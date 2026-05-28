import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, LabelList,
} from 'recharts'
import {
  collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore'
import { ref, get } from 'firebase/database'
import { db, rtdb } from '../firebase'
import { useSensorHistory } from '../hooks/useSensorHistory'
import { exportFarmPDF, exportAllFarmsPDF } from '../utils/pdfReport'
import {
  Droplets, Thermometer, Wind, FlaskConical, Waves,
  BookOpen, Send, FileDown, Cpu, Users, Leaf, TicketCheck,
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const SENSORS = [
  { key: 'soil',       label: 'Soil',     unit: '%',   icon: Droplets,     color: '#3B82F6' },
  { key: 'temp',       label: 'Temp',     unit: '°C',  icon: Thermometer,  color: '#F97316' },
  { key: 'humidity',   label: 'Humidity', unit: '%',   icon: Wind,         color: '#14B8A6' },
  { key: 'ph',         label: 'pH',       unit: ' pH', icon: FlaskConical, color: '#A855F7' },
  { key: 'waterLevel', label: 'Water',    unit: '%',   icon: Waves,        color: '#EF4444' },
]

const SENSOR_META   = Object.fromEntries(SENSORS.map(s => [s.key, s]))
const SENSOR_RANGES = {
  soil: { min: 0, max: 100 }, temp: { min: 0, max: 50 },
  humidity: { min: 0, max: 100 }, ph: { min: 0, max: 14 }, waterLevel: { min: 0, max: 100 },
}

const DEVICE_STATUS_COLORS = {
  available: '#13EC37',
  claimed:   '#3B82F6',
  inactive:  '#EF4444',
}

const CROP_COLORS = ['#13EC37','#3B82F6','#F97316','#A855F7','#14B8A6','#EF4444','#FBBF24','#EC4899']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatXAxis(ts, rangeKey) {
  const d = new Date(ts)
  return rangeKey === '30d'
    ? d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    : d.toLocaleDateString('en', { weekday: 'short' })
}

function formatValue(value, sensorKey) {
  if (value == null) return '--'
  if (sensorKey === 'ph')   return value.toFixed(1) + ' pH'
  if (sensorKey === 'temp') return value.toFixed(1) + '°C'
  return Math.round(value) + '%'
}

function computeStats(data) {
  if (!data.length) return null
  const values = data.map(d => d.value)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return { avg, min: Math.min(...values), max: Math.max(...values) }
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, sensorKey }) {
  if (!active || !payload?.length) return null
  const val   = payload[0]?.value
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

// ─── Pie Chart Custom Label ───────────────────────────────────────────────────

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null
  const rad = Math.PI / 180
  const r   = innerRadius + (outerRadius - innerRadius) * 0.55
  const x   = cx + r * Math.cos(-midAngle * rad)
  const y   = cy + r * Math.sin(-midAngle * rad)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sensorKey }) {
  const color = SENSOR_META[sensorKey]?.color ?? '#13EC37'
  return (
    <div className="flex-1 card p-4 text-center">
      <p className="text-xs font-bold tracking-widest text-farm-muted/50 mb-1">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{formatValue(value, sensorKey)}</p>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="rounded-xl p-3 shrink-0" style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-farm-muted mt-1">{label}</p>
        {sub && <p className="text-[10px] text-farm-muted/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Annotation Card ──────────────────────────────────────────────────────────

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

// ─── Admin Overview: Charts ───────────────────────────────────────────────────

function AdminOverview({ allCrops, liveSnapshots }) {
  const [deviceStats, setDeviceStats] = useState({ available: 0, claimed: 0, inactive: 0, total: 0 })
  const [ticketStats, setTicketStats] = useState({ open: 0, inProgress: 0, resolved: 0 })
  const [farmerCount, setFarmerCount] = useState(0)

  useEffect(() => {
    // Devices breakdown
    getDocs(collection(db, 'devices')).then(snap => {
      const docs = snap.docs.map(d => d.data())
      setDeviceStats({
        available: docs.filter(d => d.status === 'available').length,
        claimed:   docs.filter(d => d.status === 'claimed').length,
        inactive:  docs.filter(d => d.status === 'inactive').length,
        total:     docs.length,
      })
    }).catch(() => {})

    // Support tickets
    getDocs(collection(db, 'support_tickets')).then(snap => {
      const docs = snap.docs.map(d => d.data())
      setTicketStats({
        open:       docs.filter(d => d.status === 'open').length,
        inProgress: docs.filter(d => d.status === 'in_progress').length,
        resolved:   docs.filter(d => d.status === 'resolved').length,
      })
    }).catch(() => {})

    // Active farmers (unique farmer_ids from active crops)
    getDocs(query(collection(db, 'crops'), where('status', '==', 'active'))).then(snap => {
      const uids = new Set(snap.docs.map(d => d.data().farmer_id).filter(Boolean))
      setFarmerCount(uids.size)
    }).catch(() => {})
  }, [])

  // Pie data
  const devicePieData = [
    { name: 'Available', value: deviceStats.available, color: DEVICE_STATUS_COLORS.available },
    { name: 'Claimed',   value: deviceStats.claimed,   color: DEVICE_STATUS_COLORS.claimed   },
    { name: 'Inactive',  value: deviceStats.inactive,  color: DEVICE_STATUS_COLORS.inactive  },
  ].filter(d => d.value > 0)

  const ticketPieData = [
    { name: 'Open',        value: ticketStats.open,       color: '#13EC37' },
    { name: 'In Progress', value: ticketStats.inProgress, color: '#FBBF24' },
    { name: 'Resolved',    value: ticketStats.resolved,   color: '#6B7280' },
  ].filter(d => d.value > 0)

  // Crop type bar data
  const cropTypeCounts = {}
  allCrops.forEach(c => {
    const t = c.crop_type ?? 'Other'
    cropTypeCounts[t] = (cropTypeCounts[t] ?? 0) + 1
  })
  const cropBarData = Object.entries(cropTypeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  const utilizationRate = deviceStats.total > 0
    ? Math.round((deviceStats.claimed / deviceStats.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Cpu}        label="Total Devices"    value={deviceStats.total}  sub={`${utilizationRate}% utilization`} color="#13EC37" />
        <KpiCard icon={Users}      label="Active Farmers"  value={farmerCount}         sub="devices claimed & in use"          color="#3B82F6" />
        <KpiCard icon={Leaf}       label="Active Crops"    value={allCrops.length}     sub="currently monitored"               color="#F97316" />
        <KpiCard icon={TicketCheck} label="Total Tickets"  value={ticketStats.open + ticketStats.inProgress + ticketStats.resolved} sub={`${ticketStats.open} open`} color="#A855F7" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Device Status Pie */}
        <div className="card p-5">
          <p className="text-xs font-bold tracking-widest text-farm-muted/50 mb-4">DEVICE STATUS</p>
          {devicePieData.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-farm-muted text-xs">No devices yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={devicePieData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {devicePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a2e1f', border: '1px solid #2d4a35', borderRadius: 12, fontSize: 12 }}
                    formatter={(value, name) => [value + ' devices', name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {devicePieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-farm-muted">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    {d.name} <span className="text-white font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Support Tickets Pie */}
        <div className="card p-5">
          <p className="text-xs font-bold tracking-widest text-farm-muted/50 mb-4">SUPPORT TICKETS</p>
          {ticketPieData.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-farm-muted text-xs">No tickets yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={ticketPieData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {ticketPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a2e1f', border: '1px solid #2d4a35', borderRadius: 12, fontSize: 12 }}
                    formatter={(value, name) => [value + ' tickets', name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {ticketPieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-farm-muted">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    {d.name} <span className="text-white font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Crop Type Distribution Bar */}
        <div className="card p-5">
          <p className="text-xs font-bold tracking-widest text-farm-muted/50 mb-4">CROP DISTRIBUTION</p>
          {cropBarData.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-farm-muted text-xs">No crops yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cropBarData} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category" dataKey="name" width={70}
                  tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#1a2e1f', border: '1px solid #2d4a35', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [v + ' farms', 'Count']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {cropBarData.map((_, i) => (
                    <Cell key={i} fill={CROP_COLORS[i % CROP_COLORS.length]} />
                  ))}
                  <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: '#9db9a6', fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Farm Health Table ────────────────────────────────────────────────────────

function healthColor(key, val) {
  if (val === '--') return 'text-farm-muted/40'
  const n = parseFloat(val)
  if (isNaN(n)) return 'text-farm-muted/40'
  if (key === 'soil')       return n < 30 ? 'text-red-400' : n < 60 ? 'text-yellow-400' : 'text-green-400'
  if (key === 'temp')       return n > 38 ? 'text-red-400' : n < 15  ? 'text-blue-400'  : 'text-green-400'
  if (key === 'humidity')   return n < 30 ? 'text-red-400' : n > 80  ? 'text-blue-400'  : 'text-green-400'
  if (key === 'ph')         return n < 5.5 || n > 7.5 ? 'text-red-400' : 'text-purple-400'
  if (key === 'waterLevel') return n < 20 ? 'text-red-400' : 'text-blue-400'
  return 'text-white'
}

function FarmHealthTable({ allCrops, liveSnapshots }) {
  const liveVal = (deviceId, key) => {
    const snap = liveSnapshots[deviceId]
    if (!snap) return '--'
    const v = snap[key]
    if (v == null) return '--'
    if (key === 'ph') return Number(v).toFixed(1)
    return Math.round(Number(v)) + '%'
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-farm-border">
        <p className="text-xs font-bold tracking-widest text-farm-muted/50">LIVE FARM HEALTH</p>
        <span className="flex items-center gap-1.5 text-[10px] text-farm-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-farm-primary animate-pulse" />
          Live readings
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-farm-border/40 text-farm-muted text-xs">
              <th className="text-left px-5 py-3 font-semibold">Farm</th>
              <th className="text-center px-4 py-3 font-semibold">
                <span className="flex items-center justify-center gap-1"><Droplets className="w-3 h-3 text-blue-400" />Soil</span>
              </th>
              <th className="text-center px-4 py-3 font-semibold">
                <span className="flex items-center justify-center gap-1"><Thermometer className="w-3 h-3 text-orange-400" />Temp</span>
              </th>
              <th className="text-center px-4 py-3 font-semibold">
                <span className="flex items-center justify-center gap-1"><Wind className="w-3 h-3 text-teal-400" />Humid</span>
              </th>
              <th className="text-center px-4 py-3 font-semibold">
                <span className="flex items-center justify-center gap-1"><FlaskConical className="w-3 h-3 text-purple-400" />pH</span>
              </th>
              <th className="text-center px-4 py-3 font-semibold">
                <span className="flex items-center justify-center gap-1"><Waves className="w-3 h-3 text-red-400" />Water</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {allCrops.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-6 text-farm-muted text-xs">No active farms found.</td></tr>
            ) : allCrops.map(crop => {
              const hasData = !!liveSnapshots[crop.device_id]
              return (
                <tr key={crop.id} className="border-b border-farm-border/30 hover:bg-farm-surface2/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-white font-semibold capitalize text-sm">{crop.crop_type}</p>
                    <p className="text-farm-muted text-xs">{crop.field_name ?? 'Field A'}</p>
                    <p className="text-farm-muted/40 text-[10px] mt-0.5 font-mono">{crop.device_id}</p>
                  </td>
                  {['soil','temp','humidity','ph','waterLevel'].map(key => {
                    const v = liveVal(crop.device_id, key)
                    const suffix = key === 'temp' ? '°C' : key === 'ph' ? ' pH' : ''
                    const display = v === '--' ? '--' : v.replace('%','') + suffix || v
                    return (
                      <td key={key} className="text-center px-4 py-3.5">
                        <span className={`font-mono text-xs font-bold ${hasData ? healthColor(key, v) : 'text-farm-muted/30'}`}>
                          {v === '--' ? '—' : display}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Farmer Chart View ────────────────────────────────────────────────────────

function FarmerAnalytics({ deviceId, liveData, activeCrop, userData }) {
  const [selectedSensor, setSelectedSensor] = useState('soil')
  const [rangeKey, setRangeKey]             = useState('7d')
  const [annotations, setAnnotations]       = useState([])
  const [exporting, setExporting]           = useState(false)

  const { data, loading } = useSensorHistory(deviceId, selectedSensor, rangeKey)
  const stats    = computeStats(data)
  const meta     = SENSOR_META[selectedSensor]
  const range    = SENSOR_RANGES[selectedSensor]
  const chartData = data.length > 120 ? data.filter((_, i) => i % Math.ceil(data.length / 120) === 0) : data

  useEffect(() => {
    if (!deviceId) return
    const q = query(
      collection(db, 'annotations'),
      where('farm_id', '==', deviceId),
      where('pinned', '==', true),
      orderBy('created_at', 'desc'),
      limit(5)
    )
    getDocs(q).then(snap => setAnnotations(snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {})
  }, [deviceId])

  async function handleExport() {
    setExporting(true)
    try {
      await exportFarmPDF({
        cropType: activeCrop?.crop_type, fieldName: activeCrop?.field_name, deviceId,
        sensorKey: selectedSensor, sensorLabel: meta?.label ?? selectedSensor,
        rangeKey, stats, liveData, annotations, chartData: data,
        adminName: userData?.role === 'admin' ? userData?.name : null,
      })
    } finally { setExporting(false) }
  }

  return (
    <div className="space-y-5">
      {/* Sensor tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {SENSORS.map(s => {
          const Icon     = s.icon
          const isActive = selectedSensor === s.key
          return (
            <button key={s.key} onClick={() => setSelectedSensor(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isActive ? 'border-transparent text-farm-bg' : 'border-farm-border text-farm-muted hover:border-farm-primary/40'
              }`}
              style={isActive ? { background: s.color } : {}}>
              <Icon className="w-3.5 h-3.5" />{s.label}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-farm-surface2 rounded-xl p-1">
            {['7d','30d'].map(r => (
              <button key={r} onClick={() => setRangeKey(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  rangeKey === r ? 'bg-farm-primary text-farm-bg' : 'text-farm-muted'
                }`}>
                {r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button onClick={handleExport} disabled={exporting || !stats}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-farm-primary/10 border border-farm-primary/30 text-farm-primary text-xs font-semibold rounded-xl hover:bg-farm-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
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
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold tracking-widest text-farm-muted/50">
            {meta?.label?.toUpperCase()} TREND
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-farm-muted/60">
            <span className="w-6 border-t-2 border-dashed" style={{ borderColor: meta?.color }} />
            {meta?.label} ({rangeKey === '7d' ? 'Last 7 days' : 'Last 30 days'})
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <div className="w-6 h-6 border-2 border-farm-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-2 text-farm-muted text-sm">
            <div className="w-10 h-10 rounded-full bg-farm-surface2 flex items-center justify-center">
              {meta && <meta.icon className="w-5 h-5 opacity-40" />}
            </div>
            No history data for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={meta?.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={meta?.color} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="timestamp" tickFormatter={(ts) => formatXAxis(ts, rangeKey)}
                tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[range.min, range.max]}
                tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip sensorKey={selectedSensor} />} />
              <Line type="monotone" dataKey="value" stroke={meta?.color} strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: meta?.color, stroke: 'transparent' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Annotations */}
      {annotations.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold tracking-widest text-farm-muted/50">ADMIN NOTES</p>
          {annotations.map(note => <AnnotationCard key={note.id} note={note} />)}
        </div>
      )}
    </div>
  )
}

// ─── Admin Full Section ───────────────────────────────────────────────────────

function AdminAnalytics({ firebaseUser, userData }) {
  const [allCrops, setAllCrops]             = useState([])
  const [liveSnapshots, setLiveSnapshots]   = useState({})
  const [selectedFarm, setSelectedFarm]     = useState(null)
  const [selectedSensorType, setSelectedSensorType] = useState('general')
  const [annotationText, setAnnotationText] = useState('')
  const [submitting, setSubmitting]         = useState(false)
  const [submitted, setSubmitted]           = useState(false)
  const [exportingAll, setExportingAll]     = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'crops'), where('status', '==', 'active'))
    getDocs(q).then(snap => {
      const crops = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setAllCrops(crops)
      if (crops.length > 0) setSelectedFarm(crops[0])
      const uniqueDevices = [...new Set(crops.map(c => c.device_id).filter(Boolean))]
      uniqueDevices.forEach(deviceId => {
        get(ref(rtdb, `sensors/${deviceId}/live`)).then(snap => {
          if (snap.exists()) setLiveSnapshots(prev => ({ ...prev, [deviceId]: snap.val() }))
        }).catch(() => {})
      })
    }).catch(() => {})
  }, [])

  async function handleExportAll() {
    setExportingAll(true)
    try { exportAllFarmsPDF({ allCrops, liveSnapshots, adminName: userData?.name }) }
    finally { setExportingAll(false) }
  }

  async function handleSubmitAnnotation() {
    if (!selectedFarm || !annotationText.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'annotations'), {
        farm_id: selectedFarm.device_id, farmer_user_id: selectedFarm.farmer_id,
        admin_uid: firebaseUser.uid, admin_name: userData?.name ?? 'Admin',
        sensor_type: selectedSensorType, message: annotationText.trim(),
        created_at: serverTimestamp(), pinned: true,
      })
      setAnnotationText('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (e) { console.error('Annotation write failed:', e) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6 mt-8 pt-6 border-t border-farm-border">
      {/* Admin header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-farm-primary/70">ADMIN VIEW</p>
          <p className="text-white font-semibold mt-0.5">All Farms Overview</p>
        </div>
        <button onClick={handleExportAll} disabled={exportingAll || allCrops.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-farm-primary text-farm-bg text-xs font-bold rounded-xl hover:bg-farm-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          <FileDown className="w-3.5 h-3.5" />
          {exportingAll ? 'Exporting...' : 'Export All PDF'}
        </button>
      </div>

      {/* Analytics overview charts */}
      <AdminOverview allCrops={allCrops} liveSnapshots={liveSnapshots} />

      {/* Live health table */}
      <FarmHealthTable allCrops={allCrops} liveSnapshots={liveSnapshots} />

      {/* Annotation composer */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-farm-primary" />
          <p className="text-sm font-bold text-white">Send Note to Farmer</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-farm-muted">Farm</label>
            <select
              className="w-full bg-farm-surface2 border border-farm-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-farm-primary"
              value={selectedFarm?.id ?? ''}
              onChange={e => setSelectedFarm(allCrops.find(c => c.id === e.target.value) ?? null)}>
              {allCrops.map(c => (
                <option key={c.id} value={c.id}>{c.crop_type} — {c.field_name ?? 'Field A'}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-farm-muted">Related sensor</label>
            <select
              className="w-full bg-farm-surface2 border border-farm-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-farm-primary"
              value={selectedSensorType}
              onChange={e => setSelectedSensorType(e.target.value)}>
              <option value="general">General</option>
              {SENSORS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-farm-muted">Note (max 500 chars)</label>
          <textarea
            className="w-full bg-farm-surface2 border border-farm-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-farm-muted/50 focus:outline-none focus:border-farm-primary resize-none"
            rows={3} maxLength={500}
            placeholder="e.g. Your soil pH has been dropping — consider adding lime..."
            value={annotationText}
            onChange={e => setAnnotationText(e.target.value)} />
          <p className="text-right text-[10px] text-farm-muted/40">{annotationText.length}/500</p>
        </div>

        <button onClick={handleSubmitAnnotation}
          disabled={submitting || !annotationText.trim() || !selectedFarm}
          className="flex items-center gap-2 px-4 py-2.5 bg-farm-primary text-farm-bg text-sm font-bold rounded-xl hover:bg-farm-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          <Send className="w-4 h-4" />
          {submitted ? '✓ Note sent!' : submitting ? 'Sending...' : 'Send Note'}
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
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-farm-muted">
        <Cpu className="w-10 h-10 opacity-30" />
        <p className="text-sm">No device connected.</p>
        <p className="text-xs opacity-60">Claim your IoT device using the mobile app first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FarmerAnalytics deviceId={deviceId} liveData={liveData} activeCrop={activeCrop} userData={userData} />
      {isAdmin && <AdminAnalytics firebaseUser={firebaseUser} userData={userData} />}
    </div>
  )
}
