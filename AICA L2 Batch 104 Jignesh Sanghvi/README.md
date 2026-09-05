# Indian Income-tax Comparative Analysis & Tax Calculation Workstation (TaxSetu)

A professional, colourful, offline-first desktop application engineered for Indian income-tax comparative analysis (Income-tax Act, 1961 vs Income-tax Act, 2025), advance tax calculations, TDS computations, and multi-format reporting.

---

## 🛡️ Legal Safeguard & Compliance Disclaimer
> **IMPORTANT**: This application is for educational, planning, and preliminary computation purposes only. Tax calculations must be verified against the applicable law, rules, notifications, circulars, and professional advice.
> 
> The application maintains all provisions, rates, thresholds, deductions, exemptions, and effective dates in editable local SQLite tables. When a provision is unverified or unavailable, the system states **"Rule not configured"** rather than fabricating legal provisions or making assumptions.

---

## Key Features

1. **Comparative Analysis (Act Comparison)**
   - Side-by-side comparison of the **Income-tax Act, 1961** and **Income-tax Act, 2025**.
   - Filter by Topic, Chapter, Section, Taxpayer Category (Individual, HUF, Firm, LLP, Company, Trust, Non-resident, Senior Citizen).
   - Search by keyword, highlight amended/new/deleted/replaced provisions.
   - User notes and bookmarking.

2. **Advance Tax Calculator**
   - Income heads: Salary, House Property (with -2L loss cap), Business/Profession, Capital Gains (STCG 111A, LTCG 112A), Other Sources.
   - Deductions: Standard Deduction (Section 16(ia)), Chapter VI-A (80C, 80D, 80CCD).
   - Slabs, Section 87A rebate, Surcharge with marginal relief check, 4% Health & Education Cess.
   - Advance Tax Instalment Schedule (15%, 45%, 75%, 100% due dates) with visual progress tracking.
   - Full calculation formula audit trail and "How was this calculated?" explanation.

3. **TDS Calculator**
   - Comprehensive searchable section master (194C, 194J, 194I, 194A, 194Q, 194H, etc.).
   - Threshold crossing checks (single transaction vs annual aggregate).
   - Section 206AA penal rate (20%) when PAN is absent.
   - Lower deduction certificate rate (Section 197) and Non-resident rate matrices.
   - TDS Section Comparison tool.

4. **Administrator Tax Rule Master**
   - Protected by local PIN authentication (Default Demo PIN: `admin123`).
   - Add, edit, duplicate, and deactivate rules without modifying application code.
   - Full version history, rollback capability, and audit trail.
   - CSV export and import.

5. **Multi-Format Reports & Exports**
   - **Excel (.xlsx)** via openpyxl with formatted tables, input summaries, and disclaimers.
   - **Word (.docx)** via python-docx with styled headings, taxpayer profile, and calculations.
   - **PDF (.pdf)** via ReportLab with page numbering, headers, footers, and tables.

6. **Local Persistence & Safeguards**
   - Local SQLite database (`tax_data.db`) with normalized schema.
   - 1-click database backup and restore.
   - Zero external cloud dependencies, zero external APIs, zero telemetry.

---

## Installation & Running the Desktop Application

### Prerequisites
- Python 3.10, 3.11, or 3.12+
- Windows, macOS, or Linux

### Quick Start
```bash
# 1. Clone or extract the repository
git clone <repo-url>
cd applet

# 2. Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install required dependencies
pip install -r requirements.txt

# 4. Run the Desktop Application
python desktop_app/main.py
```

### Running Automated Tests
```bash
python -m unittest discover tests
```

### Building Windows Executable (.exe) with PyInstaller
```bash
pyinstaller tax_analyzer.spec
```
The compiled executable will be generated in the `dist/` directory.

---

## Directory Structure
```
├── desktop_app/
│   ├── main.py                  # PySide6 desktop entry point
│   ├── database/
│   │   ├── schema.sql           # Normalized SQLite schema
│   │   ├── db_manager.py        # Transactional SQLite manager, backup/restore
│   │   └── seed_demo_rules.py   # Demo rule seed script
│   ├── tax_rules/
│   │   ├── models.py            # Rule data models (Decimal arithmetic)
│   │   └── rule_manager.py      # Rule CRUD, versioning, conflict checks
│   ├── engine/
│   │   ├── calculator.py        # Income & Advance Tax computation engine
│   │   └── tds_calculator.py    # TDS computation engine
│   ├── validation/
│   │   └── validators.py        # PAN, FY/AY consistency & amount validation
│   ├── reports/
│   │   ├── exporter_excel.py    # Excel (.xlsx) generator
│   │   ├── exporter_word.py     # Word (.docx) generator
│   │   └── exporter_pdf.py      # PDF (.pdf) generator
│   └── ui/
│       └── main_window.py       # PySide6 desktop GUI with cards, dark/light modes
├── tests/
│   ├── test_tax_engine.py       # Unit tests for tax engine & slabs
│   ├── test_tds_engine.py       # Unit tests for TDS calculations
│   ├── test_validators.py       # Unit tests for input validation
│   └── test_export.py           # Unit tests for file exporters
├── tax_analyzer.spec            # PyInstaller build specification
├── requirements.txt             # Python desktop dependencies
├── USER_GUIDE.md                # Comprehensive user guide
├── ADMIN_GUIDE.md               # Rule administration and versioning guide
└── DISCLAIMER.md                # Compliance safeguard text
```
