import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Leaf, LayoutDashboard, Activity, Droplets, Bot, MoreHorizontal,
  Thermometer, Wind, FlaskConical, Waves, Wifi, Battery,
  CloudSun, Power, Send, ChevronDown, Bell, User, MapPin,
  Settings, UserPlus, Zap, AlertTriangle, CheckCircle,
  Smartphone, Download, ChevronLeft, TrendingUp, TrendingDown, Minus,
  Sun, Cloud, CloudRain, Eye, Gauge,
} from 'lucide-react'

// ─── Static Data ───────────────────────────────────────────────

const APK_URL = 'https://drive.google.com/uc?export=download&id=1mjnvoelnVVTWk8fdPntIBN2V0wVoyXG1'

const DEMO_SEED = { temp: 30.2, humidity: 68.0, soil: 52.0, ph: 6.5, waterLevel: 74.0 }

const WEATHER_HOURLY = [
  { time: 'Now',  icon: CloudSun,  temp: 28, rain: 10  },
  { time: '1 PM', icon: Sun,       temp: 29, rain: 5   },
  { time: '2 PM', icon: Sun,       temp: 30, rain: 5   },
  { time: '3 PM', icon: CloudSun,  temp: 29, rain: 15  },
  { time: '4 PM', icon: Cloud,     temp: 27, rain: 30  },
  { time: '5 PM', icon: CloudRain, temp: 25, rain: 65  },
  { time: '6 PM', icon: CloudRain, temp: 24, rain: 70  },
  { time: '7 PM', icon: Cloud,     temp: 23, rain: 35  },
]

const WEATHER_WEEKLY = [
  { day: 'Today', icon: CloudSun,  hi: 30, lo: 22, rain: 10 },
  { day: 'Tue',   icon: Cloud,     hi: 27, lo: 21, rain: 35 },
  { day: 'Wed',   icon: CloudRain, hi: 25, lo: 20, rain: 75 },
  { day: 'Thu',   icon: CloudRain, hi: 24, lo: 19, rain: 80 },
  { day: 'Fri',   icon: Cloud,     hi: 26, lo: 21, rain: 40 },
  { day: 'Sat',   icon: CloudSun,  hi: 29, lo: 22, rain: 15 },
  { day: 'Sun',   icon: Sun,       temp: 31, hi: 31, lo: 24, rain: 5  },
]

const CROPS = [
  { id: 'tomato', label: 'Tomato — Field A', short: 'Tomato A' },
  { id: 'rice',   label: 'Rice — Field B',   short: 'Rice B'   },
  { id: 'chili',  label: 'Chili — Plot C',   short: 'Chili C'  },
]

const SENSOR_KEYS = ['soil', 'temp', 'humidity', 'ph', 'waterLevel']

