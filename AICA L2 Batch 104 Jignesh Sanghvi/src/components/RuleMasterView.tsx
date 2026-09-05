import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Layers,
  Scale,
  Receipt
} from 'lucide-react';
import { ComparisonRule, TaxSlab, TDSRule } from '../types';

interface RuleMasterViewProps {
  currentRole: 'user' | 'admin';
  comparisonRules: ComparisonRule[];
  setComparisonRules: React.Dispatch<React.SetStateAction<ComparisonRule[]>>;
  slabsList: TaxSlab[];
  setSlabsList: React.Dispatch<React.SetStateAction<TaxSlab[]>>;
  tdsRules: TDSRule[];
  setTdsRules: React.Dispatch<React.SetStateAction<TDSRule[]>>;
  isDarkMode: boolean;
}

export const RuleMasterView: React.FC<RuleMasterViewProps> = ({
  currentRole,
  comparisonRules,
  setComparisonRules,
  slabsList,
  setSlabsList,
  tdsRules,
  setTdsRules,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'comparisons' | 'slabs' | 'tds' | 'audit'>('comparisons');
  const [auditLogs, setAuditLogs] = useState<Array<{ id: number; timestamp: string; action: string; details: string; admin: string }>>([
    {
      id: 1,
      timestamp: '2025-04-01 10:00:00',
      action: 'INITIAL_SEED',
      details: 'Populated official base rules for Income-tax Act, 1961 & Income-tax Act, 2025',
      admin: 'System'
    },
    {
      id: 2,
      timestamp: '2025-04-02 14:30:15',
      action: 'SLAB_UPDATE',
      details: 'Configured FY 2025-26 New Regime slab limits according to Finance Act provisions',
      admin: 'admin_user'
    }
  ]);

  // Edit / Add Modal States
  const [showAddComparisonModal, setShowAddComparisonModal] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newChapter, setNewChapter] = useState('General');
  const [newSec1961, setNewSec1961] = useState('');
  const [newProv1961, setNewProv1961] = useState('');
  const [newSec2025, setNewSec2025] = useState('');
  const [newProv2025, setNewProv2025] = useState('');
  const [newKeyChange, setNewKeyChange] = useState('');
  const [newImpact, setNewImpact] = useState('');

  const handleAddComparison = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic || !newSec1961 || !newSec2025) return;

    const newRule: ComparisonRule = {
      id: Date.now(),
      topic: newTopic,
      chapter: newChapter,
      section_1961: newSec1961,
      provision_1961: newProv1961,
      section_2025: newSec2025,
      provision_2025: newProv2025,
      key_change: newKeyChange,
      practical_impact: newImpact,
      change_type: 'changed',
      taxpayer_categories: ['Individual', 'HUF', 'Company', 'Firm'],
      source_reference: 'Admin Manual Entry',
      applicability_date: '2025-04-01',
      version: 1,
      is_active: true
    };

    setComparisonRules(prev => [newRule, ...prev]);
    setAuditLogs(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'ADD_COMPARISON_RULE',
        details: `Added new provision comparison: "${newTopic}" (${newSec1961} vs ${newSec2025})`,
        admin: 'admin_user'
      },
      ...prev
    ]);

    setShowAddComparisonModal(false);
    setNewTopic('');
    setNewSec1961('');
    setNewProv1961('');
    setNewSec2025('');
    setNewProv2025('');
    setNewKeyChange('');
    setNewImpact('');
  };

  const cardBg = isDarkMode ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200';
  const textTitle = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  if (currentRole !== 'admin') {
    return (
      <div className={`rounded-xl border p-12 text-center shadow-sm ${cardBg}`}>
        <Lock className="mx-auto h-12 w-12 text-amber-500" />
        <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
          Admin Authentication Required
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          The Tax Rule Master houses statutory provisions, slab thresholds, and rate configurations. Please click "Standard User" on top to authenticate with Admin PIN.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Tax Rule Master & Statutory Rate Administration
            </h2>
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
              Administrator Active 🛡️
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain statutory rules, tax slabs, TDS thresholds, version histories, and complete database audit logs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'comparisons' && (
            <button
              onClick={() => setShowAddComparisonModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Provision Comparison</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('comparisons')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 ${
            activeTab === 'comparisons'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Act Comparisons ({comparisonRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('slabs')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 ${
            activeTab === 'slabs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Tax Slabs ({slabsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tds')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 ${
            activeTab === 'tds'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>TDS Rules ({tdsRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Act Comparisons Table */}
      {activeTab === 'comparisons' && (
        <div className={`rounded-xl border p-4 shadow-sm overflow-x-auto ${cardBg}`}>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Topic / Subject</th>
                <th className="p-3">1961 Section</th>
                <th className="p-3">2025 Section</th>
                <th className="p-3">Change Type</th>
                <th className="p-3">Version</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {comparisonRules.map(r => (
                <tr key={r.id}>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{r.topic}</td>
                  <td className="p-3 font-mono text-blue-600">{r.section_1961}</td>
                  <td className="p-3 font-mono text-teal-600">{r.section_2025}</td>
                  <td className="p-3">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {r.change_type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">v{r.version}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setComparisonRules(prev => prev.filter(x => x.id !== r.id));
                        setAuditLogs(prev => [
                          {
                            id: Date.now(),
                            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                            action: 'DELETE_COMPARISON_RULE',
                            details: `Deactivated rule: ${r.topic}`,
                            admin: 'admin_user'
                          },
                          ...prev
                        ]);
                      }}
                      className="text-rose-600 hover:text-rose-800 p-1"
                      title="Deactivate / Delete Rule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Slabs Table */}
      {activeTab === 'slabs' && (
        <div className={`rounded-xl border p-4 shadow-sm overflow-x-auto ${cardBg}`}>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Governing Act</th>
                <th className="p-3">Regime</th>
                <th className="p-3">FY / AY</th>
                <th className="p-3">Lower Limit (INR)</th>
                <th className="p-3">Upper Limit (INR)</th>
                <th className="p-3">Tax Rate %</th>
                <th className="p-3">Statutory Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {slabsList.map(s => (
                <tr key={s.id}>
                  <td className="p-3 font-semibold">{s.act_name}</td>
                  <td className="p-3">{s.regime}</td>
                  <td className="p-3">{s.financial_year} / {s.assessment_year}</td>
                  <td className="p-3">₹ {s.lower_limit.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    {s.upper_limit ? `₹ ${s.upper_limit.toLocaleString('en-IN')}` : 'Above'}
                  </td>
                  <td className="p-3 font-bold text-blue-600">{s.tax_rate_percent}%</td>
                  <td className="p-3 text-slate-500">{s.source_reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: TDS Rules Table */}
      {activeTab === 'tds' && (
        <div className={`rounded-xl border p-4 shadow-sm overflow-x-auto ${cardBg}`}>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Section</th>
                <th className="p-3">Nature of Payment</th>
                <th className="p-3">Resident Rate %</th>
                <th className="p-3">Rate w/o PAN % (206AA)</th>
                <th className="p-3">Threshold Limit (INR)</th>
                <th className="p-3">Threshold Type</th>
                <th className="p-3">LDC Sec 197</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tdsRules.map(t => (
                <tr key={t.id}>
                  <td className="p-3 font-mono font-bold text-blue-600">{t.section_number}</td>
                  <td className="p-3">{t.nature_of_payment}</td>
                  <td className="p-3 font-semibold">{t.resident_rate}%</td>
                  <td className="p-3 font-semibold text-rose-600">{t.rate_without_pan}%</td>
                  <td className="p-3">₹ {t.threshold_limit.toLocaleString('en-IN')}</td>
                  <td className="p-3 capitalize">{t.threshold_type.replace('_', ' ')}</td>
                  <td className="p-3">{t.lower_ded_cert_allowed ? '✓ Eligible' : '✗ No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className={`rounded-xl border p-4 shadow-sm space-y-2 ${cardBg}`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textMuted} mb-2`}>
            Immutable System Modification Audit Trail
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.map(l => (
              <div key={l.id} className="py-2.5 flex items-start justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{l.action}</span>
                    <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      by {l.admin}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{l.details}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">{l.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Provision Comparison Modal */}
      {showAddComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              Add New Act Provision Comparison
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Map and rationalize provisions between Income-tax Act, 1961 and Income-tax Act, 2025.
            </p>

            <form onSubmit={handleAddComparison} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Topic / Title
                </label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  placeholder="e.g. Assessment Timeline & Scrutiny"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    1961 Section
                  </label>
                  <input
                    type="text"
                    required
                    value={newSec1961}
                    onChange={e => setNewSec1961(e.target.value)}
                    placeholder="e.g. Section 143(3)"
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    2025 Section
                  </label>
                  <input
                    type="text"
                    required
                    value={newSec2025}
                    onChange={e => setNewSec2025(e.target.value)}
                    placeholder="e.g. Section 156"
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  1961 Provision Summary
                </label>
                <textarea
                  rows={2}
                  value={newProv1961}
                  onChange={e => setNewProv1961(e.target.value)}
                  placeholder="Summary of 1961 provision..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  2025 Provision Summary
                </label>
                <textarea
                  rows={2}
                  value={newProv2025}
                  onChange={e => setNewProv2025(e.target.value)}
                  placeholder="Summary of 2025 provision..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Key Change & Rationalization
                </label>
                <input
                  type="text"
                  value={newKeyChange}
                  onChange={e => setNewKeyChange(e.target.value)}
                  placeholder="e.g. Consolidated assessment cycle from 12 months to 9 months"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Practical Impact on Taxpayers
                </label>
                <input
                  type="text"
                  value={newImpact}
                  onChange={e => setNewImpact(e.target.value)}
                  placeholder="e.g. Expedited closure of tax scrutiny proceedings"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddComparisonModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
