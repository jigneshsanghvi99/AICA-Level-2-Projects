# TaxSetu Desktop: Administrator Guide

## 1. Accessing Administrator Mode
1. Click the **Role: Standard User** button in the top-right header.
2. Enter the administrator security PIN.
   - Default Demo PIN: `admin123`
3. Upon authentication, the header badge changes to **Role: Administrator 🛡️** and the **Tax Rule Master** becomes accessible.

## 2. Maintaining Tax Slabs and Rates
- Never alter source code to update tax rates.
- Navigate to **Tax Rule Master** > **Tax Slabs**.
- Add a new slab record or edit an existing slab by specifying:
  - Act Name: `Income-tax Act, 1961` or `Income-tax Act, 2025`
  - Regime: `New Regime`, `Old Regime`, or `Standard Regime`
  - Financial Year & Assessment Year
  - Slab Minimum and Slab Maximum
  - Tax Rate Percentage
  - Statutory Source Reference note
- The system automatically increments the rule version number and logs the change to `audit_logs`.

## 3. Maintaining TDS Sections & Thresholds
- To update a TDS rate (for example, the reduction of Section 194H/194DA rate to 2%):
  1. Locate the section in the TDS Section Master.
  2. Modify the resident rate, non-resident rate, or threshold limit.
  3. Enter the official notification reference or circular date in the source reference field.
  4. Save the rule. The change takes effect immediately across all calculations.

## 4. Deactivating vs. Deleting Rules
- To preserve calculation integrity and audit trails for prior years, rules cannot be permanently deleted if they have been utilized in calculations.
- Mark the rule as **Inactive** (`is_active = 0`). The system will retain the record for historical audit purposes while omitting it from new calculations.

## 5. Local Database Backup & Restore
- Go to **Saved Records & Backup**.
- Click **Create Database Backup (.db)** to generate a timestamped local copy of `tax_data.db`.
- Click **Restore Database from Backup** to roll back the system to any previously saved state.
