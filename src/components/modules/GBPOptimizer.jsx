import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { MapPin, CheckCircle, Circle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

const CHECKLIST = [
  { id: 'business_name', category: 'Core Listing', label: 'Business name matches exactly (PurePro Restoration)', impact: 'critical' },
  { id: 'phone', category: 'Core Listing', label: 'Phone number is correct and matches website', impact: 'critical' },
  { id: 'address', category: 'Core Listing', label: 'Address verified and matches website', impact: 'critical' },
  { id: 'website', category: 'Core Listing', label: 'Website URL added and working', impact: 'critical' },
  { id: 'hours', category: 'Core Listing', label: 'Business hours current and accurate', impact: 'critical' },
  { id: 'primary_category', category: 'Categories', label: 'Primary category: "Water Damage Restoration Service"', impact: 'high' },
  { id: 'secondary_mold', category: 'Categories', label: 'Secondary category: "Mold Remediation Service"', impact: 'high' },
  { id: 'secondary_fire', category: 'Categories', label: 'Secondary category: "Fire Damage Restoration Service" (if applicable)', impact: 'medium' },
  { id: 'description', category: 'Business Description', label: '750-character description written and published', impact: 'high' },
  { id: 'keywords_desc', category: 'Business Description', label: 'Description includes: mold remediation, water damage, IICRC, Denver, clearance testing', impact: 'high' },
  { id: 'services', category: 'Services', label: 'Services list added: Mold Inspection, Mold Remediation, Water Damage Mitigation, ERMI Testing, Crawlspace Remediation', impact: 'high' },
  { id: 'service_areas', category: 'Services', label: 'Service areas defined (Denver, Arvada, Lakewood, Aurora, etc.)', impact: 'medium' },
  { id: 'photos_exterior', category: 'Photos', label: '3+ exterior / van / logo photos uploaded', impact: 'medium' },
  { id: 'photos_work', category: 'Photos', label: '5+ before/after job photos (no client faces without consent)', impact: 'high' },
  { id: 'photos_team', category: 'Photos', label: 'Team photo or owner photo uploaded', impact: 'medium' },
  { id: 'photos_equipment', category: 'Photos', label: 'Equipment / setup photos uploaded', impact: 'low' },
  { id: 'review_count', category: 'Reviews', label: '10+ Google reviews', impact: 'critical' },
  { id: 'review_avg', category: 'Reviews', label: '4.5+ star average', impact: 'critical' },
  { id: 'review_responses', category: 'Reviews', label: 'Every review (positive and negative) has a response', impact: 'high' },
  { id: 'review_recent', category: 'Reviews', label: 'At least 1 review in the last 60 days', impact: 'high' },
  { id: 'posts_active', category: 'GBP Posts', label: 'Posted at least once in the last 30 days', impact: 'medium' },
  { id: 'posts_offers', category: 'GBP Posts', label: 'At least 1 offer or promotion post active', impact: 'low' },
  { id: 'qa_section', category: 'Q&A', label: 'Q&A section seeded with 5+ common questions and answers', impact: 'medium' },
  { id: 'messaging', category: 'Features', label: 'GBP messaging enabled (responds within 24 hrs)', impact: 'medium' },
  { id: 'booking', category: 'Features', label: 'Booking link or appointment URL added', impact: 'low' },
]

const IMPACT_COLORS = {
  critical: { badge: 'bg-red-100 text-red-700', label: 'Critical' },
  high: { badge: 'bg-orange-100 text-orange-700', label: 'High' },
  medium: { badge: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  low: { badge: 'bg-gray-100 text-gray-600', label: 'Low' },
}

const WEEKLY_PROMPTS = [
  "Post a brief before/after photo of a job completed this week with a 2-3 sentence description of what was found and how it was resolved.",
  "Respond to any Google reviews received this week using the AI Content Generator's Review Response tool.",
  "Check if any new questions have appeared in the Q&A section and answer them.",
  "Share a tip about mold prevention or water damage warning signs as a GBP post.",
  "Review your most recent 5 reviews — are there keywords clients use to describe your work? Add those to your business description.",
]

const MONTHLY_AUDIT = [
  "Verify all listing info is still accurate (phone, address, hours, website).",
  "Check photo count — are there at least 10 photos total? Add new job photos.",
  "Review star average — if below 4.5, focus on generating new reviews this month.",
  "Check if any competitors near you have more recent photos or posts — respond by updating yours.",
  "Confirm at least 2 GBP posts were published this month.",
  "Review services list — does it reflect all current service offerings?",
  "Ensure every review (positive and negative) has a response.",
  "Check Google Insights (in your GBP dashboard) for search query trends — are clients finding you with the keywords you expect?",
]

export default function GBPOptimizer() {
  const { state, dispatch } = useApp()
  const [expandedCategories, setExpandedCategories] = useState({})
  const [copiedPrompt, setCopiedPrompt] = useState(null)
  const [tab, setTab] = useState('checklist')

  const checklist = state.gbpChecklist ?? {}

  const toggleItem = (id) => {
    const current = checklist[id]?.checked ?? false
    dispatch({ type: ACTIONS.UPDATE_GBP_ITEM, payload: { item: id, checked: !current } })
  }

  const toggleCategory = (cat) => {
    setExpandedCategories(e => ({ ...e, [cat]: !e[cat] }))
  }

  const categories = [...new Set(CHECKLIST.map(i => i.category))]
  const totalItems = CHECKLIST.length
  const checkedItems = CHECKLIST.filter(i => checklist[i.id]?.checked).length
  const completionPct = Math.round((checkedItems / totalItems) * 100)
  const criticalUnchecked = CHECKLIST.filter(i => i.impact === 'critical' && !checklist[i.id]?.checked)

  const copyPrompt = async (text, idx) => {
    try { await navigator.clipboard.writeText(text) } catch {
      const el = document.createElement('textarea'); el.value = text
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopiedPrompt(idx)
    setTimeout(() => setCopiedPrompt(null), 2500)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={18} className="text-red-500" /> GBP Optimizer
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Google Business Profile completeness checklist, weekly prompts, and monthly audit.</p>
        </div>

        {/* Score bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-gray-900 text-lg">{completionPct}% Complete</div>
              <div className="text-xs text-gray-500">{checkedItems} of {totalItems} items checked</div>
            </div>
            <div className={`text-2xl font-black ${completionPct === 100 ? 'text-green-600' : completionPct >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
              {completionPct === 100 ? 'A+' : completionPct >= 75 ? 'B' : completionPct >= 50 ? 'C' : 'D'}
            </div>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
          {criticalUnchecked.length > 0 && (
            <div className="mt-3 text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2 font-medium">
              {criticalUnchecked.length} critical item{criticalUnchecked.length !== 1 ? 's' : ''} incomplete:
              {' '}{criticalUnchecked.map(i => i.label.split(' ').slice(0, 4).join(' ')).join(', ')}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 gap-4">
          {['checklist', 'weekly', 'monthly'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-2 text-sm font-semibold capitalize transition-colors ${tab === t ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}>
              {t === 'weekly' ? 'Weekly Prompts' : t === 'monthly' ? 'Monthly Audit' : 'Checklist'}
            </button>
          ))}
        </div>

        {tab === 'checklist' && (
          <div className="space-y-3">
            {categories.map(cat => {
              const items = CHECKLIST.filter(i => i.category === cat)
              const catChecked = items.filter(i => checklist[i.id]?.checked).length
              const open = expandedCategories[cat] !== false

              return (
                <div key={cat} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <button onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                        ${catChecked === items.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {catChecked}/{items.length}
                      </div>
                      <span className="font-semibold text-sm text-gray-900">{cat}</span>
                    </div>
                    {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </button>

                  {open && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {items.map(item => {
                        const checked = checklist[item.id]?.checked ?? false
                        const ic = IMPACT_COLORS[item.impact]
                        return (
                          <div key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className="flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="mt-0.5 flex-shrink-0">
                              {checked
                                ? <CheckCircle size={16} className="text-green-500" />
                                : <Circle size={16} className="text-gray-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.label}</p>
                              {checklist[item.id]?.checkedAt && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Done {new Date(checklist[item.id].checkedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              )}
                            </div>
                            <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ic.badge}`}>{ic.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'weekly' && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
              <strong>Weekly routine:</strong> Pick 2-3 of these each week to keep your GBP fresh. Google rewards activity — consistent posting improves ranking.
            </div>
            {WEEKLY_PROMPTS.map((prompt, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-gray-800 leading-relaxed flex-1">{prompt}</p>
                </div>
                <div className="flex justify-end mt-3">
                  <button onClick={() => copyPrompt(prompt, i)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                      ${copiedPrompt === i ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    {copiedPrompt === i ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy reminder</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'monthly' && (
          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-sm text-orange-800">
              <strong>Monthly audit:</strong> Set aside 30 minutes each month — ideally the first Monday — to run through all of these.
            </div>
            {MONTHLY_AUDIT.map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-sm text-gray-800 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
