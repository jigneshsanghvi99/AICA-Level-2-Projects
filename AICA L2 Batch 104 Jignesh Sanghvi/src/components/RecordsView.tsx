import React, { useState } from 'react';
import {
  FolderArchive,
  Search,
  Download,
  Upload,
  Trash2,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SavedCalculationRecord } from '../types';
import { exportAdvanceTaxToExcel, exportAdvanceTaxToPDF, exportToWord } from '../utils/exportHelpers';

interface RecordsViewProps {
  records: SavedCalculationRecord[];
  setRecords: React.Dispatch<React.SetStateAction<SavedCalculationRecord[]>>;
  isDarkMode: boolean;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  records,
  setRecords,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [notification, setNotification] = useState('');

  const filteredRecords = records.filter(rec => {
    const matchesSearch =
      rec.taxpayer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.pan_masked.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.financial_year.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'All' || rec.calculation_type === selectedType;

    return matchesSearch && matchesType;
  });

  const handleDelete = (id: number) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    setNotification('Record deleted from local SQLite storage.');
    setTimeout(() => setNotification(''), 3000);
  };

  // Full Database Backup to JSON
  const handleBackupDatabase = () => {
    const backupData = {
      app: 'TaxSetu Workstation',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      records_count: records.length,
      records: records
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TaxSetu_Database_Backup_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setNotification('Database backup downloaded successfully.');
    setTimeout(() => setNotification(''), 3000);
  };

  // Restore Database from JSON
  const handleRestoreDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.records)) {
          setRecords(parsed.records);
          setNotification(`Successfully restored ${parsed.records.length} records!`);
          setTimeout(() => setNotification(''), 3500);
        } else {
          alert('Invalid backup file structure.');
        }
      } catch (err) {
        alert('Error parsing JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const cardBg = isDarkMode ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200';
  const textTitle = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Local SQLite Records & Database Maintenance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical tax calculations, Advance Tax schedules, and full local database backup/restore.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBackupDatabase}
            className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
          >
            <Download className="h-4 w-4" />
            <span>Backup Database (JSON)</span>
          </button>

          <label className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreDatabase}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className={`rounded-xl border p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 ${cardBg}`}>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by taxpayer name, masked PAN, FY..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Filter Type:</span>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="All">All Calculations</option>
            <option value="advance_tax">Advance Tax</option>
            <option value="tds">TDS</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className={`rounded-xl border shadow-sm overflow-x-auto ${cardBg}`}>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">Taxpayer Name</th>
              <th className="p-3">PAN</th>
              <th className="p-3">Governing Act & Regime</th>
              <th className="p-3">FY / AY</th>
              <th className="p-3 text-right">Taxable Income</th>
              <th className="p-3 text-right">Total Tax Liability</th>
              <th className="p-3 text-right">Net Payable / (Refund)</th>
              <th className="p-3 text-center">Timestamp</th>
              <th className="p-3 text-right">Export & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  No saved calculation records found in database.
                </td>
              </tr>
            ) : (
              filteredRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{rec.taxpayer_name}</td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{rec.pan_masked}</td>
                  <td className="p-3">
                    <span className="font-medium text-blue-700 dark:text-blue-400">{rec.act_name}</span>
                    <span className="block text-[10px] text-slate-500">{rec.regime}</span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{rec.financial_year} / {rec.assessment_year}</td>
                  <td className="p-3 text-right font-medium">₹ {(rec.taxable_income ?? 0).toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    ₹ {(rec.total_tax_liability ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400">
                    ₹ {(rec.net_payable_or_refund ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-center text-[10px] font-mono text-slate-400">
                    {rec.timestamp.substring(0, 10)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {rec.calculation_type === 'advance_tax' && (
                        <>
                          <button
                            onClick={() => exportAdvanceTaxToExcel(rec.calculation_payload)}
                            className="p-1 text-emerald-600 hover:text-emerald-800"
                            title="Download Excel"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => exportAdvanceTaxToPDF(rec.calculation_payload)}
                            className="p-1 text-rose-600 hover:text-rose-800"
                            title="Download PDF"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete Record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
