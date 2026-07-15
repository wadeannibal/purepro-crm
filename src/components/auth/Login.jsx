import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loader } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <div className="leading-tight">
            <div>
              <span className="text-red-500 font-black text-xl tracking-tight">PURE</span>
              <span className="text-white font-black text-xl tracking-tight">PRO</span>
            </div>
            <div className="text-gray-500 text-xs font-medium tracking-widest uppercase leading-none">Restoration</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-white font-bold text-lg mb-1">Sign in</h1>
          <p className="text-gray-500 text-sm mb-6">Access your PurePro CRM</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-800 text-red-300 text-xs px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><Loader size={15} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
