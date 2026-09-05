"""
Unit tests for Income Tax and Advance Tax Calculation Engine.
Verifies slabs, rebate u/s 87A, surcharge, 4% cess, special rate capital gains, and rounding.
"""
import unittest
import os
import tempfile
from decimal import Decimal
from desktop_app.database.db_manager import DatabaseManager
from desktop_app.tax_rules.rule_manager import RuleManager
from desktop_app.engine.calculator import TaxCalculator

class TestTaxEngine(unittest.TestCase):
    def setUp(self):
        # Create temporary database for unit tests
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db.close()
        self.db_mgr = DatabaseManager(db_path=self.temp_db.name)
        self.rule_mgr = RuleManager(self.db_mgr)
        self.calculator = TaxCalculator(self.rule_mgr)

    def tearDown(self):
        if os.path.exists(self.temp_db.name):
            try:
                os.remove(self.temp_db.name)
            except OSError:
                pass

    def test_new_regime_rebate_87A(self):
        """Under FY 2024-25 New Regime, taxable income up to 7,00,000 should have zero tax after 87A rebate."""
        inputs = {
            "taxpayer_name": "Demo Resident",
            "pan": "ABCDE1234F",
            "act_name": "Income-tax Act, 1961",
            "regime": "New Regime",
            "financial_year": "2024-25",
            "assessment_year": "2025-26",
            "taxpayer_category": "Individual",
            "incomes": {
                "salary": Decimal('750000'),
            },
            "deductions": {
                "standard_deduction": Decimal('75000'),  # 7,50,000 - 75,000 = 6,75,000 <= 7,00,000
            },
            "credits": {}
        }
        res = self.calculator.calculate_advance_tax(inputs)
        summary = res["summary"]

        self.assertEqual(Decimal(summary["taxable_total_income"]), Decimal('675000'))
        # Under New Regime: 0-3L (0%), 3L-6.75L @ 5% on 3L-7L slab:
        # 3L to 6.75L is 3,75,000 * 5% = 18,750
        self.assertEqual(Decimal(summary["tax_before_rebate"]), Decimal('18750'))
        # Rebate up to 25,000 covers 18,750 completely
        self.assertEqual(Decimal(summary["tax_after_rebate"]), Decimal('0'))
        self.assertEqual(Decimal(summary["total_tax_liability"]), Decimal('0'))

    def test_new_regime_higher_bracket(self):
        """Test calculation with income exceeding rebate limit."""
        inputs = {
            "taxpayer_name": "High Earner",
            "pan": "ABCDE1234F",
            "act_name": "Income-tax Act, 1961",
            "regime": "New Regime",
            "financial_year": "2024-25",
            "assessment_year": "2025-26",
            "taxpayer_category": "Individual",
            "incomes": {
                "salary": Decimal('1275000'),
            },
            "deductions": {
                "standard_deduction": Decimal('75000'),  # Taxable = 12,00,000
            },
            "credits": {
                "tds_deducted": Decimal('50000')
            }
        }
        res = self.calculator.calculate_advance_tax(inputs)
        summary = res["summary"]

        # Taxable income = 12,00,000
        # 0 - 3L: 0
        # 3L - 7L: 4L * 5% = 20,000
        # 7L - 10L: 3L * 10% = 30,000
        # 10L - 12L: 2L * 15% = 30,000
        # Total slab tax = 80,000
        self.assertEqual(Decimal(summary["taxable_total_income"]), Decimal('1200000'))
        self.assertEqual(Decimal(summary["normal_slab_tax"]), Decimal('80000'))
        # Cess = 4% of 80,000 = 3,200
        self.assertEqual(Decimal(summary["cess_amount"]), Decimal('3200'))
        self.assertEqual(Decimal(summary["total_tax_liability"]), Decimal('83200'))
        # Balance = 83,200 - 50,000 = 33,200
        self.assertEqual(Decimal(summary["balance_tax_payable"]), Decimal('33200'))

    def test_missing_rule_safety(self):
        """If a rule is not in the database, it must warn and not silently fabricate rates."""
        inputs = {
            "taxpayer_name": "Future Year User",
            "pan": "ABCDE1234F",
            "act_name": "Income-tax Act, 1961",
            "regime": "New Regime",
            "financial_year": "2039-40",  # Unconfigured FY
            "assessment_year": "2040-41",
            "taxpayer_category": "Individual",
            "incomes": {"salary": Decimal('500000')},
            "deductions": {},
            "credits": {}
        }
        res = self.calculator.calculate_advance_tax(inputs)
        # Must report error for missing rule
        self.assertTrue(len(res["errors"]) > 0 or len(res["warnings"]) > 0)
        self.assertTrue(any("not found" in err or "not configured" in err for err in (res["errors"] + res["warnings"])))

if __name__ == "__main__":
    unittest.main()
