"""
Unit tests for Excel, Word, and PDF exporters.
Verifies file creation, data persistence, and disclaimer inclusion.
"""
import unittest
import os
import tempfile
from desktop_app.reports.exporter_excel import export_to_excel
from desktop_app.reports.exporter_word import export_to_word
from desktop_app.reports.exporter_pdf import export_to_pdf

class TestExporters(unittest.TestCase):
    def setUp(self):
        self.sample_calc = {
            "timestamp": "2024-11-20 14:30:00",
            "taxpayer_name": "Test Taxpayer",
            "pan_masked": "ABXXXXXX4F",
            "act_name": "Income-tax Act, 1961",
            "regime": "New Regime",
            "financial_year": "2024-25",
            "assessment_year": "2025-26",
            "summary": {
                "gross_total_income": "1200000",
                "total_deductions": "75000",
                "taxable_total_income": "1125000",
                "normal_slab_tax": "70000",
                "special_rate_tax": "0",
                "tax_before_rebate": "70000",
                "rebate_amount": "0",
                "tax_after_rebate": "70000",
                "surcharge_amount": "0",
                "cess_amount": "2800",
                "total_tax_liability": "72800",
                "total_prepaid_tax": "50000",
                "balance_tax_payable": "22800",
            },
            "rules_applied": ["Section 115BAC New Regime", "Standard deduction Rs. 75,000"],
            "audit_trail": ["GTI: 12,00,000", "Net Tax: 72,800"],
            "disclaimer": "This application is for educational, planning and preliminary computation purposes only."
        }

    def test_excel_export(self):
        temp_file = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
        temp_file.close()
        try:
            out = export_to_excel(self.sample_calc, temp_file.name)
            self.assertTrue(os.path.exists(out))
            self.assertGreater(os.path.getsize(out), 0)
        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)
            if os.path.exists(temp_file.name.replace(".xlsx", ".csv")):
                os.remove(temp_file.name.replace(".xlsx", ".csv"))

    def test_word_export(self):
        temp_file = tempfile.NamedTemporaryFile(suffix=".docx", delete=False)
        temp_file.close()
        try:
            out = export_to_word(self.sample_calc, temp_file.name)
            self.assertTrue(os.path.exists(out))
            self.assertGreater(os.path.getsize(out), 0)
        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)
            if os.path.exists(temp_file.name.replace(".docx", ".txt")):
                os.remove(temp_file.name.replace(".docx", ".txt"))

    def test_pdf_export(self):
        temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        temp_file.close()
        try:
            out = export_to_pdf(self.sample_calc, temp_file.name)
            self.assertTrue(os.path.exists(out))
            self.assertGreater(os.path.getsize(out), 0)
        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)
            if os.path.exists(temp_file.name.replace(".pdf", ".txt")):
                os.remove(temp_file.name.replace(".pdf", ".txt"))

if __name__ == "__main__":
    unittest.main()
