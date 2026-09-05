import React, { useState } from 'react';
import {
  Calculator,
  Save,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Building2,
  Home,
  Plus,
  Trash2,
  BookOpen,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Scale
} from 'lucide-react';
import {
  AdvanceTaxInputs,
  AdvanceTaxResult,
  TaxRegime,
  TaxpayerCategory,
  TaxSlab,
  RebateRule,
  SurchargeRule,
  DeductionRule,
  AdvanceTaxScheduleRule,
  ChapterVIADeductionItem,
  HousePropertyDetails
} from '../types';
import { computeAdvanceTax, computeHousePropertyIncome, calculateAllowedChapterVIA } from '../engine/taxEngine';
import { exportAdvanceTaxToExcel, exportAdvanceTaxToPDF, exportToWord } from '../utils/exportHelpers';
import { DEFAULT_CHAPTER_VIA_ITEMS } from '../data/defaultRules';
import { StatutoryProvisionsSummary } from './StatutoryProvisionsSummary';

interface AdvanceTaxViewProps {
  financialYear: string;
  assessmentYear: string;
  slabsList: TaxSlab[];
  rebatesList: RebateRule[];
  surchargesList: SurchargeRule[];
  deductionsList: DeductionRule[];
  schedulesList: AdvanceTaxScheduleRule[];
  onSaveCalculation: (res: AdvanceTaxResult) => void;
  isDarkMode: boolean;
}

