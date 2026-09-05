"""
Seed module for Indian Income-Tax Comparative Analysis & Calculation System.
All rules are explicitly marked as "Demo Rule – Verify Before Use"
as required by the legal safeguards specification.
"""
import sqlite3
from datetime import datetime

DEMO_SOURCE_PREFIX = "Demo Rule – Verify Before Use: "

def seed_database(cursor: sqlite3.Cursor):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. DB Version
    cursor.execute("INSERT OR IGNORE INTO db_version (version_number, applied_at, description) VALUES (?, ?, ?)",
                   (1, now_str, "Initial schema and demo seed rules"))

    # 2. Settings
    default_settings = [
        ("app_name", "Indian Income-tax Comparative Analysis & Calculator"),
        ("default_financial_year", "2024-25"),
        ("default_assessment_year", "2025-26"),
        ("rounding_method", "nearest_ten"),  # As per Section 288A/B (nearest multiple of 10)
        ("admin_pin_hash", "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"), # SHA-256 for demo PIN: "admin123"
        ("enable_dark_mode", "0"),
        ("disclaimer_acknowledged", "1")
    ]
    for k, v in default_settings:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)", (k, v, now_str))

    # 3. Comparison Rules between Income-tax Act, 1961 and Income-tax Act, 2025
    demo_comparisons = [
        (
            "Basis of Charge & Tax Architecture",
            "Chapter II: Basis of Charge",
            "Tax is charged under Section 4 on the total income of the previous year based on rates in the annual Finance Act. Dual regimes exist under Sec 115BAC.",
            "Provisions consolidated under unified Direct Tax Code architecture of Income-tax Act, 2025, streamlining heads of income and standardizing computational definitions.",
            "Section 4 & 115BAC",
            "Section 3 & Section 14 (Configured draft)",
            "Consolidated regime-neutral framework with revised schedule structure",
            "Simplifies multi-slab assessment; reduces annual Finance Act ambiguities",
            "2025-04-01",
            "Individual,HUF,Firm,Company,LLP",
            f"{DEMO_SOURCE_PREFIX}Finance Bill & IT Act 2025 Draft Outline Note",
            "Admin note: Verify against final Gazette notification once notified",
            "changed"
        ),
        (
            "Standard Deduction for Salaried Employees",
            "Chapter IV-A: Salaries",
            "Standard deduction under Section 16(ia) allowed up to Rs. 50,000 (Old Regime) and Rs. 75,000 (New Regime u/s 115BAC for FY 2024-25).",
            "Unified standard deduction provision under Income-tax Act, 2025 with indexed periodic enhancement.",
            "Section 16(ia)",
            "Section 21 (Configured draft)",
            "Single harmonized statutory deduction across regimes",
            "Enhances disposable income for salaried class; eliminates regime disparity",
            "2025-04-01",
            "Individual",
            f"{DEMO_SOURCE_PREFIX}Union Budget Explanatory Memorandum",
            "Check threshold configuration per assessment year",
            "changed"
        ),
        (
            "Capital Gains Categorization & Holding Periods",
            "Chapter IV-E: Capital Gains",
            "Complex holding periods (12/24/36 months) across listed vs unlisted assets; STCG under 111A at 20%, LTCG under 112A at 12.5% with Rs. 1.25 Lakh exemption.",
            "Standardized 2 holding period tiers (12 months listed, 24 months unlisted); uniform indexation phase-out and simplified rate matrices.",
            "Section 2(42A), 111A, 112, 112A",
            "Section 48 to 55 (Configured draft)",
            "Streamlined holding periods and unified reporting taxonomy",
            "Reduces litigation on characterization; simplifies portfolio computation",
            "2025-04-01",
            "Individual,HUF,Firm,Company,Non-resident",
            f"{DEMO_SOURCE_PREFIX}CBDT Rationalization Committee Report",
            "Carefully calculate indexation impact for legacy properties acquired before 2001",
            "changed"
        ),
        (
            "TDS Rationalization and De-criminalization",
            "Chapter XVII-B: Collection and Recovery (TDS)",
            "Over 30 distinct TDS sections with varying rates from 0.1% to 30%, complex thresholds and separate penal provisions under Sec 276B.",
            "Rationalized into fewer rate bands (1%, 2%, 5%, 10%, 20%); higher monetary threshold before prosecution proceedings.",
            "Sections 192 to 195",
            "Sections 180 to 198 (Configured draft)",
            "Rate band reduction and threshold consolidation",
            "Significant ease of compliance for MSMEs and withholding agents",
            "2025-04-01",
            "Individual,HUF,Firm,LLP,Company,Trust",
            f"{DEMO_SOURCE_PREFIX}Task Force Report on Direct Tax Law Simplification",
            "Rate configurations should be monitored per section",
            "changed"
        ),
        (
            "Rebate under Section 87A / Equivalent",
            "Chapter VIII: Rebates and Reliefs",
            "Rebate up to Rs. 25,000 for taxable income up to Rs. 7,00,000 under New Regime (marginal relief enabled). Old regime limit Rs. 5,00,000 (Rs. 12,500).",
            "Enhanced threshold rebate protecting lower-income earners up to revised basic exemption limit under Income-tax Act, 2025.",
            "Section 87A",
            "Section 68 (Configured draft)",
            "Increased threshold for nil tax liability",
            "Zero effective tax liability for broad middle income bracket",
            "2025-04-01",
            "Individual",
            f"{DEMO_SOURCE_PREFIX}CBDT Proposed Schedules",
            "Applies strictly to resident individuals",
            "changed"
        ),
        (
            "Virtual Digital Assets (VDA) Reporting",
            "Chapter XII-AA: Special Rates",
            "Section 115BBH imposes flat 30% tax without deduction of expenses (except cost of acquisition) or set-off of losses; 1% TDS u/s 194S.",
            "Detailed classification under Income-tax Act, 2025 for tokenized instruments, web3 assets, and standardized exchange reconciliation reporting.",
            "Section 115BBH & 194S",
            "Section 92 (Configured draft)",
            "Distinction between utility tokens and speculative digital assets",
            "Allows set-off within digital asset classes under stricter audit trails",
            "2025-04-01",
            "Individual,HUF,Company,Firm",
            f"{DEMO_SOURCE_PREFIX}High Level Committee on Digital Assets",
            "Pending final technical rules",
            "requires_review"
        ),
        (
            "Reassessment and Faceless Procedures",
            "Chapter XIV: Procedure for Assessment",
            "Sections 147, 148, 148A prescribe 3-year standard and 10-year extended limitation period for income escaping assessment.",
            "Unified limitation period of 5 years with mandatory prior verification; electronic document identification system.",
            "Sections 147 to 151",
            "Sections 130 to 142 (Configured draft)",
            "Reduced window for reopening and strict evidentiary thresholds",
            "Certainty of tax assessments; curtailed prolonged inquiry periods",
            "2025-04-01",
            "Individual,HUF,Company,Firm,LLP,Trust",
            f"{DEMO_SOURCE_PREFIX}Law Commission & Parliament Standing Committee Recommendations",
            "Procedural changes take effect from designated gazette date",
            "changed"
        )
    ]

    for item in demo_comparisons:
        cursor.execute("""
            INSERT INTO comparison_rules (
                topic, chapter, provision_1961, provision_2025,
                section_1961, section_2025, key_change, practical_impact,
                applicability_date, taxpayer_categories, source_reference,
                notes, change_type, is_active, version, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
        """, (*item, now_str))

    # 4. Tax Slabs - New Regime & Old Regime (Income-tax Act, 1961 & Configured 2025)
    # FY 2024-25 / AY 2025-26 New Regime
    slabs_data = [
        # Act 1961 - New Regime (FY 2024-25 / AY 2025-26 Budget 2024 revised)
        ("Income-tax Act, 1961", "New Regime", "2024-25", "2025-26", "Individual", 0, 300000, 0.0, f"{DEMO_SOURCE_PREFIX}Finance (No. 2) Act 2024 Sec 115BAC"),
        ("Income-tax Act, 1961", "New Regime", "2024-25", "2025-26", "Individual", 300000, 700000, 5.0, f"{DEMO_SOURCE_PREFIX}Finance (No. 2) Act 2024 Sec 115BAC"),
        ("Income-tax Act, 1961", "New Regime", "2024-25", "2025-26", "Individual", 700000, 1000000, 10.0, f"{DEMO_SOURCE_PREFIX}Finance (No. 2) Act 2024 Sec 115BAC"),
        ("Income-tax Act, 1961", "New Regime", "2024-25", "2025-26", "Individual", 1000000, 1200000, 15.0, f"{DEMO_SOURCE_PREFIX}Finance (No. 2) Act 2024 Sec 115BAC"),
        ("Income-tax Act, 1961", "New Regime", "2024-25", "2025-26", "Individual", 1200000, 1500000, 20.0, f"{DEMO_SOURCE_PREFIX}Finance (No. 2) Act 2024 Sec 115BAC"),
        ("Income-tax Act, 1961", "New Regime", "2024-25", "2025-26", "Individual", 1500000, None, 30.0, f"{DEMO_SOURCE_PREFIX}Finance (No. 2) Act 2024 Sec 115BAC"),

        # Act 1961 - Old Regime (FY 2024-25 / AY 2025-26)
        ("Income-tax Act, 1961", "Old Regime", "2024-25", "2025-26", "Individual", 0, 250000, 0.0, f"{DEMO_SOURCE_PREFIX}First Schedule Part I"),
        ("Income-tax Act, 1961", "Old Regime", "2024-25", "2025-26", "Individual", 250000, 500000, 5.0, f"{DEMO_SOURCE_PREFIX}First Schedule Part I"),
        ("Income-tax Act, 1961", "Old Regime", "2024-25", "2025-26", "Individual", 500000, 1000000, 20.0, f"{DEMO_SOURCE_PREFIX}First Schedule Part I"),
        ("Income-tax Act, 1961", "Old Regime", "2024-25", "2025-26", "Individual", 1000000, None, 30.0, f"{DEMO_SOURCE_PREFIX}First Schedule Part I"),

        # Income-tax Act, 2025 (Demo Configured Slabs FY 2025-26 / AY 2026-27)
        ("Income-tax Act, 2025", "Standard Regime", "2025-26", "2026-27", "Individual", 0, 400000, 0.0, f"{DEMO_SOURCE_PREFIX}Draft Schedule Income-tax Act, 2025 (Rule not legally binding)"),
        ("Income-tax Act, 2025", "Standard Regime", "2025-26", "2026-27", "Individual", 400000, 800000, 5.0, f"{DEMO_SOURCE_PREFIX}Draft Schedule Income-tax Act, 2025 (Rule not legally binding)"),
        ("Income-tax Act, 2025", "Standard Regime", "2025-26", "2026-27", "Individual", 800000, 1200000, 10.0, f"{DEMO_SOURCE_PREFIX}Draft Schedule Income-tax Act, 2025 (Rule not legally binding)"),
        ("Income-tax Act, 2025", "Standard Regime", "2025-26", "2026-27", "Individual", 1200000, 1600000, 15.0, f"{DEMO_SOURCE_PREFIX}Draft Schedule Income-tax Act, 2025 (Rule not legally binding)"),
        ("Income-tax Act, 2025", "Standard Regime", "2025-26", "2026-27", "Individual", 1600000, 2000000, 20.0, f"{DEMO_SOURCE_PREFIX}Draft Schedule Income-tax Act, 2025 (Rule not legally binding)"),
        ("Income-tax Act, 2025", "Standard Regime", "2025-26", "2026-27", "Individual", 2000000, None, 25.0, f"{DEMO_SOURCE_PREFIX}Draft Schedule Income-tax Act, 2025 (Rule not legally binding)"),
    ]

    for row in slabs_data:
        cursor.execute("""
            INSERT INTO tax_slabs (
                act_name, regime, financial_year, assessment_year,
                taxpayer_category, slab_min, slab_max, tax_rate_percent,
                source_reference, is_active, version, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
        """, (*row, now_str))

    # 5. Rebates
    rebates = [
        ("Income-tax Act, 1961", "New Regime", "2024-25", "2025-26", 700000, 25000, "Section 87A", f"{DEMO_SOURCE_PREFIX}Sec 87A New Regime"),
        ("Income-tax Act, 1961", "Old Regime", "2024-25", "2025-26", 500000, 12500, "Section 87A", f"{DEMO_SOURCE_PREFIX}Sec 87A Old Regime"),
        ("Income-tax Act, 2025", "Standard Regime", "2025-26", "2026-27", 800000, 20000, "Section 68 (Configured)", f"{DEMO_SOURCE_PREFIX}Sec 68 Draft Act 2025"),
    ]
    for r in rebates:
        cursor.execute("""
            INSERT INTO tax_rebates (
                act_name, regime, financial_year, assessment_year,
                max_income_limit, max_rebate_amount, section_ref, source_reference, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, r)

    # 6. Surcharge Rules
    surcharges = [
        ("Income-tax Act, 1961", "New Regime", "2024-25", "2025-26", "Individual", 5000000, 10000000, 10.0, 1),
        ("Income-tax Act, 1961", "New Regime", "2024-25", "2025-26", "Individual", 10000000, 20000000, 15.0, 1),
        ("Income-tax Act, 1961", "New Regime", "2024-25", "2025-26", "Individual", 20000000, None, 25.0, 1), # Max 25% in new regime

        ("Income-tax Act, 1961", "Old Regime", "2024-25", "2025-26", "Individual", 5000000, 10000000, 10.0, 1),
        ("Income-tax Act, 1961", "Old Regime", "2024-25", "2025-26", "Individual", 10000000, 20000000, 15.0, 1),
        ("Income-tax Act, 1961", "Old Regime", "2024-25", "2025-26", "Individual", 20000000, 50000000, 25.0, 1),
        ("Income-tax Act, 1961", "Old Regime", "2024-25", "2025-26", "Individual", 50000000, None, 37.0, 1),

        ("Income-tax Act, 2025", "Standard Regime", "2025-26", "2026-27", "Individual", 5000000, 10000000, 10.0, 1),
        ("Income-tax Act, 2025", "Standard Regime", "2025-26", "2026-27", "Individual", 10000000, 20000000, 15.0, 1),
        ("Income-tax Act, 2025", "Standard Regime", "2025-26", "2026-27", "Individual", 20000000, None, 22.0, 1),
    ]
    for s in surcharges:
        cursor.execute("""
            INSERT INTO surcharge_rules (
                act_name, regime, financial_year, assessment_year, taxpayer_category,
                min_income, max_income, surcharge_rate_percent, marginal_relief_applicable, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, s)

    # 7. Cess Rules (4% Health & Education Cess)
    cesses = [
        ("2024-25", "2025-26", "Health and Education Cess", 4.0),
        ("2025-26", "2026-27", "Health and Education Cess", 4.0)
    ]
    for c in cesses:
        cursor.execute("INSERT INTO cess_rules (financial_year, assessment_year, cess_name, cess_rate_percent, is_active) VALUES (?, ?, ?, ?, 1)", c)

    # 8. Deductions
    deductions = [
        ("Income-tax Act, 1961", "New Regime", "16(ia)", "Standard Deduction for Salaried/Pensioners", 75000.0, "Individual", f"{DEMO_SOURCE_PREFIX}Finance (No. 2) Act 2024"),
        ("Income-tax Act, 1961", "Old Regime", "16(ia)", "Standard Deduction for Salaried/Pensioners", 50000.0, "Individual", f"{DEMO_SOURCE_PREFIX}Sec 16(ia)"),
        ("Income-tax Act, 1961", "Old Regime", "80C", "Deductions on EPF, PPF, ELSS, Life Insurance, Principal on Home Loan", 150000.0, "Individual,HUF", f"{DEMO_SOURCE_PREFIX}Sec 80C"),
        ("Income-tax Act, 1961", "Old Regime", "80D", "Health Insurance Premium & Preventive Health Checkup", 25000.0, "Individual,HUF", f"{DEMO_SOURCE_PREFIX}Sec 80D"),
        ("Income-tax Act, 1961", "Old Regime", "80CCD(1B)", "Additional contribution to NPS", 50000.0, "Individual", f"{DEMO_SOURCE_PREFIX}Sec 80CCD(1B)"),
        ("Income-tax Act, 1961", "New Regime", "80CCD(2)", "Employer contribution to NPS (up to 14% of salary)", None, "Individual", f"{DEMO_SOURCE_PREFIX}Sec 80CCD(2)"),
        ("Income-tax Act, 1961", "Old Regime", "24(b)", "Interest on Borrowed Capital (Self-Occupied House Property)", 200000.0, "Individual,HUF", f"{DEMO_SOURCE_PREFIX}Sec 24(b)"),
        ("Income-tax Act, 2025", "Standard Regime", "21(std)", "Standard Employment Deduction", 100000.0, "Individual", f"{DEMO_SOURCE_PREFIX}Income-tax Act, 2025 Draft Schedule"),
    ]
    for d in deductions:
        cursor.execute("""
            INSERT INTO deduction_rules (
                act_name, regime, section_ref, name, max_limit, eligible_categories,
                source_reference, is_active, version, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
        """, (*d, now_str))

    # 9. TDS Section Master Rules
    tds_data = [
        (
            "194C", "Payments to Contractors & Sub-contractors",
            "Contractual Work & Advertising", "Any Specified Person",
            "Resident Individual/HUF/Firm/Company", 1.0, 30.0, 20.0,
            30000.0, "single_transaction", "2024-04-01", 0.0, 0.0, 1,
            "No TDS if single transaction <= 30k AND aggregate <= 1 Lakh. 2% for non-individual deductees.",
            "1% for Ind/HUF deductees; 2% for other entities. Rate without PAN is 20% u/s 206AA.",
            f"{DEMO_SOURCE_PREFIX}Section 194C CBDT Circular"
        ),
        (
            "194J(a)", "Fees for Professional Services",
            "Professional, Technical, Royalty Fees", "Specified Entities",
            "Resident Individual, Firm, Company", 10.0, 30.0, 20.0,
            30000.0, "annual", "2024-04-01", 0.0, 0.0, 1,
            "Nil TDS if annual aggregate <= Rs. 30,000",
            "Technical fees reduced to 2% under 194J(1); 10% for other professional services.",
            f"{DEMO_SOURCE_PREFIX}Section 194J Finance Act"
        ),
        (
            "194J(b)", "Fees for Technical Services (FTS)",
            "Technical Services & Call Centre Operators", "Specified Entities",
            "Resident Individuals & Entities", 2.0, 30.0, 20.0,
            30000.0, "annual", "2024-04-01", 0.0, 0.0, 1,
            "Nil TDS if annual aggregate <= Rs. 30,000",
            "Reduced rate of 2% applicable to pure technical services.",
            f"{DEMO_SOURCE_PREFIX}Section 194J(1) Proviso"
        ),
        (
            "194I(a)", "Rent on Plant, Machinery or Equipment",
            "Equipment Rental", "Individuals (Audit) / Entities",
            "Resident Entities", 2.0, 30.0, 20.0,
            240000.0, "annual", "2024-04-01", 0.0, 0.0, 1,
            "Aggregate annual limit Rs. 2,40,000",
            "2% on machinery leasing. Surcharge/cess added only for foreign entities.",
            f"{DEMO_SOURCE_PREFIX}Section 194-I(a)"
        ),
        (
            "194I(b)", "Rent on Land or Building or Furniture",
            "Commercial & Residential Rent", "Specified Entities",
            "Resident Individuals & Entities", 10.0, 30.0, 20.0,
            240000.0, "annual", "2024-04-01", 0.0, 0.0, 1,
            "Aggregate annual limit Rs. 2,40,000",
            "10% for immovable property rent.",
            f"{DEMO_SOURCE_PREFIX}Section 194-I(b)"
        ),
        (
            "194A", "Interest other than Interest on Securities (Banks / NBFCs)",
            "Bank Fixed Deposit & Recurring Deposit Interest", "Banking Companies & Co-ops",
            "Resident Individuals & HUF", 10.0, 30.0, 20.0,
            40000.0, "annual", "2024-04-01", 0.0, 0.0, 1,
            "Threshold Rs. 50,000 for Senior Citizens; Rs. 40,000 for others.",
            "Form 15G/15H valid for nil deduction.",
            f"{DEMO_SOURCE_PREFIX}Section 194A"
        ),
        (
            "194Q", "Payment for Purchase of Goods",
            "Purchase of Goods exceeding Rs. 50 Lakhs", "Buyer with turnover > 10 Cr",
            "Resident Sellers", 0.1, 30.0, 5.0,
            5000000.0, "annual", "2024-04-01", 0.0, 0.0, 0,
            "Only on amount exceeding Rs. 50,00,000 in a financial year",
            "Rate without PAN is 5% under Sec 206AA proviso.",
            f"{DEMO_SOURCE_PREFIX}Section 194Q"
        ),
        (
            "194H", "Commission or Brokerage",
            "Brokerage on Commercial Transactions", "Specified Entities",
            "Resident Intermediaries", 2.0, 30.0, 20.0, # Reduced to 2% from Oct 2024
            15000.0, "annual", "2024-10-01", 0.0, 0.0, 1,
            "Threshold Rs. 15,000 per financial year",
            "Rate reduced from 5% to 2% effective 1st October 2024 via Finance (No. 2) Act 2024.",
            f"{DEMO_SOURCE_PREFIX}Finance (No. 2) Act 2024 Sec 194H"
        ),
        (
            "194DA", "Payment in respect of Life Insurance Policy",
            "Maturity proceeds not exempt u/s 10(10D)", "Insurance Companies",
            "Resident Policyholders", 2.0, 30.0, 20.0, # Reduced to 2% from Oct 2024
            100000.0, "annual", "2024-10-01", 0.0, 0.0, 1,
            "TDS on income component if aggregate >= Rs. 1,00,000",
            "Rate reduced from 5% to 2% effective Oct 2024.",
            f"{DEMO_SOURCE_PREFIX}Section 194DA Amendment"
        )
    ]

    for item in tds_data:
        cursor.execute("""
            INSERT INTO tds_rules (
                section_number, section_title, nature_of_payment, applicable_payer,
                applicable_deductee, resident_rate, non_resident_rate, rate_without_pan,
                threshold_limit, threshold_type, effective_date, applicable_surcharge,
                applicable_cess, lower_ded_cert_allowed, exemptions, remarks,
                source_reference, last_updated, is_active, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
        """, (*item, now_str))

    # 10. Advance Tax Instalment Schedule Rules
    adv_rules = [
        ("2024-25", 1, "15th June", 15.0, "First instalment: 15% of estimated tax payable"),
        ("2024-25", 2, "15th September", 45.0, "Second instalment: 45% cumulative"),
        ("2024-25", 3, "15th December", 75.0, "Third instalment: 75% cumulative"),
        ("2024-25", 4, "15th March", 100.0, "Final instalment: 100% cumulative"),

        ("2025-26", 1, "15th June", 15.0, "First instalment: 15% of estimated tax payable"),
        ("2025-26", 2, "15th September", 45.0, "Second instalment: 45% cumulative"),
        ("2025-26", 3, "15th December", 75.0, "Third instalment: 75% cumulative"),
        ("2025-26", 4, "15th March", 100.0, "Final instalment: 100% cumulative"),
    ]
    for ar in adv_rules:
        cursor.execute("""
            INSERT INTO advance_tax_rules (
                financial_year, instalment_number, due_date, cumulative_percent, description, is_active
            ) VALUES (?, ?, ?, ?, ?, 1)
        """, ar)

    # 11. Initial Audit Log
    cursor.execute("""
        INSERT INTO audit_logs (timestamp, user_role, action, entity_type, entity_id, details)
        VALUES (?, 'system', 'INITIALIZE', 'DATABASE', 1, 'Seeded default demo rules marked Demo Rule - Verify Before Use')
    """, (now_str,))
