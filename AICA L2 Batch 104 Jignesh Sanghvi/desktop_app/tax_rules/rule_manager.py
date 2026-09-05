"""
Tax Rule Manager: reads, validates, versions, and maintains local rule tables.
Ensures no assumptions are made; if a rule is missing, reports "Rule not configured".
"""
import csv
import io
import sqlite3
from decimal import Decimal
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from ..database.db_manager import DatabaseManager
from .models import (
    TaxSlab, RebateRule, SurchargeRule, CessRule,
    DeductionRule, TDSRule, AdvanceTaxRule, ComparisonRule
)

class RuleManager:
    def __init__(self, db: DatabaseManager):
        self.db = db

    # 1. Tax Slabs
    def get_tax_slabs(self, act_name: str, regime: str, fy: str, category: str = "Individual") -> List[TaxSlab]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM tax_slabs
                WHERE act_name = ? AND regime = ? AND financial_year = ? AND is_active = 1
                AND (taxpayer_category = ? OR taxpayer_category = 'Individual')
                ORDER BY slab_min ASC
            """, (act_name, regime, fy, category))
            rows = cursor.fetchall()
            return [
                TaxSlab(
                    id=row["id"],
                    act_name=row["act_name"],
                    regime=row["regime"],
                    financial_year=row["financial_year"],
                    assessment_year=row["assessment_year"],
                    taxpayer_category=row["taxpayer_category"],
                    slab_min=Decimal(str(row["slab_min"])),
                    slab_max=Decimal(str(row["slab_max"])) if row["slab_max"] is not None else None,
                    tax_rate_percent=Decimal(str(row["tax_rate_percent"])),
                    source_reference=row["source_reference"],
                    is_active=bool(row["is_active"]),
                    version=row["version"],
                    last_updated=row["last_updated"]
                ) for row in rows
            ]

    # 2. Rebate
    def get_rebate_rule(self, act_name: str, regime: str, fy: str) -> Optional[RebateRule]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM tax_rebates
                WHERE act_name = ? AND regime = ? AND financial_year = ? AND is_active = 1
                LIMIT 1
            """, (act_name, regime, fy))
            row = cursor.fetchone()
            if not row:
                return None
            return RebateRule(
                id=row["id"],
                act_name=row["act_name"],
                regime=row["regime"],
                financial_year=row["financial_year"],
                assessment_year=row["assessment_year"],
                max_income_limit=Decimal(str(row["max_income_limit"])),
                max_rebate_amount=Decimal(str(row["max_rebate_amount"])),
                section_ref=row["section_ref"],
                source_reference=row["source_reference"],
                is_active=bool(row["is_active"])
            )

    # 3. Surcharge
    def get_surcharge_rules(self, act_name: str, regime: str, fy: str, category: str = "Individual") -> List[SurchargeRule]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM surcharge_rules
                WHERE act_name = ? AND regime = ? AND financial_year = ? AND is_active = 1
                ORDER BY min_income ASC
            """, (act_name, regime, fy))
            rows = cursor.fetchall()
            return [
                SurchargeRule(
                    id=row["id"],
                    act_name=row["act_name"],
                    regime=row["regime"],
                    financial_year=row["financial_year"],
                    assessment_year=row["assessment_year"],
                    taxpayer_category=row["taxpayer_category"],
                    min_income=Decimal(str(row["min_income"])),
                    max_income=Decimal(str(row["max_income"])) if row["max_income"] is not None else None,
                    surcharge_rate_percent=Decimal(str(row["surcharge_rate_percent"])),
                    marginal_relief_applicable=bool(row["marginal_relief_applicable"]),
                    is_active=bool(row["is_active"])
                ) for row in rows
            ]

    # 4. Cess
    def get_cess_rule(self, fy: str) -> Optional[CessRule]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM cess_rules WHERE financial_year = ? AND is_active = 1 LIMIT 1", (fy,))
            row = cursor.fetchone()
            if not row:
                return None
            return CessRule(
                id=row["id"],
                financial_year=row["financial_year"],
                assessment_year=row["assessment_year"],
                cess_name=row["cess_name"],
                cess_rate_percent=Decimal(str(row["cess_rate_percent"])),
                is_active=bool(row["is_active"])
            )

    # 5. Deductions
    def get_deductions(self, act_name: str, regime: str) -> List[DeductionRule]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM deduction_rules
                WHERE act_name = ? AND regime = ? AND is_active = 1
                ORDER BY section_ref ASC
            """, (act_name, regime))
            rows = cursor.fetchall()
            return [
                DeductionRule(
                    id=row["id"],
                    act_name=row["act_name"],
                    regime=row["regime"],
                    section_ref=row["section_ref"],
                    name=row["name"],
                    max_limit=Decimal(str(row["max_limit"])) if row["max_limit"] is not None else None,
                    eligible_categories=row["eligible_categories"],
                    source_reference=row["source_reference"],
                    is_active=bool(row["is_active"]),
                    version=row["version"],
                    last_updated=row["last_updated"]
                ) for row in rows
            ]

    # 6. TDS Rules
    def get_all_tds_rules(self, active_only: bool = True) -> List[TDSRule]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            sql = "SELECT * FROM tds_rules"
            if active_only:
                sql += " WHERE is_active = 1"
            sql += " ORDER BY section_number ASC"
            cursor.execute(sql)
            rows = cursor.fetchall()
            return [self._row_to_tds(row) for row in rows]

    def get_tds_rule_by_section(self, section: str) -> Optional[TDSRule]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tds_rules WHERE section_number = ? AND is_active = 1 LIMIT 1", (section,))
            row = cursor.fetchone()
            return self._row_to_tds(row) if row else None

    def _row_to_tds(self, row: sqlite3.Row) -> TDSRule:
        return TDSRule(
            id=row["id"],
            section_number=row["section_number"],
            section_title=row["section_title"],
            nature_of_payment=row["nature_of_payment"],
            applicable_payer=row["applicable_payer"],
            applicable_deductee=row["applicable_deductee"],
            resident_rate=Decimal(str(row["resident_rate"])),
            non_resident_rate=Decimal(str(row["non_resident_rate"])),
            rate_without_pan=Decimal(str(row["rate_without_pan"])),
            threshold_limit=Decimal(str(row["threshold_limit"])),
            threshold_type=row["threshold_type"],
            effective_date=row["effective_date"],
            applicable_surcharge=Decimal(str(row["applicable_surcharge"])),
            applicable_cess=Decimal(str(row["applicable_cess"])),
            lower_ded_cert_allowed=bool(row["lower_ded_cert_allowed"]),
            exemptions=row["exemptions"] or "",
            remarks=row["remarks"] or "",
            source_reference=row["source_reference"],
            last_updated=row["last_updated"],
            is_active=bool(row["is_active"]),
            version=row["version"]
        )

    # 7. Advance Tax Rules
    def get_advance_tax_schedule(self, fy: str) -> List[AdvanceTaxRule]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM advance_tax_rules
                WHERE financial_year = ? AND is_active = 1
                ORDER BY instalment_number ASC
            """, (fy,))
            rows = cursor.fetchall()
            return [
                AdvanceTaxRule(
                    id=row["id"],
                    financial_year=row["financial_year"],
                    instalment_number=row["instalment_number"],
                    due_date=row["due_date"],
                    cumulative_percent=Decimal(str(row["cumulative_percent"])),
                    description=row["description"] or "",
                    is_active=bool(row["is_active"])
                ) for row in rows
            ]

    # 8. Comparison Rules
    def get_comparison_rules(self, keyword: str = "", chapter: str = "",
                             change_type: str = "", category: str = "") -> List[ComparisonRule]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            sql = "SELECT * FROM comparison_rules WHERE is_active = 1"
            params = []
            if chapter:
                sql += " AND chapter LIKE ?"
                params.append(f"%{chapter}%")
            if change_type and change_type != "all":
                sql += " AND change_type = ?"
                params.append(change_type)
            if category:
                sql += " AND taxpayer_categories LIKE ?"
                params.append(f"%{category}%")
            if keyword:
                sql += " AND (topic LIKE ? OR provision_1961 LIKE ? OR provision_2025 LIKE ? OR section_1961 LIKE ? OR section_2025 LIKE ? OR key_change LIKE ? OR practical_impact LIKE ?)"
                kw = f"%{keyword}%"
                params.extend([kw, kw, kw, kw, kw, kw, kw])

            sql += " ORDER BY id ASC"
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            return [
                ComparisonRule(
                    id=row["id"],
                    topic=row["topic"],
                    chapter=row["chapter"] or "",
                    provision_1961=row["provision_1961"],
                    provision_2025=row["provision_2025"],
                    section_1961=row["section_1961"],
                    section_2025=row["section_2025"],
                    key_change=row["key_change"],
                    practical_impact=row["practical_impact"],
                    applicability_date=row["applicability_date"],
                    taxpayer_categories=row["taxpayer_categories"],
                    source_reference=row["source_reference"],
                    notes=row["notes"] or "",
                    change_type=row["change_type"],
                    is_active=bool(row["is_active"]),
                    version=row["version"],
                    last_updated=row["last_updated"]
                ) for row in rows
            ]

    # Rule Maintenance Methods (Admin)
    def update_tds_rule(self, rule_id: int, updates: Dict[str, Any], user_role: str = "admin") -> bool:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            set_clauses = []
            params = []
            for k, v in updates.items():
                if k not in ("id", "version"):
                    set_clauses.append(f"{k} = ?")
                    params.append(v)
            set_clauses.append("version = version + 1")
            set_clauses.append("last_updated = ?")
            params.append(now_str)
            params.append(rule_id)

            sql = f"UPDATE tds_rules SET {', '.join(set_clauses)} WHERE id = ?"
            cursor.execute(sql, params)
            conn.commit()
            self.db.log_audit(user_role, "UPDATE_TDS_RULE", "tds_rules", rule_id, f"Updated fields: {list(updates.keys())}")
            return True

    def deactivate_rule(self, table_name: str, rule_id: int, user_role: str = "admin") -> bool:
        """Safely deactivates rather than deleting, preserving audit and historical calculations."""
        allowed_tables = ("tds_rules", "tax_slabs", "comparison_rules", "deduction_rules", "advance_tax_rules")
        if table_name not in allowed_tables:
            raise ValueError(f"Invalid table: {table_name}")

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE {table_name} SET is_active = 0 WHERE id = ?", (rule_id,))
            conn.commit()
            self.db.log_audit(user_role, "DEACTIVATE_RULE", table_name, rule_id, "Rule deactivated")
            return True

    def export_rules_csv(self, table_name: str) -> str:
        """Exports any rule table to standard CSV text."""
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            if not rows:
                return ""
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow([d[0] for d in cursor.description])
            for r in rows:
                writer.writerow(list(r))
            return output.getvalue()