export const AdvanceTaxView: React.FC<AdvanceTaxViewProps> = ({
  financialYear,
  assessmentYear,
  slabsList,
  rebatesList,
  surchargesList,
  deductionsList,
  schedulesList,
  onSaveCalculation,
  isDarkMode
}) => {
  // Form State
  const [taxpayerName, setTaxpayerName] = useState('M/s Apex Enterprises');
  const [pan, setPan] = useState('ABCDE1234F');
  const [actName, setActName] = useState('Income-tax Act, 1961');
  const [regime, setRegime] = useState<TaxRegime>('New Regime');
  const [category, setCategory] = useState<TaxpayerCategory>('Individual (Below 60)');

  // Income States
  const [sal, setSal] = useState<number>(1200000);
  const [biz, setBiz] = useState<number>(350000);
  const [stcgNorm, setStcgNorm] = useState<number>(0);
  const [stcg111a, setStcg111a] = useState<number>(50000);
  const [ltcg112a, setLtcg112a] = useState<number>(150000);
  const [other, setOther] = useState<number>(30000);

  // House Property Detailed State (Self-Occupied vs Let-Out)
  const [propertyType, setPropertyType] = useState<'self_occupied' | 'let_out'>('let_out');
  const [grossRent, setGrossRent] = useState<number>(360000);
  const [municipalTaxes, setMunicipalTaxes] = useState<number>(20000);
  const [homeLoanInterest, setHomeLoanInterest] = useState<number>(150000);
  const [showHpBreakdown, setShowHpBreakdown] = useState(true);

  // Dynamic Chapter VI-A Deductions State
  const [deductionItems, setDeductionItems] = useState<ChapterVIADeductionItem[]>(DEFAULT_CHAPTER_VIA_ITEMS);
  const [showDeductionsManager, setShowDeductionsManager] = useState(false);
  const [customSection, setCustomSection] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [customMax, setCustomMax] = useState<number>(50000);

  // Deductions & Credits
  const [stdDed, setStdDed] = useState<number>(75000);
  const [tdsPaid, setTdsPaid] = useState<number>(45000);
  const [tcsPaid, setTcsPaid] = useState<number>(0);
  const [advPaid, setAdvPaid] = useState<number>(50000);

  // Provisions Summary Modal/Drawer
  const [showProvisions, setShowProvisions] = useState(false);

  // Results State
  const [result, setResult] = useState<AdvanceTaxResult | null>(null);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Live Computed House Property
  const hpDetails: HousePropertyDetails = computeHousePropertyIncome(
    propertyType,
    grossRent,
    municipalTaxes,
    homeLoanInterest
  );

  // Computed allowed Chapter VI-A based on selected Act and regime
  const computedChapterVIA = calculateAllowedChapterVIA(deductionItems, actName, regime);

  const handleActChange = (newAct: string) => {
    setActName(newAct);
    if (newAct === 'Income-tax Act, 2025') {
      setRegime('Standard Regime');
      setStdDed(100000); // 2025 Act standard deduction is ₹ 1,00,000
    } else {
      setRegime('New Regime');
      setStdDed(75000); // FY 24-25 New Regime standard deduction is ₹ 75,000
    }
  };

  const handleRegimeChange = (newRegime: TaxRegime) => {
    setRegime(newRegime);
    if (newRegime === 'Old Regime') {
      setStdDed(50000);
    } else if (newRegime === 'New Regime') {
      setStdDed(75000);
    } else if (newRegime === 'Standard Regime') {
      setStdDed(100000);
    }
  };

  const handleDeductionAmountChange = (id: string, amount: number) => {
    setDeductionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, amount } : item))
    );
  };

  const handleAddCustomDeduction = () => {
    if (!customSection.trim()) return;
    const newItem: ChapterVIADeductionItem = {
      id: `custom_${Date.now()}`,
      section: customSection.trim(),
      title: customTitle.trim() || `Deduction u/s ${customSection}`,
      description: 'User-added statutory deduction claim',
      amount: customAmount,
      statutory_limit: customMax > 0 ? customMax : null,
      allowed_in_regimes: ['Old Regime'],
      allowed_in_acts: ['Income-tax Act, 1961'],
      category: 'OTHER'
    };
    setDeductionItems(prev => [...prev, newItem]);
    setCustomSection('');
    setCustomTitle('');
    setCustomAmount(0);
  };

  const handleRemoveDeduction = (id: string) => {
    setDeductionItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCalculate = () => {
    const inputs: AdvanceTaxInputs = {
      taxpayer_name: taxpayerName,
      pan: pan,
      act_name: actName,
      regime: regime,
      financial_year: financialYear,
      assessment_year: assessmentYear,
      taxpayer_category: category,
      date_of_calculation: new Date().toISOString(),
      incomes: {
        salary: sal,
        house_property: hpDetails.computed_hp_income,
        business_profession: biz,
        stcg_normal: stcgNorm,
        stcg_special_111a: stcg111a,
        ltcg_special_112a: ltcg112a,
        other_sources: other
      },
      house_property_details: hpDetails,
      deductions: {
        standard_deduction: stdDed,
        chapter_via: computedChapterVIA.totalAllowed,
        other_deductions: 0
      },
      deduction_items: deductionItems,
      credits: {
        tds_deducted: tdsPaid,
        tcs_collected: tcsPaid,
        advance_tax_paid: advPaid,
        other_credits: 0
      },
      advance_tax_paid_dates: []
    };

    const res = computeAdvanceTax(
      inputs,
      slabsList,
      rebatesList,
      surchargesList,
      deductionsList,
      schedulesList
    );
    setResult(res);
  };

  const handleSave = () => {
    if (!result) return;
    onSaveCalculation(result);
    setSaveMessage('Calculation saved successfully to local records!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const cardBg = isDarkMode ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200';
  const textTitle = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 pb-8">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Advance Tax & Comprehensive Direct Tax Calculator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Head-wise income estimation, Self-occupied/Let-out property, Chapter VI-A deduction engine, statutory provisions summary & dual-act comparative analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProvisions(!showProvisions)}
            className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            <span>{showProvisions ? 'Hide Statutory Provisions' : 'Act 1961 vs 2025 Provisions'}</span>
          </button>
          <button
            onClick={handleCalculate}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            <Calculator className="h-4 w-4" />
            <span>Compute Advance Tax</span>
          </button>
        </div>
      </div>

      {/* Statutory Provisions Summary Panel */}
      {showProvisions && (
        <StatutoryProvisionsSummary isDarkMode={isDarkMode} defaultTopic="house_property" />
      )}

      {/* Inputs Form */}
      <div className={`rounded-xl border p-5 shadow-sm space-y-6 ${cardBg}`}>
        {/* Row 1: Profile & Regimes */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textMuted} mb-3`}>
            1. Taxpayer Profile & Regime Parameters
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Taxpayer Name
              </label>
              <input
                type="text"
                value={taxpayerName}
                onChange={e => setTaxpayerName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                PAN (Masked in Reports)
              </label>
              <input
                type="text"
                value={pan}
                onChange={e => setPan(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full font-mono rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Governing Act
              </label>
              <select
                value={actName}
                onChange={e => handleActChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              >
                <option value="Income-tax Act, 1961">Income-tax Act, 1961</option>
                <option value="Income-tax Act, 2025">Income-tax Act, 2025</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tax Regime
              </label>
              <select
                value={regime}
                onChange={e => handleRegimeChange(e.target.value as TaxRegime)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              >
                {actName === 'Income-tax Act, 1961' ? (
                  <>
                    <option value="New Regime">New Regime (Default u/s 115BAC)</option>
                    <option value="Old Regime">Old Regime (With Exemptions)</option>
                  </>
                ) : (
                  <option value="Standard Regime">Standard Regime (Unified Code)</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TaxpayerCategory)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Individual (Below 60)">Individual (Below 60)</option>
                <option value="Senior Citizen (60-80)">Senior Citizen (60-80)</option>
                <option value="Super Senior Citizen (80+)">Super Senior (80+)</option>
                <option value="HUF">HUF</option>
                <option value="Company">Company</option>
                <option value="Firm">Firm / LLP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2A: House Property Details (Self-Occupied vs Let-Out Property) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>
                Income from House Property — Property Classification & Computation
              </h3>
            </div>

            {/* Property Type Radio Selector */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setPropertyType('self_occupied')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  propertyType === 'self_occupied'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Self Occupied Property (SOP)</span>
              </button>

              <button
                type="button"
                onClick={() => setPropertyType('let_out')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  propertyType === 'let_out'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Let Out Property (LOP)</span>
              </button>
            </div>
          </div>

          {/* House Property Parameter Inputs */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
            {propertyType === 'let_out' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Gross Annual Rent (GAV)
                  </label>
                  <input
                    type="number"
                    value={grossRent}
                    onChange={e => setGrossRent(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">Rent received / receivable in FY</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Municipal Taxes Paid
                  </label>
                  <input
                    type="number"
                    value={municipalTaxes}
                    onChange={e => setMunicipalTaxes(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">Paid by owner during the year</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Net Annual Value (NAV)
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                    ₹ {hpDetails.net_annual_value.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400">GAV less Municipal Taxes</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    30% Std Deduction u/s 24(a)
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-emerald-400">
                    ₹ {hpDetails.standard_deduction_24a.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400">Automatic 30% statutory relief</span>
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 lg:col-span-3 rounded-lg border border-dashed border-slate-300 bg-white/70 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                  Self-Occupied Property (Section 23(2)):
                </span>
                Annual Value is statutorily treated as <strong>NIL</strong>. No municipal taxes or standard 30% deduction u/s 24(a) are deductible. Only interest on borrowed capital u/s 24(b) can be claimed as a loss, subject to a statutory limit of <strong>₹ 2,00,000</strong>.
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Housing Loan Interest u/s 24(b)
              </label>
              <input
                type="number"
                value={homeLoanInterest}
                onChange={e => setHomeLoanInterest(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">
                {propertyType === 'self_occupied' ? 'Cap of ₹ 2,00,000 for SOP' : 'Actual interest paid/payable'}
              </span>
            </div>
          </div>

          {/* Computed Net House Property Income Badge & Note */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Net Computed Income / (Loss) from House Property:
              </span>
              <span
                className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                  hpDetails.computed_hp_income >= 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                ₹ {hpDetails.computed_hp_income.toLocaleString('en-IN')}
              </span>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {regime === 'Old Regime'
                ? 'Old Regime: HP loss up to ₹ 2,00,000 can be set off against Salary/Business.'
                : 'New Regime & 2025 Act: Loss from HP cannot be set off against other heads of income.'}
            </span>
          </div>
        </div>

        {/* Row 2: Incomes by Other Heads */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textMuted} mb-3`}>
            2. Estimated Gross Income Under Other Respective Heads (INR)
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Salary Income (Gross)
              </label>
              <input
                type="number"
                value={sal}
                onChange={e => setSal(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Profits & Gains of Business/Profession
              </label>
              <input
                type="number"
                value={biz}
                onChange={e => setBiz(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Income from Other Sources (Interest/Dividend)
              </label>
              <input
                type="number"
                value={other}
                onChange={e => setOther(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                STCG u/s 111A (Special 20% Tax)
              </label>
              <input
                type="number"
                value={stcg111a}
                onChange={e => setStcg111a(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                LTCG u/s 112A (Special 12.5% Tax over ₹ 1.25L)
              </label>
              <input
                type="number"
                value={ltcg112a}
                onChange={e => setLtcg112a(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Normal STCG (Taxed at Slab Rates)
              </label>
              <input
                type="number"
                value={stcgNorm}
                onChange={e => setStcgNorm(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Deductions & Prepaid Taxes */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textMuted} mb-3`}>
            3. Deductions Claimed & Prepaid Tax Credits (INR)
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Standard Deduction u/s 16(ia)
              </label>
              <input
                type="number"
                value={stdDed}
                onChange={e => setStdDed(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">
                {actName === 'Income-tax Act, 2025'
                  ? '₹ 1,00,000 in 2025 Act'
                  : regime === 'New Regime'
                  ? '₹ 75,000 for New Regime'
                  : '₹ 50,000 for Old Regime'}
              </span>
            </div>

            {/* Chapter VI-A Total & Details Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Chapter VI-A Allowed
                </label>
                <button
                  type="button"
                  onClick={() => setShowDeductionsManager(!showDeductionsManager)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {showDeductionsManager ? 'Hide Manager' : 'Edit Sections'}
                </button>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                ₹ {computedChapterVIA.totalAllowed.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400">
                {regime === 'Old Regime'
                  ? 'Full 80C, 80D, 80CCD claims'
                  : 'Restricted: 80CCD(2) allowed only'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                TDS Already Deducted
              </label>
              <input
                type="number"
                value={tdsPaid}
                onChange={e => setTdsPaid(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                TCS Collected
              </label>
              <input
                type="number"
                value={tcsPaid}
                onChange={e => setTcsPaid(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Advance Tax Already Paid
              </label>
              <input
                type="number"
                value={advPaid}
                onChange={e => setAdvPaid(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Chapter VI-A Deductions Manager Drawer */}
          {showDeductionsManager && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Statutory Deductions Under Various Sections (Chapter VI-A)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Input statutory claims across sections. The system automatically enforces statutory ceilings and regime eligibility.
                  </p>
                </div>
                <span className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Current Regime Allowed: ₹ {computedChapterVIA.totalAllowed.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Deductions Items Grid */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {deductionItems.map(item => {
                  const isEligible =
                    item.allowed_in_regimes?.includes(regime) &&
                    (item.allowed_in_acts ? item.allowed_in_acts.includes(actName) : true);

                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border p-2.5 text-xs space-y-1.5 ${
                        isEligible
                          ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                          : 'border-slate-200 bg-slate-100/70 opacity-60 dark:border-slate-800 dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-700 dark:text-blue-400">
                          {item.section}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                              isEligible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {isEligible ? 'Eligible' : 'Disallowed'}
                          </span>
                          {item.id.startsWith('custom_') && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDeduction(item.id)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                        {item.title}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.amount}
                          onChange={e => handleDeductionAmountChange(item.id, Number(e.target.value))}
                          className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                        {item.statutory_limit && (
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            Cap: ₹{(item.statutory_limit / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Deduction Section Row */}
              <div className="border-t border-slate-200 pt-3 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Add Section:</span>
                <input
                  type="text"
                  placeholder="e.g. 80GG"
                  value={customSection}
                  onChange={e => setCustomSection(e.target.value.toUpperCase())}
                  className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Description (Rent Paid)"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="flex-1 min-w-[150px] rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={customAmount || ''}
                  onChange={e => setCustomAmount(Number(e.target.value))}
                  className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDeduction}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calculation Results Card */}
      {result && (
        <div className={`rounded-xl border shadow-sm space-y-6 p-6 ${cardBg}`}>
          {/* Top Result Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className={`text-base font-bold ${textTitle}`}>
                Tax Computation Results ({result.act_name} - {result.regime})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Taxpayer: <span className="font-semibold">{result.taxpayer_name}</span> (PAN: {result.pan_masked}) | FY: {result.financial_year} (AY: {result.assessment_year})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
              >
                <Save className="h-4 w-4" />
                <span>Save Record</span>
              </button>
              <button
                onClick={() => exportAdvanceTaxToExcel(result)}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => exportToWord(result)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
              >
                <FileText className="h-4 w-4" />
                <span>Word (.doc)</span>
              </button>
              <button
                onClick={() => exportAdvanceTaxToPDF(result)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
              >
                <FileText className="h-4 w-4" />
                <span>PDF (.pdf)</span>
              </button>
            </div>
          </div>

          {saveMessage && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-medium dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
              {saveMessage}
            </div>
          )}

          {/* Warnings & Alerts */}
          {result.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 space-y-1">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Act-to-Act Comparative Tax Computation (Saving/Loss Analysis) */}
          {result.comparative_analysis && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-5 shadow-sm space-y-4 dark:border-teal-900/60 dark:bg-teal-950/20">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-200/70 pb-3 dark:border-teal-800/70">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Comparative Tax Computation & Saving / Loss Analysis
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Comparing <span className="font-semibold">{result.act_name} ({result.regime})</span> vs.{' '}
                      <span className="font-semibold">{result.comparative_analysis.counterpart_act} ({result.comparative_analysis.counterpart_regime})</span>
                    </p>
                  </div>
                </div>

                {/* Saving / Loss Outcome Pill */}
                {(() => {
                  const comp = result.comparative_analysis;
                  const taxDiff = comp.tax_difference ?? comp.saving_amount ?? Math.abs(comp.difference_tax ?? 0);
                  const isSaving = comp.is_saving_in_counterpart;
                  return (
                    <div className="flex items-center gap-2">
                      {isSaving ? (
                        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            ₹ {(taxDiff ?? 0).toLocaleString('en-IN')} Tax Saving under {comp.counterpart_act}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span>
                            Current Selection Saves ₹ {(taxDiff ?? 0).toLocaleString('en-IN')} vs. Counterpart Act
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Recommendation Insight */}
              <div className="rounded-lg border border-teal-200 bg-white/80 p-3 text-xs text-slate-700 dark:border-teal-900/50 dark:bg-slate-900/60 dark:text-slate-300 space-y-1">
                <span className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  Comparative Tax Advisory Note:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {result.comparative_analysis.recommendation}
                </p>
              </div>

              {/* Side-by-Side Comparison Metrics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Key Computation Metric</th>
                      <th className="p-2.5 text-right">
                        {result.act_name} ({result.regime})
                      </th>
                      <th className="p-2.5 text-right text-teal-700 dark:text-teal-400">
                        {result.comparative_analysis.counterpart_act} ({result.comparative_analysis.counterpart_regime})
                      </th>
                      <th className="p-2.5 text-right">Variance (Difference)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white/60 dark:divide-slate-800 dark:bg-slate-900/30">
                    {(
                      result.comparative_analysis.metric_comparison ||
                      result.comparative_analysis.comparison_metrics?.map(m => ({
                        metric_name: m.metric,
                        primary_amount: m.primary_value,
                        counterpart_amount: m.counterpart_value,
                        difference: m.difference
                      })) ||
                      []
                    ).map((metric, idx) => {
                      const isTaxTotal = metric.metric_name.includes('Tax Liability');
                      const pAmt = metric.primary_amount ?? 0;
                      const cpAmt = metric.counterpart_amount ?? 0;
                      const diff = metric.difference ?? (pAmt - cpAmt);
                      return (
                        <tr
                          key={idx}
                          className={isTaxTotal ? 'font-bold bg-teal-50/50 dark:bg-teal-950/40 text-slate-900 dark:text-white' : ''}
                        >
                          <td className="p-2.5 font-medium">{metric.metric_name}</td>
                          <td className="p-2.5 text-right font-semibold">
                            ₹ {pAmt.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-teal-700 dark:text-teal-400">
                            ₹ {cpAmt.toLocaleString('en-IN')}
                          </td>
                          <td
                            className={`p-2.5 text-right font-bold ${
                              diff < 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : diff > 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {diff === 0
                              ? '₹ 0'
                              : `${diff < 0 ? '-' : '+'} ₹ ${Math.abs(diff).toLocaleString('en-IN')}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Core Computational Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Statutory Head / Computation Line</th>
                  <th className="p-3 text-right">Amount (INR)</th>
                  <th className="p-3">Legal Basis & Statutory Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                <tr>
                  <td className="p-3 font-medium">Gross Total Income (GTI)</td>
                  <td className="p-3 text-right font-semibold">₹ {result.summary.gross_total_income.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">Aggregate of 5 Heads of Income</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-emerald-700 dark:text-emerald-400">Less: Total Deductions</td>
                  <td className="p-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">- ₹ {result.summary.total_deductions.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">Section 16(ia) & Chapter VI-A</td>
                </tr>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 font-bold">
                  <td className="p-3">Net Taxable Total Income</td>
                  <td className="p-3 text-right text-blue-700 dark:text-blue-400">₹ {result.summary.taxable_total_income.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">GTI minus verified deductions</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Normal Slab Tax</td>
                  <td className="p-3 text-right font-semibold">₹ {result.summary.normal_slab_tax.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">Tax computed across applicable slab rates</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Special Rate Capital Gains Tax</td>
                  <td className="p-3 text-right font-semibold">₹ {result.summary.special_rate_tax.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">STCG 111A @ 20% & LTCG 112A @ 12.5%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Total Tax Payable before Rebate</td>
                  <td className="p-3 text-right font-semibold">₹ {result.summary.tax_before_rebate.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">Slab Tax + Special Rate Tax</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-emerald-700 dark:text-emerald-400">Less: Rebate under Section 87A</td>
                  <td className="p-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">- ₹ {result.summary.rebate_amount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">Nil tax if taxable income &lt;= limit</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Tax after Rebate</td>
                  <td className="p-3 text-right font-semibold">₹ {result.summary.tax_after_rebate.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">Base liability subject to surcharge</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Add: Surcharge</td>
                  <td className="p-3 text-right font-semibold">₹ {result.summary.surcharge_amount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">Applicable rate {result.summary.surcharge_rate_percent}% (Marginal relief checked)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Add: Health & Education Cess (4%)</td>
                  <td className="p-3 text-right font-semibold">₹ {result.summary.cess_amount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">4% of (Tax after rebate + Surcharge)</td>
                </tr>
                <tr className="bg-blue-50/60 dark:bg-blue-950/40 font-bold text-slate-900 dark:text-white">
                  <td className="p-3">Total Tax Liability (Rounded u/s 288B)</td>
                  <td className="p-3 text-right text-base text-blue-700 dark:text-blue-400">
                    ₹ {result.summary.total_tax_liability.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-slate-500">Final statutory tax obligation</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-emerald-700 dark:text-emerald-400">Less: Total Prepaid Taxes (TDS / Adv Tax)</td>
                  <td className="p-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">- ₹ {result.summary.total_prepaid_tax.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-500">TDS + TCS + Advance tax deposited</td>
                </tr>
                <tr className="bg-amber-50/70 dark:bg-amber-950/40 font-black">
                  <td className="p-3 text-sm">
                    {result.summary.balance_tax_payable >= 0 ? 'Net Balance Tax Payable' : 'Net Refund Due'}
                  </td>
                  <td className={`p-3 text-right text-lg ${result.summary.balance_tax_payable >= 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    ₹ {Math.abs(result.summary.balance_tax_payable).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {result.summary.is_advance_tax_applicable ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        ⚠️ Advance tax mandatory u/s 208 (Net liability &gt;= ₹ 10,000)
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ Advance tax not required (Net liability &lt; ₹ 10,000)
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Slabs Computation Breakdown */}
          {result.slab_breakdown.length > 0 && (
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${textMuted} mb-2`}>
                Slab-by-Slab Normal Tax Computation Breakdown
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {result.slab_breakdown.map((sb, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-blue-700 dark:text-blue-400">{sb.range}</span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-800 dark:bg-blue-950 dark:text-blue-300">{sb.rate}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Taxable in slab:</span>
                      <span className="font-semibold">₹ {sb.taxable_amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="mt-1 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                      <span>Tax in slab:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">₹ {sb.tax.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advance Tax Instalment Progression Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
                Advance Tax Instalment Progression Schedule (Section 211)
              </h4>
              <span className="text-[11px] text-slate-500">
                Net Tax Subject to Advance Tax: <span className="font-bold text-blue-600">₹ {result.summary.net_tax_subject_to_adv_tax.toLocaleString('en-IN')}</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Instalment</th>
                    <th className="p-2.5">Statutory Due Date</th>
                    <th className="p-2.5">Cumulative %</th>
                    <th className="p-2.5 text-right">Required Cumulative (INR)</th>
                    <th className="p-2.5 text-right">Suggested Instalment (INR)</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.instalment_schedule.map((inst, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-bold">Instalment {inst.instalment_number}</td>
                      <td className="p-2.5 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{inst.due_date}</span>
                      </td>
                      <td className="p-2.5 font-semibold text-blue-600">{inst.cumulative_percent}%</td>
                      <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-200">
                        ₹ {inst.required_cumulative_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-600">
                        ₹ {inst.suggested_instalment.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            inst.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : inst.status === 'shortfall'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Trail Drawer Toggle */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              <HelpCircle className="h-4 w-4" />
              <span>How was this calculated? (View Computational Audit Trail)</span>
              {showAuditTrail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showAuditTrail && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-2 text-xs">
                <h5 className="font-bold text-slate-800 dark:text-slate-200">
                  Statutory Rules Applied & Step-by-Step Computational Trail:
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                  {result.rules_applied.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h6 className="font-bold text-slate-700 dark:text-slate-300">Calculation Log:</h6>
                  <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 mt-1">
                    {result.audit_trail.map((a, i) => (
                      <p key={i}>• {a}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
