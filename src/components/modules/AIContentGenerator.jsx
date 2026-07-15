import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Sparkles, Copy, Check, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { getCompanySettings } from '../../utils/companySettings'

const MODEL = 'claude-sonnet-4-6'
const API_URL = 'https://api.anthropic.com/v1/messages'

function getTools() {
  const { companyName, ownerName, city } = getCompanySettings()
  return [
    {
      id: 'instagram',
      label: 'Instagram Post',
      description: 'Engaging post for a completed job or educational mold content',
      buildPrompt: (ctx) => `You are a social media copywriter for ${companyName}, a mold and water damage remediation company in ${city}. Write an engaging Instagram post (max 220 words).

Context: ${ctx || `Recent completed mold remediation job in ${city}`}

Requirements:
- Hook in first line (no hashtag opener)
- Conversational, confident tone — not salesy
- Educational or story-driven
- End with a soft CTA (DM us, link in bio, etc.)
- Include 6-8 relevant hashtags at the end
- Do NOT use emojis unless they fit naturally`,
    },
    {
      id: 'referral',
      label: 'Referral Outreach',
      description: 'Personalized outreach message to a potential referral partner',
      buildPrompt: (ctx) => `You are writing on behalf of ${ownerName} at ${companyName} in ${city} (mold & water damage remediation, IICRC-certified).

Write a short, personalized outreach message to a potential referral partner.

Context: ${ctx || 'Local plumber — first outreach, no prior relationship'}

Requirements:
- Warm, professional, not pushy
- Mention the shared value of the referral relationship
- Short enough to text or DM (under 150 words)
- Personal sign-off: — ${ownerName}, ${companyName}
- No formal greetings like "I hope this email finds you well"`,
    },
    {
      id: 'review-response',
      label: 'Google Review Response',
      description: 'Professional response to a Google review (positive or negative)',
      buildPrompt: (ctx) => `You are writing a Google review response for ${companyName}, a mold & water damage remediation company in ${city}, run by ${ownerName}.

Review content: ${ctx || 'A 5-star review praising the team\'s thoroughness and professionalism'}

Requirements:
- 3-5 sentences, professional and warm
- Thank them by first name if included
- Reinforce 1-2 specific points from the review
- For negative reviews: acknowledge, apologize, offer to make it right offline
- Sign off: — ${ownerName} & the ${companyName} Team
- Do NOT use "We're thrilled!" or "Delighted!" — keep it genuine`,
    },
    {
      id: 'followup',
      label: 'Follow-Up Message',
      description: 'Custom follow-up for a specific lead or client situation',
      buildPrompt: (ctx) => `You are writing on behalf of ${ownerName} at ${companyName} in ${city}.

Write a short follow-up message for the following situation:
${ctx || 'Lead who received an estimate 5 days ago and hasn\'t responded'}

Requirements:
- Under 120 words
- Not pushy — empathetic and helpful tone
- Add one specific reason to act (e.g. mold spreads, limited schedule availability)
- Personal sign-off: — ${ownerName}, ${companyName}
- Ready to send as a text or email`,
    },
  ]
}

export default function AIContentGenerator() {
  const { state } = useApp()
  const tools = getTools()
  const [activeTool, setActiveTool] = useState(tools[0])
  const [context, setContext] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [marked, setMarked] = useState(false)
  const [sentHistory, setSentHistory] = useState([])

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  const generate = async () => {
    if (!apiKey) {
      setError('No API key found. Add VITE_ANTHROPIC_API_KEY to your .env file.')
      return
    }
    setLoading(true)
    setOutput('')
    setError(null)
    setMarked(false)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 600,
          messages: [{ role: 'user', content: activeTool.buildPrompt(context) }],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `API error ${res.status}`)
      }

      const data = await res.json()
      setOutput(data.content?.[0]?.text ?? '')
    } catch (e) {
      setError(e.message ?? 'Unknown error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!output) return
    try { await navigator.clipboard.writeText(output) } catch {
      const el = document.createElement('textarea'); el.value = output
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const markSent = () => {
    setSentHistory(h => [{ tool: activeTool.label, sentAt: new Date().toISOString(), preview: output.slice(0, 80) }, ...h.slice(0, 9)])
    setMarked(true)
    setOutput('')
    setContext('')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={18} className="text-red-500" /> AI Content Generator
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Generate marketing and outreach content using Claude AI. Review, copy, send manually.
          </p>
        </div>

        {/* Tool selector */}
        <div className="grid grid-cols-2 gap-3">
          {tools.map(t => (
            <button key={t.id} onClick={() => { setActiveTool(t); setOutput(''); setError(null); setMarked(false) }}
              className={`text-left border rounded-xl p-4 transition-all ${activeTool.id === t.id
                ? 'border-red-400 bg-red-50 ring-1 ring-red-300'
                : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
              <div className="font-semibold text-sm text-gray-900 mb-0.5">{t.label}</div>
              <div className="text-xs text-gray-500">{t.description}</div>
            </button>
          ))}
        </div>

        {/* Context input */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
            Context / Details
          </label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            rows={3}
            placeholder={
              activeTool.id === 'instagram' ? 'e.g. Completed a full attic remediation for a family in Arvada — 3-day job, heavy black mold on OSB sheathing, post-remediation ERMI passed at 0.6' :
              activeTool.id === 'referral' ? 'e.g. A local plumber named Mike at Ace Plumbing — warm handshake at a networking event, handles residential water line breaks' :
              activeTool.id === 'review-response' ? 'Paste the review text here' :
              'e.g. Lead got estimate for $4,800 crawlspace job 6 days ago. Young couple, first-time homeowners, worried about cost. Third follow-up.'
            }
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><Sparkles size={15} /> Generate with Claude</>}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Generation failed</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
              {!apiKey && <p className="text-xs text-red-600 mt-1.5 font-medium">
                Add <code className="bg-red-100 px-1 rounded">VITE_ANTHROPIC_API_KEY=your_key</code> to <code className="bg-red-100 px-1 rounded">.env</code> and restart the dev server.
              </p>}
            </div>
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{activeTool.label} — Preview</div>
              <div className="text-[10px] text-gray-400">Model: {MODEL}</div>
            </div>
            <div className="px-5 py-4">
              <pre className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">{output}</pre>
              <div className="flex items-center gap-2 mt-4">
                <button onClick={copy}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                    ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Approve & Copy</>}
                </button>
                <button onClick={markSent}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  <CheckCircle size={12} /> Mark as Sent
                </button>
                <button onClick={generate}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Sparkles size={11} /> Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Marked sent confirmation */}
        {marked && !output && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 font-medium flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" /> Logged as sent. Generate another when you're ready.
          </div>
        )}

        {/* Sent history */}
        {sentHistory.length > 0 && (
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Sent This Session</div>
            <div className="space-y-2">
              {sentHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-3">
                  <CheckCircle size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-gray-700">{h.tool}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{h.preview}…</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{new Date(h.sentAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