const SENSOR_CONFIG = {
  soil:       { color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   hex: '#60a5fa', label: 'Soil Moisture', unit: '%',  icon: Droplets,    chartMin: 20, chartMax: 80,  jitterScale: 2.5 },
  temp:       { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', hex: '#fb923c', label: 'Temperature',   unit: '°C', icon: Thermometer, chartMin: 24, chartMax: 36,  jitterScale: 0.5 },
  humidity:   { color: 'text-teal-400',   bg: 'bg-teal-400/10',   border: 'border-teal-400/20',   hex: '#2dd4bf', label: 'Humidity',      unit: '%',  icon: Wind,        chartMin: 50, chartMax: 90,  jitterScale: 1.5 },
  ph:         { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', hex: '#c084fc', label: 'pH Level',      unit: '',   icon: FlaskConical,chartMin: 5.5,chartMax: 7.5, jitterScale: 0.12},
  waterLevel: { color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',    hex: '#f87171', label: 'Water Tank',    unit: '%',  icon: Waves,       chartMin: 40, chartMax: 100, jitterScale: 1.5 },
}

const TABS = [
  { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { id: 'sensors',    icon: Activity,        label: 'Sensors'    },
  { id: 'irrigation', icon: Droplets,        label: 'Irrigation' },
  { id: 'ai-chat',    icon: Bot,             label: 'AI Chat'    },
  { id: 'more',       icon: MoreHorizontal,  label: 'More'       },
]

const ANNOTATIONS = {
  dashboard:  { title: 'Live Sensor Sync',         body: 'An ESP32 microcontroller reads soil, temperature, humidity, pH, and water level — then pushes data to Firebase every 5 seconds.' },
  sensors:    { title: 'Automatic Health Alerts',  body: "Each sensor is individually monitored. When a value falls outside the safe range, a push notification fires on the farmer's phone instantly." },
  irrigation: { title: 'Smart Auto-Irrigation',    body: 'Set a soil moisture threshold and the system activates the pump automatically — no manual intervention needed.' },
  'ai-chat':  { title: 'Powered by Claude AI',     body: 'The AI Crop Advisor reads your live sensor data in real time and gives tailored recommendations for your specific crop and conditions.' },
  more:       { title: 'Multi-Device Sync',        body: 'Profile, farm details, and notification preferences sync instantly across all your devices via Firebase.' },
}

const NOTIFICATIONS = [
  { icon: AlertTriangle, color: 'text-yellow-400',   bg: 'bg-yellow-400/10',   label: 'Soil Moisture Low',            time: '2 hours ago' },
  { icon: Zap,           color: 'text-blue-400',     bg: 'bg-blue-400/10',     label: 'Pump activated automatically', time: '3 hours ago' },
  { icon: CheckCircle,   color: 'text-farm-primary', bg: 'bg-farm-primary/10', label: 'Device online',                time: '5 hours ago' },
]

const DEMO_NOTIFICATIONS = [
  { id: 1,  type: 'alert',  icon: AlertTriangle, color: 'text-yellow-400',   bg: 'bg-yellow-400/10',   border: 'border-yellow-400/20',   title: 'Soil Moisture Critical',       desc: 'Soil dropped to 38% — below your 40% threshold. Irrigation recommended.',     time: '14 min ago',   unread: true  },
  { id: 2,  type: 'alert',  icon: Waves,         color: 'text-red-400',      bg: 'bg-red-400/10',      border: 'border-red-400/20',       title: 'Water Tank Low',               desc: 'Tank at 22%. Refill soon to ensure continuous irrigation.',                   time: '1 hour ago',   unread: true  },
  { id: 3,  type: 'system', icon: Zap,           color: 'text-blue-400',     bg: 'bg-blue-400/10',     border: 'border-blue-400/20',       title: 'Pump Activated (Auto)',        desc: 'Auto-irrigation triggered for Tomato — Field A. Duration: 12 minutes.',       time: '2 hours ago',  unread: true  },
  { id: 4,  type: 'alert',  icon: FlaskConical,  color: 'text-purple-400',   bg: 'bg-purple-400/10',   border: 'border-purple-400/20',    title: 'pH Level Warning',             desc: 'pH reading at 7.1 — slightly above optimal range (6.0–6.8) for tomatoes.',   time: '5 hours ago',  unread: false },
  { id: 5,  type: 'system', icon: CheckCircle,   color: 'text-farm-primary', bg: 'bg-farm-primary/10', border: 'border-farm-primary/20',  title: 'Device Back Online',           desc: 'ESP32-A3F2 reconnected to Firebase after 4 minutes offline.',                 time: '6 hours ago',  unread: false },
  { id: 6,  type: 'alert',  icon: Thermometer,   color: 'text-orange-400',   bg: 'bg-orange-400/10',   border: 'border-orange-400/20',    title: 'High Temperature Alert',       desc: 'Temperature peaked at 34.2°C. Monitor crop for heat stress.',                 time: 'Yesterday',    unread: false },
  { id: 7,  type: 'system', icon: Settings,      color: 'text-teal-400',     bg: 'bg-teal-400/10',     border: 'border-teal-400/20',      title: 'Firmware Updated',             desc: 'ESP32-A3F2 updated to firmware v2.1.4 successfully.',                         time: 'Yesterday',    unread: false },
  { id: 8,  type: 'system', icon: Leaf,          color: 'text-farm-primary', bg: 'bg-farm-primary/10', border: 'border-farm-primary/20',  title: 'Crop Status Updated',          desc: 'Tomato — Field A marked as Active. Expected harvest in 45 days.',             time: '2 days ago',   unread: false },
]

const SETTINGS_ITEMS = [
  { icon: MapPin,    label: 'Farm Location'     },
  { icon: Leaf,      label: 'Farm Details'      },
  { icon: Settings,  label: 'Language'          },
  { icon: Bell,      label: 'Alert Preferences' },
  { icon: User,      label: 'Change Password'   },
]

const PRE_LOADED_CHAT = [
  { role: 'assistant', content: `Hello! I'm your **AI Crop Advisor** for **Tomato — Field A**. I have access to your live sensor readings right now. Ask me anything about your crop!` },
  { role: 'user',      content: 'How is my soil doing?' },
  { role: 'assistant', content: `Your **Soil Moisture** is at **52.0%** — within the healthy range for tomatoes (40–60%). No irrigation needed right now. If it drops below 42%, run the pump for 10–15 minutes.` },
]

const STARTER_PROMPTS = [
  'How is my soil?', 'Should I irrigate?', "What's my pH?", 'How is the weather?',
]

const AI_SCRIPTS = [
  { match: /soil|moisture/i,         fn: d => `Your **Soil Moisture** is at **${d.soil.toFixed(1)}%** — healthy for tomatoes (40–60%). No irrigation needed right now. If it drops below 42%, run the pump for 10–15 minutes.` },
  { match: /irrigat|pump|water/i,    fn: d => `Soil is at **${d.soil.toFixed(1)}%** and water tank at **${d.waterLevel.toFixed(1)}%**. Irrigation is not immediately required. Wait until soil drops below 42% to conserve water.` },
  { match: /ph/i,                    fn: d => `Your **pH Level** reads **${d.ph.toFixed(1)}** — ideal for tomatoes (6.0–6.8). No soil amendment needed. If pH rises above 7.0, consider a mild acidifying fertiliser.` },
  { match: /temp|hot|cold/i,         fn: d => `**Temperature** is **${d.temp.toFixed(1)}°C** — optimal for tomatoes (25–35°C). Your crop is comfortable. Above 35°C, consider shading and increased irrigation frequency.` },
  { match: /humid/i,                 fn: d => `**Humidity** at **${d.humidity.toFixed(1)}%** is within the tomato ideal range (60–75%). Good airflow around plants will help prevent fungal diseases at this level.` },
  { match: /weather|rain|wind|sun/i, fn: () => `Current weather in **Kuala Lumpur**: **28°C**, sunny, **75% humidity**, wind **12 km/h**. Conditions are good for your tomatoes today — no extreme weather warnings.` },
  { match: /harvest|ready|pick/i,    fn: () => `Your **Tomato — Field A** crop looks healthy based on current sensor trends. Harvest readiness depends on days since transplanting — check your crop timeline in the Crop Management section of the app.` },
  { match: /hi|hello|hey|good/i,     fn: () => `Hello! I'm your **AI Crop Advisor** for **Tomato — Field A**. I can see your live sensor readings. Ask me about soil, pH, irrigation, temperature, weather, or harvest readiness!` },
  { match: /.*/,                     fn: d => `Farm looks healthy overall! **Soil** ${d.soil.toFixed(1)}%, **Temp** ${d.temp.toFixed(1)}°C, **pH** ${d.ph.toFixed(1)}, **Water Tank** ${d.waterLevel.toFixed(1)}% — all within optimal ranges for **Tomato**. Keep monitoring!` },
]

// ─── Helpers ───────────────────────────────────────────────────

function jitter(n) { return (Math.random() * 2 - 1) * n }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)) }

function sparklinePath(points) {
  if (points.length < 2) return ''
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const w = 60, h = 18
  return points.map((p, i) => {
    const x = (i / (points.length - 1)) * w
    const y = h - ((p - min) / range) * h
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function renderMd(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="text-white font-semibold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

// ─── Custom Hooks ──────────────────────────────────────────────

function useJitteredData() {
  const [data, setData] = useState(DEMO_SEED)
  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => ({
        temp:       clamp(prev.temp       + jitter(0.4), 28,   32  ),
        humidity:   clamp(prev.humidity   + jitter(1.0), 65,   75  ),
        soil:       clamp(prev.soil       + jitter(1.5), 42,   58  ),
        ph:         clamp(prev.ph         + jitter(0.1), 6.2,  6.8 ),
        waterLevel: clamp(prev.waterLevel + jitter(0.8), 68,   82  ),
      }))
    }, 3000)
    return () => clearInterval(id)
  }, [])
  return data
}

function useSparkline(value, length = 18) {
  const [points, setPoints] = useState(() => Array.from({ length }, () => value))
  const prevRef = useRef(value)
  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value
      setPoints(prev => [...prev.slice(1), value])
    }
  })
  return points
}

function useSensorHistory(type, currentValue, count = 48) {
  const cfg = SENSOR_CONFIG[type]
  const [history, setHistory] = useState(() => {
    const pts = []
    let v = currentValue
    for (let i = 0; i < count; i++) {
      v = clamp(v + jitter(cfg.jitterScale), cfg.chartMin, cfg.chartMax)
      pts.unshift(v)
    }
    return [...pts, currentValue]
  })
  const prevRef = useRef(currentValue)
  useEffect(() => {
    if (prevRef.current !== currentValue) {
      prevRef.current = currentValue
      setHistory(prev => [...prev.slice(1), currentValue])
    }
  })
  return history
}

// ─── Phone UI Primitives ───────────────────────────────────────

function PhoneStatusBar() {
  return (
    <div className="relative bg-[#0d0d0d] px-5 pt-2 pb-1 flex items-center justify-between flex-shrink-0">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0d0d0d] rounded-b-2xl z-10 flex items-end justify-center pb-1">
        <div className="w-1.5 h-1.5 bg-[#222] rounded-full border border-[#333]" />
      </div>
      <span className="text-white text-[11px] font-semibold z-10">9:41</span>
      <div className="flex items-center gap-1 z-10">
        <Wifi className="w-3 h-3 text-white" />
        <Battery className="w-3.5 h-3.5 text-white" />
      </div>
    </div>
  )
}

