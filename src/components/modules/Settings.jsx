import { useState, useEffect } from 'react'
import { Settings2, Save, Check, Building2 } from 'lucide-react'

const STORAGE_KEY = 'purepro_company_settings'

const BLANK = {
  companyName: '',
  phone: '',
  city: '',
  website: '',
  licenseNumber: '',
  email: '',
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? BLANK
  } catch {
    return BLANK
  }
}

export default function Settings() {
  const [form, setForm] = useState(BLANK)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(load())
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <Settings2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Company Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your company info used across quotes, proposals, and messages</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={15} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Company Information</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Company Name</label>
              <input
                type="text"
                value={form.companyName}
                onChange={e => set('companyName', e.target.value)}
                placeholder="e.g. PurePro Restoration"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="e.g. (720) 555-0100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="e.g. info@purepro.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">City / Service Area</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="e.g. Denver, CO"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">License Number</label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={e => set('licenseNumber', e.target.value)}
                  placeholder="e.g. CO-2024-00142"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={e => set('website', e.target.value)}
                placeholder="e.g. https://pureprorestoration.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={save}
              className={`flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-900 hover:bg-gray-700 text-white'
              }`}
            >
              {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Settings</>}
            </button>
          </div>
        </div>

        {/* Usage note */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
          <div className="text-sm font-semibold text-blue-900 mb-1">How this is used</div>
          <p className="text-xs text-blue-700 leading-relaxed">
            This info auto-populates your proposals, invoices, liability waivers, and outbound message scripts. Stored locally on this device — update it once and it applies everywhere.
          </p>
        </div>
      </div>
    </div>
  )
}
