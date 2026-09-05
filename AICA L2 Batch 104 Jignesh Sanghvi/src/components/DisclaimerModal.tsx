import React from 'react';
import { ShieldAlert, CheckCircle, Scale, AlertTriangle } from 'lucide-react';
import { LEGAL_DISCLAIMER_TEXT } from '../data/defaultRules';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#1E293B] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
            <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Statutory Compliance & Legal Disclaimer
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Income-tax Act, 1961 vs Income-tax Act, 2025 Comparative Framework
            </p>
          </div>
        </div>

        <div className="my-5 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-medium">
            <p className="font-bold mb-1">Official Statutory Notice:</p>
            {LEGAL_DISCLAIMER_TEXT}
          </div>

          <p>
            <strong>Terminology Adherence:</strong> All comparative references throughout this application strictly utilize the exact legislative designation <em>"Income-tax Act, 2025"</em> and <em>"Income-tax Act, 1961"</em>. No legal provisions, exemptions, or tax rates have been assumed or artificially fabricated.
          </p>

          <p>
            <strong>Offline Architecture:</strong> This application operates completely offline without transmitting taxpayer financial data, PAN numbers, or calculation payloads to any external cloud service, remote server, or third-party API. All information resides strictly within your local SQLite database.
          </p>

          <p>
            <strong>Professional Guidance:</strong> Tax liabilities, advance tax schedules, and TDS withholdings computed by this software serve strictly comparative and analytical purposes. Taxpayers, chartered accountants, and tax practitioners must verify computations against the official Gazette notifications and CBDT circulars before finalizing statutory returns.
          </p>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            <CheckCircle className="h-4 w-4" />
            <span>I Understand & Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
