import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { Camera, Star, StarOff, Copy, Check, CheckCircle } from 'lucide-react'
import { getCompanySettings } from '../../utils/companySettings'

export default function BeforeAfterShowcase({ navigateTo }) {
  const { state, dispatch } = useApp()
  const [copiedId, setCopiedId] = useState(null)
  const [sentId, setSentId] = useState(null)
  const [showOnlyShowcase, setShowOnlyShowcase] = useState(false)

  const showcasePhotos = state.showcasePhotos ?? {}

  // Find all jobs that have at least one before AND one after photo
  const jobsWithPairs = useMemo(() => {
    return (state.jobs ?? []).flatMap(job => {
      const photos = job.photos ?? []
      const befores = photos.filter(p => p.type === 'before' || p.photoType?.toLowerCase() === 'before' || p.name?.toLowerCase().includes('before'))
      const afters = photos.filter(p => p.type === 'after' || p.photoType?.toLowerCase() === 'after' || p.name?.toLowerCase().includes('after'))
      if (befores.length === 0 || afters.length === 0) return []
      const client = (state.clients ?? []).find(c => c.id === job.clientId)
      return [{ job, client, befores, afters }]
    })
  }, [state.jobs, state.clients])

  const filtered = showOnlyShowcase
    ? jobsWithPairs.filter(j => showcasePhotos[j.job.id])
    : jobsWithPairs

  const toggle = (jobId) => {
    dispatch({ type: ACTIONS.TOGGLE_SHOWCASE, payload: { photoId: jobId } })
  }

  const generateShowcaseText = (job, client) => {
    const { companyName, ownerName, city, phone, website } = getCompanySettings()
    const name = client?.name ?? `a ${city} homeowner`
    const type = job.type ?? 'restoration'
    const addr = job.address ?? ''
    return `Before & After — ${companyName}
${type} Project${addr ? ` · ${addr}` : ''}
Client: ${name}

We're proud of the transformation on this project. From initial assessment through final clearance, our team handled every step with precision and professionalism.

To see more before/after results or to request a free assessment, contact ${companyName} in ${city}.
📞 Call or text ${ownerName}${phone ? `: ${phone}` : ': [your number]'}
🌐 ${website || '[your website]'}`
  }

  const handleCopy = async (job, client) => {
    const text = generateShowcaseText(job, client)
    try { await navigator.clipboard.writeText(text) } catch {
      const el = document.createElement('textarea'); el.value = text
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopiedId(job.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const markShared = (jobId) => {
    setSentId(jobId)
    setTimeout(() => setSentId(null), 4000)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Camera size={18} className="text-red-500" /> Before/After Showcase
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Jobs with matched before and after photos. Mark your best work as Showcase Ready.
            </p>
          </div>
          <button
            onClick={() => setShowOnlyShowcase(s => !s)}
            className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-colors
              ${showOnlyShowcase ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}>
            {showOnlyShowcase ? 'Showing Showcase Only' : 'Show All'}
          </button>
        </div>

        {/* 5-step instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-800 uppercase mb-2">How to share</p>
          <div className="text-xs text-blue-700 space-y-0.5">
            <p>1. Star a job to mark it Showcase Ready · 2. Click <strong>Approve &amp; Copy</strong> · 3. Review the caption · 4. Paste into Instagram/Facebook with your photos · 5. Click <strong>Mark as Shared</strong></p>
          </div>
        </div>

        {jobsWithPairs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-14 text-center">
            <Camera size={44} className="mx-auto mb-3 text-gray-200" />
            <p className="font-semibold text-gray-500">No before/after pairs found</p>
            <p className="text-sm text-gray-400 mt-1">
              Attach before <em>and</em> after photos to a job in{' '}
              <button onClick={() => navigateTo?.('photos')} className="text-red-600 underline">Photo Attachments</button> to see them here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-gray-500 text-sm">No showcase-ready jobs yet. Star a job to mark it.</p>
            <button onClick={() => setShowOnlyShowcase(false)} className="mt-2 text-red-600 text-sm underline">Show all jobs</button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(({ job, client, befores, afters }) => {
              const isShowcase = !!showcasePhotos[job.id]
              const isCopied = copiedId === job.id
              const isSent = sentId === job.id
              return (
                <div key={job.id} className={`bg-white border rounded-2xl overflow-hidden ${isShowcase ? 'border-red-300' : 'border-gray-200'}`}>
                  <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-gray-100">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{job.type ?? 'Restoration Job'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {client?.name ?? 'Unknown Client'}
                        {job.address ? ` · ${job.address}` : ''}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{befores.length} before · {afters.length} after</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isShowcase && <span className="text-[11px] font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">Showcase Ready</span>}
                      <button
                        onClick={() => toggle(job.id)}
                        className={`p-2 rounded-xl border transition-colors ${isShowcase ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-300 hover:text-yellow-500'}`}
                        title={isShowcase ? 'Remove from Showcase' : 'Mark as Showcase Ready'}>
                        {isShowcase ? <Star size={15} fill="currentColor" /> : <StarOff size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Photo pairs */}
                  <div className="grid grid-cols-2 gap-3 p-4">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Before</div>
                      <div className="grid gap-2">
                        {befores.slice(0, 2).map(p => (
                          <div key={p.id} className="bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                            {p.url
                              ? <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                              : <Camera size={24} className="text-gray-300" />}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">After</div>
                      <div className="grid gap-2">
                        {afters.slice(0, 2).map(p => (
                          <div key={p.id} className="bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                            {p.url
                              ? <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                              : <Camera size={24} className="text-gray-300" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Share actions */}
                  <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleCopy(job, client)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                        ${isCopied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                      {isCopied ? <><Check size={11} /> Caption Copied!</> : <><Copy size={11} /> Approve &amp; Copy Caption</>}
                    </button>
                    {isCopied && !isSent && (
                      <button
                        onClick={() => markShared(job.id)}
                        className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                        <CheckCircle size={11} /> Mark as Shared
                      </button>
                    )}
                    {isSent && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                        <CheckCircle size={11} /> Shared!
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pt-2">
          Photos attached via <button onClick={() => navigateTo?.('photos')} className="text-red-600 underline">Photo Attachments</button> on individual jobs.
        </p>
      </div>
    </div>
  )
}
