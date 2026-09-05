import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Bookmark,
  BookmarkCheck,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Scale
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { ComparisonRule } from '../types';
import { LEGAL_DISCLAIMER_TEXT } from '../data/defaultRules';

interface ComparisonViewProps {
  rules: ComparisonRule[];
  onSaveRuleNote: (ruleId: number, note: string) => void;
  isDarkMode: boolean;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  rules,
  onSaveRuleNote,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedChangeType, setSelectedChangeType] = useState('All');
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [expandedRuleId, setExpandedRuleId] = useState<number | null>(null);
  const [activeNoteRuleId, setActiveNoteRuleId] = useState<number | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState('');

  // Toggle bookmark
  const toggleBookmark = (id: number) => {
    setBookmarkedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Open note modal
  const openNoteEditor = (rule: ComparisonRule) => {
    setActiveNoteRuleId(rule.id);
    setCurrentNoteText(rule.notes || '');
  };

  const handleSaveNote = () => {
    if (activeNoteRuleId !== null) {
      onSaveRuleNote(activeNoteRuleId, currentNoteText);
      setActiveNoteRuleId(null);
    }
  };

  // Filter rules
  const filteredRules = rules.filter(r => {
    const matchesSearch =
      r.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.provision_1961.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.provision_2025.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.section_1961.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.section_2025.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.key_change.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      r.taxpayer_categories.some(cat => cat.toLowerCase().includes(selectedCategory.toLowerCase()));

    const matchesChangeType =
      selectedChangeType === 'All' || r.change_type === selectedChangeType;

    return matchesSearch && matchesCategory && matchesChangeType;
  });

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['ACT COMPARISON: Income-tax Act, 1961 vs Income-tax Act, 2025'],
      ['Generated On', new Date().toLocaleString()],
      [],
      [
        'Topic',
        'Chapter',
        'Income-tax Act, 1961 (Section & Provision)',
        'Income-tax Act, 2025 (Section & Provision)',
        'Key Change',
        'Practical Impact',
        'Taxpayer Categories',
        'Source / Reference',
        'User Notes'
      ],
      ...filteredRules.map(r => [
        r.topic,
        r.chapter,
        `${r.section_1961}: ${r.provision_1961}`,
        `${r.section_2025}: ${r.provision_2025}`,
        r.key_change,
        r.practical_impact,
        r.taxpayer_categories.join(', '),
        r.source_reference,
        r.notes || ''
      ]),
      [],
      ['DISCLAIMER'],
      [LEGAL_DISCLAIMER_TEXT]
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Act_Comparison');
    XLSX.writeFile(wb, 'Income_Tax_Act_1961_vs_2025_Comparison.xlsx');
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('COMPARATIVE ANALYSIS: Income-tax Act, 1961 vs Income-tax Act, 2025', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()} | Filter: ${selectedCategory}`, 14, 20);

    let y = 28;
    filteredRules.slice(0, 7).forEach((r, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${r.topic} (${r.chapter})`, 14, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`• 1961: [${r.section_1961}] ${r.provision_1961.substring(0, 110)}...`, 16, y);
      y += 4;
      doc.text(`• 2025: [${r.section_2025}] ${r.provision_2025.substring(0, 110)}...`, 16, y);
      y += 4;
      doc.setTextColor(37, 99, 235);
      doc.text(`• Impact: ${r.practical_impact.substring(0, 120)}`, 16, y);
      y += 6;
    });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(185, 28, 28);
    doc.text(`Disclaimer: ${LEGAL_DISCLAIMER_TEXT}`, 14, 198);

    doc.save('Act_Comparison_Report.pdf');
  };

  const cardBg = isDarkMode ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200';
  const textTitle = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Comparative Analysis: Income-tax Act, 1961 vs Income-tax Act, 2025
            </h2>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {filteredRules.length} Provisions Mapped
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Section-by-section statutory mapping, conceptual rationalization, and practical impact analysis.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
          >
            <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={`rounded-xl border p-4 shadow-sm space-y-3 ${cardBg}`}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search topic, section (e.g. 115BAC, 87A), keyword..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Taxpayer Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">All Taxpayer Categories</option>
              <option value="Individual">Individual</option>
              <option value="HUF">HUF</option>
              <option value="Company">Company</option>
              <option value="Firm">Firm / LLP</option>
              <option value="Non-resident">Non-resident</option>
            </select>
          </div>

          {/* Change Classification */}
          <div>
            <select
              value={selectedChangeType}
              onChange={e => setSelectedChangeType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">All Change Types</option>
              <option value="changed">Amended / Rationalized</option>
              <option value="new">New Concept</option>
              <option value="requires_review">Requires Administrative Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards / Rows */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className={`rounded-xl border p-12 text-center ${cardBg}`}>
            <Scale className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              No matching provisions found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try modifying your search keywords or clearing taxpayer category filters.
            </p>
          </div>
        ) : (
          filteredRules.map(rule => {
            const isBookmarked = bookmarkedIds.includes(rule.id);
            const isExpanded = expandedRuleId === rule.id;

            return (
              <div
                key={rule.id}
                className={`rounded-xl border transition-all shadow-sm ${cardBg} ${
                  isBookmarked ? 'ring-1 ring-blue-400 dark:ring-blue-600' : ''
                }`}
              >
                {/* Rule Header Bar */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleBookmark(rule.id)}
                      className="text-slate-400 hover:text-amber-500"
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this provision'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Bookmark className="h-5 w-5" />
                      )}
                    </button>
                    <div>
                      <h3 className={`text-sm font-bold ${textTitle}`}>{rule.topic}</h3>
                      <span className={`text-[11px] font-medium ${textMuted}`}>{rule.chapter}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        rule.change_type === 'changed'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : rule.change_type === 'new'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {rule.change_type === 'changed'
                        ? 'Amended Provision'
                        : rule.change_type === 'new'
                        ? 'New Architecture'
                        : 'Review Needed'}
                    </span>

                    <button
                      onClick={() => openNoteEditor(rule)}
                      className="rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {rule.notes ? 'Edit Notes ✍️' : '+ Add Notes'}
                    </button>

                    <button
                      onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Content Columns */}
                <div className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-y-0 md:divide-x border-slate-100 dark:border-slate-800">
                  {/* Left Column: Income-tax Act, 1961 */}
                  <div className="p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                        Income-tax Act, 1961
                      </span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {rule.section_1961}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {rule.provision_1961}
                    </p>
                  </div>

                  {/* Right Column: Income-tax Act, 2025 */}
                  <div className="p-4 space-y-2 bg-teal-50/30 dark:bg-teal-950/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                        Income-tax Act, 2025
                      </span>
                      <span className="rounded bg-teal-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        {rule.section_2025}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {rule.provision_2025}
                    </p>
                  </div>
                </div>

                {/* Key Change & Practical Impact Summary Bar */}
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 bg-slate-50/20 dark:bg-slate-900/10">
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200 shrink-0">
                      Key Change:
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      {rule.key_change}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                      Practical Impact:
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      {rule.practical_impact}
                    </span>
                  </div>

                  {/* User Note Display if present */}
                  {rule.notes && (
                    <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      <span className="font-bold">Your Custom Note:</span> {rule.notes}
                    </div>
                  )}

                  {/* Expanded Statutory Source Note */}
                  {isExpanded && (
                    <div className="mt-2 rounded bg-slate-100 p-3 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300 space-y-1">
                      <p><span className="font-semibold">Source Reference:</span> {rule.source_reference}</p>
                      <p><span className="font-semibold">Applicability Date:</span> {rule.applicability_date}</p>
                      <p><span className="font-semibold">Applicable Taxpayer Categories:</span> {rule.taxpayer_categories.join(', ')}</p>
                      <p className="text-[10px] text-red-600 dark:text-red-400 italic">
                        {LEGAL_DISCLAIMER_TEXT}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Note Editor Modal */}
      {activeNoteRuleId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              Save Custom User Note
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add your firm's observations, client advisory tips, or compliance notes for this provision.
            </p>
            <textarea
              value={currentNoteText}
              onChange={e => setCurrentNoteText(e.target.value)}
              rows={4}
              placeholder="Type your notes here..."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setActiveNoteRuleId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
