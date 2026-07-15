import { useState, useEffect, useRef } from 'react'
import { Settings2, Save, Check, Building2, LogOut, Upload, X, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { COMPANY_DEFAULTS } from '../../utils/companySettings'

const STORAGE_KEY = 'purepro_company_settings'

function load() {
  try {
    return { ...COMPANY_DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }
  } catch {
    return { ...COMPANY_DEFAULTS }
  }
}

export default function Settings() {
  const [form, setForm] = useState(COMPANY_DEFAULTS)
  const [saved, setSaved] = useState(false)
  const logoRef = useRef()

  useEffect(() => {
    setForm(load())
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
      setForm(settings)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      window.dispatchEvent(new Event('company-settings-updated'))
    })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('logo', ev.target.result)
    reader.readAsDataURL(file)
  }

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    window.dispatchEvent(new Event('company-settings-updated'))
    supabase.from('company_settings').upsert({
      id: 'singleton',
      company_name: form.companyName,
      owner_name: form.ownerName,
      phone: form.phone,
      email: form.email,
      city: form.city,
      license_number: form.licenseNumber,
      website: form.website,
      logo: form.logo ?? null,
      updated_at: new Date().toISOString(),
    }).then()
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
            <p className="text-sm text-gray-500 mt-0.5">Used across all quotes, proposals, messages, and documents</p>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Company Logo</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
              {form.logo
                ? <img src={form.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                : <Upload size={22} className="text-gray-300" />
              }
            </div>
            <div className="space-y-2">
              <button
                onClick={() => logoRef.current?.click()}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <Upload size={14} /> {form.logo ? 'Change Logo' : 'Upload Logo'}
              </button>
              {form.logo && (
                <button
                  onClick={() => set('logo', null)}
                  className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  <X size={12} /> Remove logo
                </button>
              )}
              <p className="text-xs text-gray-400">PNG or JPG. Appears in the sidebar, login screen, and printed documents.</p>
              <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogo} />
            </div>
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

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Owner / Rep Name</label>
              <input
                type="text"
                value={form.ownerName}
                onChange={e => set('ownerName', e.target.value)}
                placeholder="e.g. Wade"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">Used in outreach scripts, follow-ups, and AI content sign-offs.</p>
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
                saved ? 'bg-green-600 text-white' : 'bg-gray-900 hover:bg-gray-700 text-white'
              }`}
            >
              {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Settings</>}
            </button>
          </div>
        </div>

        {/* Sign out */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Sign Out</div>
            <div className="text-xs text-gray-400 mt-0.5">You'll be returned to the login screen</div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
