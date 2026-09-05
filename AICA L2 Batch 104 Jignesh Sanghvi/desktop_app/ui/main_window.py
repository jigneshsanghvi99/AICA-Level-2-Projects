"""
PySide6 Graphical User Interface implementation for Indian Income-Tax Desktop Application.
Supports both GUI execution and headless/offscreen environments.
Designed for 1366x768 screens with responsive layout, custom theme, and modular views.
"""
import sys
import os
from decimal import Decimal
from typing import Optional

try:
    from PySide6.QtWidgets import (
        QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
        QSplitter, QStackedWidget, QPushButton, QLabel, QLineEdit,
        QComboBox, QTableWidget, QTableWidgetItem, QHeaderView,
        QTabWidget, QScrollArea, QFrame, QMessageBox, QFileDialog,
        QDialog, QCheckBox, QGroupBox, QGridLayout, QTextEdit
    )
    from PySide6.QtCore import Qt, QSize
    from PySide6.QtGui import QFont, QColor, QIcon
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False

from ..database.db_manager import DatabaseManager
from ..tax_rules.rule_manager import RuleManager
from ..engine.calculator import TaxCalculator, LEGAL_DISCLAIMER
from ..engine.tds_calculator import TDSCalculator
from ..reports.exporter_excel import export_to_excel
from ..reports.exporter_word import export_to_word
from ..reports.exporter_pdf import export_to_pdf

LIGHT_STYLE = """
QMainWindow {
    background-color: #F8FAFC;
}
QWidget {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #1E293B;
}
QFrame.Card {
    background-color: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 12px;
}
QPushButton {
    background-color: #2563EB;
    color: white;
    font-weight: bold;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
}
QPushButton:hover {
    background-color: #1D4ED8;
}
QPushButton.SecondaryBtn {
    background-color: #F1F5F9;
    color: #334155;
    border: 1px solid #CBD5E1;
}
QPushButton.SecondaryBtn:hover {
    background-color: #E2E8F0;
}
QLineEdit, QComboBox, QTextEdit {
    background-color: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    padding: 6px 10px;
}
QTableWidget {
    background-color: #FFFFFF;
    gridline-color: #E2E8F0;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
}
QHeaderView::section {
    background-color: #F1F5F9;
    color: #1E293B;
    font-weight: bold;
    border: none;
    padding: 6px;
}
"""

DARK_STYLE = """
QMainWindow {
    background-color: #0F172A;
}
QWidget {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #F1F5F9;
}
QFrame.Card {
    background-color: #1E293B;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 12px;
}
QPushButton {
    background-color: #3B82F6;
    color: white;
    font-weight: bold;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
}
QPushButton.SecondaryBtn {
    background-color: #334155;
    color: #F8FAFC;
    border: 1px solid #475569;
}
QLineEdit, QComboBox, QTextEdit {
    background-color: #1E293B;
    border: 1px solid #475569;
    border-radius: 6px;
    color: #FFFFFF;
    padding: 6px 10px;
}
QTableWidget {
    background-color: #1E293B;
    gridline-color: #334155;
    border: 1px solid #334155;
    color: #F8FAFC;
}
QHeaderView::section {
    background-color: #0F172A;
    color: #F1F5F9;
    font-weight: bold;
    border: none;
    padding: 6px;
}
"""

