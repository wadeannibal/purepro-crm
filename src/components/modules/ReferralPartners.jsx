import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { PARTNER_TYPES, formatCurrency, formatDate } from '../../utils/helpers'
import { Plus, Phone, Mail, Star, Clock, TrendingUp, Users, ChevronLeft, ChevronRight, X, Edit2, Trash2, MessageSquare, UserCheck, AlertCircle, AlertTriangle, CheckCircle2, Globe, MapPin } from 'lucide-react'

const BLANK_PARTNER = { name: '', company: '', phone: '', email: '', website: '', address: '', partnerType: 'Plumber', temperature: 'cold', notes: '', priority: 3 }

const PRIORITY_COLORS = ['', 'bg-green-500', 'bg-lime-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-500']
const PRIORITY_LABELS = ['', 'P1 – Top', 'P2 – High', 'P3 – Mid', 'P4 – Low', 'P5 – Lowest']
const BLANK_CONTACT = { method: 'Call', summary: '' }
const BLANK_DEAL = { agreementType: 'Mutual Referral', referralFee: '', feeType: 'percent', startDate: (d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)(new Date()), termsNotes: '', jobsSent: 0, jobsReceived: 0 }

const TEMP_COLORS = {
  cold: 'bg-blue-100 text-blue-700',
  warm: 'bg-yellow-100 text-yellow-800',
  hot: 'bg-red-100 text-red-700',
}

const TEMP_LABEL = { cold: '❄ Cold', warm: '☀ Warm', hot: '🔥 Hot' }

const WON_STAGES = new Set(['Invoiced', 'Closed'])
const PIPELINE_STAGES = new Set(['Approved', 'Remediation', 'Post-Test'])
const canonicalRev = (j) => j.estimate?.grandTotal ?? j.revenue ?? 0

const CONTACT_METHODS = ['Call', 'Text', 'Email', 'In Person', 'LinkedIn', 'Other']
const AGREEMENT_TYPES = ['Mutual Referral', 'Referral Fee', 'Preferred Vendor']

function daysSince(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso)) / 86400000)
}

