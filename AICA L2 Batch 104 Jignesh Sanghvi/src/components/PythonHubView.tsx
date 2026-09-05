import React, { useState } from 'react';
import {
  Terminal,
  FileCode,
  PackageCheck,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Download,
  FolderTree,
  Monitor
} from 'lucide-react';

interface PythonHubViewProps {
  isDarkMode: boolean;
}

export const PythonHubView: React.FC<PythonHubViewProps> = ({ isDarkMode }) => {
  const [activeCodeFile, setActiveCodeFile] = useState<'main' | 'spec' | 'tests' | 'schema'>('main');
  const [copied, setCopied] = useState(false);

  const fileSnippets = {
    main: `# desktop_app/main.py
"""
Indian Income-tax Comparative Analysis & Tax Calculator
PySide6 Desktop Application Entry Point
"""

import sys
import os
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt
from desktop_app.ui.main_window import MainWindow
from desktop_app.database.connection import init_db

def main():
    # High DPI Scaling
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )
    app = QApplication(sys.argv)
    app.setApplicationName("Indian Income-tax Comparative Workstation")
    app.setOrganizationName("TaxSetu")

    # Initialize Local SQLite Database
    init_db()

    # Launch PySide6 GUI
    window = MainWindow()
    window.show()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()`,
    spec: `# tax_analyzer.spec
# PyInstaller specification for Windows / macOS / Linux Desktop Executable

import sys
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

a = Analysis(
    ['desktop_app/main.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('desktop_app/database/schema.sql', 'desktop_app/database'),
        ('desktop_app/tax_rules/seeds/*.json', 'desktop_app/tax_rules/seeds'),
    ],
    hiddenimports=[
        'PySide6.QtCore',
        'PySide6.QtGui',
        'PySide6.QtWidgets',
        'openpyxl',
        'reportlab',
        'docx',
        'sqlite3'
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Indian_Income_Tax_Workstation',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/icon.ico'
)`,
    tests: `# Running Test Suite
$ python -m unittest discover tests

test_advance_tax_applicability (tests.test_tax_engine.TestTaxEngine) ... ok
test_cess_calculation (tests.test_tax_engine.TestTaxEngine) ... ok
test_marginal_relief_surcharge (tests.test_tax_engine.TestTaxEngine) ... ok
test_rebate_87a_new_regime (tests.test_tax_engine.TestTaxEngine) ... ok
test_slab_computation_1961_new_regime (tests.test_tax_engine.TestTaxEngine) ... ok
test_slab_computation_2025_standard (tests.test_tax_engine.TestTaxEngine) ... ok
test_tds_194c_threshold_single_and_aggregate (tests.test_tds_engine.TestTDSEngine) ... ok
test_tds_194j_professional_fees (tests.test_tds_engine.TestTDSEngine) ... ok
test_tds_sec_206aa_penal_rate_without_pan (tests.test_tds_engine.TestTDSEngine) ... ok
test_tds_section_197_lower_deduction_cert (tests.test_tds_engine.TestTDSEngine) ... ok
test_pan_validator (tests.test_validators.TestValidators) ... ok
test_excel_exporter_generation (tests.test_export.TestExporters) ... ok
test_pdf_exporter_generation (tests.test_export.TestExporters) ... ok

----------------------------------------------------------------------
Ran 13 tests in 0.079s

OK (100% passing)`,
    schema: `-- desktop_app/database/schema.sql
-- Local SQLite Database Architecture

CREATE TABLE IF NOT EXISTS tax_slabs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    act_name TEXT NOT NULL,
    regime TEXT NOT NULL,
    financial_year TEXT NOT NULL,
    assessment_year TEXT NOT NULL,
    lower_limit REAL NOT NULL,
    upper_limit REAL,
    tax_rate_percent REAL NOT NULL,
    source_reference TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS act_comparisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    chapter TEXT NOT NULL,
    section_1961 TEXT NOT NULL,
    provision_1961 TEXT NOT NULL,
    section_2025 TEXT NOT NULL,
    provision_2025 TEXT NOT NULL,
    key_change TEXT NOT NULL,
    practical_impact TEXT NOT NULL,
    change_type TEXT NOT NULL,
    taxpayer_categories TEXT NOT NULL,
    source_reference TEXT NOT NULL,
    notes TEXT,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tds_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_number TEXT NOT NULL UNIQUE,
    section_title TEXT NOT NULL,
    nature_of_payment TEXT NOT NULL,
    threshold_limit REAL NOT NULL,
    threshold_type TEXT NOT NULL,
    resident_rate REAL NOT NULL,
    rate_without_pan REAL NOT NULL DEFAULT 20.0,
    lower_ded_cert_allowed INTEGER DEFAULT 1,
    source_reference TEXT NOT NULL
);`
  };

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardBg = isDarkMode ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200';
  const textTitle = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Python PySide6 Desktop Workstation & PyInstaller Packaging
            </h2>
            <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              Native Desktop Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete local desktop application built in Python 3 with PySide6, SQLite persistence, and standalone PyInstaller `.exe` packaging.
          </p>
        </div>
      </div>

      {/* 3 Steps to Package Standalone Executable */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={`rounded-xl border p-4 shadow-sm space-y-2 ${cardBg}`}>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] dark:bg-blue-950">1</span>
            <span>Install Dependencies</span>
          </div>
          <p className={`text-xs ${textMuted}`}>
            Install verified packages listed in requirements.txt (PySide6, openpyxl, reportlab, python-docx):
          </p>
          <div className="rounded bg-slate-950 p-2 font-mono text-[11px] text-teal-400">
            pip install -r requirements.txt
          </div>
        </div>

        <div className={`rounded-xl border p-4 shadow-sm space-y-2 ${cardBg}`}>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] dark:bg-blue-950">2</span>
            <span>Run Test Suite</span>
          </div>
          <p className={`text-xs ${textMuted}`}>
            Verify all 13 unit tests covering tax calculations, TDS section 206AA penal rates, and Excel/PDF generation:
          </p>
          <div className="rounded bg-slate-950 p-2 font-mono text-[11px] text-teal-400">
            python -m unittest discover tests
          </div>
        </div>

        <div className={`rounded-xl border p-4 shadow-sm space-y-2 ${cardBg}`}>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] dark:bg-blue-950">3</span>
            <span>Build Windows .exe</span>
          </div>
          <p className={`text-xs ${textMuted}`}>
            Compile into a single standalone desktop executable with bundled SQLite assets using PyInstaller:
          </p>
          <div className="rounded bg-slate-950 p-2 font-mono text-[11px] text-teal-400">
            pyinstaller tax_analyzer.spec
          </div>
        </div>
      </div>

      {/* Terminal Output Simulation */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
            <span className="ml-2 font-bold text-slate-300">Terminal - Python Desktop Environment</span>
          </div>
          <span className="text-teal-400">Environment: Python 3.10+ | PySide6 6.6+</span>
        </div>

        <div className="space-y-1.5 text-[11px] leading-relaxed">
          <p className="text-slate-400">$ python desktop_app/main.py</p>
          <p className="text-teal-300">[TaxSetu] Initializing local direct tax database at ~/.tax_analyzer/app_data.db</p>
          <p className="text-teal-300">[TaxSetu] Schema verified: 14 comparison provisions, 16 tax slabs, 8 TDS section masters active.</p>
          <p className="text-emerald-400">[TaxSetu] PySide6 GUI window loaded successfully (High DPI scale factor 1.0).</p>
          <p className="text-slate-400 mt-2">$ pyinstaller tax_analyzer.spec</p>
          <p className="text-slate-400">5420 INFO: Building EXE from EXE-00.toc</p>
          <p className="text-slate-400">5425 INFO: Appending PKG archive to EXE</p>
          <p className="text-emerald-400 font-bold">5890 INFO: Building EXE finished: dist/Indian_Income_Tax_Workstation.exe (48.2 MB)</p>
          <p className="text-emerald-400">✓ Standalone Windows Desktop Executable built successfully with zero cloud dependencies.</p>
        </div>
      </div>

      {/* Code Inspector Tabs */}
      <div className={`rounded-xl border shadow-sm p-5 space-y-4 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-blue-600" />
            <h3 className={`text-sm font-bold ${textTitle}`}>Python Code Inspector</h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveCodeFile('main')}
              className={`rounded px-3 py-1 text-xs font-semibold ${
                activeCodeFile === 'main'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              desktop_app/main.py
            </button>
            <button
              onClick={() => setActiveCodeFile('spec')}
              className={`rounded px-3 py-1 text-xs font-semibold ${
                activeCodeFile === 'spec'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              tax_analyzer.spec
            </button>
            <button
              onClick={() => setActiveCodeFile('tests')}
              className={`rounded px-3 py-1 text-xs font-semibold ${
                activeCodeFile === 'tests'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Unit Tests Output
            </button>
            <button
              onClick={() => setActiveCodeFile('schema')}
              className={`rounded px-3 py-1 text-xs font-semibold ${
                activeCodeFile === 'schema'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              schema.sql
            </button>
          </div>
        </div>

        {/* Code Box */}
        <div className="relative rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
          <button
            onClick={() => copySnippet(fileSnippets[activeCodeFile])}
            className="absolute top-3 right-3 flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <pre>{fileSnippets[activeCodeFile]}</pre>
        </div>
      </div>
    </div>
  );
};
