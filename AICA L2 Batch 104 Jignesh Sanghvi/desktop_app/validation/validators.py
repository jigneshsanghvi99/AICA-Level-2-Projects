"""
Input validation and compliance guardrails for Indian Income-Tax calculations.
"""
import re
from datetime import datetime
from decimal import Decimal
from typing import Tuple, List, Dict, Any, Optional

PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")

def validate_pan(pan: str) -> Tuple[bool, str]:
    if not pan:
        return False, "PAN is empty. Section 206AA penal rate may apply."
    clean_pan = pan.strip().upper()
    if not PAN_REGEX.match(clean_pan):
        return False, f"Invalid PAN format '{pan}'. Expected 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F)."
    return True, ""

def validate_fy_ay_consistency(fy: str, ay: str) -> Tuple[bool, str]:
    """Ensures FY (e.g., 2024-25) maps to AY (e.g., 2025-26)."""
    try:
        fy_start = int(fy.split("-")[0])
        ay_start = int(ay.split("-")[0])
        if ay_start != fy_start + 1:
            return False, f"Inconsistent Financial Year ({fy}) and Assessment Year ({ay}). Assessment year must be FY + 1 year."
        return True, ""
    except Exception:
        return False, f"Cannot parse FY '{fy}' or AY '{ay}'. Expected format 'YYYY-YY' (e.g. 2024-25)."

def validate_positive_amount(val: Any, field_name: str, allow_zero: bool = True) -> Tuple[bool, str]:
    try:
        d = Decimal(str(val))
        if not allow_zero and d <= Decimal('0'):
            return False, f"{field_name} must be greater than zero."
        if allow_zero and d < Decimal('0'):
            return False, f"{field_name} cannot be negative."
        return True, ""
    except Exception:
        return False, f"{field_name} must be a valid numeric amount."

def validate_date(date_str: str, field_name: str) -> Tuple[bool, str]:
    if not date_str:
        return False, f"{field_name} date is required."
    try:
        datetime.strptime(date_str.strip(), "%Y-%m-%d")
        return True, ""
    except ValueError:
        return False, f"Invalid date for {field_name}. Expected format YYYY-MM-DD."

def validate_advance_tax_inputs(inputs: Dict[str, Any]) -> List[str]:
    errors = []
    # Check FY and AY
    fy = inputs.get("financial_year", "")
    ay = inputs.get("assessment_year", "")
    ok, msg = validate_fy_ay_consistency(fy, ay)
    if not ok:
        errors.append(msg)

    # Check PAN if provided
    pan = inputs.get("pan", "")
    if pan:
        ok, msg = validate_pan(pan)
        if not ok:
            errors.append(msg)

    # Validate incomes
    incomes = inputs.get("incomes", {})
    for k, v in incomes.items():
        if k == "house_property":
            # Can be negative (loss)
            try:
                Decimal(str(v))
            except Exception:
                errors.append("House property income must be a valid number.")
        else:
            ok, msg = validate_positive_amount(v, k.replace("_", " ").title())
            if not ok:
                errors.append(msg)

    return errors
