import { useState, useEffect } from 'react'
import { getCompanySettings } from '../utils/companySettings'

export function useCompanySettings() {
  const [settings, setSettings] = useState(getCompanySettings)

  useEffect(() => {
    const handler = () => setSettings(getCompanySettings())
    window.addEventListener('company-settings-updated', handler)
    return () => window.removeEventListener('company-settings-updated', handler)
  }, [])

  return settings
}
