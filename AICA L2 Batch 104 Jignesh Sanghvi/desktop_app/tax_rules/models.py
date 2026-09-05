"""
Data models for tax rules, slabs, deductions, and TDS provisions.
Uses Decimal types for financial safety.
"""
from dataclasses import dataclass
from typing import Optional, List
from decimal import Decimal

@dataclass
class TaxSlab:
    id: Optional[int]
    act_name: str
    regime: str
    financial_year: str
    assessment_year: str
    taxpayer_category: str
    slab_min: Decimal
    slab_max: Optional[Decimal]
    tax_rate_percent: Decimal
    source_reference: str
    is_active: bool = True
    version: int = 1
    last_updated: str = ""

@dataclass
class RebateRule:
    id: Optional[int]
    act_name: str
    regime: str
    financial_year: str
    assessment_year: str
    max_income_limit: Decimal
    max_rebate_amount: Decimal
    section_ref: str
    source_reference: str
    is_active: bool = True

@dataclass
class SurchargeRule:
    id: Optional[int]
    act_name: str
    regime: str
    financial_year: str
    assessment_year: str
    taxpayer_category: str
    min_income: Decimal
    max_income: Optional[Decimal]
    surcharge_rate_percent: Decimal
    marginal_relief_applicable: bool = True
    is_active: bool = True

@dataclass
class CessRule:
    id: Optional[int]
    financial_year: str
    assessment_year: str
    cess_name: str
    cess_rate_percent: Decimal
    is_active: bool = True

@dataclass
class DeductionRule:
    id: Optional[int]
    act_name: str
    regime: str
    section_ref: str
    name: str
    max_limit: Optional[Decimal]
    eligible_categories: str
    source_reference: str
    is_active: bool = True
    version: int = 1
    last_updated: str = ""

@dataclass
class TDSRule:
    id: Optional[int]
    section_number: str
    section_title: str
    nature_of_payment: str
    applicable_payer: str
    applicable_deductee: str
    resident_rate: Decimal
    non_resident_rate: Decimal
    rate_without_pan: Decimal
    threshold_limit: Decimal
    threshold_type: str  # 'annual' or 'single_transaction'
    effective_date: str
    applicable_surcharge: Decimal
    applicable_cess: Decimal
    lower_ded_cert_allowed: bool
    exemptions: str
    remarks: str
    source_reference: str
    last_updated: str = ""
    is_active: bool = True
    version: int = 1

@dataclass
class AdvanceTaxRule:
    id: Optional[int]
    financial_year: str
    instalment_number: int
    due_date: str
    cumulative_percent: Decimal
    description: str
    is_active: bool = True

@dataclass
class ComparisonRule:
    id: Optional[int]
    topic: str
    chapter: str
    provision_1961: str
    provision_2025: str
    section_1961: str
    section_2025: str
    key_change: str
    practical_impact: str
    applicability_date: str
    taxpayer_categories: str
    source_reference: str
    notes: str
    change_type: str  # 'changed', 'new', 'deleted', 'unchanged', 'requires_review'
    is_active: bool = True
    version: int = 1
    last_updated: str = ""
