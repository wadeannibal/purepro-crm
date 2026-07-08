import { useState } from 'react'
import {
  Users, LayoutDashboard, FileText, Camera, Folder, MessageSquare,
  Wrench, Clock, Shield, ShieldCheck, Star, ChevronRight,
  Calculator, FileSignature, Receipt, BarChart2, TrendingUp,
  DollarSign, Percent, Briefcase, UserCheck, Wallet, PiggyBank, ChevronDown,
  CalendarDays, Droplets, Wind, Globe, PenLine, BellRing,
  SmilePlus, UserPlus, Award, RefreshCw,
  Network, ScrollText, HelpCircle, PieChart, Target,
  Zap, Sparkles, CalendarRange, Swords, MapPin,
  Home, TrendingDown, BadgeCheck, Package, BookOpen, GraduationCap, Settings2,
} from 'lucide-react'

const GROUPS = [
  {
    label: 'COMMAND',
    items: [
      { id: 'operations', label: 'Operations Dashboard', icon: Home },
      { id: 'marketing', label: 'Marketing Dashboard', icon: BarChart2 },
      { id: 'kpi', label: 'KPI Goal Tracker', icon: Target },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { id: 'pipeline', label: 'Job Pipeline', icon: LayoutDashboard },
      { id: 'crm', label: 'CRM / Clients', icon: Users },
      { id: 'jobs', label: 'Job Records', icon: FileText },
      { id: 'communications', label: 'Comm Log', icon: MessageSquare },
      { id: 'photos', label: 'Photos', icon: Camera },
      { id: 'documents', label: 'Documents', icon: Folder },
      { id: 'equipment', label: 'Equipment', icon: Wrench },
      { id: 'timer', label: 'Job Timer', icon: Clock },
      { id: 'waivers', label: 'Waivers', icon: Shield },
      { id: 'osha', label: 'OSHA', icon: ShieldCheck },
      { id: 'vip', label: 'VIP Clients', icon: Star },
    ],
  },
  {
    label: 'FINANCIAL',
    items: [
      { id: 'estimator', label: 'Estimator', icon: Calculator },
      { id: 'proposals', label: 'Proposals', icon: FileSignature },
      { id: 'invoicing', label: 'Invoicing', icon: Receipt },
      { id: 'jobcosting', label: 'Job Costing', icon: BarChart2 },
      { id: 'pl', label: 'P&L Snapshot', icon: TrendingUp },
      { id: 'cashflow', label: 'Cash Flow', icon: DollarSign },
      { id: 'overhead', label: 'Overhead Calc', icon: Percent },
      { id: 'tax', label: 'Tax Estimator', icon: PiggyBank },
      { id: 'expensesummary', label: 'Annual Summary', icon: TrendingDown },
    ],
  },
  {
    label: 'SCHEDULING',
    items: [
      { id: 'scheduler', label: 'Scheduler', icon: CalendarDays },
      { id: 'apptconfirm', label: 'Appt Confirmations', icon: BellRing },
    ],
  },
  {
    label: 'FIELD LOGS',
    items: [
      { id: 'moisture', label: 'Moisture Log', icon: Droplets },
      { id: 'drying', label: 'Drying Log', icon: Wind },
    ],
  },
  {
    label: 'JOB DETAILS',
    items: [
      { id: 'followup', label: 'Follow-Up Tracker', icon: Briefcase },
      { id: 'portal', label: 'Client Portal', icon: Globe },
      { id: 'esign', label: 'E-Signature', icon: PenLine },
      { id: 'insurance', label: 'Insurance & Claims', icon: UserCheck },
      { id: 'subs', label: 'Subcontractors', icon: Users },
      { id: 'expenses', label: 'Expenses', icon: Wallet },
    ],
  },
  {
    label: 'CLIENT SUCCESS',
    items: [
      { id: 'survey', label: 'Satisfaction Survey', icon: SmilePlus },
      { id: 'referral', label: 'Referral Ask', icon: UserPlus },
      { id: 'review', label: 'Google Review', icon: Star },
      { id: 'warranty', label: 'Warranty Tracking', icon: Award },
      { id: 'checkin', label: 'Annual Check-In', icon: RefreshCw },
    ],
  },
  {
    label: 'GROWTH',
    items: [
      { id: 'partners', label: 'Referral Partners', icon: Network },
      { id: 'scripts', label: 'Outreach Scripts', icon: ScrollText },
      { id: 'objections', label: 'Objection Handler', icon: HelpCircle },
      { id: 'leadsource', label: 'Lead Sources', icon: PieChart },
      { id: 'winloss', label: 'Win / Loss', icon: Target },
      { id: 'followupengine', label: 'Follow-Up Engine', icon: Zap },
      { id: 'aicontent', label: 'AI Content', icon: Sparkles },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { id: 'seasonal', label: 'Seasonal Campaigns', icon: CalendarRange },
      { id: 'competitors', label: 'Competitor Intel', icon: Swords },
      { id: 'gbp', label: 'GBP Optimizer', icon: MapPin },
    ],
  },
  {
    label: 'BUSINESS OPS',
    items: [
      { id: 'showcase', label: 'Before/After Showcase', icon: Camera },
      { id: 'certs', label: 'Certification Tracker', icon: BadgeCheck },
      { id: 'inventory', label: 'Inventory Tracker', icon: Package },
      { id: 'docs', label: 'Document Library', icon: BookOpen },
      { id: 'onboarding', label: 'Employee Onboarding', icon: GraduationCap },
      { id: 'settings', label: 'Settings', icon: Settings2 },
    ],
  },
]

export default function Sidebar({ currentView, navigateTo }) {
  const [collapsed, setCollapsed] = useState({})

  const toggle = (label) => setCollapsed(c => ({ ...c, [label]: !c[label] }))

  return (
    <aside className="w-56 flex-shrink-0 bg-gray-950 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <div className="leading-tight">
            <span className="text-red-500 font-black text-sm tracking-tight">PURE</span>
            <span className="text-white font-black text-sm tracking-tight">PRO</span>
            <div className="text-gray-500 text-[10px] font-medium tracking-wider uppercase leading-none">Restoration</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {GROUPS.map(({ label, items }) => (
          <div key={label}>
            <button
              onClick={() => toggle(label)}
              className="w-full flex items-center justify-between px-4 pt-4 pb-1.5 group"
            >
              <span className="text-[10px] font-bold text-gray-600 tracking-widest group-hover:text-gray-400 transition-colors">{label}</span>
              <ChevronDown size={11} className={`text-gray-700 transition-transform ${collapsed[label] ? '-rotate-90' : ''}`} />
            </button>
            {!collapsed[label] && items.map(({ id, label: itemLabel, icon: Icon }) => {
              const active = currentView === id
              return (
                <button
                  key={id}
                  onClick={() => navigateTo(id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-all relative group
                    ${active
                      ? 'text-white bg-gray-800'
                      : 'text-gray-400 hover:text-white hover:bg-gray-900'
                    }`}
                >
                  {active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500" />}
                  <Icon size={15} className={active ? 'text-red-400' : 'text-gray-600 group-hover:text-gray-300'} />
                  <span className="truncate text-[13px]">{itemLabel}</span>
                  {active && <ChevronRight size={11} className="ml-auto text-gray-500" />}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
        <div className="text-gray-600 text-[11px] font-medium">PurePro CRM — v5.0</div>
        <div className="text-gray-700 text-[10px]">Denver, CO</div>
      </div>
    </aside>
  )
}
