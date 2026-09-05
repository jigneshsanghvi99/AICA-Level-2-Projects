import {
  AdvanceTaxInputs,
  AdvanceTaxResult,
  TaxSlab,
  RebateRule,
  SurchargeRule,
  DeductionRule,
  AdvanceTaxScheduleRule,
  HousePropertyDetails,
  ChapterVIADeductionItem,
  ComparativeTaxAnalysis
} from '../types';
import { LEGAL_DISCLAIMER_TEXT } from '../data/defaultRules';

export function maskPan(pan: string): string {
  const p = (pan || '').trim().toUpperCase();
  if (p.length === 10) {
    return `${p.substring(0, 2)}XXXXXX${p.substring(8)}`;
  }
  return p ? `${p.substring(0, 2)}***` : 'NOT_ENTERED';
}

export function roundToNearestTen(amount: number): number {
  return Math.round(amount / 10) * 10;
}

/**
 * Computes Income / Loss from House Property under statutory rules:
 * - Self-Occupied Property (SOP): GAV = 0, Municipal Taxes = 0, Sec 24(a) = 0.
 *   Interest u/s 24(b) capped at Rs. 2,00,000 under Old Regime.
 * - Let-Out Property (LOP): GAV - Municipal Taxes = NAV.
 *   Less 30% Statutory Standard Deduction u/s 24(a).
 *   Less Housing Loan Interest u/s 24(b) (uncapped for LOP).
 */
export function computeHousePropertyIncome(
  propertyType: 'self_occupied' | 'let_out',
  grossRent: number,
  municipalTaxes: number,
  homeLoanInterest: number
): HousePropertyDetails {
  if (propertyType === 'self_occupied') {
    const interest = Math.max(0, homeLoanInterest);
    const cappedInterest = Math.min(interest, 200000);
    return {
      property_type: 'self_occupied',
      gross_annual_rent: 0,
      municipal_taxes: 0,
      net_annual_value: 0,
      standard_deduction_24a: 0,
      home_loan_interest_24b: cappedInterest,
      computed_hp_income: -cappedInterest
    };
  } else {
    const gav = Math.max(0, grossRent);
    const munTax = Math.max(0, municipalTaxes);
    const nav = Math.max(0, gav - munTax);
    const stdDed24a = Math.round(nav * 0.30);
    const interest = Math.max(0, homeLoanInterest);
    const netIncome = nav - stdDed24a - interest;
    return {
      property_type: 'let_out',
      gross_annual_rent: gav,
      municipal_taxes: munTax,
      net_annual_value: nav,
      standard_deduction_24a: stdDed24a,
      home_loan_interest_24b: interest,
      computed_hp_income: netIncome
    };
  }
}

/**
 * Evaluates allowed Chapter VI-A deductions for the given Act and Regime
 */
export function calculateAllowedChapterVIA(
  items: ChapterVIADeductionItem[] | undefined,
  actName: string,
  regime: string
): { totalAllowed: number; breakdown: Array<{ section: string; claimed: number; allowed: number; note: string }> } {
  if (!items || items.length === 0) {
    return { totalAllowed: 0, breakdown: [] };
  }

  let totalAllowed = 0;
  const breakdown: Array<{ section: string; claimed: number; allowed: number; note: string }> = [];

  for (const item of items) {
    const claimed = Math.max(0, item.amount || 0);
    if (claimed === 0) continue;

    // Check regime eligibility
    const isAllowedInRegime = item.allowed_in_regimes.includes(regime as any);
    const isAllowedInAct = item.allowed_in_acts.includes(actName);

    if (!isAllowedInRegime || !isAllowedInAct) {
      breakdown.push({
        section: item.section,
        claimed,
        allowed: 0,
        note: `Not eligible under ${actName} (${regime}). Only available under Old Regime.`
      });
      continue;
    }

    // Apply statutory cap if any
    let allowed = claimed;
    if (item.statutory_limit !== null && allowed > item.statutory_limit) {
      allowed = item.statutory_limit;
      breakdown.push({
        section: item.section,
        claimed,
        allowed,
        note: `Capped at statutory ceiling of ₹ ${item.statutory_limit.toLocaleString('en-IN')}.`
      });
    } else {
      breakdown.push({
        section: item.section,
        claimed,
        allowed,
        note: 'Allowed in full.'
      });
    }

    totalAllowed += allowed;
  }

  return { totalAllowed, breakdown };
}