function PhoneBottomNav({ activeTab, onTabChange }) {
  const unread = DEMO_NOTIFICATIONS.filter(n => n.unread).length
  return (
    <div className="bg-farm-surface border-t border-farm-border flex items-center justify-around px-1 py-1.5 flex-shrink-0">
      {TABS.map(({ id, icon: Icon, label }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200
              ${active ? 'text-farm-primary' : 'text-farm-muted hover:text-white'}`}
          >
            <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
            {id === 'more' && unread > 0 && (
              <span className="absolute top-0.5 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
            <span className="text-[9px] font-medium">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

function PhoneTopBar({ selectedCrop, onCropChange }) {
  return (
    <div className="bg-farm-surface border-b border-farm-border px-3 py-2 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-1.5">
        <img src="/agroezuran_icon_allmode.svg" className="w-5 h-5" alt="AgroEzuran" />
        <span className="text-white text-xs font-bold">AgroEzuran</span>
      </div>
      <div className="relative">
        <select
          value={selectedCrop}
          onChange={e => onCropChange(e.target.value)}
          className="appearance-none bg-farm-surface2 border border-farm-border text-white text-[10px]
                     rounded-lg pl-2 pr-5 py-1 focus:outline-none focus:border-farm-primary/50 cursor-pointer"
          style={{ maxWidth: 86 }}
        >
          {CROPS.map(c => <option key={c.id} value={c.id}>{c.short}</option>)}
        </select>
        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-farm-muted pointer-events-none" />
      </div>
      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-farm-primary/10 border border-farm-primary/20 rounded-full">
        <div className="w-1.5 h-1.5 bg-farm-primary rounded-full animate-pulse" />
        <span className="text-farm-primary text-[9px] font-medium">Online</span>
      </div>
    </div>
  )
}

// ─── App Screens ───────────────────────────────────────────────

function MiniSensorCard({ type, value }) {
  const cfg = SENSOR_CONFIG[type]
  const Icon = cfg.icon
  const prevRef = useRef(value)
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    if (Math.abs(prevRef.current - value) > 0.001) {
      prevRef.current = value
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 500)
      return () => clearTimeout(t)
    }
  })
  return (
    <div className={`p-2.5 rounded-xl bg-farm-surface border ${cfg.border} transition-colors duration-500`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg} mb-2`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <p className="text-farm-muted text-[9px] leading-tight mb-0.5">{cfg.label}</p>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-sm font-bold ${cfg.color} transition-opacity duration-300 ${flash ? 'opacity-50' : 'opacity-100'}`}>
          {value.toFixed(1)}
        </span>
        {cfg.unit && <span className="text-farm-muted text-[9px]">{cfg.unit}</span>}
      </div>
    </div>
  )
}

function WeatherDetailScreen({ onBack }) {
  return (
    <div className="flex flex-col h-full bg-farm-bg">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900/60 to-teal-900/40 border-b border-blue-500/20 px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1">
          <p className="text-white text-xs font-semibold">Weather Forecast</p>
          <p className="text-blue-300 text-[9px] flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> Kuala Lumpur, Malaysia
          </p>
        </div>
        <CloudSun className="w-6 h-6 text-yellow-400" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Current hero */}
        <div className="bg-gradient-to-br from-blue-900/50 to-teal-900/30 p-4 text-center">
          <CloudSun className="w-14 h-14 text-yellow-400 mx-auto mb-1" />
          <div className="flex items-start justify-center gap-1">
            <span className="text-white text-5xl font-bold">28</span>
            <span className="text-blue-300 text-xl mt-2">°C</span>
          </div>
          <p className="text-white font-medium text-sm mt-0.5">Sunny</p>
          <p className="text-blue-300 text-[10px] mt-0.5">Feels like 31°C</p>

          {/* 4 stat pills */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { icon: Droplets,    label: 'Humidity', value: '75%',    color: 'text-blue-300'  },
              { icon: Wind,        label: 'Wind',     value: '12km/h', color: 'text-teal-300'  },
              { icon: Gauge,       label: 'UV Index', value: '6 Mid',  color: 'text-yellow-300'},
              { icon: Eye,         label: 'Visibility',value: '10 km', color: 'text-purple-300'},
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-white/10 rounded-xl p-2 text-center">
                  <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${s.color}`} />
                  <p className="text-white text-[10px] font-semibold">{s.value}</p>
                  <p className="text-blue-300/70 text-[8px]">{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* Hourly forecast */}
          <div>
            <p className="text-farm-muted text-[10px] font-medium uppercase tracking-wide mb-2">Hourly Forecast</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
              {WEATHER_HOURLY.map((h, i) => {
                const Icon = h.icon
                const isNow = i === 0
                return (
                  <div key={i} className={`flex-shrink-0 flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border min-w-[52px] transition-all
                    ${isNow ? 'bg-blue-500/20 border-blue-500/40' : 'bg-farm-surface border-farm-border'}`}>
                    <p className={`text-[9px] font-medium ${isNow ? 'text-blue-300' : 'text-farm-muted'}`}>{h.time}</p>
                    <Icon className={`w-5 h-5 ${h.icon === CloudRain ? 'text-blue-400' : h.icon === Sun ? 'text-yellow-400' : 'text-yellow-300'}`} />
                    <p className="text-white text-[10px] font-bold">{h.temp}°</p>
                    <div className="flex items-center gap-0.5">
                      <Droplets className="w-2 h-2 text-blue-400" />
                      <p className="text-blue-400 text-[8px]">{h.rain}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weekly forecast */}
          <div>
            <p className="text-farm-muted text-[10px] font-medium uppercase tracking-wide mb-2">7-Day Forecast</p>
            <div className="bg-farm-surface border border-farm-border rounded-xl overflow-hidden divide-y divide-farm-border">
              {WEATHER_WEEKLY.map((d, i) => {
                const Icon = d.icon
                const rainColor = d.rain >= 60 ? 'text-blue-400' : d.rain >= 30 ? 'text-blue-300' : 'text-farm-muted'
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <p className={`text-xs font-medium w-10 flex-shrink-0 ${i === 0 ? 'text-farm-primary' : 'text-white'}`}>{d.day}</p>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${d.icon === CloudRain ? 'text-blue-400' : d.icon === Sun ? 'text-yellow-400' : 'text-yellow-300'}`} />
                    <div className="flex items-center gap-1 flex-1">
                      <Droplets className="w-2.5 h-2.5 text-blue-400" />
                      <span className={`text-[9px] ${rainColor}`}>{d.rain}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-white text-[10px] font-bold">{d.hi}°</span>
                      <span className="text-farm-muted text-[10px]">{d.lo}°</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Farm impact note */}
          <div className="p-2.5 rounded-xl bg-yellow-400/5 border border-yellow-400/20 flex items-start gap-2">
            <Leaf className="w-3.5 h-3.5 text-farm-primary mt-0.5 flex-shrink-0" />
            <p className="text-farm-muted text-[10px] leading-relaxed">
              Rain expected Wed–Thu. Consider reducing irrigation on Tuesday evening to avoid overwatering.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardScreen({ data, selectedCrop, onCropChange }) {
  const [showWeather, setShowWeather] = useState(false)

  if (showWeather) {
    return <WeatherDetailScreen onBack={() => setShowWeather(false)} />
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PhoneTopBar selectedCrop={selectedCrop} onCropChange={onCropChange} />
      <div className="flex-1 p-3 space-y-3">
        {/* Weather card — tappable */}
        <div
          onClick={() => setShowWeather(true)}
          className="p-3 rounded-2xl bg-gradient-to-br from-blue-900/40 to-teal-900/30 border border-blue-500/20 cursor-pointer hover:border-blue-400/40 active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-[10px]">Kuala Lumpur · Tap for forecast</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-white text-2xl font-bold">28</span>
                <span className="text-farm-muted text-xs">°C</span>
              </div>
              <p className="text-farm-muted text-[10px] mt-0.5">Sunny · Feels like 31°C</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <CloudSun className="w-10 h-10 text-yellow-400" />
              <ChevronLeft className="w-3.5 h-3.5 text-blue-400 rotate-180" />
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span className="text-farm-muted text-[10px]">75%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-teal-400" />
              <span className="text-farm-muted text-[10px]">12 km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-300" />
              <span className="text-farm-muted text-[10px]">Rain 10%</span>
            </div>
          </div>
        </div>

        {/* Sensor grid */}
        <p className="text-farm-muted text-[10px] font-medium uppercase tracking-wide">Live Sensors</p>
        <div className="grid grid-cols-2 gap-2">
          {SENSOR_KEYS.map(key => (
            <MiniSensorCard key={key} type={key} value={data[key]} />
          ))}
        </div>

        {/* Hint */}
        <div className="p-3 rounded-xl bg-farm-primary/5 border border-farm-primary/20 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-farm-primary flex-shrink-0" />
          <p className="text-farm-muted text-[10px] leading-tight">More features in the mobile app: analytics, maps & push alerts</p>
        </div>
      </div>
    </div>
  )
}

function Sparkline({ points, hex }) {
  const path = sparklinePath(points)
  return (
    <svg viewBox="0 0 60 18" className="w-14 h-4 overflow-visible flex-shrink-0">
      {path && (
        <polyline
          points={path}
          fill="none"
          stroke={hex}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      )}
    </svg>
  )
}

function SensorGraphScreen({ type, value, onBack }) {
  const cfg = SENSOR_CONFIG[type]
  const Icon = cfg.icon
  const history = useSensorHistory(type, value)
  const [range, setRange] = useState('6H')

  const displayPoints = range === '1H' ? history.slice(-12)
    : range === '24H' ? history
    : history.slice(-24)

  // SVG chart dims
  const W = 310, H = 130
  const PAD = { l: 36, r: 10, t: 12, b: 24 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b

  const yMin = cfg.chartMin
  const yMax = cfg.chartMax
  const yRange = yMax - yMin || 1

  const pts = displayPoints.map((p, i) => ({
    x: PAD.l + (i / (displayPoints.length - 1)) * cW,
    y: PAD.t + cH - ((p - yMin) / yRange) * cH,
    v: p,
  }))

  const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = pts.length > 1
    ? `M ${pts[0].x.toFixed(1)},${(PAD.t + cH).toFixed(1)} ` +
      pts.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      ` L ${pts[pts.length - 1].x.toFixed(1)},${(PAD.t + cH).toFixed(1)} Z`
    : ''

  const yLabels = [yMin, yMin + yRange * 0.33, yMin + yRange * 0.66, yMax]
  const xLabels = range === '1H'
    ? ['60m', '45m', '30m', '15m', 'Now']
    : range === '24H'
    ? ['24h', '18h', '12h', '6h', 'Now']
    : ['6h', '4h', '2h', '1h', 'Now']

  const currentVal = value
  const minVal = Math.min(...displayPoints)
  const maxVal = Math.max(...displayPoints)
  const avgVal = displayPoints.reduce((a, b) => a + b, 0) / displayPoints.length
  const trend = displayPoints[displayPoints.length - 1] - displayPoints[0]
  const TrendIcon = Math.abs(trend) < 0.5 ? Minus : trend > 0 ? TrendingUp : TrendingDown
  const trendColor = Math.abs(trend) < 0.5 ? 'text-farm-muted' : trend > 0 ? 'text-green-400' : 'text-red-400'

  const gradId = `grad-${type}`

  return (
    <div className="flex flex-col h-full bg-farm-bg">
      {/* Header */}
      <div className="bg-farm-surface border-b border-farm-border px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-farm-surface2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-farm-muted" />
        </button>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${cfg.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
        </div>
        <div className="flex-1">
          <p className="text-white text-xs font-semibold">{cfg.label}</p>
          <p className="text-farm-muted text-[9px]">Sensor Analytics</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-farm-primary rounded-full animate-pulse" />
          <span className="text-farm-primary text-[9px]">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Current value hero */}
        <div className={`p-3 rounded-xl ${cfg.bg} border ${cfg.border}`}>
          <p className="text-farm-muted text-[10px] mb-0.5">{cfg.label}</p>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${cfg.color}`}>{currentVal.toFixed(1)}</span>
              <span className="text-farm-muted text-sm">{cfg.unit}</span>
            </div>
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-[10px] font-medium">
                {Math.abs(trend) < 0.5 ? 'Stable' : `${trend > 0 ? '+' : ''}${trend.toFixed(1)}${cfg.unit}`}
              </span>
            </div>
          </div>
        </div>

        {/* Time range tabs */}
        <div className="flex bg-farm-surface border border-farm-border rounded-xl p-0.5 gap-0.5">
          {['1H', '6H', '24H'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200
                ${range === r ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : 'text-farm-muted hover:text-white'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* SVG Chart */}
        <div className="bg-farm-surface border border-farm-border rounded-xl p-2 overflow-hidden">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: H }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cfg.hex} stopOpacity="0.3" />
                <stop offset="100%" stopColor={cfg.hex} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {yLabels.map((lv, i) => {
              const y = PAD.t + cH - ((lv - yMin) / yRange) * cH
              return (
                <g key={i}>
                  <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <text x={PAD.l - 4} y={y + 3.5} textAnchor="end" fill="#9DB9A1" fontSize="8">
                    {lv % 1 === 0 ? lv : lv.toFixed(1)}
                  </text>
                </g>
              )
            })}

            {/* X labels */}
            {xLabels.map((lbl, i) => {
              const x = PAD.l + (i / (xLabels.length - 1)) * cW
              return (
                <text key={i} x={x} y={H - 4} textAnchor="middle" fill="#9DB9A1" fontSize="8">{lbl}</text>
              )
            })}

            {/* Area fill */}
            {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

            {/* Line */}
            {pts.length > 1 && (
              <polyline
                points={polyline}
                fill="none"
                stroke={cfg.hex}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Current value dot */}
            {pts.length > 0 && (
              <>
                <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill={cfg.hex} opacity="0.3" />
                <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={cfg.hex} />
              </>
            )}
          </svg>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Min', value: minVal.toFixed(1) },
            { label: 'Avg', value: avgVal.toFixed(1) },
            { label: 'Max', value: maxVal.toFixed(1) },
          ].map(s => (
            <div key={s.label} className="p-2 rounded-xl bg-farm-surface border border-farm-border text-center">
              <p className="text-farm-muted text-[9px] mb-0.5">{s.label}</p>
              <span className={`text-sm font-bold ${cfg.color}`}>{s.value}</span>
              {cfg.unit && <span className="text-farm-muted text-[9px] ml-0.5">{cfg.unit}</span>}
            </div>
          ))}
        </div>

        {/* Status note */}
        <div className="p-2.5 rounded-xl bg-farm-surface border border-farm-border flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-farm-primary flex-shrink-0" />
          <p className="text-farm-muted text-[10px] leading-tight">
            Sensor healthy — readings within optimal range for your crop.
          </p>
        </div>
      </div>
    </div>
  )
}

function SensorRow({ type, value, isError, onClick }) {
  const cfg = SENSOR_CONFIG[type]
  const Icon = cfg.icon
  const points = useSparkline(value)
  return (
    <div
      onClick={!isError ? onClick : undefined}
      className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-farm-surface border transition-all duration-300
        ${isError ? 'border-red-500/40' : `${cfg.border} cursor-pointer hover:bg-farm-surface2 active:scale-[0.98]`}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isError ? 'bg-red-400/10' : cfg.bg}`}>
        <Icon className={`w-4 h-4 ${isError ? 'text-red-400' : cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-farm-muted text-[10px]">{cfg.label}</p>
        <div className="flex items-baseline gap-0.5">
          <span className={`text-sm font-bold ${isError ? 'text-red-400' : cfg.color}`}>
            {isError ? 'ERR' : value.toFixed(1)}
          </span>
          {!isError && cfg.unit && <span className="text-farm-muted text-[9px]">{cfg.unit}</span>}
        </div>
      </div>
      {isError ? (
        <span className="text-[9px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-1.5 py-0.5 rounded-full flex-shrink-0">Error</span>
      ) : (
        <>
          <Sparkline points={points} hex={cfg.hex} />
          <ChevronLeft className="w-3.5 h-3.5 text-farm-muted rotate-180 flex-shrink-0" />
        </>
      )}
    </div>
  )
}

function SensorsScreen({ data, selectedCrop, onCropChange, errorIdx, onToggleError }) {
  const [selectedSensor, setSelectedSensor] = useState(null)

  if (selectedSensor) {
    return (
      <SensorGraphScreen
        type={selectedSensor}
        value={data[selectedSensor]}
        onBack={() => setSelectedSensor(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PhoneTopBar selectedCrop={selectedCrop} onCropChange={onCropChange} />
      <div className="flex-1 p-3 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-farm-muted text-[10px] font-medium uppercase tracking-wide">Tap sensor to view graph</p>
          <button
            onClick={onToggleError}
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all duration-200
              ${errorIdx !== null
                ? 'text-farm-primary bg-farm-primary/10 border-farm-primary/30'
                : 'text-red-400 bg-red-400/10 border-red-400/30 hover:bg-red-400/20'}`}
          >
            {errorIdx !== null ? 'Clear Error' : 'Simulate Error'}
          </button>
        </div>
        {SENSOR_KEYS.map((key, i) => (
          <SensorRow
            key={key}
            type={key}
            value={data[key]}
            isError={errorIdx === i}
            onClick={() => setSelectedSensor(key)}
          />
        ))}
      </div>
    </div>
  )
}

function IrrigationScreen({ data, selectedCrop, onCropChange, pumpOn, pumpLoading, autoMode, soilThreshold, setSoilThreshold, onTogglePump, onToggleAuto }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PhoneTopBar selectedCrop={selectedCrop} onCropChange={onCropChange} />
      <div className="flex-1 p-3 space-y-3">
        {/* Mode toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-farm-surface border border-farm-border">
          <span className="text-white text-xs font-medium">Irrigation Mode</span>
          <div className="flex bg-farm-bg rounded-lg p-0.5 gap-0.5">
            {['Manual', 'Auto'].map(m => (
              <button
                key={m}
                onClick={() => onToggleAuto(m === 'Auto')}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-all duration-200
                  ${(m === 'Auto') === autoMode
                    ? 'bg-farm-primary text-farm-bg'
                    : 'text-farm-muted hover:text-white'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {autoMode ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-farm-surface border border-farm-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-xs font-medium">Soil Threshold</span>
                <span className="text-farm-primary text-xs font-bold">{soilThreshold}%</span>
              </div>
              <input
                type="range" min={20} max={70} step={1}
                value={soilThreshold}
                onChange={e => setSoilThreshold(+e.target.value)}
                className="w-full accent-farm-primary"
              />
              <p className="text-farm-muted text-[9px] mt-1">Pump activates when soil drops below this value</p>
            </div>
            <div className={`p-3 rounded-xl border flex items-center gap-2 transition-all duration-500
              ${pumpOn ? 'bg-farm-primary/10 border-farm-primary/30' : 'bg-farm-surface border-farm-border'}`}>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${pumpOn ? 'bg-farm-primary animate-pulse' : 'bg-farm-muted'}`} />
              <div>
                <p className="text-white text-xs font-medium">Pump Status</p>
                <p className={`text-[10px] ${pumpOn ? 'text-farm-primary' : 'text-farm-muted'}`}>
                  {pumpOn ? `Irrigating — soil at ${data.soil.toFixed(1)}%` : `Idle — soil at ${data.soil.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 pt-2">
            {/* Pump circle */}
            <div className="relative flex items-center justify-center">
              <div className={`absolute w-28 h-28 rounded-full transition-all duration-700
                ${pumpOn ? 'shadow-[0_0_40px_rgba(19,236,55,0.35)] bg-farm-primary/10' : 'bg-farm-muted/5'}`} />
              <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-500
                ${pumpOn ? 'border-farm-primary bg-farm-primary/15' : 'border-farm-border bg-farm-surface'}`}>
                <Power
                  className={`w-8 h-8 transition-colors duration-500 ${pumpOn ? 'text-farm-primary' : 'text-farm-muted'}`}
                  style={pumpOn ? { animation: 'spin 4s linear infinite' } : {}}
                />
              </div>
            </div>
            <p className={`text-sm font-bold transition-colors duration-300 ${pumpOn ? 'text-farm-primary' : 'text-farm-muted'}`}>
              {pumpOn ? 'Irrigating' : 'Pump Idle'}
            </p>
            <div className="flex gap-2 w-full">
              <button
                disabled={pumpOn || pumpLoading}
                onClick={() => onTogglePump(true)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200
                  bg-farm-primary text-farm-bg hover:bg-farm-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pumpLoading && !pumpOn ? '···' : 'Start Pump'}
              </button>
              <button
                disabled={!pumpOn || pumpLoading}
                onClick={() => onTogglePump(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200
                  bg-farm-surface border border-farm-border text-white hover:border-red-400/50 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pumpLoading && pumpOn ? '···' : 'Stop Pump'}
              </button>
            </div>
          </div>
        )}

        {/* Context mini-cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-xl bg-farm-surface border border-blue-400/20">
            <Droplets className="w-3.5 h-3.5 text-blue-400 mb-1" />
            <p className="text-farm-muted text-[9px]">Soil</p>
            <p className="text-blue-400 text-xs font-bold">{data.soil.toFixed(1)}%</p>
          </div>
          <div className="p-2 rounded-xl bg-farm-surface border border-red-400/20">
            <Waves className="w-3.5 h-3.5 text-red-400 mb-1" />
            <p className="text-farm-muted text-[9px]">Water Tank</p>
            <p className="text-red-400 text-xs font-bold">{data.waterLevel.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-2">
      <div className="w-6 h-6 rounded-full bg-farm-primary/20 border border-farm-primary/30 flex items-center justify-center flex-shrink-0">
        <Leaf className="w-3 h-3 text-farm-primary" />
      </div>
      <div className="bg-farm-surface border border-farm-border rounded-2xl rounded-bl-sm px-3 py-2.5 flex gap-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-farm-muted rounded-full"
            style={{ display: 'inline-block', animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-end gap-1.5 mb-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-farm-primary/20 border border-farm-primary/30 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-3 h-3 text-farm-primary" />
        </div>
      )}
      <div className={`max-w-[78%] px-3 py-2 text-[11px] leading-relaxed rounded-2xl
        ${isUser
          ? 'bg-farm-primary text-farm-bg rounded-br-sm font-medium'
          : 'bg-farm-surface border border-farm-border text-white rounded-bl-sm'}`}>
        {isUser ? msg.content : renderMd(msg.content)}
      </div>
    </div>
  )
}

function AiChatScreen({ messages, setMessages, chatInput, setChatInput, typing, setTyping, dataRef }) {
  const bottomRef = useRef(null)
  const hasNewMessages = messages.length > PRE_LOADED_CHAT.length

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  async function send(text) {
    const t = text.trim()
    if (!t || typing) return
    setChatInput('')
    setMessages(prev => [...prev, { role: 'user', content: t }])
    setTyping(true)
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 600))
    const script = AI_SCRIPTS.find(s => s.match.test(t))
    setTyping(false)
    setMessages(prev => [...prev, { role: 'assistant', content: script.fn(dataRef.current) }])
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(chatInput) }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-farm-surface border-b border-farm-border px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-farm-primary/20 border border-farm-primary/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-farm-primary" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">AI Crop Advisor</p>
            <p className="text-farm-primary text-[9px]">● Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Starter chips */}
      {!hasNewMessages && !typing && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {STARTER_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => send(p)}
              className="text-[9px] font-medium px-2 py-1 bg-farm-surface border border-farm-border text-farm-muted hover:text-farm-primary hover:border-farm-primary/30 rounded-full transition-all duration-200"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-farm-border px-2 py-2 flex gap-1.5 flex-shrink-0 bg-farm-surface">
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask about your crop..."
          className="flex-1 bg-farm-bg border border-farm-border rounded-xl px-3 py-1.5 text-white text-[11px] placeholder:text-farm-muted/60 focus:outline-none focus:border-farm-primary/50 min-w-0"
        />
        <button
          onClick={() => send(chatInput)}
          disabled={!chatInput.trim() || typing}
          className="w-8 h-8 rounded-xl bg-farm-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-farm-primary/90 transition-all"
        >
          <Send className="w-3.5 h-3.5 text-farm-bg" />
        </button>
      </div>
    </div>
  )
}

function NotificationCenterScreen({ onBack }) {
  const [items, setItems] = useState(DEMO_NOTIFICATIONS)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? items : items.filter(n => n.type === filter)
  const unreadCount = items.filter(n => n.unread).length

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, unread: false })))
  }

  function markRead(id) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  return (
    <div className="flex flex-col h-full bg-farm-bg">
      {/* Header */}
      <div className="bg-farm-surface border-b border-farm-border px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <button onClick={onBack} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-farm-surface2 transition-colors">
          <ChevronLeft className="w-4 h-4 text-farm-muted" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <p className="text-white text-xs font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-farm-primary text-[9px] font-medium hover:text-farm-primary/80 transition-colors">
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex bg-farm-surface border-b border-farm-border px-3 py-1.5 gap-1 flex-shrink-0">
        {[
          { id: 'all',    label: 'All'    },
          { id: 'alert',  label: 'Alerts' },
          { id: 'system', label: 'System' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200
              ${filter === f.id ? 'bg-farm-primary/15 text-farm-primary border border-farm-primary/30' : 'text-farm-muted hover:text-white'}`}
          >
            {f.label}
            {f.id === 'all' && unreadCount > 0 && (
              <span className="ml-1 w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
            <Bell className="w-8 h-8 text-farm-muted" />
            <p className="text-farm-muted text-xs">No notifications in this category</p>
          </div>
        ) : (
          <div className="divide-y divide-farm-border">
            {filtered.map(n => {
              const Icon = n.icon
              return (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex gap-2.5 px-3 py-3 cursor-pointer transition-colors
                    ${n.unread ? 'bg-farm-surface/60 hover:bg-farm-surface' : 'hover:bg-farm-surface/40'}`}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${n.bg} border ${n.border}`}>
                      <Icon className={`w-4 h-4 ${n.color}`} />
                    </div>
                    {n.unread && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-farm-bg" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[11px] font-semibold leading-tight ${n.unread ? 'text-white' : 'text-farm-muted'}`}>{n.title}</p>
                      <span className="text-farm-muted text-[9px] flex-shrink-0">{n.time}</span>
                    </div>
                    <p className="text-farm-muted text-[10px] leading-relaxed mt-0.5">{n.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function FarmLocationScreen({ onBack }) {
  const [mapLoaded, setMapLoaded] = useState(false)

  return (
    <div className="flex flex-col h-full bg-farm-bg">
      {/* Header */}
      <div className="bg-farm-surface border-b border-farm-border px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <button onClick={onBack} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-farm-surface2 transition-colors">
          <ChevronLeft className="w-4 h-4 text-farm-muted" />
        </button>
        <div className="flex-1">
          <p className="text-white text-xs font-semibold">Farm Location</p>
          <p className="text-farm-muted text-[9px]">Serdang, Selangor, Malaysia</p>
        </div>
        <MapPin className="w-4 h-4 text-farm-primary" />
      </div>

      {/* Map */}
      <div className="relative flex-shrink-0" style={{ height: 320 }}>
        {!mapLoaded && (
          <div className="absolute inset-0 bg-farm-surface flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-farm-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-farm-muted text-[10px]">Loading map...</p>
            </div>
          </div>
        )}
        <iframe
          title="Farm Location"
          src="https://www.openstreetmap.org/export/embed.html?bbox=101.6569%2C2.9653%2C101.7569%2C3.0253&layer=mapnik&marker=2.9953%2C101.7069"
          className="w-full h-full border-0"
          onLoad={() => setMapLoaded(true)}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* Address card */}
        <div className="p-3 rounded-xl bg-farm-surface border border-farm-border">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-farm-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white text-xs font-semibold">Ahmad Rizal's Farm</p>
              <p className="text-farm-muted text-[10px] mt-0.5 leading-relaxed">
                Lot 12, Jalan Pertanian 3,<br />
                43400 Serdang, Selangor,<br />
                Malaysia
              </p>
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-farm-surface border border-farm-border">
            <p className="text-farm-muted text-[9px] mb-0.5">Latitude</p>
            <p className="text-white text-[11px] font-mono font-semibold">2.9953° N</p>
          </div>
          <div className="p-2.5 rounded-xl bg-farm-surface border border-farm-border">
            <p className="text-farm-muted text-[9px] mb-0.5">Longitude</p>
            <p className="text-white text-[11px] font-mono font-semibold">101.7069° E</p>
          </div>
        </div>

        {/* Farm size */}
        <div className="p-3 rounded-xl bg-farm-surface border border-farm-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-farm-primary" />
            <div>
              <p className="text-white text-xs font-semibold">Farm Size</p>
              <p className="text-farm-muted text-[10px]">Total area</p>
            </div>
          </div>
          <span className="text-farm-primary text-sm font-bold">2.4 acres</span>
        </div>

        {/* Update button (demo, disabled) */}
        <button
          disabled
          className="w-full py-2.5 rounded-xl bg-farm-surface border border-farm-border text-farm-muted text-xs font-semibold opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
        >
          <MapPin className="w-4 h-4" /> Update Location (Real App Only)
        </button>
      </div>
    </div>
  )
}

function MoreScreen() {
  const [view, setView] = useState(null)   // null | 'notifications' | 'farm-location'
  const [notifItems, setNotifItems] = useState(DEMO_NOTIFICATIONS)
  const unreadCount = notifItems.filter(n => n.unread).length

  if (view === 'notifications') {
    return <NotificationCenterScreen onBack={() => setView(null)} />
  }
  if (view === 'farm-location') {
    return <FarmLocationScreen onBack={() => setView(null)} />
  }

  const settingsWithActions = [
    { icon: MapPin,    label: 'Farm Location',     onClick: () => setView('farm-location') },
    { icon: Leaf,      label: 'Farm Details',       onClick: null },
    { icon: Settings,  label: 'Language',           onClick: null },
    { icon: Bell,      label: 'Alert Preferences',  onClick: null },
    { icon: User,      label: 'Change Password',    onClick: null },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="bg-farm-surface border-b border-farm-border px-3 py-2 flex-shrink-0">
        <p className="text-white text-xs font-bold">More</p>
      </div>
      <div className="flex-1 p-3 space-y-3">
        {/* Profile */}
        <div className="p-3 rounded-xl bg-farm-surface border border-farm-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-farm-primary/20 border border-farm-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-farm-primary text-sm font-bold">A</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold">Ahmad Rizal</p>
            <p className="text-farm-muted text-[10px] truncate">ahmad@farm.my</p>
            <span className="inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.5 bg-farm-primary/10 border border-farm-primary/20 text-farm-primary rounded-full">Farmer</span>
          </div>
        </div>

        {/* Notification shortcut */}
        <button
          onClick={() => setView('notifications')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-farm-surface border border-farm-border hover:bg-farm-surface2 transition-colors text-left"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-blue-400" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-semibold">Notification Center</p>
            <p className="text-farm-muted text-[9px]">{unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up'}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-farm-muted -rotate-90 flex-shrink-0" />
        </button>

        {/* Settings */}
        <div>
          <p className="text-farm-muted text-[10px] font-medium uppercase tracking-wide mb-2">Settings</p>
          <div className="rounded-xl overflow-hidden border border-farm-border divide-y divide-farm-border">
            {settingsWithActions.map(({ icon: Icon, label, onClick }) => (
              <div
                key={label}
                onClick={onClick || undefined}
                className={`flex items-center gap-2.5 px-3 py-2.5 bg-farm-surface transition-colors
                  ${onClick ? 'cursor-pointer hover:bg-farm-surface2' : 'opacity-60'}`}
              >
                <Icon className="w-4 h-4 text-farm-muted flex-shrink-0" />
                <span className="text-white text-xs flex-1">{label}</span>
                {onClick
                  ? <ChevronDown className="w-3.5 h-3.5 text-farm-muted -rotate-90 flex-shrink-0" />
                  : <span className="text-[8px] text-farm-muted border border-farm-border rounded px-1 py-0.5">App only</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Phone Frame ───────────────────────────────────────────────

function PhoneFrame({ activeTab, onTabChange, children }) {
  return (
    <div className="relative flex justify-center">
      {/* Decorative side buttons */}
      <div className="absolute -left-[5px] top-[88px]  w-[5px] h-7  bg-[#2a2a2a] rounded-l-sm" />
      <div className="absolute -left-[5px] top-[128px] w-[5px] h-10 bg-[#2a2a2a] rounded-l-sm" />
      <div className="absolute -left-[5px] top-[152px] w-[5px] h-10 bg-[#2a2a2a] rounded-l-sm" />
      <div className="absolute -right-[5px] top-[118px] w-[5px] h-14 bg-[#2a2a2a] rounded-r-sm" />

      {/* Bezel */}
      <div
        className="relative bg-[#111] flex flex-col overflow-hidden"
        style={{
          width: 375,
          height: 760,
          borderRadius: 44,
          boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 2px #2a2a2a',
        }}
      >
        {/* Screen highlight ring */}
        <div
          className="absolute inset-[3px] pointer-events-none z-20"
          style={{ borderRadius: 41, border: '1px solid rgba(255,255,255,0.06)' }}
        />

        <PhoneStatusBar />

        {/* App screen area */}
        <div className="flex-1 overflow-hidden bg-farm-bg relative">
          <div key={activeTab} className="h-full animate-fade-up">
            {children}
          </div>
        </div>

        <PhoneBottomNav activeTab={activeTab} onTabChange={onTabChange} />

        {/* Home indicator */}
        <div className="bg-[#0d0d0d] py-2 flex justify-center flex-shrink-0">
          <div className="w-28 h-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ─── Outer Page Sections ───────────────────────────────────────

function DemoHeader() {
  return (
    <header className="sticky top-0 z-50 bg-farm-bg/95 backdrop-blur border-b border-farm-border px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/agroezuran_icon_allmode.svg" className="w-7 h-7" alt="AgroEzuran" />
        <span className="text-white font-bold text-sm">AgroEzuran</span>
        <span className="hidden sm:inline px-2 py-0.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-[10px] font-bold rounded-full uppercase tracking-wide ml-1">
          Interactive Demo
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/" className="text-farm-muted hover:text-white text-sm transition-colors hidden sm:inline">
          ← Home
        </Link>
        <Link
          to="/register"
          className="flex items-center gap-1.5 bg-farm-primary text-farm-bg font-semibold rounded-lg px-3 py-1.5 text-sm hover:bg-farm-primary/90 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Get Started</span>
        </Link>
      </div>
    </header>
  )
}

function AnnotationCard({ tab }) {
  const ann = ANNOTATIONS[tab]
  const TabIcon = TABS.find(t => t.id === tab)?.icon || Leaf
  return (
    <div className="card p-5 border-farm-primary/20 animate-fade-up">
      <div className="w-8 h-8 bg-farm-primary/10 rounded-lg flex items-center justify-center mb-3">
        <TabIcon className="w-4 h-4 text-farm-primary" />
      </div>
      <p className="text-white font-semibold text-sm mb-1.5">{ann.title}</p>
      <p className="text-farm-muted text-xs leading-relaxed">{ann.body}</p>
    </div>
  )
}

function LeftPanel({ activeTab }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-white text-xl font-bold leading-snug mb-2">
          This is what the app<br />looks like on your phone
        </h2>
        <p className="text-farm-muted text-sm leading-relaxed">
          Tap the tabs to explore each feature. Sensor values update live every 3 seconds.
        </p>
      </div>
      <div key={activeTab}>
        <AnnotationCard tab={activeTab} />
      </div>
      <div className="space-y-1">
        {TABS.map(({ id, icon: Icon, label }) => (
          <div key={id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200
            ${activeTab === id ? 'text-farm-primary bg-farm-primary/5' : 'text-farm-muted'}`}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{label}</span>
            {activeTab === id && <span className="ml-auto w-1.5 h-1.5 bg-farm-primary rounded-full" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function RightPanel() {
  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5 text-center">
        <div className="w-12 h-12 bg-farm-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Smartphone className="w-6 h-6 text-farm-primary" />
        </div>
        <p className="text-white font-semibold text-sm mb-1">Get the Real App</p>
        <p className="text-farm-muted text-xs mb-4 leading-relaxed">Connect your ESP32, claim your device, and start monitoring your real farm.</p>
        <a
          href={APK_URL}
          download
          className="w-full flex items-center justify-center gap-2 bg-farm-primary text-farm-bg font-semibold rounded-xl px-4 py-2.5 text-sm hover:bg-farm-primary/90 transition-all mb-2 glow-sm"
        >
          <Download className="w-4 h-4" /> Download APK
        </a>
        <Link
          to="/register"
          className="w-full flex items-center justify-center gap-2 border border-farm-border text-farm-muted rounded-xl px-4 py-2 text-sm hover:text-white hover:border-farm-primary/50 transition-all"
        >
          <UserPlus className="w-4 h-4" /> Sign Up Free
        </Link>
      </div>

      <div className="card p-5">
        <p className="text-white font-semibold text-sm mb-3">More in the Full App</p>
        <ul className="space-y-2">
          {['Historical sensor graphs', 'Push notification alerts', 'Farm map & GPS', 'Crop management', 'Offline support'].map(f => (
            <li key={f} className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-farm-primary mt-0.5 flex-shrink-0" />
              <span className="text-farm-muted text-xs">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────

export default function Demo() {
  const data = useJitteredData()
  const dataRef = useRef(data)
  dataRef.current = data

  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedCrop, setSelectedCrop] = useState('tomato')
  const [errorIdx, setErrorIdx] = useState(null)

  const [pumpOn, setPumpOn] = useState(false)
  const [pumpLoading, setPumpLoading] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [soilThreshold, setSoilThreshold] = useState(40)

  const [messages, setMessages] = useState(PRE_LOADED_CHAT)
  const [chatInput, setChatInput] = useState('')
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    if (autoMode) setPumpOn(data.soil < soilThreshold)
  }, [data.soil, autoMode, soilThreshold])

  async function handlePump(state) {
    if (autoMode || pumpLoading) return
    setPumpLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setPumpOn(state)
    setPumpLoading(false)
  }

  function handleToggleError() {
    setErrorIdx(prev => prev !== null ? null : Math.floor(Math.random() * SENSOR_KEYS.length))
  }

  function renderScreen() {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen data={data} selectedCrop={selectedCrop} onCropChange={setSelectedCrop} />
      case 'sensors':
        return <SensorsScreen data={data} selectedCrop={selectedCrop} onCropChange={setSelectedCrop} errorIdx={errorIdx} onToggleError={handleToggleError} />
      case 'irrigation':
        return (
          <IrrigationScreen
            data={data} selectedCrop={selectedCrop} onCropChange={setSelectedCrop}
            pumpOn={pumpOn} pumpLoading={pumpLoading} autoMode={autoMode}
            soilThreshold={soilThreshold} setSoilThreshold={setSoilThreshold}
            onTogglePump={handlePump} onToggleAuto={setAutoMode}
          />
        )
      case 'ai-chat':
        return (
          <AiChatScreen
            messages={messages} setMessages={setMessages}
            chatInput={chatInput} setChatInput={setChatInput}
            typing={typing} setTyping={setTyping}
            dataRef={dataRef}
          />
        )
      case 'more':
        return <MoreScreen />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-farm-bg text-white">
      <DemoHeader />

      {/* Demo notice banner */}
      <div className="bg-yellow-400/8 border-b border-yellow-400/20 px-4 py-2 flex items-center justify-center gap-2">
        <span className="text-yellow-300 text-[10px]">⚠️</span>
        <p className="text-yellow-200/80 text-[11px] text-center leading-snug">
          This is a <span className="font-semibold text-yellow-300">simplified interactive preview</span> — some features, data, and visuals may differ from the actual mobile app.
        </p>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-16">
        {/* Mobile headline */}
        <div className="lg:hidden text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">Try AgroEzuran Live</h1>
          <p className="text-farm-muted text-sm">Tap the tabs to explore each feature</p>
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-10">
          {/* Left column */}
          <div className="hidden lg:block w-64 xl:w-72 flex-shrink-0 pt-4">
            <LeftPanel activeTab={activeTab} />
          </div>

          {/* Phone */}
          <div className="flex flex-col items-center flex-shrink-0 w-full lg:w-auto">
            <div className="transform scale-[0.78] sm:scale-90 md:scale-100 origin-top">
              <PhoneFrame activeTab={activeTab} onTabChange={setActiveTab}>
                {renderScreen()}
              </PhoneFrame>
            </div>
          </div>

          {/* Right column */}
          <div className="hidden lg:block w-56 xl:w-64 flex-shrink-0 pt-4">
            <RightPanel />
          </div>
        </div>

        {/* Mobile: annotation + CTAs below phone */}
        <div className="lg:hidden mt-4 space-y-4">
          <div key={activeTab}>
            <AnnotationCard tab={activeTab} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={APK_URL}
              download
              className="flex items-center justify-center gap-2 bg-farm-primary text-farm-bg font-semibold rounded-xl px-6 py-3 text-sm hover:bg-farm-primary/90 transition-all glow-sm"
            >
              <Download className="w-4 h-4" /> Download APK
            </a>
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 border border-farm-border text-white rounded-xl px-6 py-3 text-sm hover:border-farm-primary/50 hover:bg-white/5 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Get Started Free
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
