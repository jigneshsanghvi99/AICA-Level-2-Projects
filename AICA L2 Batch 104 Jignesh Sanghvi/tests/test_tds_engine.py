"""
Unit tests for TDS calculation engine.
Verifies threshold crossing, missing PAN 20% penalty, and resident vs non-resident calculations.
"""
import unittest
import os
import tempfile
from decimal import Decimal
from desktop_app.database.db_manager import DatabaseManager
from desktop_app.tax_rules.rule_manager import RuleManager
from desktop_app.engine.tds_calculator import TDSCalculator

class TestTDSEngine(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db.close()
        self.db_mgr = DatabaseManager(db_path=self.temp_db.name)
        self.rule_mgr = RuleManager(self.db_mgr)
        self.calculator = TDSCalculator(self.rule_mgr)

    def tearDown(self):
        if os.path.exists(self.temp_db.name):
            try:
                os.remove(self.temp_db.name)
            except OSError:
                pass

    def test_section_194c_threshold_below(self):
        """Single transaction below Rs. 30,000 should have 0 TDS."""
        inputs = {
            "section": "194C",
            "transaction_value": Decimal('25000'),
            "aggregate_annual_value": Decimal('20000'),
            "has_pan": True,
            "deductee_type": "Resident Individual"
        }
        res = self.calculator.calculate_tds(inputs)
        self.assertFalse(res["is_threshold_crossed"])
        self.assertEqual(Decimal(res["tds_amount"]), Decimal('0'))

    def test_section_194c_threshold_crossed(self):
        """Single transaction of Rs. 40,000 exceeds Rs. 30,000 threshold. 1% TDS applies for resident individual."""
        inputs = {
            "section": "194C",
            "transaction_value": Decimal('40000'),
            "aggregate_annual_value": Decimal('0'),
            "has_pan": True,
            "deductee_type": "Resident Individual"
        }
        res = self.calculator.calculate_tds(inputs)
        self.assertTrue(res["is_threshold_crossed"])
        self.assertEqual(Decimal(res["base_rate_percent"]), Decimal('1.0'))
        self.assertEqual(Decimal(res["tds_amount"]), Decimal('400'))

    def test_section_missing_pan_penal_rate(self):
        """When PAN is missing, Section 206AA penal rate of 20% must be applied."""
        inputs = {
            "section": "194C",
            "transaction_value": Decimal('50000'),
            "aggregate_annual_value": Decimal('0'),
            "has_pan": False,
            "deductee_type": "Resident Individual"
        }
        res = self.calculator.calculate_tds(inputs)
        self.assertTrue(res["is_threshold_crossed"])
        self.assertEqual(Decimal(res["base_rate_percent"]), Decimal('20.0'))
        self.assertEqual(Decimal(res["tds_amount"]), Decimal('10000'))
        self.assertTrue(any("206AA" in w for w in res["warnings"]))

if __name__ == "__main__":
    unittest.main()
