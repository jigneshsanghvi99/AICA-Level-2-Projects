# -*- mode: python ; coding: utf-8 -*-
# PyInstaller build specification for TaxSetu Desktop Application
# Generates a standalone Windows .exe, macOS .app, or Linux binary.

import os
import sys

block_cipher = None

# Base path
base_dir = os.path.abspath(os.path.dirname(SPEC))

# Data files to bundle: SQLite schema and default configuration
datas = [
    (os.path.join(base_dir, 'desktop_app', 'database', 'schema.sql'), os.path.join('desktop_app', 'database')),
]

a = Analysis(
    [os.path.join(base_dir, 'desktop_app', 'main.py')],
    pathex=[base_dir],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'PySide6',
        'PySide6.QtCore',
        'PySide6.QtGui',
        'PySide6.QtWidgets',
        'openpyxl',
        'docx',
        'reportlab',
        'reportlab.lib',
        'reportlab.platypus',
        'matplotlib',
        'sqlite3',
        'decimal',
        'hashlib'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='TaxSetu_Desktop_Tax_Workstation',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Set to False for native windowed desktop app
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
