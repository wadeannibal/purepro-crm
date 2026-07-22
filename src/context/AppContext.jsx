import { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback } from 'react'
import { reducer, ACTIONS } from './AppReducer'
import { loadState, saveState } from '../data/storage'
import { initialData } from '../data/initialData'
import { loadFromSupabase, syncAction, enrichAction } from '../lib/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [state, dispatch] = useReducer(reducer, null, () => loadState() ?? initialData)
  const [syncStatus, setSyncStatus] = useState('synced') // 'synced' | 'offline' | 'error'
  const [syncToast, setSyncToast] = useState(null)
  const stateRef = useRef(state)
  const syncStatusRef = useRef('synced')
  const toastTimer = useRef(null)

  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { syncStatusRef.current = syncStatus }, [syncStatus])

  // Keep localStorage in sync as an offline cache
  useEffect(() => {
    if (!loading) saveState(state)
  }, [state, loading])

  const doLoad = useCallback(() => {
    return loadFromSupabase()
      .then(data => {
        dispatch({ type: ACTIONS.LOAD_STATE, payload: data })
        setSyncStatus('synced')
      })
      .catch(err => {
        console.warn('Using local data — Supabase unavailable:', err.message)
        setSyncStatus('offline')
      })
  }, [])

  // Load from Supabase on mount — Supabase is source of truth when online
  useEffect(() => {
    doLoad().finally(() => setLoading(false))
  }, [doLoad])

  const retrySync = useCallback(() => { doLoad() }, [doLoad])

  const showToast = useCallback((msg) => {
    setSyncToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setSyncToast(null), 6000)
  }, [])

  // Wrap dispatch: update UI immediately + sync to Supabase in background
  const dispatchAndSync = useCallback((action) => {
    const enriched = enrichAction(action)
    dispatch(enriched)
    syncAction(enriched, stateRef.current).catch(err => {
      console.error('Sync failed:', err)
      if (syncStatusRef.current !== 'offline') showToast('Save failed — check your connection')
    })
  }, [showToast])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white font-semibold text-sm">Loading PurePro CRM…</div>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ state, dispatch: dispatchAndSync, syncStatus, syncToast, retrySync }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
