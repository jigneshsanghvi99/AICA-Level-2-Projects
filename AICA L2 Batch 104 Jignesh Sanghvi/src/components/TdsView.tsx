import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  FileText,
  Info,
  Scale,
  ShieldAlert,
  BookOpen,
  Sparkles,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { TDSRule, TDSInputs, TDSResult } from '../types';
import { calculateTDS } from '../engine/tdsEngine';
import { exportTDSToExcel } from '../utils/exportHelpers';
import { StatutoryProvisionsSummary } from './StatutoryProvisionsSummary';
import { DEFAULT_TDS_RULES } from '../data/defaultRules';

interface TdsViewProps {
  tdsRules: TDSRule[];
  financialYear: string;
  assessmentYear: string;
  isDarkMode: boolean;
}

export const TdsView: React.FC<TdsViewProps> = ({
  tdsRules,
  financialYear,
  assessmentYear,
  isDarkMode
}) => {
  // Act selection
  const [selectedAct, setSelectedAct] = useState<string>('Income-tax Act, 1961');
  const [showProvisions, setShowProvisions] = useState<boolean>(false);

  // Normalize rules: default missing act_name to 'Income-tax Act, 1961' and ensure both acts are available
  const activeTdsRules = useMemo<TDSRule[]>(() => {
    const sourceRules = tdsRules && tdsRules.length > 0 ? tdsRules : DEFAULT_TDS_RULES;
    const normalized = sourceRules.map(r => ({
      ...r,
      act_name: r.act_name || 'Income-tax Act, 1961',
      is_active: r.is_active ?? true
    }));
    const has2025 = normalized.some(r => r.act_name === 'Income-tax Act, 2025');
    if (!has2025) {
      const default2025 = DEFAULT_TDS_RULES.filter(r => r.act_name === 'Income-tax Act, 2025');
      return [...normalized, ...default2025];
    }
    return normalized;
  }, [tdsRules]);

  // Filter sections by selected Act with guaranteed non-empty fallback
  const filteredRules = useMemo(() => {
    const list = activeTdsRules.filter(r => r.act_name === selectedAct && r.is_active);
    if (list.length > 0) return list;
    return DEFAULT_TDS_RULES.filter(r => r.act_name === selectedAct && r.is_active);
  }, [activeTdsRules, selectedAct]);

  // Inputs
  const [selectedSection, setSelectedSection] = useState<string>(() => {
    return filteredRules[0]?.section_number || '194C';
  });
  const [txValue, setTxValue] = useState<number>(45000);
  const [aggValue, setAggValue] = useState<number>(20000);
  const [hasPan, setHasPan] = useState<boolean>(true);
  const [deducteeType, setDeducteeType] = useState<string>('Resident Individual');
  const [hasLdc, setHasLdc] = useState<boolean>(false);
  const [ldcRate, setLdcRate] = useState<number>(0.5);
  const [dateOfDed, setDateOfDed] = useState<string>(new Date().toISOString().substring(0, 10));

  // Result state
  const [result, setResult] = useState<TDSResult | null>(null);

  // Keep selectedSection valid whenever filteredRules changes
  useEffect(() => {
    if (filteredRules.length > 0) {
      const exists = filteredRules.some(r => r.section_number === selectedSection);
      if (!exists) {
        setSelectedSection(filteredRules[0].section_number);
      }
    }
  }, [filteredRules, selectedSection]);

  // Active Rule details
  const activeRule = useMemo(() => {
    return (
      filteredRules.find(r => r.section_number === selectedSection) ||
      filteredRules[0] ||
      activeTdsRules[0]
    );
  }, [filteredRules, selectedSection, activeTdsRules]);

  const handleActChange = (newAct: string) => {
    setSelectedAct(newAct);
    const rulesInNewAct = activeTdsRules.filter(r => r.act_name === newAct && r.is_active);
    if (rulesInNewAct.length > 0) {
      const currentRule = activeTdsRules.find(
        r => r.section_number === selectedSection && r.act_name === selectedAct
      );
      const counterpart = currentRule?.counterpart_section
        ? rulesInNewAct.find(r => r.section_number === currentRule.counterpart_section)
        : null;
      const targetSec = counterpart ? counterpart.section_number : rulesInNewAct[0].section_number;
      setSelectedSection(targetSec);
    }
  };

  const handleSectionChange = (newSec: string) => {
    setSelectedSection(newSec);
  };

  const handleCompute = () => {
    const inputs: TDSInputs = {
      act_name: selectedAct,
      section: selectedSection,
      financial_year: financialYear,
      assessment_year: assessmentYear,
      date_of_payment: dateOfDed,
      transaction_value: txValue,
      aggregate_annual_value: aggValue,
      has_pan: hasPan,
      deductee_type: deducteeType,
      lower_deduction_certificate: hasLdc,
      certificate_rate: ldcRate,
      date_of_deduction: dateOfDed
    };
    const res = calculateTDS(inputs, activeTdsRules);
    setResult(res);
  };

  // Automatically compute on parameter changes or initial mount so calculation is always responsive
  useEffect(() => {
    if (selectedSection) {
      const inputs: TDSInputs = {
        act_name: selectedAct,
        section: selectedSection,
        financial_year: financialYear,
        assessment_year: assessmentYear,
        date_of_payment: dateOfDed,
        transaction_value: txValue,
        aggregate_annual_value: aggValue,
        has_pan: hasPan,
        deductee_type: deducteeType,
        lower_deduction_certificate: hasLdc,
        certificate_rate: ldcRate,
        date_of_deduction: dateOfDed
      };
      const res = calculateTDS(inputs, activeTdsRules);
      setResult(res);
    }
  }, [selectedAct, selectedSection, txValue, aggValue, hasPan, deducteeType, hasLdc, ldcRate, dateOfDed, financialYear, assessmentYear, activeTdsRules]);

  const cardBg = isDarkMode ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200';
  const textTitle = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            TDS Calculator, Threshold Verifier & Section Master
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Section 194C, 194J, 194I, 194A, 194Q & 194H threshold crossing tests, Section 206AA / 395 penal rates, and dual-act comparative analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProvisions(!showProvisions)}
            className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            <span>{showProvisions ? 'Hide Provisions' : 'TDS Provisions: 1961 vs 2025'}</span>
          </button>
          <button
            onClick={handleCompute}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            <Receipt className="h-4 w-4" />
            <span>Compute TDS</span>
          </button>
        </div>
      </div>

      {/* Statutory Provisions Summary Panel */}
      {showProvisions && (
        <StatutoryProvisionsSummary isDarkMode={isDarkMode} defaultTopic="tds_rationalization" />
      )}

      {/* Input Form & Active Rule Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Form */}
        <div className={`rounded-xl border p-5 shadow-sm space-y-4 lg:col-span-2 ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
              TDS Transaction Parameters
            </h3>

            {/* Act Selector Pills */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => handleActChange('Income-tax Act, 1961')}
                className={`rounded px-3 py-1 text-xs font-semibold transition-all ${
                  selectedAct === 'Income-tax Act, 1961'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Income-tax Act, 1961
              </button>
              <button
                type="button"
                onClick={() => handleActChange('Income-tax Act, 2025')}
                className={`rounded px-3 py-1 text-xs font-semibold transition-all ${
                  selectedAct === 'Income-tax Act, 2025'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Income-tax Act, 2025 (New)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Section Selection */}
            <div>
              <label htmlFor="tds-section-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select TDS Section ({selectedAct})
              </label>
              <select
                id="tds-section-select"
                name="tdsSection"
                value={selectedSection}
                onChange={e => handleSectionChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                {filteredRules.map(r => (
                  <option key={`${r.act_name}-${r.section_number}-${r.id}`} value={r.section_number}>
                    Sec {r.section_number} - {r.nature_of_payment} ({r.section_title})
                  </option>
                ))}
              </select>
            </div>

            {/* Date of Deduction */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date of Payment / Credit
              </label>
              <input
                type="date"
                value={dateOfDed}
                onChange={e => setDateOfDed(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Current Transaction Value */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Current Transaction Value (INR)
              </label>
              <input
                type="number"
                value={txValue}
                onChange={e => setTxValue(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Aggregate Prior Value */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prior Aggregate Annual Value (INR)
              </label>
              <input
                type="number"
                value={aggValue}
                onChange={e => setAggValue(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Deductee Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Deductee Classification
              </label>
              <select
                value={deducteeType}
                onChange={e => setDeducteeType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Resident Individual">Resident Individual / HUF</option>
                <option value="Resident Company">Resident Corporate / Firm</option>
                <option value="Non-resident">Non-resident (Foreign Entity)</option>
              </select>
            </div>

            {/* PAN Checkbox */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={hasPan}
                  onChange={e => setHasPan(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Deductee has furnished valid PAN</span>
              </label>
            </div>
          </div>

          {/* Lower Deduction Certificate Option */}
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={hasLdc}
                onChange={e => setHasLdc(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Lower Deduction Certificate u/s 197/390 available</span>
            </label>

            {hasLdc && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Certificate Rate %:</span>
                <input
                  type="number"
                  step="0.1"
                  value={ldcRate}
                  onChange={e => setLdcRate(Number(e.target.value))}
                  className="w-20 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Active Rule Card */}
        {activeRule && (
          <div className={`rounded-xl border p-5 shadow-sm space-y-3 ${cardBg}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Section {activeRule.section_number}
              </span>
              <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                {activeRule.act_name === 'Income-tax Act, 2025' ? '2025 Act Master' : '1961 Act Master'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <p><span className="font-bold text-slate-800 dark:text-slate-200">Payment:</span> {activeRule.nature_of_payment}</p>
              <p><span className="font-bold text-slate-800 dark:text-slate-200">Standard Rate:</span> {activeRule.resident_rate}%</p>
              <p>
                <span className="font-bold text-slate-800 dark:text-slate-200">Rate w/o PAN:</span>{' '}
                <span className="font-semibold text-rose-600">
                  {activeRule.rate_without_pan}% ({activeRule.act_name === 'Income-tax Act, 2025' ? 'Sec 395' : 'Sec 206AA'})
                </span>
              </p>
              <p>
                <span className="font-bold text-slate-800 dark:text-slate-200">Threshold:</span> ₹ {activeRule.threshold_limit.toLocaleString('en-IN')} ({activeRule.threshold_type})
              </p>
              <p><span className="font-bold text-slate-800 dark:text-slate-200">Remarks:</span> {activeRule.remarks}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                Ref: {activeRule.source_reference}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Result Display Card */}
      {result && (
        <div className={`rounded-xl border p-6 shadow-sm space-y-6 ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${textTitle}`}>
                  TDS Computation Result: Section {result.section} ({result.act_name})
                </h3>
                <span
                  className={`rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    result.is_threshold_crossed
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {result.is_threshold_crossed ? 'TDS Applicable' : 'Nil TDS (Threshold Not Crossed)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {result.nature_of_payment} | Due Date for Government Deposit: <span className="font-bold text-blue-600 dark:text-blue-400">{result.due_date_for_deposit}</span>
              </p>
            </div>

            <button
              onClick={() => exportTDSToExcel(result)}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export TDS Excel</span>
            </button>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 space-y-1">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Computation Output Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-slate-500">Transaction Value</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                ₹ {result.transaction_value.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-slate-500">Amount Subject to TDS</span>
              <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1">
                ₹ {result.amount_subject_to_tds.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-slate-500">Effective TDS Rate</span>
              <div className="text-base font-bold text-purple-600 dark:text-purple-400 mt-1">
                {result.effective_rate_percent}%
              </div>
              <span className="text-[10px] text-slate-400">{result.rate_note}</span>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-slate-500">TDS Amount Deductible</span>
              <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
                ₹ {result.tds_amount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Dual-Act TDS Counterpart Comparison Card */}
          {result.counterpart_comparison && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-4 dark:border-teal-900/60 dark:bg-teal-950/20 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/70 pb-2 dark:border-teal-800/70">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Dual-Act Counterpart Comparison: {result.counterpart_comparison.counterpart_act} (Section {result.counterpart_comparison.counterpart_section})
                  </h4>
                </div>

                <span className="rounded bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  Difference in TDS: ₹ {Math.abs(result.counterpart_comparison.difference_in_tds ?? result.counterpart_comparison.difference_amount ?? 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Side by side comparison table */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-800 space-y-1.5">
                  <span className="font-bold text-blue-700 dark:text-blue-400 block">
                    Under Current Selection ({result.act_name}):
                  </span>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Section:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Sec {result.section}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Threshold Cross Status:</span>
                    <span className={`font-semibold ${result.is_threshold_crossed ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {result.is_threshold_crossed ? 'Threshold Crossed' : 'Threshold Not Crossed'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Applied Rate:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{result.effective_rate_percent}%</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1 text-slate-800 dark:text-slate-200 font-bold">
                    <span>TDS Deductible:</span>
                    <span className="text-rose-600 dark:text-rose-400">₹ {(result.tds_amount ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-teal-200 bg-white p-3 text-xs dark:border-teal-800 dark:bg-slate-800 space-y-1.5">
                  <span className="font-bold text-teal-700 dark:text-teal-400 block">
                    Under Counterpart Act ({result.counterpart_comparison.counterpart_act}):
                  </span>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Section:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Sec {result.counterpart_comparison.counterpart_section}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Threshold Limit:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ₹ {(result.counterpart_comparison.counterpart_threshold ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Applicable Rate:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {hasPan ? `${result.counterpart_comparison.counterpart_rate}%` : `${result.counterpart_comparison.counterpart_rate_without_pan}%`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1 text-slate-800 dark:text-slate-200 font-bold">
                    <span>Counterpart TDS:</span>
                    <span className="text-teal-700 dark:text-teal-400">
                      ₹ {(result.counterpart_comparison.counterpart_tds_amount ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legislative explanation note */}
              <div className="rounded-lg border border-teal-200 bg-white/70 p-2.5 text-xs text-slate-700 dark:border-teal-900/50 dark:bg-slate-900/40 dark:text-slate-300">
                <span className="font-bold text-teal-800 dark:text-teal-300 block mb-0.5">
                  Statutory Parity & Provision Analysis:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {result.counterpart_comparison.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Audit Steps */}
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/40 text-xs space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">Rules Applied:</span>
            <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400">
              {result.rules_applied.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TDS Section Comparison Matrix */}
      <div className={`rounded-xl border p-5 shadow-sm space-y-3 ${cardBg}`}>
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-blue-600" />
          <h3 className={`text-sm font-bold ${textTitle}`}>
            TDS Section Statutory Master (1961 Act vs 2025 Act)
          </h3>
        </div>
        <p className={`text-xs ${textMuted}`}>
          Side-by-side comparative threshold, resident rate, missing PAN penal rate, and lower deduction certificate eligibility across both legislative acts.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Governing Act</th>
                <th className="p-3">Section</th>
                <th className="p-3">Nature of Payment</th>
                <th className="p-3">Resident Rate %</th>
                <th className="p-3">Rate w/o PAN %</th>
                <th className="p-3">Statutory Threshold</th>
                <th className="p-3">LDC Sec 197/390?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeTdsRules.map(r => (
                <tr key={`${r.act_name}-${r.section_number}-${r.id}`}>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        r.act_name === 'Income-tax Act, 2025'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {r.act_name === 'Income-tax Act, 2025' ? '2025 Act' : '1961 Act'}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">Sec {r.section_number}</td>
                  <td className="p-3">{r.nature_of_payment}</td>
                  <td className="p-3 font-semibold">{r.resident_rate}%</td>
                  <td className="p-3 font-semibold text-rose-600">{r.rate_without_pan}%</td>
                  <td className="p-3">₹ {(r.threshold_limit ?? 0).toLocaleString('en-IN')} ({r.threshold_type})</td>
                  <td className="p-3">{r.lower_ded_cert_allowed ? '✓ Eligible' : '✗ Not Allowed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
