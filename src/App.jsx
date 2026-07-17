import { useState, useEffect } from 'react'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Login from './components/auth/Login'
import { supabase } from './lib/supabase'
import { COMPANY_DEFAULTS } from './utils/companySettings'

// Phase 1
import CRM from './components/modules/CRM'
import JobPipeline from './components/modules/JobPipeline'
import JobRecords from './components/modules/JobRecords'
import PhotoAttachments from './components/modules/PhotoAttachments'
import DocumentStorage from './components/modules/DocumentStorage'
import CommunicationLog from './components/modules/CommunicationLog'
import EquipmentTracker from './components/modules/EquipmentTracker'
import JobTimer from './components/modules/JobTimer'
import LiabilityWaivers from './components/modules/LiabilityWaivers'
import OSHACompliance from './components/modules/OSHACompliance'
import VIPClients from './components/modules/VIPClients'

// Phase 2
import Estimator from './components/modules/Estimator'
import ProposalTemplates from './components/modules/ProposalTemplates'
import QuoteGenerator from './components/modules/QuoteGenerator'
import EstimateFollowUp from './components/modules/EstimateFollowUp'
import Invoicing from './components/modules/Invoicing'
import JobCosting from './components/modules/JobCosting'
import PLSnapshot from './components/modules/PLSnapshot'
import OverheadCalculator from './components/modules/OverheadCalculator'
import CashFlowForecast from './components/modules/CashFlowForecast'
import InsuranceClaims from './components/modules/InsuranceClaims'
import SubcontractorManagement from './components/modules/SubcontractorManagement'
import ExpenseTracker from './components/modules/ExpenseTracker'
import TaxEstimator from './components/modules/TaxEstimator'

import Settings from './components/modules/Settings'

// Phase 5
import OperationsDashboard from './components/modules/OperationsDashboard'
import MarketingDashboard from './components/modules/MarketingDashboard'
import KPIGoalTracker from './components/modules/KPIGoalTracker'
import BeforeAfterShowcase from './components/modules/BeforeAfterShowcase'
import CertificationTracker from './components/modules/CertificationTracker'
import InventoryTracker from './components/modules/InventoryTracker'
import DocumentLibrary from './components/modules/DocumentLibrary'
import EmployeeOnboarding from './components/modules/EmployeeOnboarding'
import ExpenseAnnualSummary from './components/modules/ExpenseAnnualSummary'

// Phase 4
import ReferralPartners from './components/modules/ReferralPartners'
import OutreachScripts from './components/modules/OutreachScripts'
import ObjectionHandler from './components/modules/ObjectionHandler'
import LeadSourceTracking from './components/modules/LeadSourceTracking'
import WinLossTracker from './components/modules/WinLossTracker'
import FollowUpEngine from './components/modules/FollowUpEngine'
import AIContentGenerator from './components/modules/AIContentGenerator'
import SeasonalCampaigns from './components/modules/SeasonalCampaigns'
import CompetitorIntel from './components/modules/CompetitorIntel'
import GBPOptimizer from './components/modules/GBPOptimizer'

