export type TaxRegime = 'New Regime' | 'Old Regime' | 'Standard Regime';

export type TaxpayerCategory =
  | 'Individual (Below 60)'
  | 'Senior Citizen (60-80)'
  | 'Super Senior Citizen (80+)'
  | 'HUF'
  | 'Firm'
  | 'LLP'
  | 'Company'
  | 'Trust'
  | 'Non-resident';

export interface ComparisonRule {
  id: number;
  topic: string;
  chapter: string;
  provision_1961: string;
  provision_2025: string;
  section_1961: string;
  section_2025: string;
  key_change: string;
  practical_impact: string;
  applicability_date: string;
  taxpayer_categories: string[];
  source_reference: string;
  notes?: string;
  change_type: 'changed' | 'new' | 'deleted' | 'unchanged' | 'requires_review';
  is_active: boolean;
  version: number;
  last_updated?: string;
}

export interface TaxSlab {
  id: number;
  act_name: string; // 'Income-tax Act, 1961' | 'Income-tax Act, 2025'
  regime: TaxRegime;
  financial_year: string;
  assessment_year: string;
  taxpayer_category: string;
  slab_min: number;
  slab_max: number | null; // null represents 'Above'
  tax_rate_percent: number;
  source_reference: string;
  is_active: boolean;
  version: number;
  last_updated: string;
}

export interface RebateRule {
  id: number;
  act_name: string;
  regime: TaxRegime;
  financial_year: string;
  assessment_year: string;
  max_income_limit: number;
  max_rebate_amount: number;
  section_ref: string;
  source_reference: string;
  is_active: boolean;
}

export interface SurchargeRule {
  id: number;
  act_name: string;
  regime: TaxRegime;
  financial_year: string;
  assessment_year: string;
  taxpayer_category: string;
  min_income: number;
  max_income: number | null;
  surcharge_rate_percent: number;
  marginal_relief_applicable: boolean;
  is_active: boolean;
}

export interface DeductionRule {
  id: number;
  act_name: string;
  regime: TaxRegime;
  section_ref: string;
  name: string;
  max_limit: number | null;
  eligible_categories: string[];
  source_reference: string;
  is_active: boolean;
  version: number;
  last_updated: string;
}

export interface HousePropertyDetails {
  property_type: 'self_occupied' | 'let_out';
  gross_annual_rent: number;
  municipal_taxes: number;
  net_annual_value: number;
  standard_deduction_24a: number;
  home_loan_interest_24b: number;
  computed_hp_income: number;
}

export interface ChapterVIADeductionItem {
  id: string;
  section: string;
  title: string;
  amount: number;
  statutory_limit: number | null;
  allowed_in_regimes: TaxRegime[];
  allowed_in_acts: string[];
  description: string;
  category: '80C' | '80D' | '80CCD' | '80E' | '80G' | '80TTA_TTB' | 'OTHER';
}

export interface TDSRule {
  id: number;
  act_name?: string; // 'Income-tax Act, 1961' | 'Income-tax Act, 2025'
  section_number: string;
  section_title: string;
  nature_of_payment: string;
  applicable_payer: string;
  applicable_deductee: string;
  resident_rate: number;
  non_resident_rate: number;
  rate_without_pan: number;
  threshold_limit: number;
  threshold_type: 'annual' | 'single_transaction';
  effective_date: string;
  applicable_surcharge: number;
  applicable_cess: number;
  lower_ded_cert_allowed: boolean;
  exemptions: string;
  remarks: string;
  source_reference: string;
  last_updated: string;
  is_active: boolean;
  version: number;
  counterpart_section?: string;
}

export interface AdvanceTaxScheduleRule {
  id: number;
  financial_year: string;
  instalment_number: number;
  due_date: string;
  cumulative_percent: number;
  description: string;
  is_active: boolean;
}

export interface AdvanceTaxInputs {
  taxpayer_name: string;
  pan: string;
  act_name: string;
  regime: TaxRegime;
  financial_year: string;
  assessment_year: string;
  taxpayer_category: TaxpayerCategory;
  date_of_calculation: string;
  incomes: {
    salary: number;
    house_property: number; // can be negative (loss)
    business_profession: number;
    stcg_normal: number;
    stcg_special_111a: number;
    ltcg_special_112a: number;
    other_sources: number;
  };
  house_property_details?: HousePropertyDetails;
  deductions: {
    standard_deduction: number;
    chapter_via: number;
    other_deductions: number;
  };
  deduction_items?: ChapterVIADeductionItem[];
  credits: {
    tds_deducted: number;
    tcs_collected: number;
    advance_tax_paid: number;
    other_credits: number;
  };
  advance_tax_paid_dates: Array<{
    date: string;
    amount: number;
  }>;
}

