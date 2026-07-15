const KEY = 'purepro_company_settings'

export const COMPANY_DEFAULTS = {
  companyName: 'PurePro Restoration',
  ownerName: 'Wade',
  phone: '',
  email: '',
  city: 'Denver, CO',
  licenseNumber: '',
  website: '',
  logo: null,
}

export function getCompanySettings() {
  try {
    return { ...COMPANY_DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return COMPANY_DEFAULTS
  }
}
