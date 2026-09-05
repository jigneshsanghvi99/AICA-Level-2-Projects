"""
TDS Calculation Engine for Indian Income-Tax Desktop Application.
Calculates withholding tax with threshold crossing checks, PAN availability penalties,
resident vs non-resident rate matrices, and formula audit trail.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List, Optional
from datetime import datetime
from ..tax_rules.rule_manager import RuleManager

LEGAL_DISCLAIMER = (
    "This application is for educational, planning and preliminary computation purposes only. "
    "Tax calculations must be verified against the applicable law, rules, notifications, circulars and professional advice."
)

class TDSCalculator:
    def __init__(self, rule_manager: RuleManager):
        self.rule_mgr = rule_manager

    def calculate_tds(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inputs format:
        {
            "section": "194C" or "194J(a)" etc.,
            "transaction_value": Decimal,
            "aggregate_annual_value": Decimal, # previous transactions this FY
            "has_pan": bool,
            "deductee_type": "Resident Individual" or "Non-Resident" or "Company",
            "lower_deduction_certificate": bool,
            "certificate_rate": Optional[Decimal],
            "financial_year": "2024-25",
            "date_of_payment": "2024-11-15",
            "date_of_deduction": "2024-11-15",
            "custom_rate": Optional[Decimal]
        }
        """
        warnings = []
        errors = []
        rules_applied = []
        audit_trail = []

        section = inputs.get("section", "")
        tx_value = Decimal(str(inputs.get("transaction_value", 0)))
        agg_value = Decimal(str(inputs.get("aggregate_annual_value", 0)))
        has_pan = bool(inputs.get("has_pan", True))
        deductee_type = inputs.get("deductee_type", "Resident Individual")
        has_cert = bool(inputs.get("lower_deduction_certificate", False))
        cert_rate = Decimal(str(inputs.get("certificate_rate", 0))) if has_cert else None
        custom_rate = Decimal(str(inputs.get("custom_rate", 0))) if inputs.get("custom_rate") else None

        if tx_value <= Decimal('0'):
            errors.append("Transaction value must be greater than zero.")

        # Fetch TDS Rule from local database
        rule = self.rule_mgr.get_tds_rule_by_section(section)
        if not rule:
            errors.append(f"Rule not configured: TDS Section '{section}' not found in local rule database.")
            return {
                "calculation_type": "tds",
                "errors": errors,
                "warnings": warnings,
                "disclaimer": LEGAL_DISCLAIMER
            }

        rules_applied.append(f"Section {rule.section_number}: {rule.section_title} ({rule.source_reference})")
        threshold = rule.threshold_limit
        threshold_type = rule.threshold_type  # 'annual' or 'single_transaction'

        total_value_with_tx = agg_value + tx_value
        is_threshold_crossed = False
        amount_subject_to_tds = Decimal('0')

        # Threshold evaluation
        if threshold_type == "single_transaction":
            if tx_value > threshold:
                is_threshold_crossed = True
                amount_subject_to_tds = tx_value
                audit_trail.append(f"Single transaction Rs. {tx_value} exceeds threshold limit Rs. {threshold}.")
            elif total_value_with_tx > Decimal('100000') and section == "194C":
                # Special proviso for 194C: aggregate exceeding 1 Lakh also triggers TDS
                is_threshold_crossed = True
                amount_subject_to_tds = tx_value
                audit_trail.append(f"Section 194C aggregate threshold Rs. 1,00,000 crossed. Current transaction Rs. {tx_value} is liable to TDS.")
            else:
                audit_trail.append(f"Transaction Rs. {tx_value} is below threshold Rs. {threshold}. No TDS deductible.")
        else: # annual threshold
            if total_value_with_tx > threshold:
                is_threshold_crossed = True
                # If earlier aggregate was below threshold, TDS is deductible on the entire cumulative or current
                if agg_value <= threshold:
                    # In many sections (e.g. 194J, 194C), once crossed, TDS is on the entire amount or current
                    amount_subject_to_tds = total_value_with_tx if inputs.get("deduct_on_cumulative_when_crossing", False) else tx_value
                    audit_trail.append(f"Aggregate value Rs. {total_value_with_tx} has crossed annual threshold Rs. {threshold}. TDS triggered.")
                else:
                    amount_subject_to_tds = tx_value
                    audit_trail.append(f"Annual threshold Rs. {threshold} was already crossed previously. Current transaction Rs. {tx_value} is liable.")
            else:
                audit_trail.append(f"Cumulative value Rs. {total_value_with_tx} does not exceed annual threshold Rs. {threshold}. No TDS required.")

        # Rate determination
        base_rate = Decimal('0')
        rate_note = ""

        if not is_threshold_crossed:
            effective_rate = Decimal('0')
            tds_amount = Decimal('0')
            surcharge = Decimal('0')
            cess = Decimal('0')
        else:
            if not has_pan:
                base_rate = rule.rate_without_pan  # usually 20% u/s 206AA
                rate_note = f"PAN not provided. Higher rate of {base_rate}% applied as per Section 206AA."
                warnings.append("PAN is missing: Penal rate under Section 206AA applied.")
                rules_applied.append(f"Section 206AA: Higher rate {base_rate}% due to missing PAN")
            elif has_cert and cert_rate is not None:
                base_rate = cert_rate
                rate_note = f"Lower deduction certificate rate of {base_rate}% applied under Section 197."
                rules_applied.append(f"Section 197 Certificate Rate: {base_rate}%")
            elif custom_rate is not None and custom_rate > Decimal('0'):
                base_rate = custom_rate
                rate_note = f"Configured special rate of {base_rate}% applied."
                rules_applied.append(f"Special Rate configured: {base_rate}%")
            else:
                if "non-resident" in deductee_type.lower():
                    base_rate = rule.non_resident_rate
                    rate_note = f"Non-resident base rate of {base_rate}% applied under Section 195/specified section."
                    rules_applied.append(f"Non-resident rate: {base_rate}%")
                else:
                    base_rate = rule.resident_rate
                    rate_note = f"Resident base rate of {base_rate}% applied."
                    rules_applied.append(f"Resident base rate: {base_rate}%")

            # Surcharge and Cess for Non-Residents or specified entities
            surcharge_rate = rule.applicable_surcharge
            cess_rate = rule.applicable_cess
            if "non-resident" in deductee_type.lower() and cess_rate == Decimal('0'):
                cess_rate = Decimal('4.0')  # 4% health & education cess on non-resident payments

            surcharge = (base_rate * (surcharge_rate / Decimal('100'))).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
            cess = ((base_rate + surcharge) * (cess_rate / Decimal('100'))).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
            effective_rate = base_rate + surcharge + cess

            tds_amount = (amount_subject_to_tds * (effective_rate / Decimal('100'))).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
            audit_trail.append(f"Formula: Rs. {amount_subject_to_tds} x {effective_rate}% = Rs. {tds_amount} (Base: {base_rate}%, Surcharge: {surcharge_rate}%, Cess: {cess_rate}%)")

        # Due Date for deposit
        # Standard: 7th of subsequent month (or 30th April for March deductions)
        date_ded = inputs.get("date_of_deduction", datetime.now().strftime("%Y-%m-%d"))
        deposit_due_date = self._get_deposit_due_date(date_ded)

        return {
            "calculation_type": "tds",
            "section": section,
            "section_title": rule.section_title,
            "nature_of_payment": rule.nature_of_payment,
            "transaction_value": str(tx_value),
            "aggregate_annual_value": str(agg_value),
            "threshold_limit": str(threshold),
            "threshold_type": threshold_type,
            "is_threshold_crossed": is_threshold_crossed,
            "amount_subject_to_tds": str(amount_subject_to_tds),
            "base_rate_percent": str(base_rate),
            "effective_rate_percent": str(effective_rate),
            "tds_amount": str(tds_amount),
            "rate_note": rate_note,
            "date_of_deduction": date_ded,
            "due_date_for_deposit": deposit_due_date,
            "rules_applied": rules_applied,
            "audit_trail": audit_trail,
            "warnings": warnings,
            "errors": errors,
            "source_reference": rule.source_reference,
            "disclaimer": LEGAL_DISCLAIMER
        }

    def _get_deposit_due_date(self, deduction_date_str: str) -> str:
        try:
            dt = datetime.strptime(deduction_date_str, "%Y-%m-%d")
            if dt.month == 3:
                return f"{dt.year}-04-30 (April 30 for March deductions)"
            else:
                next_month = dt.month + 1 if dt.month < 12 else 1
                next_year = dt.year if dt.month < 12 else dt.year + 1
                return f"{next_year}-{next_month:02d}-07 (7th of following month)"
        except Exception:
            return "7th of following month (30th April for March)"