function PartnerCard({ partner, jobs, onClick, isOverdue }) {
  const linked = jobs.filter(j => j.leadSourcePartnerId === partner.id)
  const wonRevenue = linked.filter(j => WON_STAGES.has(j.stage)).reduce((s, j) => s + canonicalRev(j), 0)
  const pipeRevenue = linked.filter(j => PIPELINE_STAGES.has(j.stage)).reduce((s, j) => s + canonicalRev(j), 0)
  const days = daysSince(partner.lastContactDate)
  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${isOverdue ? 'border-orange-300 hover:border-orange-400' : 'border-gray-200 hover:border-red-300'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">{partner.name}</div>
          <div className="text-xs text-gray-500 truncate">{partner.company}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            {partner.priority && (
              <span className={`text-[10px] font-black text-white px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[partner.priority]}`}>
                P{partner.priority}
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TEMP_COLORS[partner.temperature]}`}>
              {TEMP_LABEL[partner.temperature]}
            </span>
          </div>
          {isOverdue && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-0.5">
              <AlertCircle size={9} /> Overdue
            </span>
          )}
        </div>
      </div>
      <div className="text-[11px] font-semibold text-purple-700 bg-purple-50 inline-block px-2 py-0.5 rounded-full mb-3">
        {partner.partnerType}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="font-bold text-gray-900">{linked.length}</div>
          <div className="text-gray-400">Jobs</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-green-700">{wonRevenue > 0 ? formatCurrency(wonRevenue) : '—'}</div>
          <div className="text-gray-400">Won</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-blue-600">{pipeRevenue > 0 ? formatCurrency(pipeRevenue) : '—'}</div>
          <div className="text-gray-400">Pipeline</div>
        </div>
      </div>
      {/* Last contacted strip */}
      <div className={`mt-3 pt-2.5 border-t flex items-center gap-1.5 ${
        days === null ? 'border-gray-100' :
        days === 0 ? 'border-green-100' :
        days <= 7 ? 'border-green-100' :
        days <= 30 ? 'border-yellow-100' : 'border-orange-200'
      }`}>
        <Clock size={10} className={
          days === null ? 'text-gray-300' :
          days <= 7 ? 'text-green-500' :
          days <= 30 ? 'text-yellow-600' : 'text-orange-500'
        } />
        <span className={`text-[11px] font-medium ${
          days === null ? 'text-gray-400' :
          days <= 7 ? 'text-green-600' :
          days <= 30 ? 'text-yellow-700' : 'text-orange-600 font-semibold'
        }`}>
          {days === null ? 'Never contacted' :
           days === 0 ? 'Contacted today' :
           days === 1 ? `Yesterday · ${formatDate(partner.lastContactDate)}` :
           `${days}d ago · ${formatDate(partner.lastContactDate)}`}
        </span>
      </div>
    </div>
  )
}

function PartnerDetail({ partner, jobs, onClose, onEdit, onDelete, dispatch }) {
  const [tab, setTab] = useState('history')
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState(BLANK_CONTACT)
  const [showDealForm, setShowDealForm] = useState(false)
  const [dealForm, setDealForm] = useState(BLANK_DEAL)
  const [editingDeal, setEditingDeal] = useState(null)

  const jobsReferred = jobs.filter(j => j.leadSourcePartnerId === partner.id)
  const wonRevenue = jobsReferred.filter(j => WON_STAGES.has(j.stage)).reduce((s, j) => s + canonicalRev(j), 0)
  const pipeRevenue = jobsReferred.filter(j => PIPELINE_STAGES.has(j.stage)).reduce((s, j) => s + canonicalRev(j), 0)
  const days = daysSince(partner.lastContactDate)

  const saveContact = () => {
    if (!contactForm.summary) return
    dispatch({ type: ACTIONS.ADD_PARTNER_CONTACT, payload: { partnerId: partner.id, contact: contactForm } })
    setContactForm(BLANK_CONTACT)
    setShowContactForm(false)
  }

  const saveDeal = () => {
    if (!dealForm.agreementType) return
    if (editingDeal) {
      dispatch({ type: ACTIONS.UPDATE_PARTNER_DEAL, payload: { partnerId: partner.id, deal: { ...dealForm, id: editingDeal } } })
      setEditingDeal(null)
    } else {
      dispatch({ type: ACTIONS.ADD_PARTNER_DEAL, payload: { partnerId: partner.id, deal: dealForm } })
    }
    setDealForm(BLANK_DEAL)
    setShowDealForm(false)
  }

  return (
    <div className="bg-white border-l border-gray-200 w-full md:w-96 flex-shrink-0 flex flex-col h-full">
      <div className="md:hidden flex items-center gap-2 px-5 py-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-1 text-red-600 font-semibold text-sm">
          <ChevronLeft size={16} /> Back
        </button>
      </div>
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900">{partner.name}</div>
          <div className="text-xs text-gray-500">{partner.company}</div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {partner.priority && (
              <span className={`text-[10px] font-black text-white px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[partner.priority]}`}>
                {PRIORITY_LABELS[partner.priority]}
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TEMP_COLORS[partner.temperature]}`}>
              {TEMP_LABEL[partner.temperature]}
            </span>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{partner.partnerType}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X size={14} /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
        <div className="text-center py-3 px-2 border-r border-gray-100">
          <div className="text-lg font-bold text-gray-900">{jobsReferred.length}</div>
          <div className="text-[10px] text-gray-400">Jobs Linked</div>
        </div>
        <div className="text-center py-3 px-2">
          <div className="text-lg font-bold text-green-700">{wonRevenue > 0 ? formatCurrency(wonRevenue) : '—'}</div>
          <div className="text-[10px] text-gray-400">Won Revenue</div>
        </div>
        <div className="text-center py-2 px-2 border-t border-r border-gray-100">
          <div className="text-base font-bold text-blue-600">{pipeRevenue > 0 ? formatCurrency(pipeRevenue) : '—'}</div>
          <div className="text-[10px] text-gray-400">Pipeline</div>
        </div>
        <div className="text-center py-2 px-2 border-t border-gray-100">
          <div className={`text-base font-bold ${days !== null && days > 30 ? 'text-orange-600' : 'text-gray-900'}`}>
            {days !== null ? `${days}d` : '—'}
          </div>
          <div className="text-[10px] text-gray-400">Since Contact</div>
        </div>
      </div>

      {/* Contact info */}
      <div className="px-5 py-3 border-b border-gray-100 space-y-1.5">
        {partner.phone && <div className="flex items-center gap-2 text-xs text-gray-600"><Phone size={12} />{partner.phone}</div>}
        {partner.email && <div className="flex items-center gap-2 text-xs text-gray-600"><Mail size={12} />{partner.email}</div>}
        {partner.website && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Globe size={12} />
            <a href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" onClick={e => e.stopPropagation()}>
              {partner.website}
            </a>
          </div>
        )}
        {partner.address && <div className="flex items-center gap-2 text-xs text-gray-600"><MapPin size={12} className="flex-shrink-0" /><span>{partner.address}</span></div>}
        {partner.notes && <p className="text-xs text-gray-500 mt-2 italic">{partner.notes}</p>}
      </div>

      {/* Quick contact log */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold text-gray-400 uppercase mr-0.5">Quick log:</span>
        {['Call', 'Text', 'Email', 'In Person'].map(method => (
          <button key={method}
            onClick={() => dispatch({ type: ACTIONS.ADD_PARTNER_CONTACT, payload: { partnerId: partner.id, contact: { method, summary: `Touched base — ${method}` } } })}
            className="text-[10px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors flex items-center gap-1">
            <CheckCircle2 size={9} />
            {method}
          </button>
        ))}
        {days !== null && (
          <span className={`ml-auto text-[10px] font-semibold ${days <= 7 ? 'text-green-600' : days <= 30 ? 'text-yellow-600' : 'text-orange-600'}`}>
            {days === 0 ? 'Contacted today' : days === 1 ? '1 day ago' : `${days} days ago`}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {['history', 'deals', 'jobs'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-2 transition-colors capitalize ${tab === t ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}>
            {t === 'history' ? 'Contact History' : t === 'deals' ? 'Deals' : 'Referred Jobs'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'history' && (
          <div className="p-4 space-y-3">
            <button onClick={() => setShowContactForm(s => !s)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition-colors">
              <Plus size={12} /> Log Contact
            </button>
            {showContactForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                <select value={contactForm.method} onChange={e => setContactForm(f => ({ ...f, method: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500">
                  {CONTACT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
                <textarea value={contactForm.summary} onChange={e => setContactForm(f => ({ ...f, summary: e.target.value }))}
                  placeholder="What was discussed?" rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-500" />
                <div className="flex gap-2">
                  <button onClick={saveContact} className="flex-1 bg-red-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-red-700 transition-colors">Save</button>
                  <button onClick={() => setShowContactForm(false)} className="flex-1 bg-white border border-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            )}
            {[...(partner.contactHistory ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date)).map(c => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{c.method}</span>
                  <span className="text-[10px] text-gray-400">{formatDate(c.date)}</span>
                </div>
                <p className="text-xs text-gray-700">{c.summary}</p>
              </div>
            ))}
            {(partner.contactHistory ?? []).length === 0 && !showContactForm && (
              <p className="text-xs text-gray-400 text-center py-4">No contact history yet</p>
            )}
          </div>
        )}

        {tab === 'deals' && (
          <div className="p-4 space-y-3">
            <button onClick={() => { setShowDealForm(s => !s); setEditingDeal(null); setDealForm(BLANK_DEAL) }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition-colors">
              <Plus size={12} /> Add Deal
            </button>
            {showDealForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Agreement Type</label>
                  <select value={dealForm.agreementType} onChange={e => setDealForm(f => ({ ...f, agreementType: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500">
                    {AGREEMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {dealForm.agreementType === 'Referral Fee' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Fee</label>
                      <input type="number" step="0.01" value={dealForm.referralFee} onChange={e => setDealForm(f => ({ ...f, referralFee: e.target.value }))}
                        placeholder="e.g. 10" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Type</label>
                      <select value={dealForm.feeType} onChange={e => setDealForm(f => ({ ...f, feeType: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="percent">% of job</option>
                        <option value="flat">Flat $</option>
                      </select>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Start Date</label>
                  <input type="date" value={dealForm.startDate} onChange={e => setDealForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Terms Notes</label>
                  <textarea value={dealForm.termsNotes} onChange={e => setDealForm(f => ({ ...f, termsNotes: e.target.value }))}
                    rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Jobs Sent</label>
                    <input type="number" value={dealForm.jobsSent} onChange={e => setDealForm(f => ({ ...f, jobsSent: Number(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Jobs Received</label>
                    <input type="number" value={dealForm.jobsReceived} onChange={e => setDealForm(f => ({ ...f, jobsReceived: Number(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveDeal} className="flex-1 bg-red-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-red-700 transition-colors">
                    {editingDeal ? 'Update' : 'Save'} Deal
                  </button>
                  <button onClick={() => { setShowDealForm(false); setEditingDeal(null) }}
                    className="flex-1 bg-white border border-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            )}
            {(partner.deals ?? []).map(d => (
              <div key={d.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{d.agreementType}</div>
                    {d.referralFee && <div className="text-[10px] text-gray-500">
                      Fee: {d.feeType === 'percent' ? `${d.referralFee}%` : `$${d.referralFee}`}
                    </div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {d.status}
                    </span>
                    <button onClick={() => {
                      setDealForm({ ...BLANK_DEAL, ...d })
                      setEditingDeal(d.id)
                      setShowDealForm(true)
                    }} className="p-0.5 text-gray-400 hover:text-gray-700"><Edit2 size={11} /></button>
                    <button onClick={() => { if (!window.confirm('Delete this deal?')) return; dispatch({ type: ACTIONS.DELETE_PARTNER_DEAL, payload: { partnerId: partner.id, dealId: d.id } }) }}
                      className="p-0.5 text-gray-400 hover:text-red-600"><Trash2 size={11} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                  <div>Started: {d.startDate || '—'}</div>
                  <div>Sent: {d.jobsSent} / Received: {d.jobsReceived}</div>
                </div>
                {d.termsNotes && <p className="text-[10px] text-gray-500 mt-1 italic">{d.termsNotes}</p>}
              </div>
            ))}
            {(partner.deals ?? []).length === 0 && !showDealForm && (
              <p className="text-xs text-gray-400 text-center py-4">No deals logged</p>
            )}
          </div>
        )}

        {tab === 'jobs' && (
          <div className="p-4 space-y-2">
            {jobsReferred.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No jobs attributed to this partner yet</p>}
            {jobsReferred.map(j => {
              const rev = canonicalRev(j)
              const isWon = WON_STAGES.has(j.stage)
              const isPipe = PIPELINE_STAGES.has(j.stage)
              const isLost = j.stage === 'Lost'
              return (
                <div key={j.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-xs font-semibold text-gray-900 truncate">{j.type} – {j.stage}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isWon && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Won</span>}
                      {isPipe && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Pipeline</span>}
                      {isLost && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Lost</span>}
                      {!isWon && !isPipe && !isLost && <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Lead</span>}
                      <span className={`font-semibold text-xs ${isWon ? 'text-green-700' : isPipe ? 'text-blue-600' : 'text-gray-400'}`}>{rev > 0 ? formatCurrency(rev) : '—'}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500">{j.address}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(j.createdAt)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReferralPartners({ navigateTo }) {
  const { state, dispatch } = useApp()
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(BLANK_PARTNER)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [sortBy, setSortBy] = useState('revenue')

  const partners = state.partners ?? []
  const jobs = state.jobs ?? []

  const enriched = useMemo(() => partners.map(p => {
    const linked = jobs.filter(j => j.leadSourcePartnerId === p.id)
    const wonRevenue = linked.filter(j => WON_STAGES.has(j.stage)).reduce((s, j) => s + canonicalRev(j), 0)
    const pipeRevenue = linked.filter(j => PIPELINE_STAGES.has(j.stage)).reduce((s, j) => s + canonicalRev(j), 0)
    return {
      ...p,
      jobsReferred: linked.length,
      wonRevenue,
      pipeRevenue,
      revenue: wonRevenue,
      isOverdue: daysSince(p.lastContactDate) !== null && daysSince(p.lastContactDate) > 30,
    }
  }), [partners, jobs])

  const filtered = enriched
    .filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.company.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter !== 'All' && p.partnerType !== typeFilter) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return (a.priority ?? 3) - (b.priority ?? 3)
      if (sortBy === 'revenue') return b.revenue - a.revenue
      if (sortBy === 'contact') {
        const da = daysSince(a.lastContactDate) ?? Infinity
        const db = daysSince(b.lastContactDate) ?? Infinity
        return db - da
      }
      return b.jobsReferred - a.jobsReferred
    })

  const overdueCount = enriched.filter(p => p.isOverdue).length
  const totalRevenue = enriched.reduce((s, p) => s + p.revenue, 0)

  const openAdd = () => { setForm(BLANK_PARTNER); setEditingId(null); setShowModal(true) }
  const openEdit = (p) => { setForm({ ...p }); setEditingId(p.id); setShowModal(true) }

  const partnerDupes = useMemo(() => {
    if (!showModal) return []
    const normSite = s => (s ?? '').toLowerCase().trim().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/$/,'')
    const name    = (form.name ?? '').toLowerCase().trim()
    const company = (form.company ?? '').toLowerCase().trim()
    const phone   = (form.phone ?? '').replace(/\D/g, '')
    const email   = (form.email ?? '').toLowerCase().trim()
    const website = normSite(form.website)
    const address = (form.address ?? '').toLowerCase().trim()
    const results = []
    for (const p of partners) {
      if (p.id === editingId) continue
      const reasons = []
      const pName    = (p.name ?? '').toLowerCase().trim()
      const pCompany = (p.company ?? '').toLowerCase().trim()
      const pSite    = normSite(p.website)
      const pAddr    = (p.address ?? '').toLowerCase().trim()
      if (name.length >= 4 && (pName === name || pName.includes(name) || name.includes(pName))) reasons.push('name')
      if (company.length >= 4 && (pCompany === company || pCompany.includes(company) || company.includes(pCompany))) reasons.push('company')
      if (phone.length >= 7 && phone === (p.phone ?? '').replace(/\D/g, '')) reasons.push('phone')
      if (email.length >= 5 && email === (p.email ?? '').toLowerCase().trim()) reasons.push('email')
      if (website.length >= 5 && website === pSite) reasons.push('website')
      if (address.length >= 5 && (pAddr === address || pAddr.includes(address) || address.includes(pAddr))) reasons.push('address')
      if (reasons.length) results.push({ record: p, reasons })
    }
    return results
  }, [form.name, form.company, form.phone, form.email, form.website, form.address, partners, showModal, editingId])

  const save = () => {
    if (!form.name) return
    if (editingId) {
      dispatch({ type: ACTIONS.UPDATE_PARTNER, payload: { ...form, id: editingId } })
    } else {
      dispatch({ type: ACTIONS.ADD_PARTNER, payload: form })
    }
    setShowModal(false)
  }

  const deletePartner = (id) => {
    if (!window.confirm('Delete this partner?')) return
    dispatch({ type: ACTIONS.DELETE_PARTNER, payload: { id } })
    if (selected === id) setSelected(null)
  }

  const selectedPartner = selected ? partners.find(p => p.id === selected) : null

  return (
    <div className="h-full flex overflow-hidden">
      <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden`}>
        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-2 px-3 md:px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="text-sm"><span className="font-bold text-gray-900">{partners.length}</span> <span className="text-gray-500">partners</span></div>
          <div className="text-sm"><span className="font-bold text-green-700">{formatCurrency(totalRevenue)}</span> <span className="text-gray-500">won revenue</span></div>
          {enriched.reduce((s, p) => s + p.pipeRevenue, 0) > 0 && (
            <div className="text-sm"><span className="font-bold text-blue-600">{formatCurrency(enriched.reduce((s, p) => s + p.pipeRevenue, 0))}</span> <span className="text-gray-500">pipeline</span></div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-orange-600 font-semibold">
              <AlertCircle size={14} /> {overdueCount} overdue follow-up{overdueCount !== 1 ? 's' : ''}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partners…"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="All">All Types</option>
              {PARTNER_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="priority">Sort: Priority</option>
              <option value="revenue">Sort: Revenue</option>
              <option value="jobs">Sort: Jobs</option>
              <option value="contact">Sort: Last Contact</option>
            </select>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
              <Plus size={14} /> Add Partner
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-600">No referral partners yet</p>
              <p className="text-sm mt-1">Add plumbers, realtors, adjusters, and other referral sources</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => (
              <div key={p.id} className="relative">
                {i < 3 && (
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black z-10
                    ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : 'bg-amber-600 text-white'}`}>
                    {i + 1}
                  </div>
                )}
                <PartnerCard
                  partner={p}
                  jobs={jobs}
                  isOverdue={p.isOverdue}
                  onClick={() => setSelected(p.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedPartner && (
        <PartnerDetail
          partner={selectedPartner}
          jobs={jobs}
          dispatch={dispatch}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selectedPartner)}
          onDelete={() => deletePartner(selectedPartner.id)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{editingId ? 'Edit Partner' : 'New Referral Partner'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {[['Full Name', 'name'], ['Company / Practice', 'company'], ['Phone', 'phone', 'tel'], ['Email', 'email', 'email'], ['Website', 'website', 'url'], ['Address', 'address']].map(([label, key, type]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input type={type ?? 'text'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Partner Type</label>
                  <select value={form.partnerType} onChange={e => setForm(f => ({ ...f, partnerType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                    {PARTNER_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Temperature</label>
                  <select value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="cold">❄ Cold</option>
                    <option value="warm">☀ Warm</option>
                    <option value="hot">🔥 Hot</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Priority <span className="text-gray-400 font-normal">(1 = best, 5 = lowest)</span></label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: n }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${form.priority === n ? `${PRIORITY_COLORS[n]} text-white shadow-md scale-105` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-gray-400 mt-1 text-center">{PRIORITY_LABELS[form.priority ?? 3]}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>
              {partnerDupes.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-800">
                    <AlertTriangle size={12} /> Possible duplicate{partnerDupes.length > 1 ? 's' : ''} found
                  </div>
                  {partnerDupes.map(({ record, reasons }) => (
                    <div key={record.id} className="flex items-center justify-between">
                      <span className="text-xs font-medium text-yellow-900">{record.name}</span>
                      <span className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wide">{reasons.join(' · ')}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-yellow-500">You can still save — this is just a heads up.</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={save} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  {editingId ? 'Save Changes' : 'Add Partner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
