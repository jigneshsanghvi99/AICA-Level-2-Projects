import React, { useState } from 'react';
import { Shield, ShieldAlert, Sun, Moon, Info, Monitor, Lock, Unlock, FileText } from 'lucide-react';
import { TaxpayerCategory } from '../types';

interface HeaderProps {
  financialYear: string;
  setFinancialYear: (fy: string) => void;
  assessmentYear: string;
  setAssessmentYear: (ay: string) => void;
  currentRole: 'user' | 'admin';
  setCurrentRole: (role: 'user' | 'admin') => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onOpenDisclaimer: () => void;
  onOpenDesktopModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  financialYear,
  setFinancialYear,
  assessmentYear,
  setAssessmentYear,
  currentRole,
  setCurrentRole,
  isDarkMode,
  setIsDarkMode,
  onOpenDisclaimer,
  onOpenDesktopModal
}) => {
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleRoleToggle = () => {
    if (currentRole === 'admin') {
      setCurrentRole('user');
    } else {
      setEnteredPin('');
      setPinError('');
      setShowPinDialog(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === 'admin123') {
      setCurrentRole('admin');
      setShowPinDialog(false);
      setPinError('');
    } else {
      setPinError('Invalid Admin PIN. (Default demo PIN: admin123)');
    }
  };

  const handleFyChange = (newFy: string) => {
    setFinancialYear(newFy);
    if (newFy === '2024-25') {
      setAssessmentYear('2025-26');
    } else if (newFy === '2025-26') {
      setAssessmentYear('2026-27');
    }
  };

  return (
    <header
      id="app-header"
      className={`h-16 border-b px-6 md:px-8 flex items-center justify-between shadow-sm transition-colors ${
        isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Left: Geometric FY & AY Metrics Stack */}
      <div className="flex items-center gap-5">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Financial Year</span>
          <div className="flex items-center">
            <select
              id="fy-selector"
              value={financialYear}
              onChange={e => handleFyChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="2024-25" className="dark:bg-slate-800">2024-25</option>
              <option value="2025-26" className="dark:bg-slate-800">2025-26</option>
            </select>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assessment Year</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-normal">
            {assessmentYear}
          </span>
        </div>

        <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-slate-700" />

        {/* Active Statutory Tag */}
        <div className="hidden lg:flex items-center">
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 uppercase dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            Active: IT Act, 2025
          </div>
        </div>
      </div>

      {/* Right: Actions, Mode, Status & Disclaimers */}
      <div className="flex items-center gap-3">
        {/* Python Desktop Hub Button */}
        <button
          id="btn-python-desktop"
          onClick={onOpenDesktopModal}
          className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 transition-colors"
          title="View Python PySide6 Desktop Executable & Build Instructions"
        >
          <Monitor className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span className="hidden sm:inline">Desktop .exe</span>
        </button>

        {/* Role Toggle Button */}
        <button
          id="btn-role-toggle"
          onClick={handleRoleToggle}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            currentRole === 'admin'
              ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          {currentRole === 'admin' ? (
            <>
              <Unlock className="h-3.5 w-3.5" />
              <span>Admin Mode</span>
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" />
              <span>User Mode</span>
            </>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          id="btn-theme-toggle"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
          title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Statutory Disclaimer Trigger */}
        <button
          id="btn-disclaimer"
          onClick={onOpenDisclaimer}
          className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 transition-colors"
        >
          <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">Disclaimer</span>
        </button>
      </div>

      {/* Admin PIN Dialog */}
      {showPinDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Administrator Authentication
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter PIN to maintain tax rules, slabs & version history
                </p>
              </div>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Admin PIN (Default demo PIN: <span className="font-mono font-bold text-blue-600">admin123</span>)
                </label>
                <input
                  type="password"
                  value={enteredPin}
                  onChange={e => setEnteredPin(e.target.value)}
                  placeholder="Enter PIN..."
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {pinError && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{pinError}</p>}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinDialog(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
