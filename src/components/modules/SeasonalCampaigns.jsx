import { useState } from 'react'
import { CalendarRange, Copy, Check, CheckCircle } from 'lucide-react'

const CAMPAIGNS = [
  {
    id: 'spring',
    season: 'Spring',
    months: 'Mar – May',
    color: 'green',
    tagline: "Denver snow melts fast. What's hiding underneath?",
    rationale: 'Spring snowmelt drives basement intrusion, crawlspace saturation, and hidden mold under flooring. Peak season for post-winter moisture discovery.',
    tactics: [
      { type: 'Instagram Post', content: `Spring in Denver means snowmelt — and unfortunately, sometimes that means water where it doesn't belong.\n\nBasements, crawlspaces, and under flooring are the most common places we find hidden mold and moisture after a heavy Colorado winter. The scary part? Most homeowners don't notice until there's a smell, a stain, or a health symptom.\n\nIf your home had any water intrusion this past winter — even a little — it's worth a free assessment. Mold can establish in as little as 24-48 hours in wet conditions.\n\n📍 Serving Denver + surrounding metro\n🧪 IICRC-certified remediation + ERMI clearance testing\n\n#moldinspection #denverco #springhomemaintenance #moldremediation #indoorairquality #denverrealestate #purepro #waterdamage #crawlspacemold #homehealth` },
      { type: 'Referral Outreach (Plumbers)', content: `Hi [Name], spring snowmelt season is here and we both know what that means — water calls. If any of your clients are dealing with wet basements, crawlspace saturation, or musty odors after the winter, we'd love to be your referral for the remediation side of things.\n\nWe're quick to mobilize and always document thoroughly, which makes your clients feel taken care of.\n\nWorth passing our name along?\n— Wade, PurePro Restoration` },
      { type: 'Client Re-Engagement', content: `Hi [Name], hope you had a great winter! Reaching out to check in as we head into spring — snowmelt season is one of the most common times we see moisture issues resurface, especially in basements and crawlspaces.\n\nIf anything looked off after this winter, or if you want a quick moisture check before the warm months, just reply and we'll get it scheduled.\n— Wade, PurePro Restoration` },
    ],
  },
  {
    id: 'summer',
    season: 'Summer',
    months: 'Jun – Aug',
    color: 'yellow',
    tagline: 'Denver summers bring monsoon rains and AC condensation.',
    rationale: 'Colorado monsoon season (July–August) drives moisture intrusion. HVAC condensation and high humidity create crawlspace and attic mold. Real estate season means pre-sale inspections.',
    tactics: [
      { type: 'Instagram Post', content: `Denver's monsoon season is underway — and while afternoon storms are beautiful, they can quietly send water into places you'd never expect.\n\nWe've been seeing a lot of crawlspace and basement moisture calls this month, most of them traced back to the same culprit: water finding a path after repeated heavy rains.\n\nIf you've noticed any of these after a storm:\n• Musty smell in your basement or lower level\n• Visible moisture on your foundation walls\n• Condensation on basement windows\n\n…it's worth getting eyes on it before summer turns into fall and the problem gets worse.\n\n#moldremediation #denverco #monsoonseason #coloradosummer #basementmold #moisturedamage #denverrestoration #purepro #waterdamage #homeowners` },
      { type: 'Referral Outreach (Real Estate)', content: `Hi [Name], hope your summer selling season is going well! I wanted to stay on your radar — we've been getting a lot of calls for pre-sale mold inspections and clearance letters in the Denver metro this summer, and we can typically turn them around in 48-72 hours.\n\nIf any of your listings have had moisture history or any buyers are raising mold concerns during inspection, we're the team to call.\n— Wade, PurePro Restoration` },
      { type: 'HVAC / AC Campaign', content: `Hi [Name], summer in Denver is gorgeous — but air conditioning and humidity can combine to create moisture problems in attics and crawlspaces that most homeowners don't catch until there's an odor.\n\nIf any of your HVAC clients mention musty smells or poor air quality, we'd love to be the referral for the indoor air quality piece. IICRC-certified, full remediation + clearance testing.\n— Wade, PurePro Restoration` },
    ],
  },
  {
    id: 'fall',
    season: 'Fall',
    months: 'Sep – Nov',
    color: 'orange',
    tagline: 'Pre-winter inspection season. Before the freeze, find the moisture.',
    rationale: 'Homeowners prepare for winter. Pre-purchase inspections surge. Mold discovered before heating season matters — heating a damp home accelerates mold growth. Insurance claims from summer storms often resolve now.',
    tactics: [
      { type: 'Instagram Post', content: `Before Denver freezes over — now is the time to check for moisture.\n\nHere's why fall matters for mold:\n🏠 Heating season starts soon. A warm, damp basement is a mold growth accelerator.\n🏡 Real estate activity picks up before the holidays — buyers are doing inspections.\n🌧 Summer storms often leave moisture in walls, under floors, and in crawlspaces that isn't obvious until it gets warm inside.\n\nFall is your last window for a pre-winter assessment at a comfortable pace. Once the cold hits, emergency calls spike.\n\nBook a free moisture check before the season changes.\n\n#moldprevention #denverco #fallindenver #homehealth #moldremediation #winterready #purepro #moisturedamage #indoorairquality #denverrealestate` },
      { type: 'Pre-Winter Client Campaign', content: `Hi [Name], hope you're enjoying fall! We're heading into heating season and I wanted to pass along a quick reminder — if you've had any moisture concerns this year (even minor ones), now is the best time to address them before you're running heat regularly.\n\nHeating a home with existing moisture issues can accelerate mold growth significantly. A quick check now is much cheaper than emergency remediation in January.\n\nHappy to schedule a free assessment if you want peace of mind heading into winter.\n— Wade, PurePro Restoration` },
      { type: 'Referral Outreach (Property Managers)', content: `Hi [Name], as we head into winter I wanted to reach out — we work with a lot of property managers in the Denver area on moisture and mold issues before they escalate into tenant complaints or habitability concerns.\n\nFall is a great time to do preventive walk-throughs on your portfolio, especially any units with moisture history. Happy to provide a preferred vendor rate for volume.\n— Wade, PurePro Restoration` },
    ],
  },
  {
    id: 'winter',
    season: 'Winter',
    months: 'Dec – Feb',
    color: 'blue',
    tagline: "Frozen pipes, ice dams, and trapped moisture. Denver's hidden winter risk.",
    rationale: 'Frozen pipe bursts, ice dam water intrusion, and poor ventilation in sealed homes create emergency moisture situations. Highest urgency leads of the year. CIRS/mold-sensitive clients are most symptomatic.',
    tactics: [
      { type: 'Instagram Post', content: `Colorado winters are beautiful — but they're responsible for some of the most damaging moisture events we see all year.\n\nFrozen pipes burst. Ice dams force water under shingles. Homes sealed for winter trap humidity that settles into walls and crawlspaces.\n\nIf you've had a pipe burst, noticed ice buildup on your roof, or are dealing with a musty smell you can't explain — don't wait until spring to get it looked at. Mold doesn't pause for the holidays.\n\nWe're available year-round, same-day response for emergency water damage.\n\n#frozenpipes #coloradowinter #moldremediation #denverco #waterdamage #purepro #winterhomecare #icedams #emergencyrestoration #indoorairquality` },
      { type: 'Emergency Response Campaign', content: `Hi [Name], winter is officially here and with it comes the season's biggest moisture risks — frozen pipe bursts, ice dam intrusion, and trapped humidity in sealed homes.\n\nIf you ever have an emergency water situation and need a quick mobilization for moisture mitigation and mold assessment, we respond same-day in the Denver metro. Happy to be your first call.\n— Wade, PurePro Restoration` },
      { type: 'CIRS Doctor Outreach (Winter)', content: `Hi Dr. [Name], winter tends to be the most symptomatic season for CIRS patients — sealed homes, increased time indoors, and heating systems recirculating air through spaces that may have mold issues.\n\nIf any of your patients are struggling more this season and their home environment hasn't been evaluated, we're here as a resource. We're familiar with ERMI/HERTSMI protocols and take a thorough documentation approach that supports the clinical process.\n— Wade, PurePro Restoration` },
    ],
  },
]

