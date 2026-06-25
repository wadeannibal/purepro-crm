import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function uploadPhoto(file, jobId) {
  const ext = file.name.split('.').pop()
  const path = `${jobId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('job-photos').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('job-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadDocument(file, jobId) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${jobId}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from('job-documents').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('job-documents').getPublicUrl(path)
  return data.publicUrl
}
