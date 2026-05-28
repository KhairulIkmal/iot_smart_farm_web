import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import {
  collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore'
import { ref, get } from 'firebase/database'
import { db, rtdb } from '../firebase'
import { useSensorHistory } from '../hooks/useSensorHistory'
import { exportFarmPDF, exportAllFarmsPDF } from '../utils/pdfReport'
import { Droplets, Thermometer, Wind, FlaskConical, Waves, BookOpen, Send, FileDown } from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const SENSORS = [
  { key: 'soil',       label: 'Soil',     unit: '%',   icon: Droplets,     color: '#3B82F6' },
  { key: 'temp',       label: 'Temp',     unit: '°C',  icon: Thermometer,  color: '#F97316' },
  { key: 'humidity',   label: 'Humidity', unit: '%',   icon: Wind,         color: '#14B8A6' },
  { key: 'ph',         label: 'pH',       unit: ' pH', icon: FlaskConical, color: '#A855F7' },
  { key: 'waterLevel', label: 'Water',    unit: '%',   icon: Waves,        color: '#EF4444' },
]

const SENSOR_META = Object.fromEntries(SENSORS.map(s => [s.key, s]))

const SENSOR_RANGES = {
  soil:       { min: 0,  max: 100 },
  temp:       { min: 0,  max: 50  },
  humidity:   { min: 0,  max: 100 },
  ph:         { min: 0,  max: 14  },
  waterLevel: { min: 0,  max: 100 },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatXAxis(ts, rangeKey) {
  const d = new Date(ts)
  if (rangeKey === '30d') {
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString('en', { weekday: 'short' })
}

function formatValue(value, sensorKey) {
  if (value == null) return '--'
  if (sensorKey === 'ph') return value.toFixed(1) + ' pH'
  if (sensorKey === 'temp') return value.toFixed(1) + '°C'
  return Math.round(value) + '%'
}

function computeStats(data) {
  if (!data.length) return null
  const values = data.map(d => d.value)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)
  return { avg, min, max }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, sensorKey }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  const color = SENSOR_META[sensorKey]?.color ?? '#13EC37'
  return (
    <div className="bg-farm-surface2 border border-farm-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-farm-muted mb-1">
        {new Date(label).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="font-bold" style={{ color }}>{formatValue(val, sensorKey)}</p>
    </div>
  )
}

function StatCard({ label, value, sensorKey }) {
  const color = SENSOR_META[sensorKey]?.color ?? '#13EC37'
  return (
    <div className="flex-1 card p-4 text-center">
      <p className="text-xs font-bold tracking-widest text-farm-muted/50 mb-1">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{formatValue(value, sensorKey)}</p>
    </div>
  )
}

function AnnotationCard({ note }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'rgba(19,236,55,0.05)', borderColor: 'rgba(19,236,55,0.25)' }}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-3.5 h-3.5 text-farm-primary" />
        <span className="text-xs font-semibold text-farm-primary">{note.admin_name ?? 'Admin'}</span>
        {note.sensor_type && note.sensor_type !== 'general' && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full text-farm-primary font-medium capitalize"
            style={{ background: 'rgba(19,236,55,0.12)' }}>
            {note.sensor_type}
          </span>
        )}
      </div>
      <p className="text-sm text-white/80 leading-relaxed">{note.message}</p>
      {note.created_at?.seconds && (
        <p className="text-xs text-farm-muted mt-2">
          {new Date(note.created_at.seconds * 1000).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}

// ─── Farmer Chart View ────────────────────────────────────────────────────────

function FarmerAnalytics({ deviceId, liveData, activeCrop, userData }) {
  const [selectedSensor, setSelectedSensor] = useState('soil')
  const [rangeKey, setRangeKey] = useState('7d')
  const [annotations, setAnnotations] = useState([])
  const [exporting, setExporting] = useState(false)

  const { data, loading } = useSensorHistory(deviceId, selectedSensor, rangeKey)
  const stats = computeStats(data)
  const meta = SENSOR_META[selectedSensor]
  const range = SENSOR_RANGES[selectedSensor]

  // Downsample for chart performance (max 120 points)
  const chartData = data.length > 120
    ? data.filter((_, i) => i % Math.ceil(data.length / 120) === 0)
    : data

  // Load annotations for this farm
  useEffect(() => {
    if (!deviceId) return
    const q = query(
      collection(db, 'annotations'),
      where('farm_id', '==', deviceId),
      where('pinned', '==', true),
      orderBy('created_at', 'desc'),
      limit(5)
    )
    getDocs(q).then(snap => {
      setAnnotations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {})
  }, [deviceId])

  async function handleExport() {
    setExporting(true)
    try {
      await exportFarmPDF({
        cropType:    activeCrop?.crop_type,
        fieldName:   activeCrop?.field_name,
        deviceId,
        sensorKey:   selectedSensor,
        sensorLabel: meta?.label ?? selectedSensor,
        rangeKey,
        stats,
        liveData,
        annotations,
        chartData:   data,
        adminName:   userData?.role === 'admin' ? userData?.name : null,
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Sensor tabs */}
      <div className="flex gap-2 flex-wrap">
        {SENSORS.map(s => {
          const Icon = s.icon
          const isActive = selectedSensor === s.key
          return (
            <button
              key={s.key}
              onClick={() => setSelectedSensor(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isActive ? 'border-transparent text-farm-bg' : 'border-farm-border text-farm-muted hover:border-farm-primary/40'
              }`}
              style={isActive ? { background: s.color } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          )
        })}
        {/* Range toggle + export */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-farm-surface2 rounded-xl p-1">
            {['7d', '30d'].map(r => (
              <button
                key={r}
                onClick={() => setRangeKey(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  rangeKey === r ? 'bg-farm-primary text-farm-bg' : 'text-farm-muted'
                }`}
              >
                {r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || !stats}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-farm-primary/10 border border-farm-primary/30 text-farm-primary text-xs font-semibold rounded-xl hover:bg-farm-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileDown className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="flex gap-3">
          <StatCard label="AVG" value={stats.avg} sensorKey={selectedSensor} />
          <StatCard label="MIN" value={stats.min} sensorKey={selectedSensor} />
          <StatCard label="MAX" value={stats.max} sensorKey={selectedSensor} />
        </div>
      )}

      {/* Chart */}
      <div className="card p-4">
        <p className="text-xs font-bold tracking-widest text-farm-muted/50 mb-4">
          {meta?.label?.toUpperCase()} TREND
        </p>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-farm-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-farm-muted text-sm">
            No history data for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => formatXAxis(ts, rangeKey)}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[range.min, range.max]}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip sensorKey={selectedSensor} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={meta?.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: meta?.color }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Admin annotations */}
      {annotations.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold tracking-widest text-farm-muted/50">ADMIN NOTES</p>
          {annotations.map(note => (
            <AnnotationCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Admin Section ────────────────────────────────────────────────────────────

function AdminAnalytics({ firebaseUser, userData }) {
  const [allCrops, setAllCrops] = useState([])
  const [liveSnapshots, setLiveSnapshots] = useState({})
  const [selectedFarm, setSelectedFarm] = useState(null)
  const [selectedSensorType, setSelectedSensorType] = useState('general')
  const [annotationText, setAnnotationText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)

  // Load all active crops
  useEffect(() => {
    const q = query(collection(db, 'crops'), where('status', '==', 'active'))
    getDocs(q).then(snap => {
      const crops = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setAllCrops(crops)
      if (crops.length > 0) setSelectedFarm(crops[0])

      // Fetch live data for each unique device
      const uniqueDevices = [...new Set(crops.map(c => c.device_id).filter(Boolean))]
      uniqueDevices.forEach(deviceId => {
        get(ref(rtdb, `sensors/${deviceId}/live`)).then(snap => {
          if (snap.exists()) {
            setLiveSnapshots(prev => ({ ...prev, [deviceId]: snap.val() }))
          }
        }).catch(() => {})
      })
    }).catch(() => {})
  }, [])

  async function handleExportAll() {
    setExportingAll(true)
    try {
      exportAllFarmsPDF({
        allCrops,
        liveSnapshots,
        adminName: userData?.name,
      })
    } finally {
      setExportingAll(false)
    }
  }

  async function handleSubmitAnnotation() {
    if (!selectedFarm || !annotationText.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'annotations'), {
        farm_id: selectedFarm.device_id,
        farmer_user_id: selectedFarm.farmer_id,
        admin_uid: firebaseUser.uid,
        admin_name: userData?.name ?? 'Admin',
        sensor_type: selectedSensorType,
        message: annotationText.trim(),
        created_at: serverTimestamp(),
        pinned: true,
      })
      setAnnotationText('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (e) {
      console.error('Annotation write failed:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const liveVal = (deviceId, key) => {
    const snap = liveSnapshots[deviceId]
    if (!snap) return '--'
    const v = snap[key]
    if (v == null) return '--'
    if (key === 'ph') return Number(v).toFixed(1)
    return Math.round(Number(v)) + '%'
  }

  return (
    <div className="space-y-6 mt-8 pt-6 border-t border-farm-border">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-widest text-farm-primary/70">ADMIN VIEW — ALL FARMS</p>
        <button
          onClick={handleExportAll}
          disabled={exportingAll || allCrops.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-farm-primary text-farm-bg text-xs font-bold rounded-xl hover:bg-farm-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileDown className="w-3.5 h-3.5" />
          {exportingAll ? 'Exporting...' : 'Export All Farms PDF'}
        </button>
      </div>

      {/* Farm comparison table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-farm-border text-farm-muted text-xs">
                <th className="text-left p-4 font-semibold">Farm / Crop</th>
                <th className="text-center p-4 font-semibold">Soil</th>
                <th className="text-center p-4 font-semibold">Temp</th>
                <th className="text-center p-4 font-semibold">Humidity</th>
                <th className="text-center p-4 font-semibold">pH</th>
                <th className="text-center p-4 font-semibold">Water</th>
              </tr>
            </thead>
            <tbody>
              {allCrops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-farm-muted">No active farms found.</td>
                </tr>
              ) : allCrops.map(crop => (
                <tr key={crop.id} className="border-b border-farm-border/40 hover:bg-farm-surface2/50 transition-colors">
                  <td className="p-4">
                    <p className="text-white font-semibold capitalize">{crop.crop_type}</p>
                    <p className="text-farm-muted text-xs">{crop.field_name ?? 'Field A'}</p>
                    <p className="text-farm-muted/50 text-[10px] mt-0.5">{crop.device_id}</p>
                  </td>
                  <td className="text-center p-4 text-blue-400 font-mono text-xs">{liveVal(crop.device_id, 'soil')}</td>
                  <td className="text-center p-4 text-orange-400 font-mono text-xs">{liveVal(crop.device_id, 'temp')}°C</td>
                  <td className="text-center p-4 text-teal-400 font-mono text-xs">{liveVal(crop.device_id, 'humidity')}</td>
                  <td className="text-center p-4 text-purple-400 font-mono text-xs">{liveVal(crop.device_id, 'ph')} pH</td>
                  <td className="text-center p-4 text-red-400 font-mono text-xs">{liveVal(crop.device_id, 'waterLevel')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Annotation composer */}
      <div className="card p-5 space-y-4">
        <p className="text-xs font-bold tracking-widest text-farm-muted/50">SEND NOTE TO FARMER</p>

        {/* Farm selector */}
        <div className="space-y-1">
          <label className="text-xs text-farm-muted">Farm</label>
          <select
            className="w-full bg-farm-surface2 border border-farm-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-farm-primary"
            value={selectedFarm?.id ?? ''}
            onChange={e => setSelectedFarm(allCrops.find(c => c.id === e.target.value) ?? null)}
          >
            {allCrops.map(c => (
              <option key={c.id} value={c.id}>
                {c.crop_type} — {c.field_name ?? 'Field A'} ({c.device_id})
              </option>
            ))}
          </select>
        </div>

        {/* Sensor type selector */}
        <div className="space-y-1">
          <label className="text-xs text-farm-muted">Related sensor</label>
          <select
            className="w-full bg-farm-surface2 border border-farm-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-farm-primary"
            value={selectedSensorType}
            onChange={e => setSelectedSensorType(e.target.value)}
          >
            <option value="general">General</option>
            {SENSORS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div className="space-y-1">
          <label className="text-xs text-farm-muted">Note (max 500 chars)</label>
          <textarea
            className="w-full bg-farm-surface2 border border-farm-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-farm-muted/50 focus:outline-none focus:border-farm-primary resize-none"
            rows={3}
            maxLength={500}
            placeholder="e.g. Your soil pH has been dropping — consider adding lime..."
            value={annotationText}
            onChange={e => setAnnotationText(e.target.value)}
          />
          <p className="text-right text-[10px] text-farm-muted/40">{annotationText.length}/500</p>
        </div>

        <button
          onClick={handleSubmitAnnotation}
          disabled={submitting || !annotationText.trim() || !selectedFarm}
          className="flex items-center gap-2 px-4 py-2.5 bg-farm-primary text-farm-bg text-sm font-bold rounded-xl hover:bg-farm-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {submitted ? 'Note sent!' : submitting ? 'Sending...' : 'Send Note'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Analytics({ deviceId, userData, firebaseUser, liveData, activeCrop }) {
  const isAdmin = userData?.role === 'admin'

  if (!deviceId) {
    return (
      <div className="flex items-center justify-center h-64 text-farm-muted text-sm">
        No device connected. Claim your ESP32 device using the mobile app first.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FarmerAnalytics
        deviceId={deviceId}
        liveData={liveData}
        activeCrop={activeCrop}
        userData={userData}
      />
      {isAdmin && (
        <AdminAnalytics firebaseUser={firebaseUser} userData={userData} />
      )}
    </div>
  )
}
