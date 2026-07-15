import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { PHOTO_TYPES, formatDate } from '../../utils/helpers'
import { uploadPhoto } from '../../lib/supabase'
import { Upload, Trash2, SlidersHorizontal, X, Camera, Loader, ChevronLeft } from 'lucide-react'

const ROOMS = ['Basement', 'Living Room', 'Bedroom', 'Bathroom', 'Kitchen', 'Hallway', 'Garage', 'Crawlspace', 'Attic', 'Exterior', 'Other']

function BeforeAfterSlider({ before, after }) {
  const [pos, setPos] = useState(50)
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl" style={{ height: 320 }}>
        <img src={after.data} alt="After" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img src={before.data} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="absolute inset-y-0 w-0.5 bg-white shadow-lg" style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center">
            <SlidersHorizontal size={12} className="text-gray-600" />
          </div>
        </div>
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-medium">BEFORE</div>
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-medium">AFTER</div>
      </div>
      <input type="range" min="0" max="100" value={pos} onChange={e => setPos(Number(e.target.value))} className="w-full" />
    </div>
  )
}

export default function PhotoAttachments({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [filterRoom, setFilterRoom] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [compareMode, setCompareMode] = useState(false)
  const [compareSelected, setCompareSelected] = useState([])
  const [fullView, setFullView] = useState(null)
  const [uploadMeta, setUploadMeta] = useState({ room: 'Basement', photoType: 'Before' })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const photos = (job?.photos ?? []).filter(p => {
    if (filterRoom !== 'All' && p.room !== filterRoom) return false
    if (filterType !== 'All' && p.photoType !== filterType) return false
    return true
  })

  const handleFiles = async (files) => {
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const url = await uploadPhoto(file, selectedJobId)
        dispatch({
          type: ACTIONS.ADD_PHOTO,
          payload: { jobId: selectedJobId, photo: { data: url, name: file.name, room: uploadMeta.room, photoType: uploadMeta.photoType } },
        })
      }
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const toggleCompare = (photo) => {
    if (compareSelected.find(p => p.id === photo.id)) {
      setCompareSelected(prev => prev.filter(p => p.id !== photo.id))
    } else if (compareSelected.length < 2) {
      setCompareSelected(prev => [...prev, photo])
    }
  }

  const canCompare = compareSelected.length === 2

  if (!selectedJobId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Camera size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm mb-3">Select a job to view photos</p>
            <select onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="">Choose a job…</option>
              {state.jobs.map(j => {
                const c = state.clients.find(x => x.id === j.clientId)
                return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
              })}
            </select>
          </div>
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
        <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          {state.jobs.map(j => {
            const c = state.clients.find(x => x.id === j.clientId)
            return <option key={j.id} value={j.id}>{j.type} — {c?.name}</option>
          })}
        </select>

        <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="All">All Rooms</option>
          {ROOMS.map(r => <option key={r}>{r}</option>)}
        </select>

        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="All">All Types</option>
          {PHOTO_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          {compareMode && compareSelected.length > 0 && (
            <button onClick={() => { setCompareSelected([]); setCompareMode(false) }} className="text-xs text-gray-500 hover:text-red-600">Cancel ({compareSelected.length}/2)</button>
          )}
          <button
            onClick={() => { setCompareMode(m => !m); setCompareSelected([]) }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${compareMode ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <SlidersHorizontal size={13} className="inline mr-1" />
            Before/After
          </button>

          <div className="flex items-center gap-2">
            <select value={uploadMeta.room} onChange={e => setUploadMeta(m => ({ ...m, room: e.target.value }))} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none">
              {ROOMS.map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={uploadMeta.photoType} onChange={e => setUploadMeta(m => ({ ...m, photoType: e.target.value }))} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none">
              {PHOTO_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {uploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {compareMode && canCompare && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Before / After Comparison</h3>
              <button onClick={() => { setCompareSelected([]); setCompareMode(false) }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
            </div>
            <BeforeAfterSlider before={compareSelected[0]} after={compareSelected[1]} />
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <div><span className="font-semibold">Before:</span> {compareSelected[0].room} — {compareSelected[0].photoType} — {compareSelected[0].name}</div>
              <div><span className="font-semibold">After:</span> {compareSelected[1].room} — {compareSelected[1].photoType} — {compareSelected[1].name}</div>
            </div>
          </div>
        )}

        {compareMode && !canCompare && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            Select 2 photos to compare ({compareSelected.length}/2 selected)
          </div>
        )}

        {photos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Camera size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No photos yet</p>
            <p className="text-sm mt-1">Upload photos using the button above</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => {
              const isSelected = compareSelected.find(p => p.id === photo.id)
              return (
                <div
                  key={photo.id}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${compareMode ? (isSelected ? 'border-red-500 ring-2 ring-red-300' : 'border-transparent hover:border-red-300') : 'border-transparent hover:border-gray-300'}`}
                  onClick={() => compareMode ? toggleCompare(photo) : setFullView(photo)}
                >
                  <img src={photo.data} alt={photo.name} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 group-hover:translate-y-0 transition-transform">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-xs font-semibold truncate">{photo.room}</div>
                        <div className="text-white/70 text-[10px]">{photo.photoType}</div>
                      </div>
                      {!compareMode && (
                        <button
                          onClick={e => { e.stopPropagation(); if (!window.confirm('Delete this photo?')) return; dispatch({ type: ACTIONS.DELETE_PHOTO, payload: { jobId: selectedJobId, photoId: photo.id } }) }}
                          className="p-1 rounded-lg bg-red-600/80 hover:bg-red-700 text-white"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  {compareMode && isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {compareSelected.findIndex(p => p.id === photo.id) + 1}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Full view */}
      {fullView && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setFullView(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl" onClick={() => setFullView(null)}><X size={20} /></button>
          <img src={fullView.data} alt={fullView.name} className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full">
            {fullView.room} — {fullView.photoType} — {formatDate(fullView.createdAt)}
          </div>
        </div>
      )}
    </div>
  )
}
