"""
Main entry point for Indian Income-Tax Comparative Analysis & Calculation Desktop Application.
Supports running with PySide6 GUI on desktop, or graceful fallback in terminal/headless modes.
"""
import sys
import os

# Ensure desktop_app package is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

from desktop_app.database.db_manager import DatabaseManager
from desktop_app.tax_rules.rule_manager import RuleManager
from desktop_app.engine.calculator import TaxCalculator, LEGAL_DISCLAIMER
from desktop_app.engine.tds_calculator import TDSCalculator
from desktop_app.ui.main_window import TaxSetuMainWindow, PYSIDE_AVAILABLE

def run_desktop_app():
    if getattr(sys, 'frozen', False):
        user_dir = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        app_dir = os.path.join(user_dir, "TaxSetu")
        os.makedirs(app_dir, exist_ok=True)
        db_path = os.path.join(app_dir, "tax_data.db")
    else:
        db_dir = os.path.join(CURRENT_DIR, "database")
        os.makedirs(db_dir, exist_ok=True)
        db_path = os.path.join(db_dir, "tax_data.db")

    db_mgr = DatabaseManager(db_path=db_path)

    if PYSIDE_AVAILABLE:
        from PySide6.QtWidgets import QApplication
        app = QApplication(sys.argv)
        app.setApplicationName("TaxSetu Desktop")
        window = TaxSetuMainWindow(db_mgr)
        window.show()
        sys.exit(app.exec())
    else:
        print("=" * 70)
        print("TAXSETU: INDIAN INCOME-TAX COMPARATIVE ANALYSIS WORKSTATION")
        print("=" * 70)
        print(LEGAL_DISCLAIMER)
        print("\nNote: PySide6 GUI library is not installed in this environment.")
        print("To launch the Desktop GUI, install dependencies via:")
        print("  pip install -r requirements.txt")
        print("  python desktop_app/main.py\n")
        print("Running CLI demonstration:")
        rule_mgr = RuleManager(db_mgr)
        calc = TaxCalculator(rule_mgr)
        from decimal import Decimal
        res = calc.calculate_advance_tax({
            "taxpayer_name": "Demo Salaried Resident",
            "pan": "ABCDE1234F",
            "act_name": "Income-tax Act, 1961",
            "regime": "New Regime",
            "financial_year": "2024-25",
            "assessment_year": "2025-26",
            "incomes": {"salary": Decimal("1275000")},
            "deductions": {"standard_deduction": Decimal("75000")},
            "credits": {"tds_deducted": Decimal("50000")}
        })
        print(f"Taxable Income: Rs. {res['summary']['taxable_total_income']}")
        print(f"Total Tax Liability: Rs. {res['summary']['total_tax_liability']}")
        print(f"Net Balance Payable: Rs. {res['summary']['balance_tax_payable']}")
        print("Database initialized successfully at:", db_path)

if __name__ == "__main__":
    run_desktop_app()