export function computeAdvanceTax(
  inputs: AdvanceTaxInputs,
  slabsList: TaxSlab[],
  rebatesList: RebateRule[],
  surchargesList: SurchargeRule[],
  deductionsList: DeductionRule[],
  schedulesList: AdvanceTaxScheduleRule[],
  skipComparative = false
): AdvanceTaxResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const rulesApplied: string[] = [];
  const auditTrail: string[] = [];

  // 1. Incomes Aggregation
  const sal = Math.max(0, inputs.incomes.salary || 0);
  
  // House Property computation
  let hp = inputs.incomes.house_property || 0;
  if (inputs.house_property_details) {
    hp = inputs.house_property_details.computed_hp_income;
  }

  // House property loss set-off rules:
  // Under New Regime u/s 115BAC and Standard Regime under 2025 Act, loss from house property cannot be set off against other heads
  let effectiveHpForGTI = hp;
  if (hp < 0) {
    if (inputs.regime === 'New Regime' || inputs.act_name === 'Income-tax Act, 2025') {
      warnings.push(`House Property loss (-₹ ${Math.abs(hp).toLocaleString('en-IN')}) cannot be set off against other heads of income under ${inputs.regime} / ${inputs.act_name}. Set-off against other heads is ₹ 0; unabsorbed loss is carried forward.`);
      effectiveHpForGTI = 0;
    } else if (hp < -200000) {
      warnings.push('House Property loss capped at -₹ 2,00,000 for inter-head set-off under Section 71(3A) (Old Regime). Remaining loss carried forward.');
      effectiveHpForGTI = -200000;
    }
  }

  const biz = Math.max(0, inputs.incomes.business_profession || 0);
  const stcgNorm = Math.max(0, inputs.incomes.stcg_normal || 0);
  const stcg111a = Math.max(0, inputs.incomes.stcg_special_111a || 0);
  const ltcg112a = Math.max(0, inputs.incomes.ltcg_special_112a || 0);
  const other = Math.max(0, inputs.incomes.other_sources || 0);

  const specialGainsTotal = stcg111a + ltcg112a;
  const normalIncomeTotal = sal + effectiveHpForGTI + biz + stcgNorm + other;
  const grossTotalIncome = Math.max(0, normalIncomeTotal + specialGainsTotal);

  auditTrail.push(`Gross Total Income (GTI): ₹ ${grossTotalIncome.toLocaleString('en-IN')}`);
  auditTrail.push(`Breakdown: Salary ₹ ${sal}, HP ₹ ${effectiveHpForGTI} (Raw: ${hp}), Biz ₹ ${biz}, STCG Normal ₹ ${stcgNorm}, STCG 111A ₹ ${stcg111a}, LTCG 112A ₹ ${ltcg112a}, Other ₹ ${other}`);

  // 2. Deductions
  let stdDedClaimed = inputs.deductions.standard_deduction || 0;
  let chViaClaimed = inputs.deductions.chapter_via || 0;
  let otherDedClaimed = inputs.deductions.other_deductions || 0;

  // If itemized Chapter VI-A deductions are provided, compute precisely
  if (inputs.deduction_items && inputs.deduction_items.length > 0) {
    const viaResult = calculateAllowedChapterVIA(inputs.deduction_items, inputs.act_name, inputs.regime);
    chViaClaimed = viaResult.totalAllowed;
    for (const b of viaResult.breakdown) {
      if (b.allowed > 0) {
        rulesApplied.push(`${b.section}: ₹ ${b.allowed.toLocaleString('en-IN')} (${b.note})`);
      } else if (b.claimed > 0) {
        warnings.push(`${b.section}: ₹ ${b.claimed.toLocaleString('en-IN')} claimed but ${b.note}`);
      }
    }
  }

  // Verify Standard Deduction against active rules
  const stdRule = deductionsList.find(
    d => d.act_name === inputs.act_name && d.regime === inputs.regime && (d.section_ref.includes('16(ia)') || d.section_ref.includes('21(std)')) && d.is_active
  );
  if (stdRule && stdRule.max_limit !== null) {
    if (stdDedClaimed > stdRule.max_limit) {
      warnings.push(`Standard Deduction claimed (₹ ${stdDedClaimed}) exceeds statutory limit (₹ ${stdRule.max_limit}). Capped automatically.`);
      stdDedClaimed = stdRule.max_limit;
    }
    rulesApplied.push(`Standard Deduction: ₹ ${stdDedClaimed.toLocaleString('en-IN')} (${stdRule.source_reference})`);
  }

  // Under New Regime / Standard Regime, Chapter VI-A is not allowed except 80CCD(2)
  if (inputs.regime === 'New Regime' && chViaClaimed > 0 && (!inputs.deduction_items || inputs.deduction_items.length === 0)) {
    warnings.push('Chapter VI-A deductions (80C, 80D, etc.) are generally not available under New Regime u/s 115BAC.');
  }

  // Deductions cannot be claimed against special rate capital gains
  const maxDeductionsAllowedAgainstNormal = Math.max(0, normalIncomeTotal);
  let totalDeductions = stdDedClaimed + chViaClaimed + otherDedClaimed;
  if (totalDeductions > maxDeductionsAllowedAgainstNormal) {
    warnings.push('Deductions cannot exceed Normal Taxable Income or be set off against Section 111A/112A special rate gains.');
    totalDeductions = maxDeductionsAllowedAgainstNormal;
  }

  const taxableNormalIncome = Math.max(0, normalIncomeTotal - totalDeductions);
  const taxableTotalIncome = taxableNormalIncome + specialGainsTotal;
  auditTrail.push(`Total Deductions: ₹ ${totalDeductions.toLocaleString('en-IN')}`);
  auditTrail.push(`Net Taxable Total Income: ₹ ${taxableTotalIncome.toLocaleString('en-IN')}`);

  // 3. Normal Slab Tax Calculation
  const activeSlabs = slabsList
    .filter(
      s =>
        s.act_name === inputs.act_name &&
        s.regime === inputs.regime &&
        s.financial_year === inputs.financial_year &&
        s.is_active
    )
    .sort((a, b) => a.slab_min - b.slab_min);

  const slabBreakdown: AdvanceTaxResult['slab_breakdown'] = [];
  let normalSlabTax = 0;

  if (activeSlabs.length === 0) {
    warnings.push(`No active tax slabs configured for ${inputs.act_name} (${inputs.regime}) in FY ${inputs.financial_year}. Slab tax set to 0.`);
    errors.push('Rule not configured: Tax slab table missing for this selection.');
  } else {
    for (const slab of activeSlabs) {
      if (taxableNormalIncome <= slab.slab_min) {
        continue;
      }
      const upperLimit = slab.slab_max !== null ? slab.slab_max : taxableNormalIncome;
      const taxableInThisSlab = Math.max(0, Math.min(taxableNormalIncome, upperLimit) - slab.slab_min);

      if (taxableInThisSlab > 0) {
        const taxInThisSlab = (taxableInThisSlab * slab.tax_rate_percent) / 100;
        normalSlabTax += taxInThisSlab;
        const rangeText = slab.slab_max !== null
          ? `₹ ${slab.slab_min.toLocaleString('en-IN')} to ₹ ${slab.slab_max.toLocaleString('en-IN')}`
          : `Above ₹ ${slab.slab_min.toLocaleString('en-IN')}`;

        slabBreakdown.push({
          range: rangeText,
          rate: `${slab.tax_rate_percent}%`,
          taxable_amount: taxableInThisSlab,
          tax: taxInThisSlab,
          rule_source: slab.source_reference
        });
        rulesApplied.push(`Slab [${rangeText}] @ ${slab.tax_rate_percent}%: Tax ₹ ${taxInThisSlab.toLocaleString('en-IN')}`);
      }
    }
  }

  // 4. Special Rate Capital Gains Tax
  let specialRateTax = 0;
  if (stcg111a > 0) {
    const stcgTax = (stcg111a * 20) / 100;
    specialRateTax += stcgTax;
    rulesApplied.push(`STCG u/s 111A @ 20% on ₹ ${stcg111a.toLocaleString('en-IN')}: ₹ ${stcgTax.toLocaleString('en-IN')}`);
  }
  if (ltcg112a > 0) {
    const ltcgExemption = 125000;
    const taxableLtcg = Math.max(0, ltcg112a - ltcgExemption);
    const ltcgTax = (taxableLtcg * 12.5) / 100;
    specialRateTax += ltcgTax;
    rulesApplied.push(`LTCG u/s 112A @ 12.5% on excess over ₹ 1.25 Lakh (₹ ${taxableLtcg.toLocaleString('en-IN')}): ₹ ${ltcgTax.toLocaleString('en-IN')}`);
  }

  const taxBeforeRebate = normalSlabTax + specialRateTax;
  auditTrail.push(`Normal Slab Tax: ₹ ${normalSlabTax.toLocaleString('en-IN')} | Special Rate Tax: ₹ ${specialRateTax.toLocaleString('en-IN')}`);
  auditTrail.push(`Tax before Rebate: ₹ ${taxBeforeRebate.toLocaleString('en-IN')}`);

  // 5. Rebate u/s 87A (or Sec 68 of 2025 Act)
  let rebateAmount = 0;
  const rebateRule = rebatesList.find(
    r =>
      r.act_name === inputs.act_name &&
      r.regime === inputs.regime &&
      r.financial_year === inputs.financial_year &&
      r.is_active
  );

  if (rebateRule && taxableTotalIncome <= rebateRule.max_income_limit) {
    rebateAmount = Math.min(taxBeforeRebate, rebateRule.max_rebate_amount);
    rulesApplied.push(`Rebate u/s ${rebateRule.section_ref}: ₹ ${rebateAmount.toLocaleString('en-IN')} (Eligible as total income <= ₹ ${rebateRule.max_income_limit.toLocaleString('en-IN')})`);
  }

  const taxAfterRebate = Math.max(0, taxBeforeRebate - rebateAmount);

  // 6. Surcharge & Marginal Relief
  let surchargeAmount = 0;
  let surchargeRate = 0;
  const surchargeRule = surchargesList.find(
    s =>
      s.act_name === inputs.act_name &&
      s.regime === inputs.regime &&
      s.financial_year === inputs.financial_year &&
      taxableTotalIncome > s.min_income &&
      (s.max_income === null || taxableTotalIncome <= s.max_income) &&
      s.is_active
  );

  if (surchargeRule && taxAfterRebate > 0) {
    surchargeRate = surchargeRule.surcharge_rate_percent;
    surchargeAmount = (taxAfterRebate * surchargeRate) / 100;

    if (surchargeRule.marginal_relief_applicable) {
      const threshold = surchargeRule.min_income;
      const excessIncome = taxableTotalIncome - threshold;
      const estimatedTaxAtThreshold = (taxAfterRebate * threshold) / taxableTotalIncome;
      const maximumTaxAndSurcharge = estimatedTaxAtThreshold + excessIncome;
      const currentTaxAndSurcharge = taxAfterRebate + surchargeAmount;

      if (currentTaxAndSurcharge > maximumTaxAndSurcharge && excessIncome > 0) {
        const relief = currentTaxAndSurcharge - maximumTaxAndSurcharge;
        surchargeAmount = Math.max(0, surchargeAmount - relief);
        warnings.push(`Marginal relief applied on Surcharge: ₹ ${relief.toLocaleString('en-IN')} relief granted.`);
        rulesApplied.push(`Marginal relief u/s Surcharge rules: ₹ ${relief.toLocaleString('en-IN')}`);
      }
    }
    rulesApplied.push(`Surcharge @ ${surchargeRate}%: ₹ ${surchargeAmount.toLocaleString('en-IN')}`);
  }

  // 7. Health & Education Cess @ 4%
  const cessAmount = ((taxAfterRebate + surchargeAmount) * 4) / 100;
  auditTrail.push(`Health & Education Cess @ 4%: ₹ ${cessAmount.toLocaleString('en-IN')}`);
  rulesApplied.push(`Health and Education Cess @ 4%: ₹ ${cessAmount.toLocaleString('en-IN')}`);

  // Total Tax Liability rounded off to nearest 10 u/s 288B
  const unroundedTotalTax = taxAfterRebate + surchargeAmount + cessAmount;
  const totalTaxLiability = roundToNearestTen(unroundedTotalTax);
  auditTrail.push(`Total Tax Liability: ₹ ${totalTaxLiability.toLocaleString('en-IN')} (Rounded off u/s 288B)`);

  // 8. Prepaid Taxes & Advance Tax Applicability
  const tds = inputs.credits.tds_deducted || 0;
  const tcs = inputs.credits.tcs_collected || 0;
  const advPaid = inputs.credits.advance_tax_paid || 0;
  const otherCredits = inputs.credits.other_credits || 0;
  const totalPrepaid = tds + tcs + advPaid + otherCredits;

  const balanceTaxPayable = totalTaxLiability - totalPrepaid;
  const netTaxSubjectToAdvTax = Math.max(0, totalTaxLiability - (tds + tcs + otherCredits));
  const isAdvanceTaxApplicable = netTaxSubjectToAdvTax >= 10000;

  if (isAdvanceTaxApplicable) {
    rulesApplied.push(`Advance Tax Mandatory u/s 208 as net liability (₹ ${netTaxSubjectToAdvTax.toLocaleString('en-IN')}) >= ₹ 10,000.`);
  } else {
    rulesApplied.push(`Advance Tax NOT mandatory as net liability (₹ ${netTaxSubjectToAdvTax.toLocaleString('en-IN')}) < ₹ 10,000.`);
  }

  // 9. Advance Tax Instalment Schedule Generation
  const activeSchedules = schedulesList
    .filter(s => s.financial_year === inputs.financial_year && s.is_active)
    .sort((a, b) => a.instalment_number - b.instalment_number);

  const instalmentSchedule: AdvanceTaxResult['instalment_schedule'] = [];
  let previousRequired = 0;

  for (const s of activeSchedules) {
    const reqCumulative = roundToNearestTen((netTaxSubjectToAdvTax * s.cumulative_percent) / 100);
    const suggestedInstalment = Math.max(0, reqCumulative - previousRequired);
    previousRequired = reqCumulative;

    const shortfall = Math.max(0, reqCumulative - advPaid);
    const status: 'paid' | 'pending' | 'shortfall' =
      advPaid >= reqCumulative ? 'paid' : advPaid > 0 ? 'shortfall' : 'pending';

    instalmentSchedule.push({
      instalment_number: s.instalment_number,
      due_date: s.due_date,
      cumulative_percent: s.cumulative_percent,
      required_cumulative_amount: reqCumulative,
      paid_up_to_date: advPaid,
      shortfall,
      suggested_instalment: suggestedInstalment,
      description: s.description,
      status
    });
  }

  // 10. Comparative Tax Computation (Saving/Loss Analysis under counterpart Act/Regime)
  let comparativeAnalysis: ComparativeTaxAnalysis | undefined = undefined;

  if (!skipComparative) {
    // Determine counterpart
    let counterpartAct = 'Income-tax Act, 2025';
    let counterpartRegime: any = 'Standard Regime';
    let counterpartStdDed = 100000;

    if (inputs.act_name === 'Income-tax Act, 2025') {
      counterpartAct = 'Income-tax Act, 1961';
      counterpartRegime = 'New Regime';
      counterpartStdDed = 75000;
    } else if (inputs.regime === 'Old Regime') {
      // Compare Old Regime with New Regime or 2025 Act
      counterpartAct = 'Income-tax Act, 1961';
      counterpartRegime = 'New Regime';
      counterpartStdDed = 75000;
    } else {
      // Primary is 1961 New Regime -> compare with 2025 Standard Regime
      counterpartAct = 'Income-tax Act, 2025';
      counterpartRegime = 'Standard Regime';
      counterpartStdDed = 100000;
    }

    const counterpartInputs: AdvanceTaxInputs = {
      ...inputs,
      act_name: counterpartAct,
      regime: counterpartRegime,
      deductions: {
        ...inputs.deductions,
        standard_deduction: counterpartStdDed,
        // If counterpart is New/Standard regime, generic 80C/80D is excluded
        chapter_via: counterpartRegime === 'Old Regime' ? inputs.deductions.chapter_via : 0
      }
    };

    const counterpartRes = computeAdvanceTax(
      counterpartInputs,
      slabsList,
      rebatesList,
      surchargesList,
      deductionsList,
      schedulesList,
      true // prevent infinite recursion
    );

    const diffTax = totalTaxLiability - counterpartRes.summary.total_tax_liability;
    const isSaving = diffTax > 0;
    const absDiff = Math.abs(diffTax);

    let rec = '';
    if (isSaving) {
      rec = `Switching to ${counterpartAct} (${counterpartRegime}) results in a direct tax saving of ₹ ${absDiff.toLocaleString('en-IN')}.`;
    } else if (diffTax === 0) {
      rec = `Both ${inputs.act_name} and ${counterpartAct} result in identical tax liabilities of ₹ ${totalTaxLiability.toLocaleString('en-IN')}.`;
    } else {
      rec = `Current selection (${inputs.act_name} - ${inputs.regime}) is optimal, saving ₹ ${absDiff.toLocaleString('en-IN')} over ${counterpartAct} (${counterpartRegime}).`;
    }

    const compMetrics = [
        {
          metric: 'Gross Total Income (GTI)',
          primary_value: grossTotalIncome,
          counterpart_value: counterpartRes.summary.gross_total_income,
          difference: grossTotalIncome - counterpartRes.summary.gross_total_income
        },
        {
          metric: 'Total Deductions Allowed',
          primary_value: totalDeductions,
          counterpart_value: counterpartRes.summary.total_deductions,
          difference: totalDeductions - counterpartRes.summary.total_deductions
        },
        {
          metric: 'Taxable Total Income',
          primary_value: taxableTotalIncome,
          counterpart_value: counterpartRes.summary.taxable_total_income,
          difference: taxableTotalIncome - counterpartRes.summary.taxable_total_income
        },
        {
          metric: 'Normal Slab Tax',
          primary_value: normalSlabTax,
          counterpart_value: counterpartRes.summary.normal_slab_tax,
          difference: normalSlabTax - counterpartRes.summary.normal_slab_tax
        },
        {
          metric: 'Rebate Allowed (87A / Sec 68)',
          primary_value: rebateAmount,
          counterpart_value: counterpartRes.summary.rebate_amount,
          difference: rebateAmount - counterpartRes.summary.rebate_amount
        },
        {
          metric: 'Surcharge & Cess (4%)',
          primary_value: surchargeAmount + cessAmount,
          counterpart_value: counterpartRes.summary.surcharge_amount + counterpartRes.summary.cess_amount,
          difference: (surchargeAmount + cessAmount) - (counterpartRes.summary.surcharge_amount + counterpartRes.summary.cess_amount)
        },
        {
          metric: 'Total Tax Liability',
          primary_value: totalTaxLiability,
          counterpart_value: counterpartRes.summary.total_tax_liability,
          difference: diffTax
        },
        {
          metric: 'Net Advance Tax Payable',
          primary_value: balanceTaxPayable,
          counterpart_value: counterpartRes.summary.balance_tax_payable,
          difference: balanceTaxPayable - counterpartRes.summary.balance_tax_payable
        }
      ];

    comparativeAnalysis = {
      counterpart_act: counterpartAct,
      counterpart_regime: counterpartRegime,
      counterpart_tax_liability: counterpartRes.summary.total_tax_liability,
      counterpart_taxable_income: counterpartRes.summary.taxable_total_income,
      counterpart_deductions: counterpartRes.summary.total_deductions,
      counterpart_balance_payable: counterpartRes.summary.balance_tax_payable,
      difference_tax: diffTax,
      tax_difference: absDiff,
      is_saving_in_counterpart: isSaving,
      saving_amount: absDiff,
      recommendation: rec,
      comparison_metrics: compMetrics,
      metric_comparison: compMetrics.map(m => ({
        metric_name: m.metric,
        primary_amount: m.primary_value,
        counterpart_amount: m.counterpart_value,
        difference: m.difference
      }))
    };
  }

  return {
    calculation_type: 'advance_tax',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    taxpayer_name: inputs.taxpayer_name || 'Taxpayer',
    pan_masked: maskPan(inputs.pan),
    act_name: inputs.act_name,
    regime: inputs.regime,
    financial_year: inputs.financial_year,
    assessment_year: inputs.assessment_year,
    taxpayer_category: inputs.taxpayer_category,
    summary: {
      gross_total_income: grossTotalIncome,
      total_deductions: totalDeductions,
      taxable_total_income: taxableTotalIncome,
      normal_slab_tax: normalSlabTax,
      special_rate_tax: specialRateTax,
      tax_before_rebate: taxBeforeRebate,
      rebate_amount: rebateAmount,
      tax_after_rebate: taxAfterRebate,
      surcharge_amount: surchargeAmount,
      surcharge_rate_percent: surchargeRate,
      cess_amount: cessAmount,
      total_tax_liability: totalTaxLiability,
      total_prepaid_tax: totalPrepaid,
      balance_tax_payable: balanceTaxPayable,
      is_advance_tax_applicable: isAdvanceTaxApplicable,
      net_tax_subject_to_adv_tax: netTaxSubjectToAdvTax
    },
    slab_breakdown: slabBreakdown,
    instalment_schedule: instalmentSchedule,
    house_property_details: inputs.house_property_details,
    deduction_items: inputs.deduction_items,
    comparative_analysis: comparativeAnalysis,
    rules_applied: rulesApplied,
    audit_trail: auditTrail,
    warnings,
    errors,
    disclaimer: LEGAL_DISCLAIMER_TEXT
  };
}
