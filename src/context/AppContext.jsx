import { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback } from 'react'
import { reducer, ACTIONS } from './AppReducer'
import { loadState, saveState } from '../data/storage'
import { initialData } from '../data/initialData'
import { loadFromSupabase, syncAction, enrichAction } from '../lib/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [state, dispatch] = useReducer(reducer, null, () => loadState() ?? initialData)
  const stateRef = useRef(state)

  useEffect(() => { stateRef.current = state }, [state])

  // Keep localStorage in sync as an offline cache
  useEffect(() => {
    if (!loading) saveState(state)
  }, [state, loading])

  // Load from Supabase on mount — Supabase is source of truth when online
  useEffect(() => {
    loadFromSupabase()
      .then(data => {
        if (data.clients.length > 0 || data.jobs.length > 0 || data.equipment.length > 0) {
          dispatch({ type: ACTIONS.LOAD_STATE, payload: data })
        }
      })
      .catch(err => console.warn('Using local data — Supabase unavailable:', err.message))
      .finally(() => setLoading(false))
  }, [])

  // Wrap dispatch: update UI immediately + sync to Supabase in background
  const dispatchAndSync = useCallback((action) => {
    const enriched = enrichAction(action)
    dispatch(enriched)
    syncAction(enriched, stateRef.current)
  }, [])

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
    <AppContext.Provider value={{ state, dispatch: dispatchAndSync }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
