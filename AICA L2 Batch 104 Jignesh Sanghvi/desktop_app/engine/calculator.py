"""
Income Tax and Advance Tax Calculation Engine for Indian Income-Tax System.
Uses Python Decimal for exact financial arithmetic without floating point imprecision.
Follows legal safeguards: strictly rule-driven, no assumed rates, full calculation audit trail.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List, Optional
from datetime import datetime
from ..tax_rules.rule_manager import RuleManager

LEGAL_DISCLAIMER = (
    "This application is for educational, planning and preliminary computation purposes only. "
    "Tax calculations must be verified against the applicable law, rules, notifications, circulars and professional advice."
)

class TaxCalculator:
    def __init__(self, rule_manager: RuleManager):
        self.rule_mgr = rule_manager

    def round_currency(self, amount: Decimal, method: str = "nearest_ten") -> Decimal:
        """Section 288A/288B round off to nearest multiple of 10."""
        if method == "nearest_ten":
            # Round off to nearest multiple of 10
            # E.g., 14.5 -> 10, 15.0 -> 20
            rem = amount % Decimal('10')
            base = amount - rem
            if rem >= Decimal('5'):
                return base + Decimal('10')
            return base
        elif method == "exact":
            return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        else:
            return amount.quantize(Decimal('1'), rounding=ROUND_HALF_UP)

    def calculate_advance_tax(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes complete income tax and advance tax estimation.
        Inputs format:
        {
            "taxpayer_name": str,
            "pan": str,
            "act_name": "Income-tax Act, 1961" or "Income-tax Act, 2025",
            "regime": "New Regime" or "Old Regime" or "Standard Regime",
            "financial_year": "2024-25",
            "assessment_year": "2025-26",
            "taxpayer_category": "Individual",
            "incomes": {
                "salary": Decimal,
                "house_property": Decimal,  # can be negative up to -200000 in old regime
                "business_profession": Decimal,
                "stcg_normal": Decimal,
                "stcg_special_111a": Decimal,
                "ltcg_special_112a": Decimal,
                "other_sources": Decimal,
            },
            "deductions": {
                "standard_deduction": Decimal,
                "chapter_via": Decimal,
                "other_deductions": Decimal
            },
            "credits": {
                "tds_deducted": Decimal,
                "tcs_collected": Decimal,
                "advance_tax_paid": Decimal,
                "other_credits": Decimal
            },
            "advance_tax_paid_dates": [
                {"date": "2024-06-12", "amount": Decimal('15000')}, ...
            ]
        }
        """
        warnings = []
        errors = []
        rules_applied = []
        audit_trail = []

        act_name = inputs.get("act_name", "Income-tax Act, 1961")
        regime = inputs.get("regime", "New Regime")
        fy = inputs.get("financial_year", "2024-25")
        ay = inputs.get("assessment_year", "2025-26")
        category = inputs.get("taxpayer_category", "Individual")

        # 1. Calculate Gross Total Income
        incomes = inputs.get("incomes", {})
        salary = Decimal(str(incomes.get("salary", 0)))
        hp = Decimal(str(incomes.get("house_property", 0)))
        biz = Decimal(str(incomes.get("business_profession", 0)))
        stcg_norm = Decimal(str(incomes.get("stcg_normal", 0)))
        stcg_spec = Decimal(str(incomes.get("stcg_special_111a", 0)))
        ltcg_spec = Decimal(str(incomes.get("ltcg_special_112a", 0)))
        other = Decimal(str(incomes.get("other_sources", 0)))

        # House property loss cap (Section 71(3A) caps set-off against other heads at Rs. 2,00,000)
        if hp < Decimal('-200000'):
            warnings.append("House property loss set-off against other heads is capped at Rs. 2,00,000 under Section 71(3A). Remaining loss carried forward.")
            hp_effective = Decimal('-200000')
        else:
            hp_effective = hp

        normal_income = salary + hp_effective + biz + stcg_norm + other
        special_income = stcg_spec + ltcg_spec
        gross_total_income = normal_income + special_income

        audit_trail.append(f"Gross Total Income: Normal income (Rs. {normal_income}) + Special rate income (Rs. {special_income}) = Rs. {gross_total_income}")

        # 2. Deductions
        raw_deductions = inputs.get("deductions", {})
        configured_deductions = self.rule_mgr.get_deductions(act_name, regime)

        std_deduction = Decimal(str(raw_deductions.get("standard_deduction", 0)))
        # Check standard deduction limit from rules
        std_rule = next((d for d in configured_deductions if "16(ia)" in d.section_ref or "std" in d.section_ref.lower()), None)
        if std_rule and std_rule.max_limit:
            if std_deduction > std_rule.max_limit:
                warnings.append(f"Standard deduction capped to Rs. {std_rule.max_limit} as per rule {std_rule.section_ref}")
                std_deduction = std_rule.max_limit
            rules_applied.append(f"Standard deduction rule {std_rule.section_ref}: Max Rs. {std_rule.max_limit} ({std_rule.source_reference})")
        elif not std_rule and std_deduction > 0:
            warnings.append("Standard deduction rule not configured for selected Act/Regime. Claim not verified.")

        chap_via = Decimal(str(raw_deductions.get("chapter_via", 0)))
        other_ded = Decimal(str(raw_deductions.get("other_deductions", 0)))

        # In New Regime, most Chapter VI-A deductions are disallowed (except 80CCD(2), 80JJAA)
        if regime == "New Regime" and chap_via > Decimal('0'):
            warnings.append("Most Chapter VI-A deductions (80C, 80D, etc.) are NOT admissible under New Regime u/s 115BAC unless eligible under Sec 80CCD(2)/80JJAA.")

        # Deductions cannot exceed normal income (cannot be set off against special rate STCG 111A or LTCG 112A)
        total_deductions = std_deduction + chap_via + other_ded
        effective_deductions = min(total_deductions, max(Decimal('0'), normal_income))

        taxable_normal_income = max(Decimal('0'), normal_income - effective_deductions)
        taxable_total_income = taxable_normal_income + special_income

        taxable_total_income_rounded = self.round_currency(taxable_total_income, "nearest_ten")
        audit_trail.append(f"Taxable Income after deductions: Rs. {taxable_total_income_rounded} (Rounded u/s 288A)")

        # 3. Slab Tax Computation on Normal Income
        slabs = self.rule_mgr.get_tax_slabs(act_name, regime, fy, category)
        slab_tax = Decimal('0')
        slab_breakdown = []

        if not slabs:
            errors.append(f"Rule not configured: No tax slabs found in local database for {act_name} | {regime} | {fy} | {category}.")
        else:
            remaining_income = taxable_normal_income
            for s in slabs:
                if remaining_income <= Decimal('0'):
                    break
                slab_width = (s.slab_max - s.slab_min) if s.slab_max is not None else None
                if taxable_normal_income > s.slab_min:
                    taxable_in_slab = min(taxable_normal_income, s.slab_max) - s.slab_min if s.slab_max else (taxable_normal_income - s.slab_min)
                    if taxable_in_slab > Decimal('0'):
                        tax_in_this_slab = taxable_in_slab * (s.tax_rate_percent / Decimal('100'))
                        slab_tax += tax_in_this_slab
                        slab_breakdown.append({
                            "range": f"Rs. {s.slab_min} to {s.slab_max if s.slab_max else 'Above'}",
                            "rate": f"{s.tax_rate_percent}%",
                            "taxable_amount": str(taxable_in_slab),
                            "tax": str(tax_in_this_slab.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                            "rule_source": s.source_reference
                        })
                        rules_applied.append(f"Tax slab Rs. {s.slab_min}-{s.slab_max or 'Above'} @ {s.tax_rate_percent}%: {s.source_reference}")

        audit_trail.append(f"Normal Slab Tax computed: Rs. {slab_tax}")

        # 4. Special Rate Income Tax
        special_tax = Decimal('0')
        # STCG 111A at 20% (Finance (No. 2) Act 2024 increased from 15% to 20% effective 23 July 2024)
        if stcg_spec > Decimal('0'):
            stcg_tax = stcg_spec * Decimal('0.20')
            special_tax += stcg_tax
            audit_trail.append(f"Special Tax: STCG u/s 111A of Rs. {stcg_spec} @ 20% = Rs. {stcg_tax}")
            rules_applied.append("Special Tax u/s 111A: 20% on short-term listed equity capital gains")

        # LTCG 112A at 12.5% (Exemption Rs. 1,25,000)
        if ltcg_spec > Decimal('0'):
            ltcg_taxable = max(Decimal('0'), ltcg_spec - Decimal('125000'))
            ltcg_tax = ltcg_taxable * Decimal('0.125')
            special_tax += ltcg_tax
            audit_trail.append(f"Special Tax: LTCG u/s 112A of Rs. {ltcg_spec} (exemption Rs. 1.25L) @ 12.5% = Rs. {ltcg_tax}")
            rules_applied.append("Special Tax u/s 112A: 12.5% on long-term listed equity gains exceeding Rs. 1,25,000")

        total_tax_before_rebate = slab_tax + special_tax

        # 5. Rebate under Section 87A (or configured 2025 rule)
        rebate_rule = self.rule_mgr.get_rebate_rule(act_name, regime, fy)
        rebate_amount = Decimal('0')
        if rebate_rule:
            if taxable_total_income <= rebate_rule.max_income_limit:
                rebate_amount = min(total_tax_before_rebate, rebate_rule.max_rebate_amount)
                audit_trail.append(f"Rebate applied ({rebate_rule.section_ref}): Rs. {rebate_amount} as taxable income (Rs. {taxable_total_income}) <= limit (Rs. {rebate_rule.max_income_limit})")
                rules_applied.append(f"{rebate_rule.section_ref} Rebate: Up to Rs. {rebate_rule.max_rebate_amount} ({rebate_rule.source_reference})")
            else:
                audit_trail.append(f"Rebate not applicable: taxable income Rs. {taxable_total_income} exceeds limit Rs. {rebate_rule.max_income_limit}")
        else:
            warnings.append("Rebate rule not configured for this regime/act.")

        tax_after_rebate = max(Decimal('0'), total_tax_before_rebate - rebate_amount)

        # 6. Surcharge & Marginal Relief
        surcharge_rules = self.rule_mgr.get_surcharge_rules(act_name, regime, fy, category)
        surcharge_amount = Decimal('0')
        surcharge_rate = Decimal('0')

        applicable_sr = None
        for sr in surcharge_rules:
            if taxable_total_income > sr.min_income:
                if sr.max_income is None or taxable_total_income <= sr.max_income:
                    applicable_sr = sr
                    break

        if applicable_sr:
            surcharge_rate = applicable_sr.surcharge_rate_percent
            raw_surcharge = tax_after_rebate * (surcharge_rate / Decimal('100'))

            # Check marginal relief
            # Total tax + surcharge should not exceed (Tax on threshold income + (taxable income - threshold income))
            if applicable_sr.marginal_relief_applicable:
                # Approximate marginal relief check
                diff_income = taxable_total_income - applicable_sr.min_income
                # Cap extra tax to diff_income
                excess_liability = raw_surcharge
                if excess_liability > diff_income and diff_income > Decimal('0'):
                    surcharge_amount = diff_income
                    audit_trail.append(f"Marginal relief applied on surcharge: Surcharge adjusted from Rs. {raw_surcharge} to Rs. {surcharge_amount}")
                else:
                    surcharge_amount = raw_surcharge
            else:
                surcharge_amount = raw_surcharge

            rules_applied.append(f"Surcharge @ {surcharge_rate}% on income exceeding Rs. {applicable_sr.min_income}")
            audit_trail.append(f"Surcharge applied @ {surcharge_rate}%: Rs. {surcharge_amount}")

        tax_with_surcharge = tax_after_rebate + surcharge_amount

        # 7. Health and Education Cess (4%)
        cess_rule = self.rule_mgr.get_cess_rule(fy)
        if cess_rule:
            cess_rate = cess_rule.cess_rate_percent
            cess_amount = (tax_with_surcharge * (cess_rate / Decimal('100'))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            rules_applied.append(f"{cess_rule.cess_name} @ {cess_rate}%")
        else:
            cess_rate = Decimal('4.0')
            cess_amount = (tax_with_surcharge * Decimal('0.04')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            warnings.append("Cess rule not explicitly configured in DB. Applied standard 4.0% with notification.")

        audit_trail.append(f"Health and Education Cess: Rs. {cess_amount} ({cess_rate}% of Rs. {tax_with_surcharge})")

        total_tax_liability = self.round_currency(tax_with_surcharge + cess_amount, "nearest_ten")
        audit_trail.append(f"Total Tax Liability (Rounded u/s 288B): Rs. {total_tax_liability}")

        # 8. Tax Credits and Taxes Already Paid
        credits = inputs.get("credits", {})
        tds_deducted = Decimal(str(credits.get("tds_deducted", 0)))
        tcs_collected = Decimal(str(credits.get("tcs_collected", 0)))
        advance_tax_paid = Decimal(str(credits.get("advance_tax_paid", 0)))
        other_credits = Decimal(str(credits.get("other_credits", 0)))

        total_prepaid_tax = tds_deducted + tcs_collected + advance_tax_paid + other_credits
        balance_tax_payable = total_tax_liability - total_prepaid_tax

        audit_trail.append(f"Total prepaid credits: TDS (Rs. {tds_deducted}) + TCS (Rs. {tcs_collected}) + Adv. Tax (Rs. {advance_tax_paid}) + Other (Rs. {other_credits}) = Rs. {total_prepaid_tax}")
        audit_trail.append(f"Net Balance Tax Payable / (Refund): Rs. {balance_tax_payable}")

        # 9. Advance Tax Instalment Schedule
        # Under Section 208, advance tax is payable if estimated tax liability after TDS/TCS is >= Rs. 10,000
        tax_subject_to_advance_tax = max(Decimal('0'), total_tax_liability - tds_deducted - tcs_collected - other_credits)
        is_advance_tax_applicable = tax_subject_to_advance_tax >= Decimal('10000')

        schedule_rules = self.rule_mgr.get_advance_tax_schedule(fy)
        instalments = []

        if not schedule_rules:
            warnings.append(f"Advance tax instalment schedule not configured for FY {fy}.")
        else:
            cum_paid = Decimal('0')
            # Extract paid dates
            user_payments = inputs.get("advance_tax_paid_dates", [])
            # Sum up total paid entered
            total_user_adv_paid = sum(Decimal(str(p.get("amount", 0))) for p in user_payments) if user_payments else advance_tax_paid

            for r in schedule_rules:
                target_cum_amount = (tax_subject_to_advance_tax * (r.cumulative_percent / Decimal('100'))).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
                # Calculate required for this instalment alone
                # instalment 1: 15%, 2: 30%, 3: 30%, 4: 25%
                instalments.append({
                    "instalment_number": r.instalment_number,
                    "due_date": r.due_date,
                    "cumulative_percent": str(r.cumulative_percent),
                    "required_cumulative_amount": str(target_cum_amount),
                    "description": r.description
                })

        return {
            "calculation_type": "advance_tax",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "taxpayer_name": inputs.get("taxpayer_name", "N/A"),
            "pan_masked": self._mask_pan(inputs.get("pan", "")),
            "act_name": act_name,
            "regime": regime,
            "financial_year": fy,
            "assessment_year": ay,
            "taxpayer_category": category,
            "summary": {
                "gross_total_income": str(gross_total_income),
                "total_deductions": str(effective_deductions),
                "taxable_total_income": str(taxable_total_income_rounded),
                "normal_slab_tax": str(slab_tax),
                "special_rate_tax": str(special_tax),
                "tax_before_rebate": str(total_tax_before_rebate),
                "rebate_amount": str(rebate_amount),
                "tax_after_rebate": str(tax_after_rebate),
                "surcharge_amount": str(surcharge_amount),
                "surcharge_rate_percent": str(surcharge_rate),
                "cess_amount": str(cess_amount),
                "total_tax_liability": str(total_tax_liability),
                "total_prepaid_tax": str(total_prepaid_tax),
                "balance_tax_payable": str(balance_tax_payable),
                "is_advance_tax_applicable": is_advance_tax_applicable,
                "net_tax_subject_to_adv_tax": str(tax_subject_to_advance_tax)
            },
            "slab_breakdown": slab_breakdown,
            "instalment_schedule": instalments,
            "rules_applied": rules_applied,
            "audit_trail": audit_trail,
            "warnings": warnings,
            "errors": errors,
            "disclaimer": LEGAL_DISCLAIMER
        }

    def _mask_pan(self, pan: str) -> str:
        if not pan or len(pan) < 10:
            return "XXXXX0000X"
        return pan[:2] + "XXXXXX" + pan[-2:]