// Phase 3
import Scheduler from './components/modules/Scheduler'
import MoistureLog from './components/modules/MoistureLog'
import DryingLog from './components/modules/DryingLog'
import ClientPortal from './components/modules/ClientPortal'
import ESignature from './components/modules/ESignature'
import AppointmentConfirmations from './components/modules/AppointmentConfirmations'
import SatisfactionSurvey from './components/modules/SatisfactionSurvey'
import ReferralAsk from './components/modules/ReferralAsk'
import GoogleReviewRequest from './components/modules/GoogleReviewRequest'
import WarrantyTracking from './components/modules/WarrantyTracking'
import AnnualCheckIn from './components/modules/AnnualCheckIn'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Fetch company settings from Supabase on login so every module has the right values immediately
  useEffect(() => {
    if (!session) return
    supabase.from('company_settings').select('*').eq('id', 'singleton').single().then(({ data }) => {
      if (!data) return
      const settings = {
        companyName: data.company_name ?? COMPANY_DEFAULTS.companyName,
        ownerName: data.owner_name ?? COMPANY_DEFAULTS.ownerName,
        phone: data.phone ?? '',
        email: data.email ?? '',
        city: data.city ?? COMPANY_DEFAULTS.city,
        licenseNumber: data.license_number ?? '',
        website: data.website ?? '',
        logo: data.logo ?? null,
      }
      localStorage.setItem('purepro_company_settings', JSON.stringify(settings))
      window.dispatchEvent(new Event('company-settings-updated'))
    })
  }, [session])

  const [currentView, setCurrentView] = useState('operations')
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [selectedClientId, setSelectedClientId] = useState(null)

  const navigateTo = (view, params = {}) => {
    if (params.jobId !== undefined) setSelectedJobId(params.jobId)
    if (params.clientId !== undefined) setSelectedClientId(params.clientId)
    setCurrentView(view)
  }

  const renderView = () => {
    switch (currentView) {
      // Phase 1
      case 'crm':
        return <CRM navigateTo={navigateTo} />
      case 'pipeline':
        return <JobPipeline navigateTo={navigateTo} />
      case 'jobs':
        return <JobRecords selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'photos':
        return <PhotoAttachments selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'documents':
        return <DocumentStorage selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'communications':
        return <CommunicationLog selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} />
      case 'equipment':
        return <EquipmentTracker />
      case 'timer':
        return <JobTimer selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'waivers':
        return <LiabilityWaivers selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'osha':
        return <OSHACompliance selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'vip':
        return <VIPClients navigateTo={navigateTo} />
      // Phase 2
      case 'estimator':
        return <Estimator selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'proposals':
        return <ProposalTemplates selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'quote':
        return <QuoteGenerator selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'followup':
        return <EstimateFollowUp navigateTo={navigateTo} />
      case 'invoicing':
        return <Invoicing selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'jobcosting':
        return <JobCosting selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'pl':
        return <PLSnapshot />
      case 'overhead':
        return <OverheadCalculator />
      case 'cashflow':
        return <CashFlowForecast navigateTo={navigateTo} />
      case 'insurance':
        return <InsuranceClaims selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'subs':
        return <SubcontractorManagement selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'expenses':
        return <ExpenseTracker selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'tax':
        return <TaxEstimator />
      // Phase 3
      case 'scheduler':
        return <Scheduler navigateTo={navigateTo} />
      case 'moisture':
        return <MoistureLog selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'drying':
        return <DryingLog selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'portal':
        return <ClientPortal selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'esign':
        return <ESignature selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'apptconfirm':
        return <AppointmentConfirmations navigateTo={navigateTo} />
      case 'survey':
        return <SatisfactionSurvey selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'referral':
        return <ReferralAsk selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'review':
        return <GoogleReviewRequest selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'warranty':
        return <WarrantyTracking selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} navigateTo={navigateTo} />
      case 'checkin':
        return <AnnualCheckIn />
      // Phase 5
      case 'operations':
        return <OperationsDashboard navigateTo={navigateTo} />
      case 'marketing':
        return <MarketingDashboard navigateTo={navigateTo} />
      case 'kpi':
        return <KPIGoalTracker />
      case 'showcase':
        return <BeforeAfterShowcase navigateTo={navigateTo} />
      case 'certs':
        return <CertificationTracker />
      case 'inventory':
        return <InventoryTracker />
      case 'docs':
        return <DocumentLibrary />
      case 'onboarding':
        return <EmployeeOnboarding navigateTo={navigateTo} />
      case 'expensesummary':
        return <ExpenseAnnualSummary navigateTo={navigateTo} />
      // Phase 4
      case 'partners':
        return <ReferralPartners navigateTo={navigateTo} />
      case 'scripts':
        return <OutreachScripts />
      case 'objections':
        return <ObjectionHandler />
      case 'leadsource':
        return <LeadSourceTracking navigateTo={navigateTo} />
      case 'winloss':
        return <WinLossTracker navigateTo={navigateTo} />
      case 'followupengine':
        return <FollowUpEngine navigateTo={navigateTo} />
      case 'aicontent':
        return <AIContentGenerator />
      case 'seasonal':
        return <SeasonalCampaigns />
      case 'competitors':
        return <CompetitorIntel />
      case 'gbp':
        return <GBPOptimizer />
      case 'settings':
        return <Settings />
      default:
        return <OperationsDashboard navigateTo={navigateTo} />
    }
  }

  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (session === undefined) return null
  if (!session) return <Login />

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <Sidebar currentView={currentView} navigateTo={navigateTo} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header currentView={currentView} selectedJobId={selectedJobId} navigateTo={navigateTo} onMenuClick={() => setSidebarOpen(o => !o)} />
          <main className="flex-1 overflow-hidden">
            {renderView()}
          </main>
        </div>
      </div>
    </AppProvider>
  )
}
