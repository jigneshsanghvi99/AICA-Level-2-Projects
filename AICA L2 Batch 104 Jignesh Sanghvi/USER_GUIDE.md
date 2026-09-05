# TaxSetu Desktop: User Guide

Welcome to the Indian Income-tax Comparative Analysis & Tax Calculation Workstation.

## 1. Getting Started
1. Launch the application via `python desktop_app/main.py` or double-clicking the compiled executable.
2. The Top Header displays the active Financial Year (FY 2024-25), Assessment Year (AY 2025-26), and current User Role (`Standard User`).
3. Toggle between **Light Mode** and **Dark Mode** at any time using the toggle in the sidebar.

## 2. Dashboard
- View total computations performed, advance tax payable, total TDS calculated, and comparisons made.
- Inspect the visual income composition and statutory slab distributions.
- Check color-coded status badges: Green (completed/paid), Orange (action pending), Red (missing rule), Blue (informational).

## 3. Comparative Analysis (1961 vs 2025)
- Navigate to **Act Comparison (1961 vs 2025)**.
- Filter provisions by Taxpayer Category (e.g., Individual, Company, HUF).
- Search by section number or keyword (e.g. `Standard Deduction`, `Capital Gains`, `Rebate`).
- Examine side-by-side differences, key changes, practical impacts, and administrator source notes.
- Click **Export Comparison** to generate an Excel or PDF summary.

## 4. Advance Tax Calculator
1. Enter Taxpayer Name, PAN, and select the Governing Act and Regime (New Regime vs Old Regime).
2. Input income figures under respective heads:
   - Salary Income
   - House Property Income / Loss (Loss capped at -₹ 2,00,000 for inter-head set-off)
   - Business & Professional Income
   - Capital Gains (STCG u/s 111A, LTCG u/s 112A)
3. Enter Deductions claimed (Standard deduction is automatically verified against configured regime limits).
4. Enter prepaid taxes already deducted (TDS, TCS, Advance Tax already deposited).
5. Click **⚡ Calculate Advance Tax & Slabs**:
   - Inspect the Step-by-Step Slab breakdown.
   - Review Section 87A rebate applicability.
   - Review Surcharge with marginal relief and 4% Health & Education Cess.
   - Review the statutory Advance Tax Instalment Schedule (15%, 45%, 75%, 100%).
6. Click **Save Calculation** to store the calculation in your local SQLite records.
7. Click **Export to PDF** or **Export to Excel** to produce print-ready reports.

## 5. TDS Calculator
1. Select the relevant TDS Section from the searchable section master (e.g., `194C`, `194J`, `194I`, `194A`, `194Q`).
2. Enter the transaction value and prior aggregate annual value.
3. Check/uncheck **Deductee has valid PAN** (if unchecked, Section 206AA rate of 20% applies).
4. Click **Compute TDS** to inspect:
   - Threshold crossing determination.
   - Base rate, surcharge, cess, and effective rate.
   - Statutory due date for government deposit.
