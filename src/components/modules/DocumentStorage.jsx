import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { DOC_TYPES, formatDate } from '../../utils/helpers'
import { uploadDocument } from '../../lib/supabase'
import { Upload, Trash2, FileText, Download, Folder, Loader, ChevronLeft } from 'lucide-react'

const TYPE_COLORS = {
  'Lab Report': 'bg-purple-100 text-purple-700',
  'ERMI Result': 'bg-green-100 text-green-700',
  'Contract': 'bg-blue-100 text-blue-700',
  'Scope of Work': 'bg-orange-100 text-orange-700',
  'Invoice': 'bg-yellow-100 text-yellow-700',
  'Clearance Letter': 'bg-teal-100 text-teal-700',
  'Other': 'bg-gray-100 text-gray-700',
}

export default function DocumentStorage({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('Other')

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const docs = job?.documents ?? []

  const handleFiles = async (files) => {
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const url = await uploadDocument(file, selectedJobId)
        dispatch({
          type: ACTIONS.ADD_DOCUMENT,
          payload: { jobId: selectedJobId, doc: { name: file.name, docType, data: url, fileType: file.type } },
        })
      }
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const download = (doc) => {
    const a = document.createElement('a')
    a.href = doc.data
    a.download = doc.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!selectedJobId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Folder size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium text-sm mb-3">Select a job to view documents</p>
          <select onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            <option value="">Choose a job…</option>
            {state.jobs.map(j => {
              const c = state.clients.find(x => x.id === j.clientId)
              return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
            })}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        {selectedJobId && navigateTo && (
          <button onClick={() => navigateTo('jobs', { jobId: selectedJobId })} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors mr-1 flex-shrink-0">
            <ChevronLeft size={14} /> Back to Job
          </button>
        )}
        <select
          value={selectedJobId}
          onChange={e => setSelectedJobId(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {state.jobs.map(j => {
            const c = state.clients.find(x => x.id === j.clientId)
            return <option key={j.id} value={j.id}>{j.type} — {c?.name}</option>
          })}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            {uploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading…' : 'Upload Doc'}
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {docs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Folder size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No documents yet</p>
            <p className="text-sm mt-1">Upload lab reports, contracts, ERMI results, and more</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-3xl">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors group">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{doc.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[doc.docType] ?? 'bg-gray-100 text-gray-600'}`}>
                      {doc.docType}
                    </span>
                    <span className="text-[11px] text-gray-400">{formatDate(doc.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => download(doc)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Download size={15} /></button>
                  <button
                    onClick={() => { if (!window.confirm('Delete this document?')) return; dispatch({ type: ACTIONS.DELETE_DOCUMENT, payload: { jobId: selectedJobId, docId: doc.id } }) }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