const SEASON_COLORS = {
  green: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800', header: 'text-green-800', tab: 'bg-green-600' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', header: 'text-yellow-800', tab: 'bg-yellow-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', header: 'text-orange-800', tab: 'bg-orange-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800', header: 'text-blue-800', tab: 'bg-blue-600' },
}

function TacticCard({ tactic, colors }) {
  const [copied, setCopied] = useState(false)
  const [marked, setMarked] = useState(false)

  const copy = async () => {
    try { await navigator.clipboard.writeText(tactic.content) } catch {
      const el = document.createElement('textarea'); el.value = tactic.content
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className={`border rounded-2xl overflow-hidden ${colors.border} bg-white`}>
      <div className={`flex items-center justify-between px-5 py-3 ${colors.bg} border-b ${colors.border}`}>
        <span className={`text-xs font-bold uppercase tracking-wide ${colors.header}`}>{tactic.type}</span>
        {marked && <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-0.5"><CheckCircle size={10} /> Sent</span>}
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">{tactic.content}</p>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={copy}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
              ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Approve & Copy</>}
          </button>
          <button onClick={() => setMarked(true)}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <CheckCircle size={12} /> Mark as Sent (this session)
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SeasonalCampaigns() {
  const [activeSeason, setActiveSeason] = useState('spring')
  const campaign = CAMPAIGNS.find(c => c.id === activeSeason)
  const colors = SEASON_COLORS[campaign.color]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-3 md:p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarRange size={18} className="text-red-500" /> Seasonal Campaigns
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Denver CO-specific outreach campaigns for each season. All content follows the manual 5-step send flow.</p>
        </div>

        {/* Season tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CAMPAIGNS.map(c => {
            const col = SEASON_COLORS[c.color]
            return (
              <button key={c.id} onClick={() => setActiveSeason(c.id)}
                className={`rounded-xl py-2.5 px-3 text-center transition-all border ${activeSeason === c.id
                  ? `${col.bg} ${col.border} ring-1 ring-offset-0 ${col.border}`
                  : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                <div className="text-sm font-bold text-gray-900">{c.season}</div>
                <div className="text-[10px] text-gray-500">{c.months}</div>
              </button>
            )
          })}
        </div>

        {/* Campaign header */}
        <div className={`${colors.bg} border ${colors.border} rounded-2xl p-5`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className={`font-bold text-base ${colors.header}`}>{campaign.season} Campaign</div>
              <div className="text-sm text-gray-700 font-medium mt-0.5 italic">"{campaign.tagline}"</div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>{campaign.months}</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{campaign.rationale}</p>
        </div>

        {/* Tactics */}
        <div className="space-y-4">
          {campaign.tactics.map((t, i) => (
            <TacticCard key={i} tactic={t} colors={colors} />
          ))}
        </div>
      </div>
    </div>
  )
}
