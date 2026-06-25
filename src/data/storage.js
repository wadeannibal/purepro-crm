// Storage abstraction — swap loadState/saveState implementations to migrate to a real DB
const KEY = 'purepro_crm_v1'

export const loadState = () => {
  try {
    const s = localStorage.getItem(KEY)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

export const saveState = (state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
}

export const clearState = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
