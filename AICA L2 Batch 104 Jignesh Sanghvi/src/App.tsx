import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ComparisonView } from './components/ComparisonView';
import { AdvanceTaxView } from './components/AdvanceTaxView';
import { TdsView } from './components/TdsView';
import { RuleMasterView } from './components/RuleMasterView';
import { RecordsView } from './components/RecordsView';
import { PythonHubView } from './components/PythonHubView';
import { DisclaimerModal } from './components/DisclaimerModal';
import {
  DEFAULT_COMPARISON_RULES,
  DEFAULT_TAX_SLABS,
  DEFAULT_REBATE_RULES,
  DEFAULT_SURCHARGE_RULES,
  DEFAULT_DEDUCTION_RULES,
  DEFAULT_SCHEDULE_RULES,
  DEFAULT_TDS_RULES,
  LEGAL_DISCLAIMER_TEXT
} from './data/defaultRules';
import {
  ComparisonRule,
  TaxSlab,
  TDSRule,
  SavedCalculationRecord,
  AdvanceTaxResult
} from './types';
import { Scale, Info, ShieldCheck } from 'lucide-react';

export default function App() {
  // Global States
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [assessmentYear, setAssessmentYear] = useState('2025-26');
  const [currentRole, setCurrentRole] = useState<'user' | 'admin'>('user');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('taxsetu_theme') === 'dark';
  });
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  // Sync Dark Mode class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('taxsetu_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('taxsetu_theme', 'light');
    }
  }, [isDarkMode]);

  // Data Collections with local persistence (SQLite mirror)
  const [comparisonRules, setComparisonRules] = useState<ComparisonRule[]>(() => {
    const saved = localStorage.getItem('taxsetu_comparisons');
    return saved ? JSON.parse(saved) : DEFAULT_COMPARISON_RULES;
  });

  const [slabsList, setSlabsList] = useState<TaxSlab[]>(() => {
    const saved = localStorage.getItem('taxsetu_slabs');
    return saved ? JSON.parse(saved) : DEFAULT_TAX_SLABS;
  });

  const [tdsRules, setTdsRules] = useState<TDSRule[]>(() => {
    const saved = localStorage.getItem('taxsetu_tds_rules');
    if (!saved) return DEFAULT_TDS_RULES;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length < DEFAULT_TDS_RULES.length) {
        return DEFAULT_TDS_RULES;
      }
      const has1961 = parsed.some((r: any) => r.act_name === 'Income-tax Act, 1961');
      const has2025 = parsed.some((r: any) => r.act_name === 'Income-tax Act, 2025');
      if (!has1961 || !has2025) {
        return DEFAULT_TDS_RULES;
      }
      return parsed;
    } catch {
      return DEFAULT_TDS_RULES;
    }
  });

  const [savedRecords, setSavedRecords] = useState<SavedCalculationRecord[]>(() => {
    const saved = localStorage.getItem('taxsetu_records');
    if (saved) return JSON.parse(saved);

    // Initial demo records
    return [
      {
        id: 101,
        calculation_type: 'advance_tax',
        timestamp: '2025-06-14 11:20:00',
        taxpayer_name: 'M/s Radiant Infotech Ltd.',
        pan_masked: 'AAACR1234K',
        financial_year: '2024-25',
        assessment_year: '2025-26',
        act_name: 'Income-tax Act, 1961',
        regime: 'New Regime',
        taxable_income: 2450000,
        total_tax_liability: 452400,
        net_payable_or_refund: 212400,
        calculation_payload: null
      },
      {
        id: 102,
        calculation_type: 'advance_tax',
        timestamp: '2025-09-12 16:45:00',
        taxpayer_name: 'Dr. Sunita Sharma',
        pan_masked: 'ABFPS5678Q',
        financial_year: '2024-25',
        assessment_year: '2025-26',
        act_name: 'Income-tax Act, 1961',
        regime: 'New Regime',
        taxable_income: 1850000,
        total_tax_liability: 265200,
        net_payable_or_refund: 65200,
        calculation_payload: null
      }
    ];
  });

  const [latestCalculation, setLatestCalculation] = useState<AdvanceTaxResult | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('taxsetu_comparisons', JSON.stringify(comparisonRules));
  }, [comparisonRules]);

  useEffect(() => {
    localStorage.setItem('taxsetu_slabs', JSON.stringify(slabsList));
  }, [slabsList]);

  useEffect(() => {
    localStorage.setItem('taxsetu_tds_rules', JSON.stringify(tdsRules));
  }, [tdsRules]);

  useEffect(() => {
    localStorage.setItem('taxsetu_records', JSON.stringify(savedRecords));
  }, [savedRecords]);

  // Handlers
  const handleSaveCalculation = (res: AdvanceTaxResult) => {
    setLatestCalculation(res);
    const newRecord: SavedCalculationRecord = {
      id: Date.now(),
      calculation_type: 'advance_tax',
      timestamp: res.timestamp,
      taxpayer_name: res.taxpayer_name,
      pan_masked: res.pan_masked,
      financial_year: res.financial_year,
      assessment_year: res.assessment_year,
      act_name: res.act_name,
      regime: res.regime,
      taxable_income: res.summary.taxable_total_income,
      total_tax_liability: res.summary.total_tax_liability,
      net_payable_or_refund: res.summary.balance_tax_payable,
      calculation_payload: res
    };
    setSavedRecords(prev => [newRecord, ...prev]);
  };

  const handleSaveRuleNote = (ruleId: number, note: string) => {
    setComparisonRules(prev =>
      prev.map(r => (r.id === ruleId ? { ...r, notes: note } : r))
    );
  };

  const handleRequestAdmin = () => {
    // Open admin PIN in Header by switching role
    const pin = prompt('Enter Administrator PIN to access Rule Master (Default demo PIN: admin123):');
    if (pin === 'admin123') {
      setCurrentRole('admin');
      setActiveTab('rule_master');
    } else if (pin) {
      alert('Invalid Administrator PIN.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${isDarkMode ? 'bg-[#0B1120] text-slate-100' : 'bg-[#F1F5F9] text-slate-800'}`}>
      {/* Top Header */}
      <Header
        financialYear={financialYear}
        setFinancialYear={setFinancialYear}
        assessmentYear={assessmentYear}
        setAssessmentYear={setAssessmentYear}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        onOpenDesktopModal={() => setActiveTab('python_hub')}
      />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentRole={currentRole}
          onRequestAdmin={handleRequestAdmin}
          isDarkMode={isDarkMode}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                latestCalculation={latestCalculation}
                savedRecords={savedRecords}
                comparisonRules={comparisonRules}
                tdsRules={tdsRules}
                onNavigateTab={(tab: NavTab) => setActiveTab(tab)}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'comparison' && (
              <ComparisonView
                rules={comparisonRules}
                onSaveRuleNote={handleSaveRuleNote}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'advance_tax' && (
              <AdvanceTaxView
                financialYear={financialYear}
                assessmentYear={assessmentYear}
                slabsList={slabsList}
                rebatesList={DEFAULT_REBATE_RULES}
                surchargesList={DEFAULT_SURCHARGE_RULES}
                deductionsList={DEFAULT_DEDUCTION_RULES}
                schedulesList={DEFAULT_SCHEDULE_RULES}
                onSaveCalculation={handleSaveCalculation}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'tds' && (
              <TdsView
                tdsRules={tdsRules}
                financialYear={financialYear}
                assessmentYear={assessmentYear}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'rule_master' && (
              <RuleMasterView
                currentRole={currentRole}
                comparisonRules={comparisonRules}
                setComparisonRules={setComparisonRules}
                slabsList={slabsList}
                setSlabsList={setSlabsList}
                tdsRules={tdsRules}
                setTdsRules={setTdsRules}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'records' && (
              <RecordsView
                records={savedRecords}
                setRecords={setSavedRecords}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'python_hub' && (
              <PythonHubView isDarkMode={isDarkMode} />
            )}
          </div>
        </main>
      </div>

      {/* Statutory Footer Banner matching Geometric Balance */}
      <footer
        id="app-footer"
        className={`h-10 border-t px-6 md:px-8 flex items-center justify-between text-[10px] font-medium transition-colors ${
          isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-4">
          <span>System Status: <span className="text-emerald-600 font-bold dark:text-emerald-400">Offline Optimized</span></span>
          <span className="w-px h-3 bg-slate-300 dark:bg-slate-700"></span>
          <span>Database: <strong className="font-semibold text-slate-700 dark:text-slate-300">SQLite 3.42 (Local)</strong></span>
          <span className="hidden md:inline w-px h-3 bg-slate-300 dark:bg-slate-700"></span>
          <span className="hidden md:inline text-slate-600 dark:text-slate-400">IT Act, 1961 vs IT Act, 2025</span>
        </div>

        <div className="flex items-center gap-4 tracking-wider">
          <button
            onClick={() => setIsDisclaimerOpen(true)}
            className="text-amber-600 hover:underline dark:text-amber-400 font-medium"
          >
            Statutory Disclaimer
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="uppercase">App Version 2.0.1</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="uppercase">Windows Executable v1.0</span>
        </div>
      </footer>

      {/* Statutory Disclaimer Modal */}
      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
