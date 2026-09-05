import { TDSInputs, TDSResult, TDSRule, TDSCounterpartComparison } from '../types';
import { LEGAL_DISCLAIMER_TEXT } from '../data/defaultRules';

function evaluateTdsForSingleRule(
  rule: TDSRule,
  txVal: number,
  aggVal: number,
  hasPan: boolean,
  deducteeType: string,
  lowerDedCert?: boolean,
  certRate?: number
) {
  const totalCumulative = aggVal + txVal;
  let isThresholdCrossed = false;
  let amountSubjectToTDS = 0;

  if (rule.section_number === '194C') {
    if (txVal > 30000 || totalCumulative > 100000) {
      isThresholdCrossed = true;
      amountSubjectToTDS = txVal;
    }
  } else if (rule.section_number === '194Q' || rule.section_number === '190') {
    // Goods purchase exceeding 50 Lakhs
    if (totalCumulative > 5000000) {
      isThresholdCrossed = true;
      if (aggVal >= 5000000) {
        amountSubjectToTDS = txVal;
      } else {
        amountSubjectToTDS = totalCumulative - 5000000;
      }
    }
  } else if (rule.threshold_type === 'single_transaction') {
    if (txVal > rule.threshold_limit) {
      isThresholdCrossed = true;
      amountSubjectToTDS = txVal;
    }
  } else {
    // Annual threshold
    if (totalCumulative > rule.threshold_limit) {
      isThresholdCrossed = true;
      amountSubjectToTDS = txVal;
    }
  }

  let baseRate = rule.resident_rate;
  if (deducteeType === 'Non-resident') {
    baseRate = rule.non_resident_rate;
  }
  if (lowerDedCert && certRate !== undefined) {
    baseRate = certRate;
  } else if (!hasPan) {
    baseRate = rule.rate_without_pan;
  }

  let effectiveRate = baseRate;
  if (deducteeType === 'Non-resident') {
    effectiveRate = baseRate * 1.04;
  }

  let tdsAmount = 0;
  if (isThresholdCrossed && amountSubjectToTDS > 0) {
    tdsAmount = Math.round((amountSubjectToTDS * effectiveRate) / 100);
  }

  return {
    isThresholdCrossed,
    amountSubjectToTDS,
    baseRate,
    effectiveRate,
    tdsAmount
  };
}

