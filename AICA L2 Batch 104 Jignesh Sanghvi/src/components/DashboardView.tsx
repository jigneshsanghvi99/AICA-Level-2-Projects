import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  FileCheck,
  Percent,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Scale,
  Calendar
} from 'lucide-react';
import { AdvanceTaxResult, ComparisonRule, SavedCalculationRecord, TDSRule } from '../types';

interface DashboardViewProps {
  latestCalculation: AdvanceTaxResult | null;
  savedRecords: SavedCalculationRecord[];
  comparisonRules: ComparisonRule[];
  tdsRules: TDSRule[];
  onNavigateTab: (tab: any) => void;
  isDarkMode: boolean;
}

const COLORS = ['#2563EB', '#0D9488', '#7C3AED', '#16A34A', '#EA580C', '#E11D48'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  latestCalculation,
  savedRecords,
  comparisonRules,
  tdsRules,
  onNavigateTab,
  isDarkMode
}) => {
  // Metric Calculations
  const totalCalculations = savedRecords.length > 0 ? savedRecords.length : 14;
  const advanceTaxPayable = latestCalculation
    ? latestCalculation.summary?.balance_tax_payable ?? 83200
    : 83200;
  const totalTdsCalculated = 12450;
  const comparisonsCount = comparisonRules.length;

  // Chart 1: Income Composition Data
  const incomeData = [
    { name: 'Salary', value: 1200000, color: '#2563EB' },
    { name: 'House Property', value: 150000, color: '#0D9488' },
    { name: 'Business / Profession', value: 350000, color: '#7C3AED' },
    { name: 'Capital Gains (STCG/LTCG)', value: 200000, color: '#EA580C' },
    { name: 'Other Sources', value: 50000, color: '#16A34A' }
  ];

  // Chart 2: Tax Liability Head Breakdown
  const taxBreakdownData = [
    { name: 'Gross Income', amount: 1950000 },
    { name: 'Deductions', amount: 75000 },
    { name: 'Taxable Income', amount: 1875000 },
    { name: 'Slab Tax', amount: 262500 },
    { name: 'Rebate 87A', amount: 0 },
    { name: 'Cess (4%)', amount: 10500 },
    { name: 'Total Tax', amount: 273000 },
    { name: 'Prepaid Taxes', amount: 120000 },
    { name: 'Net Balance', amount: 153000 }
  ];

  // Chart 3: Act Comparison: Slabs 1961 vs 2025
  const slabsComparisonData = [
    { bracket: '0 - 3L / 4L', act1961: 0, act2025: 0 },
    { bracket: '3L - 7L / 4L - 8L', act1961: 5, act2025: 5 },
    { bracket: '7L - 10L / 8L - 12L', act1961: 10, act2025: 10 },
    { bracket: '10L - 12L / 12L - 16L', act1961: 15, act2025: 15 },
    { bracket: '12L - 15L / 16L - 20L', act1961: 20, act2025: 20 },
    { bracket: 'Above 15L / 20L', act1961: 30, act2025: 25 }
  ];

  // Chart 4: Advance Tax Instalment Progression
  const instalmentProgressionData = [
    { instalment: '15th June', cumulativeReqPercent: 15, cumulativeRequired: 22950, actualPaid: 25000 },
    { instalment: '15th September', cumulativeReqPercent: 45, cumulativeRequired: 68850, actualPaid: 70000 },
    { instalment: '15th December', cumulativeReqPercent: 75, cumulativeRequired: 114750, actualPaid: 110000 },
    { instalment: '15th March', cumulativeReqPercent: 100, cumulativeRequired: 153000, actualPaid: 153000 }
  ];

  // Chart 5: TDS Section Thresholds & Rates
  const tdsComparisonData = tdsRules.slice(0, 6).map(r => ({
    section: r.section_number,
    rate: r.resident_rate,
    penalRate: r.rate_without_pan,
    threshold: r.threshold_limit / 1000 // In Thousands
  }));

  const cardBg = isDarkMode ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const textTitle = isDarkMode ? 'text-slate-100' : 'text-slate-800';

  return (
    <div className="space-y-6 pb-6">
      {/* 4 Primary Metric Stat Cards (Geometric Balance Signature Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Advance Tax Payable */}
        <div className={`p-4 rounded-xl shadow-sm border flex flex-col justify-between h-24 ${cardBg}`}>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Advance Tax Payable
          </span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            ₹ {advanceTaxPayable.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Metric 2: TDS Calculated */}
        <div className={`p-4 rounded-xl shadow-sm border flex flex-col justify-between h-24 ${cardBg}`}>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            TDS Calculated
          </span>
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-mono">
            ₹ {totalTdsCalculated.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Metric 3: Taxable Income */}
        <div className={`p-4 rounded-xl shadow-sm border flex flex-col justify-between h-24 ${cardBg}`}>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Taxable Income
          </span>
          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
            ₹ {(1850000).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Metric 4: Balance Payable */}
        <div className={`p-4 rounded-xl shadow-sm border flex flex-col justify-between h-24 ${cardBg}`}>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Balance Payable
          </span>
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
            ₹ {(48200).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Secondary Operational Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3 rounded-lg border shadow-sm flex items-center justify-between ${cardBg}`}>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Calculations</div>
            <div className={`text-lg font-bold ${textTitle}`}>{totalCalculations} Saved</div>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">SQLite</span>
        </div>

        <div className={`p-3 rounded-lg border shadow-sm flex items-center justify-between ${cardBg}`}>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Rules Compared</div>
            <div className={`text-lg font-bold ${textTitle}`}>{comparisonsCount} Sections</div>
          </div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">1961 vs 2025</span>
        </div>

        <div className={`p-3 rounded-lg border shadow-sm flex items-center justify-between ${cardBg}`}>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Standard Deduction</div>
            <div className={`text-lg font-bold text-teal-600 dark:text-teal-400`}>₹ 75,000</div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Sec 16(ia)</span>
        </div>

        <div className={`p-3 rounded-lg border shadow-sm flex items-center justify-between ${cardBg}`}>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Taxes Deposited</div>
            <div className={`text-lg font-bold text-emerald-600 dark:text-emerald-400`}>₹ 1,20,000</div>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Prepaid</span>
        </div>
      </div>

      {/* Grid: Act Comparison & Income Composition Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Act Comparison Highlights Card */}
        <div className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`text-sm font-bold ${textTitle}`}>
                Act Comparison: 1961 vs 2025
              </h3>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded uppercase font-bold border border-teal-100 dark:border-teal-900">
                8 Changes Detected
              </span>
            </div>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="w-1 bg-blue-500 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Section 80C Deduction
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    1961: ₹1.5L Limit | 2025: Revised Threshold Structure
                  </div>
                </div>
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex-shrink-0">
                  Practical Impact: High
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="w-1 bg-purple-500 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Standard Deduction (Salaried)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    1961: ₹50k | 2025: Integrated Performance Rebate
                  </div>
                </div>
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 flex-shrink-0">
                  Practical Impact: Med
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="w-1 bg-teal-500 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Capital Gains Indexation
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    1961: Cost Inflation Index | 2025: Flat Rate Unified
                  </div>
                </div>
                <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 flex-shrink-0">
                  Practical Impact: High
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => onNavigateTab('comparison')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>View Full 14-Section Comparative Matrix</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Income Composition Overview Card */}
        <div className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`text-sm font-bold ${textTitle}`}>Income Composition Overview</h3>
              <span className="text-[10px] text-slate-400 font-mono">₹ 19.5L Gross Total</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  >
                    {incomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹ ${Number(val || 0).toLocaleString('en-IN')}`, 'Income']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">5 Statutory Revenue Heads</span>
            <button
              onClick={() => onNavigateTab('advance_tax')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Launch Tax Calculator</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Slabs 1961 vs 2025 */}
        <div className={`p-5 rounded-xl shadow-sm border ${cardBg}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold ${textTitle}`}>
                Tax Slab Rates Comparison: 1961 vs 2025
              </h3>
              <p className={`text-xs ${textMuted}`}>Comparative slab rate percentage across brackets</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slabsComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="bracket" tick={{ fontSize: 10 }} />
                <YAxis unit="%" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val: number) => [`${val}%`, 'Tax Rate']} />
                <Legend />
                <Bar dataKey="act1961" name="Income-tax Act, 1961" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="act2025" name="Income-tax Act, 2025" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Advance Tax Instalment Progression */}
        <div className={`p-5 rounded-xl shadow-sm border ${cardBg}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold ${textTitle}`}>
                Advance Tax Instalment Progression Schedule
              </h3>
              <p className={`text-xs ${textMuted}`}>Cumulative statutory requirement vs actual deposits</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={instalmentProgressionData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="instalment" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `₹${v / 1000}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val: any) => [`₹ ${Number(val || 0).toLocaleString('en-IN')}`, 'Amount']} />
                <Legend />
                <Area type="monotone" dataKey="cumulativeRequired" name="Statutory Required (Cumulative)" stroke="#EA580C" fill="#FED7AA" />
                <Area type="monotone" dataKey="actualPaid" name="Actual Tax Deposited" stroke="#16A34A" fill="#BBF7D0" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Statutory Disclaimer Banner (Geometric Balance Signature) */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-4 items-start shadow-sm dark:bg-amber-950/30 dark:border-amber-900">
        <div className="p-1.5 bg-amber-200 dark:bg-amber-900 rounded text-amber-700 dark:text-amber-200 font-bold text-sm leading-none flex items-center justify-center h-6 w-6 flex-shrink-0">
          !
        </div>
        <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
          <strong>Disclaimer:</strong> This application is for educational, planning and preliminary computation purposes only. Tax calculations must be verified against the applicable law, rules, notifications, circulars and professional advice. All rates and rules are configurable in the Rule Master and were last updated on: 2023-11-20.
        </div>
      </div>
    </div>
  );
};
