import React, { useState } from 'react';
import { BookOpen, Scale, ArrowRight, CheckCircle2, ChevronRight, Sparkles, Building2, Receipt, ShieldCheck } from 'lucide-react';
import { STATUTORY_PROVISIONS_SUMMARY, StatutorySummaryTopic } from '../data/defaultRules';

interface StatutoryProvisionsSummaryProps {
  isDarkMode: boolean;
  defaultTopic?: string;
}

export const StatutoryProvisionsSummary: React.FC<StatutoryProvisionsSummaryProps> = ({
  isDarkMode,
  defaultTopic
}) => {
  const [selectedTopicKey, setSelectedTopicKey] = useState<string>(
    defaultTopic || STATUTORY_PROVISIONS_SUMMARY[0].topic_key
  );

  const currentTopic =
    STATUTORY_PROVISIONS_SUMMARY.find(t => t.topic_key === selectedTopicKey) ||
    STATUTORY_PROVISIONS_SUMMARY[0];

  const cardBg = isDarkMode ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200';
  const textTitle = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`rounded-xl border p-5 shadow-sm space-y-4 ${cardBg}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${textTitle}`}>
              Statutory Provisions Summary & Practical Explanation (1961 Act vs 2025 Act)
            </h3>
            <p className={`text-[11px] ${textMuted}`}>
              Official comparative breakdown of computational provisions, allowances, and withholding mandates.
            </p>
          </div>
        </div>
      </div>

      {/* Topic Selection Pills */}
      <div className="flex flex-wrap gap-1.5">
        {STATUTORY_PROVISIONS_SUMMARY.map(t => (
          <button
            key={t.topic_key}
            onClick={() => setSelectedTopicKey(t.topic_key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedTopicKey === t.topic_key
                ? 'bg-[#1E293B] text-white shadow dark:bg-teal-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span>{t.title}</span>
          </button>
        ))}
      </div>

      {/* Side-by-Side Provision Comparison */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 pt-2">
        {/* Income-tax Act, 1961 Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Income-tax Act, 1961
            </span>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Legacy & Multi-Regime
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 pt-1">
            {currentTopic.act_1961_summary}
          </p>
        </div>

        {/* Income-tax Act, 2025 Box */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 dark:border-teal-900/60 dark:bg-teal-950/20 space-y-2">
          <div className="flex items-center justify-between border-b border-teal-200 pb-2 dark:border-teal-800">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Income-tax Act, 2025
            </span>
            <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              Modern Direct Tax Code
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 pt-1">
            {currentTopic.act_2025_summary}
          </p>
        </div>
      </div>

      {/* Key Difference & Taxpayer Impact Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
            <Scale className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Statutory Difference
          </span>
          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-normal">
            {currentTopic.key_difference}
          </p>
        </div>

        <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 text-xs dark:border-teal-900/50 dark:bg-teal-950/30">
          <span className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            Practical Taxpayer Impact
          </span>
          <p className="text-teal-950 dark:text-teal-200 text-[11px] leading-normal">
            {currentTopic.impact_for_taxpayer}
          </p>
        </div>
      </div>
    </div>
  );
};