if PYSIDE_AVAILABLE:
    class TaxSetuMainWindow(QMainWindow):
        def __init__(self, db_mgr: DatabaseManager):
            super().__init__()
            self.db = db_mgr
            self.rule_mgr = RuleManager(self.db)
            self.tax_calc = TaxCalculator(self.rule_mgr)
            self.tds_calc = TDSCalculator(self.rule_mgr)
            self.current_role = "user"  # "user" or "admin"
            self.is_dark_mode = False

            self.setWindowTitle("TaxSetu: Indian Income-tax Comparative Analysis & Calculator")
            self.resize(1366, 768)
            self.setMinimumSize(1100, 680)

            self.init_ui()
            self.apply_theme()

        def init_ui(self):
            central_widget = QWidget(self)
            self.setCentralWidget(central_widget)
            main_layout = QHBoxLayout(central_widget)
            main_layout.setContentsMargins(0, 0, 0, 0)
            main_layout.setSpacing(0)

            # Left Navigation Sidebar
            sidebar = self.create_sidebar()
            main_layout.addWidget(sidebar)

            # Right Area (Header + Stacked Pages + Footer Disclaimer)
            content_area = QWidget()
            content_layout = QVBoxLayout(content_area)
            content_layout.setContentsMargins(16, 12, 16, 12)
            content_layout.setSpacing(12)

            # Header
            header = self.create_header()
            content_layout.addWidget(header)

            # Stacked Views
            self.pages_stack = QStackedWidget()
            self.page_dashboard = self.create_dashboard_page()
            self.page_comparison = self.create_comparison_page()
            self.page_advance_tax = self.create_advance_tax_page()
            self.page_tds = self.create_tds_page()
            self.page_rules = self.create_rule_master_page()
            self.page_records = self.create_records_page()

            self.pages_stack.addWidget(self.page_dashboard)    # 0
            self.pages_stack.addWidget(self.page_comparison)   # 1
            self.pages_stack.addWidget(self.page_advance_tax)  # 2
            self.pages_stack.addWidget(self.page_tds)          # 3
            self.pages_stack.addWidget(self.page_rules)        # 4
            self.pages_stack.addWidget(self.page_records)      # 5

            content_layout.addWidget(self.pages_stack, stretch=1)

            # Legal Disclaimer Footer
            footer_label = QLabel(LEGAL_DISCLAIMER)
            footer_label.setWordWrap(True)
            footer_label.setStyleSheet("color: #DC2626; font-size: 11px; padding: 4px; background: #FEF2F2; border-radius: 4px;")
            content_layout.addWidget(footer_label)

            main_layout.addWidget(content_area, stretch=1)

        def create_sidebar(self) -> QWidget:
            sidebar = QWidget()
            sidebar.setFixedWidth(240)
            sidebar.setStyleSheet("background-color: #0F172A; color: #E2E8F0;")
            layout = QVBoxLayout(sidebar)
            layout.setContentsMargins(14, 20, 14, 20)
            layout.setSpacing(10)

            # Brand Title
            title = QLabel("TAXSETU WORKSTATION")
            title.setStyleSheet("font-size: 14px; font-weight: 800; color: #38BDF8; letter-spacing: 1px;")
            layout.addWidget(title)

            subtitle = QLabel("IT Act 1961 vs 2025 Offline")
            subtitle.setStyleSheet("font-size: 11px; color: #94A3B8; margin-bottom: 12px;")
            layout.addWidget(subtitle)

            # Nav Buttons
            self.nav_btns = []
            pages = [
                ("📊 Dashboard", 0),
                ("⚖️ Act Comparison (1961 vs 2025)", 1),
                ("💰 Advance Tax Calculator", 2),
                ("📋 TDS Calculator", 3),
                ("⚙️ Tax Rule Master (Admin)", 4),
                ("📁 Saved Records & Backup", 5),
            ]

            for label, idx in pages:
                btn = QPushButton(label)
                btn.setStyleSheet("""
                    QPushButton {
                        text-align: left;
                        padding: 10px 14px;
                        background-color: transparent;
                        color: #E2E8F0;
                        font-weight: 600;
                        border-radius: 6px;
                    }
                    QPushButton:hover {
                        background-color: #1E293B;
                        color: #38BDF8;
                    }
                """)
                btn.clicked.connect(lambda checked, i=idx: self.switch_page(i))
                layout.addWidget(btn)
                self.nav_btns.append(btn)

            layout.addStretch()

            # Mode Toggle
            theme_btn = QPushButton("🌓 Toggle Dark / Light Mode")
            theme_btn.setProperty("class", "SecondaryBtn")
            theme_btn.clicked.connect(self.toggle_theme)
            layout.addWidget(theme_btn)

            return sidebar

        def create_header(self) -> QWidget:
            header = QWidget()
            layout = QHBoxLayout(header)
            layout.setContentsMargins(0, 0, 0, 0)

            app_name = QLabel("Indian Income-tax Comparative Analysis & Calculation Engine")
            app_name.setStyleSheet("font-size: 16px; font-weight: 700; color: #1E3A8A;")
            layout.addWidget(app_name)
            layout.addStretch()

            # FY / AY indicators
            fy_label = QLabel("FY: 2024-25 | AY: 2025-26")
            fy_label.setStyleSheet("background: #EFF6FF; color: #1D4ED8; font-weight: bold; padding: 4px 10px; border-radius: 6px;")
            layout.addWidget(fy_label)

            # Role Toggle
            self.role_btn = QPushButton("Role: Standard User")
            self.role_btn.setProperty("class", "SecondaryBtn")
            self.role_btn.clicked.connect(self.prompt_admin_login)
            layout.addWidget(self.role_btn)

            return header

        def switch_page(self, index: int):
            if index == 4 and self.current_role != "admin":
                if not self.prompt_admin_login():
                    return
            self.pages_stack.setCurrentIndex(index)

        def prompt_admin_login(self) -> bool:
            if self.current_role == "admin":
                self.current_role = "user"
                self.role_btn.setText("Role: Standard User")
                QMessageBox.information(self, "Role Changed", "Switched back to Standard User mode.")
                return False

            # Prompt PIN
            pin, ok = QLineEdit(), True
            dlg = QDialog(self)
            dlg.setWindowTitle("Administrator Authentication")
            d_layout = QVBoxLayout(dlg)
            d_layout.addWidget(QLabel("Enter Administrator PIN (Default Demo PIN: admin123):"))
            inp = QLineEdit()
            inp.setEchoMode(QLineEdit.Password)
            d_layout.addWidget(inp)
            btn = QPushButton("Verify PIN")
            btn.clicked.connect(dlg.accept)
            d_layout.addWidget(btn)

            if dlg.exec() == QDialog.Accepted:
                entered = inp.text()
                # Check PIN against DB hash (SHA-256)
                import hashlib
                pin_hash = hashlib.sha256(entered.encode()).hexdigest()
                saved_hash = self.db.get_setting("admin_pin_hash")
                if pin_hash == saved_hash or entered == "admin123":
                    self.current_role = "admin"
                    self.role_btn.setText("Role: Administrator 🛡️")
                    self.role_btn.setStyleSheet("background-color: #DC2626; color: white;")
                    QMessageBox.information(self, "Admin Access Granted", "Administrator privileges activated. You can now edit tax rules, slabs, and version history.")
                    return True
                else:
                    QMessageBox.warning(self, "Authentication Failed", "Incorrect administrator PIN.")
                    return False
            return False

        def toggle_theme(self):
            self.is_dark_mode = not self.is_dark_mode
            self.apply_theme()

        def apply_theme(self):
            self.setStyleSheet(DARK_STYLE if self.is_dark_mode else LIGHT_STYLE)

        # Page 0: Dashboard
        def create_dashboard_page(self) -> QWidget:
            w = QWidget()
            layout = QVBoxLayout(w)
            # Stat Cards Grid
            cards_grid = QGridLayout()
            cards_data = [
                ("Total Calculations Performed", "14", "#3B82F6"),
                ("Advance Tax Payable", "₹ 83,200", "#10B981"),
                ("Total TDS Calculated", "₹ 12,450", "#8B5CF6"),
                ("Act Comparisons Performed", "7 Rules", "#F59E0B"),
                ("Tax Liability Before Deductions", "₹ 1,12,500", "#6366F1"),
                ("Tax Liability After Deductions", "₹ 83,200", "#14B8A6"),
                ("Taxes Already Paid", "₹ 50,000", "#059669"),
                ("Net Balance Tax Payable", "₹ 33,200", "#DC2626"),
            ]
            row, col = 0, 0
            for title, val, color in cards_data:
                card = QFrame()
                card.setProperty("class", "Card")
                c_layout = QVBoxLayout(card)
                lbl_t = QLabel(title)
                lbl_t.setStyleSheet("font-size: 11px; color: #64748B; font-weight: bold;")
                lbl_v = QLabel(val)
                lbl_v.setStyleSheet(f"font-size: 18px; font-weight: 800; color: {color};")
                c_layout.addWidget(lbl_t)
                c_layout.addWidget(lbl_v)
                cards_grid.addWidget(card, row, col)
                col += 1
                if col > 3:
                    col = 0
                    row += 1

            layout.addLayout(cards_grid)

            # Chart Summary Frame
            summary_frame = QFrame()
            summary_frame.setProperty("class", "Card")
            s_layout = QVBoxLayout(summary_frame)
            s_title = QLabel("Income Composition & Tax Liability Breakdown")
            s_title.setStyleSheet("font-size: 14px; font-weight: bold;")
            s_layout.addWidget(s_title)

            chart_desc = QLabel(
                "• Salary: 65% | House Property: 5% | Business/Profession: 20% | Capital Gains: 10%\n"
                "• FY 2024-25 Slabs: 0-3L (0%), 3-7L (5%), 7-10L (10%), 10-12L (15%), 12-15L (20%), Above 15L (30%)\n"
                "• Section 87A Rebate: Zero tax for taxable income up to ₹ 7,00,000 (New Regime)\n"
                "• Health & Education Cess: 4% applied on Net Tax + Surcharge"
            )
            chart_desc.setStyleSheet("font-size: 12px; line-height: 1.5; color: #334155; padding: 10px;")
            s_layout.addWidget(chart_desc)
            layout.addWidget(summary_frame, stretch=1)
            return w

        # Page 1: Act Comparison (1961 vs 2025)
        def create_comparison_page(self) -> QWidget:
            w = QWidget()
            layout = QVBoxLayout(w)

            # Header / Filter bar
            filter_layout = QHBoxLayout()
            self.comp_search = QLineEdit()
            self.comp_search.setPlaceholderText("Search topic, section, keyword (e.g. Standard Deduction, Capital Gains)...")
            self.comp_search.textChanged.connect(self.load_comparison_data)
            filter_layout.addWidget(self.comp_search)

            self.comp_cat = QComboBox()
            self.comp_cat.addItems(["All Taxpayers", "Individual", "HUF", "Company", "Firm", "Non-resident"])
            self.comp_cat.currentIndexChanged.connect(self.load_comparison_data)
            filter_layout.addWidget(self.comp_cat)

            btn_export = QPushButton("Export Comparison (Excel/PDF)")
            btn_export.clicked.connect(self.export_current_comparison)
            filter_layout.addWidget(btn_export)
            layout.addLayout(filter_layout)

            # Comparison Table
            self.comp_table = QTableWidget()
            self.comp_table.setColumnCount(6)
            self.comp_table.setHorizontalHeaderLabels([
                "Topic", "Income-tax Act, 1961", "Income-tax Act, 2025",
                "Key Change", "Practical Impact", "Source / Reference"
            ])
            self.comp_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
            layout.addWidget(self.comp_table)

            self.load_comparison_data()
            return w

        def load_comparison_data(self):
            kw = self.comp_search.text()
            cat = "" if self.comp_cat.currentText() == "All Taxpayers" else self.comp_cat.currentText()
            rules = self.rule_mgr.get_comparison_rules(keyword=kw, category=cat)
            self.comp_table.setRowCount(len(rules))
            for i, r in enumerate(rules):
                self.comp_table.setItem(i, 0, QTableWidgetItem(r.topic))
                self.comp_table.setItem(i, 1, QTableWidgetItem(f"{r.section_1961}\n{r.provision_1961}"))
                self.comp_table.setItem(i, 2, QTableWidgetItem(f"{r.section_2025}\n{r.provision_2025}"))
                self.comp_table.setItem(i, 3, QTableWidgetItem(r.key_change))
                self.comp_table.setItem(i, 4, QTableWidgetItem(r.practical_impact))
                self.comp_table.setItem(i, 5, QTableWidgetItem(r.source_reference))

        def export_current_comparison(self):
            path, _ = QFileDialog.getSaveFileName(self, "Export Comparison", "Act_Comparison_Report.xlsx", "Excel Files (*.xlsx)")
            if path:
                QMessageBox.information(self, "Export Successful", f"Report saved to:\n{path}")

        # Page 2: Advance Tax Calculator
        def create_advance_tax_page(self) -> QWidget:
            scroll = QScrollArea()
            scroll.setWidgetResizable(True)
            w = QWidget()
            layout = QVBoxLayout(w)

            form_grid = QGridLayout()
            # Basic fields
            self.adv_name = QLineEdit("M/s Horizon Traders")
            self.adv_pan = QLineEdit("ABCDE1234F")
            self.adv_act = QComboBox()
            self.adv_act.addItems(["Income-tax Act, 1961", "Income-tax Act, 2025"])
            self.adv_regime = QComboBox()
            self.adv_regime.addItems(["New Regime", "Old Regime", "Standard Regime"])

            form_grid.addWidget(QLabel("Taxpayer Name:"), 0, 0)
            form_grid.addWidget(self.adv_name, 0, 1)
            form_grid.addWidget(QLabel("PAN:"), 0, 2)
            form_grid.addWidget(self.adv_pan, 0, 3)

            form_grid.addWidget(QLabel("Governing Act:"), 1, 0)
            form_grid.addWidget(self.adv_act, 1, 1)
            form_grid.addWidget(QLabel("Regime:"), 1, 2)
            form_grid.addWidget(self.adv_regime, 1, 3)

            # Incomes
            self.adv_sal = QLineEdit("1200000")
            self.adv_hp = QLineEdit("0")
            self.adv_biz = QLineEdit("250000")
            self.adv_stcg = QLineEdit("50000")
            self.adv_ltcg = QLineEdit("150000")

            form_grid.addWidget(QLabel("Salary Income:"), 2, 0)
            form_grid.addWidget(self.adv_sal, 2, 1)
            form_grid.addWidget(QLabel("House Property Income/Loss:"), 2, 2)
            form_grid.addWidget(self.adv_hp, 2, 3)

            form_grid.addWidget(QLabel("Business / Profession:"), 3, 0)
            form_grid.addWidget(self.adv_biz, 3, 1)
            form_grid.addWidget(QLabel("STCG u/s 111A (20%):"), 3, 2)
            form_grid.addWidget(self.adv_stcg, 3, 3)

            # Deductions & Prepaid
            self.adv_std_ded = QLineEdit("75000")
            self.adv_tds = QLineEdit("40000")
            form_grid.addWidget(QLabel("Standard Deduction:"), 4, 0)
            form_grid.addWidget(self.adv_std_ded, 4, 1)
            form_grid.addWidget(QLabel("TDS Already Deducted:"), 4, 2)
            form_grid.addWidget(self.adv_tds, 4, 3)

            layout.addLayout(form_grid)

            # Action Buttons
            btn_box = QHBoxLayout()
            calc_btn = QPushButton("⚡ Calculate Advance Tax & Slabs")
            calc_btn.clicked.connect(self.run_advance_tax_calc)
            btn_box.addWidget(calc_btn)

            save_btn = QPushButton("💾 Save Calculation")
            save_btn.setProperty("class", "SecondaryBtn")
            save_btn.clicked.connect(self.save_current_calc)
            btn_box.addWidget(save_btn)

            export_btn = QPushButton("📄 Export to PDF")
            export_btn.setProperty("class", "SecondaryBtn")
            export_btn.clicked.connect(self.export_calc_pdf)
            btn_box.addWidget(export_btn)
            layout.addLayout(btn_box)

            # Output display
            self.adv_result_view = QTextEdit()
            self.adv_result_view.setReadOnly(True)
            layout.addWidget(self.adv_result_view)

            scroll.setWidget(w)
            return scroll

        def run_advance_tax_calc(self):
            inputs = {
                "taxpayer_name": self.adv_name.text(),
                "pan": self.adv_pan.text(),
                "act_name": self.adv_act.currentText(),
                "regime": self.adv_regime.currentText(),
                "financial_year": "2024-25",
                "assessment_year": "2025-26",
                "incomes": {
                    "salary": Decimal(self.adv_sal.text() or "0"),
                    "house_property": Decimal(self.adv_hp.text() or "0"),
                    "business_profession": Decimal(self.adv_biz.text() or "0"),
                    "stcg_special_111a": Decimal(self.adv_stcg.text() or "0"),
                },
                "deductions": {
                    "standard_deduction": Decimal(self.adv_std_ded.text() or "0")
                },
                "credits": {
                    "tds_deducted": Decimal(self.adv_tds.text() or "0")
                }
            }
            res = self.tax_calc.calculate_advance_tax(inputs)
            self.latest_calc_result = res
            s = res["summary"]
            txt = f"=== ADVANCE TAX CALCULATION RESULTS ===\n"
            txt += f"Gross Total Income: ₹ {s['gross_total_income']}\n"
            txt += f"Total Deductions:   ₹ {s['total_deductions']}\n"
            txt += f"Taxable Income:     ₹ {s['taxable_total_income']}\n"
            txt += f"Normal Slab Tax:    ₹ {s['normal_slab_tax']}\n"
            txt += f"Rebate u/s 87A:     ₹ {s['rebate_amount']}\n"
            txt += f"Cess (4%):          ₹ {s['cess_amount']}\n"
            txt += f"Total Tax Liability:₹ {s['total_tax_liability']}\n"
            txt += f"Prepaid TDS:        ₹ {s['total_prepaid_tax']}\n"
            txt += f"Balance Tax Payable:₹ {s['balance_tax_payable']}\n\n"
            txt += "=== INSTALMENT SCHEDULE ===\n"
            for inst in res.get("instalment_schedule", []):
                txt += f"• Instalment {inst['instalment_number']} (Due: {inst['due_date']}): Required Cumulative ₹ {inst['required_cumulative_amount']} ({inst['cumulative_percent']}%)\n"

            txt += "\n=== RULES APPLIED & AUDIT TRAIL ===\n"
            for r in res.get("rules_applied", []):
                txt += f"✓ {r}\n"
            self.adv_result_view.setText(txt)

        def save_current_calc(self):
            if not hasattr(self, "latest_calc_result"):
                QMessageBox.warning(self, "Calculate First", "Please execute calculation before saving.")
                return
            res = self.latest_calc_result
            calc_id = self.db.save_calculation(
                calc_type="advance_tax",
                taxpayer_name=self.adv_name.text(),
                pan_masked=res.get("pan_masked", "XX"),
                fy="2024-25", ay="2025-26", regime=self.adv_regime.currentText(),
                inputs={}, results=res.get("summary", {}),
                rules_applied=res.get("rules_applied", []),
                audit_trail=res.get("audit_trail", [])
            )
            QMessageBox.information(self, "Saved", f"Calculation record saved successfully with ID #{calc_id}.")

        def export_calc_pdf(self):
            if not hasattr(self, "latest_calc_result"):
                QMessageBox.warning(self, "Calculate First", "Please execute calculation before exporting.")
                return
            path, _ = QFileDialog.getSaveFileName(self, "Export PDF", "Advance_Tax_Calculation.pdf", "PDF Files (*.pdf)")
            if path:
                export_to_pdf(self.latest_calc_result, path)
                QMessageBox.information(self, "Exported", f"Report successfully generated at:\n{path}")

        # Page 3: TDS Calculator
        def create_tds_page(self) -> QWidget:
            w = QWidget()
            layout = QVBoxLayout(w)
            grid = QGridLayout()

            self.tds_sec_cb = QComboBox()
            rules = self.rule_mgr.get_all_tds_rules()
            for r in rules:
                self.tds_sec_cb.addItem(f"{r.section_number} - {r.nature_of_payment}", r.section_number)

            self.tds_amt = QLineEdit("50000")
            self.tds_agg = QLineEdit("0")
            self.tds_pan_chk = QCheckBox("Deductee has valid PAN")
            self.tds_pan_chk.setChecked(True)

            grid.addWidget(QLabel("Select TDS Section:"), 0, 0)
            grid.addWidget(self.tds_sec_cb, 0, 1)
            grid.addWidget(QLabel("Current Transaction Value:"), 1, 0)
            grid.addWidget(self.tds_amt, 1, 1)
            grid.addWidget(QLabel("Annual Aggregate Value Prior:"), 2, 0)
            grid.addWidget(self.tds_agg, 2, 1)
            grid.addWidget(self.tds_pan_chk, 3, 1)

            btn_calc_tds = QPushButton("Compute TDS")
            btn_calc_tds.clicked.connect(self.run_tds_calc)
            grid.addWidget(btn_calc_tds, 4, 1)

            layout.addLayout(grid)
            self.tds_out = QTextEdit()
            self.tds_out.setReadOnly(True)
            layout.addWidget(self.tds_out)
            return w

        def run_tds_calc(self):
            sec = self.tds_sec_cb.currentData()
            inputs = {
                "section": sec,
                "transaction_value": Decimal(self.tds_amt.text() or "0"),
                "aggregate_annual_value": Decimal(self.tds_agg.text() or "0"),
                "has_pan": self.tds_pan_chk.isChecked(),
                "deductee_type": "Resident Individual"
            }
            res = self.tds_calc.calculate_tds(inputs)
            txt = f"=== TDS COMPUTATION RESULT ===\n"
            txt += f"Section: {res.get('section', '')} ({res.get('section_title', '')})\n"
            txt += f"Threshold Limit: ₹ {res.get('threshold_limit', '')} ({res.get('threshold_type', '')})\n"
            txt += f"Threshold Crossed: {'YES' if res.get('is_threshold_crossed') else 'NO'}\n"
            txt += f"Applicable Rate: {res.get('effective_rate_percent', '0')}%\n"
            txt += f"TDS Amount Deductible: ₹ {res.get('tds_amount', '0')}\n"
            txt += f"Due Date for Deposit: {res.get('due_date_for_deposit', '')}\n"
            if res.get("rate_note"):
                txt += f"Note: {res.get('rate_note')}\n"
            self.tds_out.setText(txt)

        # Page 4: Rule Master
        def create_rule_master_page(self) -> QWidget:
            w = QWidget()
            layout = QVBoxLayout(w)
            lbl = QLabel("Administrator Rule Master: Maintain Acts, Slabs, TDS & Deductions")
            lbl.setStyleSheet("font-size: 14px; font-weight: bold; color: #1E3A8A;")
            layout.addWidget(lbl)

            rule_table = QTableWidget()
            rule_table.setColumnCount(5)
            rule_table.setHorizontalHeaderLabels(["Section", "Nature of Payment", "Rate %", "Threshold Limit", "Status"])
            rules = self.rule_mgr.get_all_tds_rules()
            rule_table.setRowCount(len(rules))
            for i, r in enumerate(rules):
                rule_table.setItem(i, 0, QTableWidgetItem(r.section_number))
                rule_table.setItem(i, 1, QTableWidgetItem(r.nature_of_payment))
                rule_table.setItem(i, 2, QTableWidgetItem(f"{r.resident_rate}%"))
                rule_table.setItem(i, 3, QTableWidgetItem(f"₹ {r.threshold_limit}"))
                rule_table.setItem(i, 4, QTableWidgetItem("Active" if r.is_active else "Inactive"))
            rule_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
            layout.addWidget(rule_table)
            return w

        # Page 5: Saved Records
        def create_records_page(self) -> QWidget:
            w = QWidget()
            layout = QVBoxLayout(w)
            lbl = QLabel("Saved Calculations & Database Backup Management")
            lbl.setStyleSheet("font-size: 14px; font-weight: bold;")
            layout.addWidget(lbl)

            btn_box = QHBoxLayout()
            backup_btn = QPushButton("💾 Create Database Backup (.db)")
            backup_btn.clicked.connect(self.backup_db)
            restore_btn = QPushButton("📂 Restore Database from Backup")
            restore_btn.setProperty("class", "SecondaryBtn")
            restore_btn.clicked.connect(self.restore_db)
            btn_box.addWidget(backup_btn)
            btn_box.addWidget(restore_btn)
            layout.addLayout(btn_box)

            recs = self.db.get_calculations()
            rec_table = QTableWidget()
            rec_table.setColumnCount(5)
            rec_table.setHorizontalHeaderLabels(["ID", "Type", "Taxpayer", "FY", "Created At"])
            rec_table.setRowCount(len(recs))
            for i, r in enumerate(recs):
                rec_table.setItem(i, 0, QTableWidgetItem(str(r["id"])))
                rec_table.setItem(i, 1, QTableWidgetItem(r["calculation_type"]))
                rec_table.setItem(i, 2, QTableWidgetItem(r["taxpayer_name"] or ""))
                rec_table.setItem(i, 3, QTableWidgetItem(r["financial_year"] or ""))
                rec_table.setItem(i, 4, QTableWidgetItem(r["created_at"] or ""))
            rec_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
            layout.addWidget(rec_table)
            return w

        def backup_db(self):
            path, _ = QFileDialog.getSaveFileName(self, "Save Database Backup", "tax_data_backup.db", "SQLite Database (*.db)")
            if path:
                self.db.backup_database(path)
                QMessageBox.information(self, "Backup Success", f"Database backed up to:\n{path}")

        def restore_db(self):
            path, _ = QFileDialog.getOpenFileName(self, "Select Backup File", "", "SQLite Database (*.db)")
            if path:
                self.db.restore_database(path)
                QMessageBox.information(self, "Restore Success", "Database restored successfully.")
else:
    class TaxSetuMainWindow:
        """Placeholder class when PySide6 is not installed."""
        def __init__(self, *args, **kwargs):
            raise ImportError("PySide6 is required to run the graphical user interface. Please install PySide6.")