export interface ComparativeTaxAnalysis {
  counterpart_act: string;
  counterpart_regime: TaxRegime;
  counterpart_tax_liability: number;
  counterpart_taxable_income: number;
  counterpart_deductions: number;
  counterpart_balance_payable: number;
  difference_tax: number; // positive means primary pays more (saving under counterpart); negative means primary pays less
  is_saving_in_counterpart: boolean;
  saving_amount: number;
  tax_difference?: number;
  recommendation: string;
  comparison_metrics: Array<{
    metric: string;
    primary_value: number;
    counterpart_value: number;
    difference: number;
    unit?: string;
  }>;
  metric_comparison?: Array<{
    metric_name: string;
    primary_amount: number;
    counterpart_amount: number;
    difference: number;
  }>;
}

export interface AdvanceTaxResult {
  calculation_type: 'advance_tax';
  timestamp: string;
  taxpayer_name: string;
  pan_masked: string;
  act_name: string;
  regime: TaxRegime;
  financial_year: string;
  assessment_year: string;
  taxpayer_category: TaxpayerCategory;
  summary: {
    gross_total_income: number;
    total_deductions: number;
    taxable_total_income: number;
    normal_slab_tax: number;
    special_rate_tax: number;
    tax_before_rebate: number;
    rebate_amount: number;
    tax_after_rebate: number;
    surcharge_amount: number;
    surcharge_rate_percent: number;
    cess_amount: number;
    total_tax_liability: number;
    total_prepaid_tax: number;
    balance_tax_payable: number;
    is_advance_tax_applicable: boolean;
    net_tax_subject_to_adv_tax: number;
  };
  slab_breakdown: Array<{
    range: string;
    rate: string;
    taxable_amount: number;
    tax: number;
    rule_source: string;
  }>;
  instalment_schedule: Array<{
    instalment_number: number;
    due_date: string;
    cumulative_percent: number;
    required_cumulative_amount: number;
    paid_up_to_date: number;
    shortfall: number;
    suggested_instalment: number;
    description: string;
    status: 'paid' | 'pending' | 'shortfall';
  }>;
  house_property_details?: HousePropertyDetails;
  deduction_items?: ChapterVIADeductionItem[];
  comparative_analysis?: ComparativeTaxAnalysis;
  rules_applied: string[];
  audit_trail: string[];
  warnings: string[];
  errors: string[];
  disclaimer: string;
}

export interface TDSInputs {
  act_name?: string; // 'Income-tax Act, 1961' | 'Income-tax Act, 2025'
  section: string;
  financial_year: string;
  assessment_year: string;
  date_of_payment: string;
  transaction_value: number;
  aggregate_annual_value: number;
  has_pan: boolean;
  deductee_type: string;
  lower_deduction_certificate: boolean;
  certificate_rate?: number;
  date_of_deduction: string;
  custom_rate?: number;
}

export interface TDSCounterpartComparison {
  counterpart_act: string;
  counterpart_section: string;
  counterpart_section_title: string;
  counterpart_threshold: number;
  counterpart_threshold_type?: string;
  counterpart_rate: number;
  counterpart_rate_without_pan?: number;
  counterpart_tds_amount: number;
  is_threshold_crossed_counterpart?: boolean;
  counterpart_is_threshold_crossed?: boolean;
  counterpart_amount_subject_to_tds?: number;
  difference_amount?: number;
  difference_in_tds?: number;
  difference_tds?: number;
  explanation?: string;
  impact_summary?: string;
}

export interface TDSResult {
  calculation_type: 'tds';
  timestamp: string;
  act_name?: string;
  section: string;
  section_title: string;
  nature_of_payment: string;
  transaction_value: number;
  aggregate_annual_value: number;
  threshold_limit: number;
  threshold_type: 'annual' | 'single_transaction';
  is_threshold_crossed: boolean;
  amount_subject_to_tds: number;
  base_rate_percent: number;
  effective_rate_percent: number;
  tds_amount: number;
  rate_note: string;
  date_of_deduction: string;
  due_date_for_deposit: string;
  counterpart_comparison?: TDSCounterpartComparison;
  rules_applied: string[];
  audit_trail: string[];
  warnings: string[];
  errors: string[];
  source_reference: string;
  disclaimer: string;
}

export interface SavedCalculationRecord {
  id: number;
  calculation_type: 'advance_tax' | 'tds' | 'comparison';
  taxpayer_name: string;
  pan_masked: string;
  financial_year: string;
  assessment_year: string;
  regime?: string;
  act_name?: string;
  taxable_income?: number;
  total_tax_liability?: number;
  net_payable_or_refund?: number;
  calculation_payload?: any;
  timestamp?: string;
  inputs?: any;
  results?: any;
  rules_applied?: string[];
  created_at?: string;
  tags?: string[];
  is_favourite?: boolean;
  is_archived?: boolean;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_role: 'user' | 'admin' | 'system';
  action: string;
  entity_type: string;
  entity_id?: number;
  details: string;
}