export function calculateTDS(inputs: TDSInputs, rulesList: TDSRule[]): TDSResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const rulesApplied: string[] = [];
  const auditTrail: string[] = [];

  const targetAct = inputs.act_name || 'Income-tax Act, 1961';

  // Find primary rule matching section and act
  let rule = rulesList.find(
    r => r.section_number === inputs.section && r.act_name === targetAct && r.is_active
  );

  // If not matched with act, fallback to section alone
  if (!rule) {
    rule = rulesList.find(r => r.section_number === inputs.section && r.is_active);
  }

  if (!rule) {
    errors.push(`Rule not configured: TDS Section "${inputs.section}" under ${targetAct} is not present in active rule master.`);
    return {
      calculation_type: 'tds',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      act_name: targetAct,
      section: inputs.section,
      section_title: 'Unconfigured Section',
      nature_of_payment: 'Unknown',
      transaction_value: inputs.transaction_value,
      aggregate_annual_value: inputs.aggregate_annual_value,
      threshold_limit: 0,
      threshold_type: 'annual',
      is_threshold_crossed: false,
      amount_subject_to_tds: 0,
      base_rate_percent: 0,
      effective_rate_percent: 0,
      tds_amount: 0,
      rate_note: 'Section not configured in system database.',
      date_of_deduction: inputs.date_of_deduction || inputs.date_of_payment,
      due_date_for_deposit: 'N/A',
      rules_applied: [],
      audit_trail: ['Failed: Rule not found'],
      warnings: ['Rule not configured in system database.'],
      errors,
      source_reference: 'N/A',
      disclaimer: LEGAL_DISCLAIMER_TEXT
    };
  }

  const txVal = Math.max(0, inputs.transaction_value || 0);
  const aggVal = Math.max(0, inputs.aggregate_annual_value || 0);
  const totalCumulative = aggVal + txVal;

  auditTrail.push(`Governing Statutory Framework: ${rule.act_name}`);
  auditTrail.push(`Current Transaction Value: ₹ ${txVal.toLocaleString('en-IN')}`);
  auditTrail.push(`Prior Cumulative Annual Value: ₹ ${aggVal.toLocaleString('en-IN')}`);
  auditTrail.push(`New Cumulative Annual Value: ₹ ${totalCumulative.toLocaleString('en-IN')}`);

  // Primary calculation
  const primaryEval = evaluateTdsForSingleRule(
    rule,
    txVal,
    aggVal,
    inputs.has_pan,
    inputs.deductee_type,
    inputs.lower_deduction_certificate,
    inputs.certificate_rate
  );

  const isThresholdCrossed = primaryEval.isThresholdCrossed;
  const amountSubjectToTDS = primaryEval.amountSubjectToTDS;
  const baseRate = primaryEval.baseRate;
  const effectiveRate = primaryEval.effectiveRate;
  const tdsAmount = primaryEval.tdsAmount;

  if (isThresholdCrossed) {
    rulesApplied.push(`Threshold crossed under ${rule.act_name} Section ${rule.section_number} (Limit: ₹ ${rule.threshold_limit.toLocaleString('en-IN')}). Subject amount: ₹ ${amountSubjectToTDS.toLocaleString('en-IN')}`);
  } else {
    rulesApplied.push(`Threshold NOT crossed under ${rule.act_name} Section ${rule.section_number} (Cumulative ₹ ${totalCumulative.toLocaleString('en-IN')} <= ₹ ${rule.threshold_limit.toLocaleString('en-IN')}).`);
  }

  let rateNote = `Standard Resident Rate of ${baseRate}%`;
  if (inputs.deductee_type === 'Non-resident') {
    rateNote = `Non-Resident rate of ${baseRate}% + 4% Cess (Subject to DTAA treaty benefits if TRC provided)`;
    warnings.push('Non-resident deductee: Surcharge and 4% Cess applied on TDS withholding.');
  }

  if (inputs.lower_deduction_certificate && inputs.certificate_rate !== undefined) {
    rateNote = `Lower Deduction Certificate u/s 197 / statutory equivalent applied at ${baseRate}%`;
    rulesApplied.push(`Lower Deduction Certificate active: Rate reduced to ${baseRate}%.`);
  } else if (!inputs.has_pan) {
    rateNote = `Penal rate applied u/s 206AA / statutory counterpart due to missing/invalid PAN (${baseRate}%)`;
    warnings.push(`In absence of valid PAN, TDS must be deducted at higher statutory penal rate of ${baseRate}%.`);
    rulesApplied.push(`Higher penal rate of ${baseRate}% enforced.`);
  }

  auditTrail.push(`Applicable Rate: ${effectiveRate}% (${rateNote})`);
  auditTrail.push(`Amount Subject to TDS: ₹ ${amountSubjectToTDS.toLocaleString('en-IN')}`);
  auditTrail.push(`Calculated TDS Amount: ₹ ${tdsAmount.toLocaleString('en-IN')}`);

  // Due date for deposit: 7th of following month (or 30th April for March)
  const dedDate = new Date(inputs.date_of_deduction || inputs.date_of_payment || new Date().toISOString());
  const dedMonth = dedDate.getMonth();
  let dueDateStr = '7th of following month';
  if (dedMonth === 2) {
    dueDateStr = '30th April (for deductions in the month of March)';
  } else {
    const nextMonthName = new Date(dedDate.getFullYear(), dedMonth + 1, 1).toLocaleString('default', { month: 'long' });
    dueDateStr = `7th ${nextMonthName} ${dedDate.getFullYear() + (dedMonth === 11 ? 1 : 0)}`;
  }

  // Counterpart Comparison Computation under the "other" Act
  let counterpartComparison: TDSCounterpartComparison | undefined = undefined;
  const isPrimary1961 = (rule.act_name || targetAct).includes('1961');
  const counterpartActName = isPrimary1961 ? 'Income-tax Act, 2025' : 'Income-tax Act, 1961';

  // Find counterpart rule
  let counterpartRule: TDSRule | undefined = undefined;
  if (rule.counterpart_section) {
    counterpartRule = rulesList.find(
      r => r.section_number === rule!.counterpart_section && r.act_name === counterpartActName && r.is_active
    );
  }
  if (!counterpartRule) {
    // Reverse lookup
    counterpartRule = rulesList.find(
      r => r.counterpart_section === rule!.section_number && r.act_name === counterpartActName && r.is_active
    );
  }

  if (counterpartRule) {
    const cpEval = evaluateTdsForSingleRule(
      counterpartRule,
      txVal,
      aggVal,
      inputs.has_pan,
      inputs.deductee_type,
      inputs.lower_deduction_certificate,
      inputs.certificate_rate
    );

    const diffTds = tdsAmount - cpEval.tdsAmount;
    let impactSummary = '';

    if (diffTds > 0) {
      impactSummary = `TDS is ₹ ${diffTds.toLocaleString('en-IN')} lower under ${counterpartActName} (${counterpartRule.section_number}) due to rationalized rate/higher threshold, leaving more working capital with the payee!`;
    } else if (diffTds < 0) {
      impactSummary = `TDS under ${counterpartActName} (${counterpartRule.section_number}) is ₹ ${Math.abs(diffTds).toLocaleString('en-IN')} higher than under ${rule.act_name}.`;
    } else {
      impactSummary = `Both ${rule.act_name} and ${counterpartActName} result in identical TDS deduction of ₹ ${tdsAmount.toLocaleString('en-IN')}.`;
    }

    counterpartComparison = {
      counterpart_act: counterpartActName,
      counterpart_section: counterpartRule.section_number,
      counterpart_section_title: counterpartRule.section_title,
      counterpart_rate: cpEval.effectiveRate,
      counterpart_rate_without_pan: counterpartRule.rate_without_pan,
      counterpart_threshold: counterpartRule.threshold_limit,
      counterpart_threshold_type: counterpartRule.threshold_type,
      counterpart_is_threshold_crossed: cpEval.isThresholdCrossed,
      is_threshold_crossed_counterpart: cpEval.isThresholdCrossed,
      counterpart_amount_subject_to_tds: cpEval.amountSubjectToTDS,
      counterpart_tds_amount: cpEval.tdsAmount,
      difference_amount: diffTds,
      difference_tds: diffTds,
      difference_in_tds: diffTds,
      impact_summary: impactSummary,
      explanation: impactSummary
    };
  }

  return {
    calculation_type: 'tds',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    act_name: rule.act_name || targetAct,
    section: rule.section_number,
    section_title: rule.section_title,
    nature_of_payment: rule.nature_of_payment,
    transaction_value: txVal,
    aggregate_annual_value: aggVal,
    threshold_limit: rule.threshold_limit,
    threshold_type: rule.threshold_type,
    is_threshold_crossed: isThresholdCrossed,
    amount_subject_to_tds: amountSubjectToTDS,
    base_rate_percent: baseRate,
    effective_rate_percent: effectiveRate,
    tds_amount: tdsAmount,
    rate_note: rateNote,
    date_of_deduction: inputs.date_of_deduction || inputs.date_of_payment,
    due_date_for_deposit: dueDateStr,
    counterpart_comparison: counterpartComparison,
    rules_applied: rulesApplied,
    audit_trail: auditTrail,
    warnings,
    errors,
    source_reference: rule.source_reference,
    disclaimer: LEGAL_DISCLAIMER_TEXT
  };
}
