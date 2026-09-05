import React from 'react';
import {
  LayoutDashboard,
  Scale,
  Calculator,
  Receipt,
  Settings,
  FolderArchive,
  Terminal,
  Database,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';

export type NavTab = 'dashboard' | 'comparison' | 'advance_tax' | 'tds' | 'rule_master' | 'records' | 'python_hub';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentRole: 'user' | 'admin';
  onRequestAdmin: () => void;
  isDarkMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  onRequestAdmin,
  isDarkMode
}) => {
  const coreNavItems = [
    { id: 'dashboard' as NavTab, label: 'Overview & Analytics', icon: LayoutDashboard, badge: null },
    { id: 'comparison' as NavTab, label: 'Act Comparison (1961 vs 2025)', icon: Scale, badge: 'Key Feature' },
    { id: 'advance_tax' as NavTab, label: 'Advance Tax Calculator', icon: Calculator, badge: null },
    { id: 'tds' as NavTab, label: 'TDS Calculator & Thresholds', icon: Receipt, badge: null },
  ];

  const adminNavItems = [
    {
      id: 'rule_master' as NavTab,
      label: 'Tax Rule Master',
      icon: Settings,
      badge: currentRole === 'admin' ? 'Active' : 'Admin Only',
      adminOnly: true
    },
    { id: 'records' as NavTab, label: 'Saved Records & Backup', icon: FolderArchive, badge: null },
    { id: 'python_hub' as NavTab, label: 'Python Desktop & PyInstaller', icon: Terminal, badge: 'Desktop' },
  ];

  const handleItemClick = (item: { id: NavTab; adminOnly?: boolean }) => {
    if (item.adminOnly && currentRole !== 'admin') {
      onRequestAdmin();
      return;
    }
    setActiveTab(item.id);
  };

  return (
    <aside
      id="app-sidebar"
      className="w-64 flex-shrink-0 flex flex-col bg-[#0F172A] text-slate-300 border-r border-slate-800 transition-colors select-none"
    >
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-700 bg-[#1E293B]">
        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0">
          TX
        </div>
        <div className="overflow-hidden">
          <span className="text-base font-bold text-white tracking-tight block leading-tight truncate">
            TaxEngine Pro
          </span>
          <span className="text-[10px] text-teal-400 font-medium tracking-wide block uppercase">
            Income-tax Act 1961 / 2025
          </span>
        </div>
      </div>

      {/* Nav List with Geometric Balance Section Dividers and Right Border Highlights */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Core Engine Group */}
        <div className="px-6 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          Core Engine
        </div>

        <div className="space-y-0.5">
          {coreNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleItemClick(item)}
                className={`w-full px-6 py-3 flex items-center justify-between text-left cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500 font-medium'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span className="text-xs">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Administrative Group */}
        <div className="mt-6 px-6 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          Administrative &amp; Tools
        </div>

        <div className="space-y-0.5">
          {adminNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLocked = item.adminOnly && currentRole !== 'admin';

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleItemClick(item)}
                className={`w-full px-6 py-3 flex items-center justify-between text-left cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500 font-medium'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span className="text-xs">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isLocked
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : isActive
                        ? 'bg-teal-500/30 text-teal-300'
                        : 'bg-slate-800 text-teal-400'
                    }`}
                  >
                    {isLocked ? <Lock className="h-2 w-2 inline mr-0.5" /> : null}
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User / Identity Footer Card */}
      <div className="p-5 border-t border-slate-700 bg-[#0F172A] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {currentRole === 'admin' ? 'AD' : 'TX'}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">
              {currentRole === 'admin' ? 'Administrator' : 'Tax Practitioner'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              {currentRole === 'admin' ? 'ID: #ADMIN-4052' : 'ID: #PRACT-2025'}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-[#1E293B] p-2.5 text-[10px] space-y-1 text-slate-300 border border-slate-700/60">
          <div className="flex items-center justify-between text-teal-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3" /> Local SQLite
            </span>
            <span className="text-emerald-400">Offline</span>
          </div>
          <div className="text-[9px] text-slate-400">
            100% verified statutory rule engine
          </div>
        </div>
      </div>
    </aside>
  );
};
