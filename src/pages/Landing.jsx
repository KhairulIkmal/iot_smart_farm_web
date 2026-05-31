import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// ─── App Screenshots ──────────────────────────────────────────
const _screenshotModules = import.meta.glob(
  '../assets/app-preview/*.jpeg',
  { eager: true }
)
const APP_SCREENSHOTS = Object.entries(_screenshotModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => mod.default)

// ─── Lucide (UI / nav only) ────────────────────────────────────
import {
  Menu, X, Download, LogIn, UserPlus, ChevronDown,
  ArrowRight, Smartphone, ExternalLink,
} from 'lucide-react'

// ─── Phosphor Icons (features, steps) ─────────────────────────
import {
  PiChartLineUpBold,
  PiDropBold,
  PiRobotBold,
  PiCloudSunBold,
  PiBellRingingBold,
  PiChartBarBold,
  PiPlantBold,
  PiMapPinBold,
  PiChatBold,
  PiHeartbeatBold,
  PiTranslateBold,
  PiMoonBold,
  PiUserPlusBold,
  PiQrCodeBold,
  PiDeviceMobileBold,
  PiGearBold,
  PiDownloadSimpleBold,
  PiWifiHigh,
  PiCpuBold,
  PiScanBold,
  PiSparkleBold,
  PiCircuitryBold,
  PiTimerBold,
  PiLightningBold,
} from 'react-icons/pi'

// ─── Game Icons (farm-themed decorations) ─────────────────────
import {
  GiWheat,
  GiSprout,
  GiWateringCan,
  GiThermometerHot,
  GiLeafSwirl,
} from 'react-icons/gi'

// ─── Simple Icons (brand logos — tech stack) ──────────────────
import {
  SiFlutter,
  SiFirebase,
  SiArduino,
  SiAnthropic,
  SiOpenstreetmap,
} from 'react-icons/si'

// ─── Config ──────────────────────────────────────────────────
const APK_URL = 'https://www.mediafire.com/file/mkl0o0yhmii5pq9/AgroEzuran.apk/file'
const GITHUB_URL = 'https://github.com/Kaiszee/iot_smart_farm_app'

// ─── Hook: scroll animation ───────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

function AnimatedSection({ children, className = '' }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-farm-bg/95 backdrop-blur border-b border-farm-border shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="/agroezuran_icon_allmode.svg" className="w-9 h-9" alt="AgroEzuran" />
            <span className="text-xl font-bold text-white">AgroEzuran</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href="#features" className="relative text-farm-muted hover:text-white transition-colors text-sm px-3 py-1.5 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-farm-primary after:transition-all after:duration-300 hover:after:w-full">Features</a>
            <a href="#how-it-works" className="relative text-farm-muted hover:text-white transition-colors text-sm px-3 py-1.5 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-farm-primary after:transition-all after:duration-300 hover:after:w-full">How It Works</a>
            <Link to="/demo" className="relative text-farm-muted hover:text-white transition-colors text-sm px-3 py-1.5 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-farm-primary after:transition-all after:duration-300 hover:after:w-full">Demo</Link>
            <Link to="/login" className="flex items-center gap-1.5 text-farm-muted hover:text-white border border-farm-border rounded-lg px-3 py-1.5 text-sm transition-all duration-200 hover:border-farm-primary/50 hover:bg-white/5 hover:-translate-y-0.5">
              <LogIn className="w-4 h-4" /> Login
            </Link>
            <Link to="/register" className="flex items-center gap-1.5 bg-farm-primary text-farm-bg font-semibold rounded-lg px-4 py-1.5 text-sm hover:bg-farm-primary/90 transition-all duration-200 hover:-translate-y-0.5 glow-sm">
              <UserPlus className="w-4 h-4" /> Get Started
            </Link>
          </div>
          <button className="md:hidden text-farm-muted hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-farm-surface border-t border-farm-border px-4 py-4 flex flex-col gap-3 animate-slideDown">
          <a href="#features" className="text-farm-muted hover:text-white py-2" onClick={() => setOpen(false)}>Features</a>
          <a href="#how-it-works" className="text-farm-muted hover:text-white py-2" onClick={() => setOpen(false)}>How It Works</a>
          <Link to="/demo" className="text-farm-muted hover:text-white py-2" onClick={() => setOpen(false)}>Demo</Link>
          <Link to="/login" className="flex items-center gap-2 border border-farm-border rounded-lg px-4 py-2 text-sm">
            <LogIn className="w-4 h-4" /> Login
          </Link>
          <Link to="/register" className="flex items-center gap-2 bg-farm-primary text-farm-bg font-semibold rounded-lg px-4 py-2 text-sm">
            <UserPlus className="w-4 h-4" /> Get Started
          </Link>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────
function Hero() {
  const floatingIcons = [
    { icon: GiWheat,          pos: 'top-1/4 left-12',    delay: '0s',   size: 'w-10 h-10' },
    { icon: GiThermometerHot, pos: 'top-1/3 right-16',   delay: '1s',   size: 'w-9 h-9' },
    { icon: GiWateringCan,    pos: 'bottom-1/3 left-20', delay: '2s',   size: 'w-10 h-10' },
    { icon: PiChartLineUpBold,pos: 'bottom-1/4 right-12',delay: '0.5s', size: 'w-8 h-8' },
    { icon: GiSprout,         pos: 'top-2/3 left-1/3',   delay: '1.5s', size: 'w-9 h-9' },
    { icon: GiLeafSwirl,      pos: 'top-1/2 right-1/3',  delay: '2.5s', size: 'w-8 h-8' },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-farm-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-farm-primary/8 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-farm-primary/3 rounded-full blur-3xl animate-float-slow" />
        {floatingIcons.map(({ icon: Icon, pos, delay, size }, i) => (
          <div key={i} className={`absolute ${pos} text-farm-primary/20 animate-float`} style={{ animationDelay: delay }}>
            <Icon className={size} />
          </div>
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto px-4 text-center">

        {/* Logo + badge stacked cleanly */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <img
            src="/agroezuran_logo_allmode.svg"
            className="w-full max-w-2xl h-auto"

            alt="AgroEzuran"
          />
          <div className="inline-flex items-center gap-2 bg-farm-primary/10 border border-farm-primary/30 rounded-full px-4 py-1.5 text-sm text-farm-primary">
            <span className="w-2 h-2 bg-farm-primary rounded-full animate-pulse-green" />
            Now available on Android
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
          Farm Smarter,
          <br />
          <span className="text-gradient">Not Harder</span>
        </h1>

        <p className="text-farm-muted text-lg sm:text-xl max-w-2xl mx-auto mb-6 leading-relaxed">
          Monitor your farm live, auto-irrigate smartly, and get AI crop advice — right from your phone.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {[
            { label: '15 Features',    Icon: PiSparkleBold,   color: 'text-farm-primary' },
            { label: '5 Sensor Types', Icon: PiCircuitryBold, color: 'text-blue-400' },
            { label: '5s Live Updates',Icon: PiTimerBold,     color: 'text-yellow-400' },
            { label: 'AI-Powered',     Icon: PiRobotBold,     color: 'text-purple-400' },
            { label: '2 Languages',    Icon: PiTranslateBold, color: 'text-pink-400' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-farm-surface border border-farm-border rounded-full px-3 py-1.5 text-xs text-farm-muted hover:border-farm-primary/30 hover:text-white transition-all duration-200">
              <s.Icon className={`w-3.5 h-3.5 ${s.color}`} /> {s.label}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-farm-primary text-farm-bg font-bold rounded-xl px-8 py-4 text-base hover:bg-farm-primary/90 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_0_24px_rgba(74,222,128,0.4)] glow">
            <UserPlus className="w-5 h-5" /> Get Started Free
          </Link>
          <Link to="/demo" className="w-full sm:w-auto flex items-center justify-center gap-2 border border-farm-primary/50 text-farm-primary rounded-xl px-8 py-4 text-base hover:bg-farm-primary/10 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
            <Smartphone className="w-5 h-5" /> Try Live Demo
          </Link>
          <a href={APK_URL} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-farm-surface border border-farm-border text-farm-primary rounded-xl px-8 py-4 text-base hover:border-farm-primary transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0" download>
            <Download className="w-5 h-5" /> Download APK
          </a>
        </div>

        <div className="mt-16 flex justify-center">
          <a href="#app-preview" className="flex flex-col items-center gap-2 text-farm-muted hover:text-farm-primary transition-colors animate-bounce">
            <span className="text-sm">See the app</span>
            <ChevronDown className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── App Preview ──────────────────────────────────────────────
const CARD_LABELS = [
  'AI Assistant', 'Analytics', 'Auto Irrigation',
  'Crop Management', 'Dashboard', 'Interactive Map',
  'Manual Irrigation', 'Notifications', 'Weather Forecast',
]

function AppPreview() {
  const outerRef = useRef(null)
  const stripRef = useRef(null)
  const cardRefs = useRef([])
  const progressBarRef = useRef(null)
  const hintRef = useRef(null)
  const initOffsetRef = useRef(null)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    const outer = outerRef.current
    const strip = stripRef.current
    if (!outer || !strip) return
    const update = () => {
      const rect = outer.getBoundingClientRect()
      const scrolled = -rect.top
      const totalScroll = rect.height - window.innerHeight
      if (totalScroll <= 0) return
      const p = Math.max(0, Math.min(1, scrolled / totalScroll))
      const maxTranslate = strip.scrollWidth - window.innerWidth
      if (initOffsetRef.current === null) {
        const c = cardRefs.current[2]
        if (c) {
          const cr = c.getBoundingClientRect()
          initOffsetRef.current = Math.max(0, Math.min(maxTranslate, cr.left + cr.width / 2 - window.innerWidth / 2))
        } else {
          initOffsetRef.current = 0
        }
      }
      const init = initOffsetRef.current
      const offset = init + p * (maxTranslate - init)
      strip.style.transform = `translateX(-${offset}px)`
      if (progressBarRef.current) progressBarRef.current.style.width = `${p * 100}%`
      if (hintRef.current) hintRef.current.style.opacity = p < 0.04 ? '1' : '0'
      const vCenter = window.innerWidth / 2
      cardRefs.current.forEach((card) => {
        if (!card) return
        const cr = card.getBoundingClientRect()
        const t = Math.min(1, Math.abs(cr.left + cr.width / 2 - vCenter) / (vCenter * 0.9))
        card.style.transform = `scale(${1.18 - t * 0.36})`
        card.style.opacity = 1 - t * 0.55
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    requestAnimationFrame(update)
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  return (
    <section id="app-preview" ref={outerRef} style={{ height: '320vh' }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col bg-farm-bg">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-farm-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="flex-1 flex flex-col items-center min-h-0">
          <div className="relative px-6 pt-10 pb-5 text-center flex-shrink-0">
            <div className="inline-flex items-center gap-2 bg-farm-primary/10 border border-farm-primary/30 rounded-full px-4 py-1.5 text-xs text-farm-primary mb-3 font-semibold uppercase tracking-wide">
              <PiDeviceMobileBold className="w-3.5 h-3.5" /> App Preview
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-1">See Every Screen</h2>
            <p className="text-farm-muted text-sm sm:text-base">Scroll to explore all 9 screens of the AgroEzuran mobile app</p>
          </div>
          <div className="flex-1 w-full flex items-center min-h-0 overflow-hidden">
          <div
            ref={stripRef}
            className="relative flex items-center gap-8 px-[max(80px,calc((100vw-600px)/2))]"
            style={{ willChange: 'transform', paddingRight: '80px' }}
          >
            {APP_SCREENSHOTS.map((src, i) => (
              <div
                key={i}
                ref={el => { cardRefs.current[i] = el }}
                className="flex-shrink-0 group relative cursor-pointer"
                style={{ width: 'clamp(170px, 17vw, 240px)', transformOrigin: 'center center', transition: 'transform 0.12s ease, opacity 0.12s ease', willChange: 'transform, opacity' }}
                onClick={() => setLightbox({ src, label: CARD_LABELS[i] ?? `Screen ${i + 1}` })}
              >
                <div className="absolute -inset-[3px] rounded-[14px] opacity-0 group-hover:opacity-100 pointer-events-none" style={{ transition: 'opacity 0.3s ease', boxShadow: '0 0 18px 4px rgba(74,222,128,0.45), 0 0 40px 8px rgba(74,222,128,0.18)', zIndex: 0 }} />
                <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '9/19.5', boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset', border: '1px solid rgba(255,255,255,0.07)', zIndex: 1 }}>
                  <img src={src} alt={CARD_LABELS[i]} className="w-full h-full object-cover object-top" draggable={false} />
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-white text-[10px] font-medium">Tap to expand</div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent pt-8 pb-2.5 px-3">
                    <p className="text-white/90 text-[10px] font-medium text-center tracking-wide">{CARD_LABELS[i]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
        <div ref={hintRef} className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 text-farm-muted text-xs pointer-events-none" style={{ transition: 'opacity 0.4s ease', opacity: 1 }}>
          <ChevronDown className="w-4 h-4 animate-bounce" />
          <span>Keep scrolling</span>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-0.5 bg-farm-border rounded-full overflow-hidden">
          <div ref={progressBarRef} className="h-full bg-farm-primary rounded-full" style={{ width: '0%', transition: 'width 0.1s linear' }} />
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md" style={{ animation: 'lightboxIn 0.2s ease' }} onClick={() => setLightbox(null)}>
          <style>{`@keyframes lightboxIn { from { opacity: 0; } to { opacity: 1; } } @keyframes lightboxPop { from { transform: scale(0.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
          <div className="relative flex flex-col items-center" style={{ animation: 'lightboxPop 0.22s cubic-bezier(0.34,1.56,0.64,1)' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.label} className="rounded-2xl shadow-2xl" style={{ maxHeight: '82vh', maxWidth: 'min(88vw, 380px)', width: 'auto' }} draggable={false} />
            <p className="text-white/60 text-sm mt-3 font-medium">{lightbox.label}</p>
            <button onClick={() => setLightbox(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-farm-surface border border-farm-border flex items-center justify-center text-farm-muted hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────
const features = [
  { icon: PiChartLineUpBold,   color: 'text-blue-400',    bg: 'bg-blue-400/10',    title: 'Real-Time Dashboard',      desc: 'Live soil moisture, pH, temperature, humidity, and water tank level — refreshed every 5 seconds directly from your ESP32 via Firebase RTDB.' },
  { icon: PiDropBold,          color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    title: 'Smart Irrigation Control', desc: 'Manual pump control or auto-threshold mode. Set soil min/max targets (FAO-56 sourced per crop) — the pump activates and stops automatically.' },
  { icon: PiRobotBold,         color: 'text-farm-primary',bg: 'bg-farm-primary/10',title: 'AI Crop Advisor',          desc: 'Powered by Claude AI. Ask any farming question — the AI fetches your live sensor data first and replies with crop-specific, context-aware advice.' },
  { icon: PiCloudSunBold,      color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  title: 'Weather Forecast',         desc: 'Hourly and 7-day weather forecasts tied to your GPS farm location via OpenWeatherMap. Plan irrigation around rain and temperature swings.' },
  { icon: PiBellRingingBold,   color: 'text-red-400',     bg: 'bg-red-400/10',     title: 'Push Notifications',       desc: 'FCM alerts for device offline, critical sensor breaches, pump overtime, and extreme weather. 8 category tabs with swipe-to-archive.' },
  { icon: PiChartBarBold,      color: 'text-indigo-400',  bg: 'bg-indigo-400/10',  title: 'Sensor Analytics',         desc: 'Historical graphs for every sensor reading. Track trends over time to spot soil degradation, water loss, or irregular pH patterns.' },
  { icon: PiPlantBold,         color: 'text-emerald-400', bg: 'bg-emerald-400/10', title: 'Crop Management',          desc: 'Manage multiple crop profiles, each linked to an ESP32 device. Claim your device with an AGR-XXXX-XXXX code and get FAO-standard thresholds loaded automatically.' },
  { icon: PiMapPinBold,        color: 'text-teal-400',    bg: 'bg-teal-400/10',    title: 'Farm Location Map',        desc: 'Drop a GPS pin anywhere on the interactive OpenStreetMap. Your location powers weather forecasts and farm profile.' },
  { icon: PiChatBold,          color: 'text-purple-400',  bg: 'bg-purple-400/10',  title: 'Support Tickets',          desc: 'Create support tickets that auto-attach your device info. Real-time chat thread per ticket — messages sync live between you and admin.' },
  { icon: PiHeartbeatBold,     color: 'text-orange-400',  bg: 'bg-orange-400/10',  title: 'Sensor Health Scoring',    desc: 'Every sensor gets a live health status (ok / warning / error). Know immediately if a hardware sensor needs attention before it affects your crop.' },
  { icon: PiTranslateBold,     color: 'text-pink-400',    bg: 'bg-pink-400/10',    title: 'Bilingual UI',             desc: 'Full support for English and Bahasa Malaysia. Switch language live from Preferences — no restart needed.' },
  { icon: PiMoonBold,          color: 'text-slate-400',   bg: 'bg-slate-400/10',   title: 'Dark & Light Mode',        desc: 'System-aware theme that follows your device setting, or toggle manually. Every screen designed for both modes.' },
]

function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-farm-primary/10 border border-farm-primary/30 rounded-full px-4 py-1.5 text-sm text-farm-primary mb-4">
            ✨ 15 Features Built In
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Everything Your Farm Needs</h2>
          <p className="text-farm-muted text-lg max-w-xl mx-auto">One app. Real sensors. Real AI. Complete control.</p>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <AnimatedSection key={i}>
              <div className="card p-6 h-full hover:-translate-y-1 hover:border-farm-primary/30 hover:shadow-[0_8px_28px_rgba(74,222,128,0.08)] transition-all duration-300 ease-out group cursor-default">
                <div className={`${f.bg} rounded-xl p-3 w-fit mb-4 group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(74,222,128,0.2)] transition-all duration-300`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-farm-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── AI Spotlight ─────────────────────────────────────────────
function AISpotlight() {
  const suggestions = [
    'When should I irrigate my tomatoes today?',
    'Is my soil pH safe for this crop?',
    'My water level is low — what should I do?',
    'Explain my current sensor readings',
  ]
  return (
    <section className="py-24 px-4 bg-farm-surface/30">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-farm-primary/10 border border-farm-primary/30 rounded-full px-4 py-1.5 text-sm text-farm-primary mb-4">
            <PiRobotBold className="w-4 h-4" /> Claude AI — Powered by Anthropic
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Your Personal Farm Advisor</h2>
          <p className="text-farm-muted text-lg max-w-2xl mx-auto">
            The AI doesn't just answer questions — it fetches your live sensor data first,
            then responds with advice specific to your crop, soil, and current conditions.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <AnimatedSection>
            <div className="space-y-4">
              {[
                { step: '01', icon: PiWifiHigh,        title: 'Reads your live sensors',    desc: 'Before replying, the AI fetches your current soil moisture, pH, temperature, humidity, water level, and pump status from Firebase.' },
                { step: '02', icon: PiPlantBold,       title: 'Knows your crop',            desc: "It knows which crop you're growing and its FAO-sourced optimal ranges. No generic advice." },
                { step: '03', icon: PiChatBold,        title: 'Replies in plain language',  desc: 'Responses are formatted with bold highlights, bullet points, and numbered steps — easy to read on a phone screen.' },
                { step: '04', icon: PiDropBold,        title: 'Apply to irrigation',        desc: 'AI recommendations include a one-tap "Apply to Irrigation" button that writes the thresholds directly to your auto-irrigation rules.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-farm-primary/10 border border-farm-primary/30 flex items-center justify-center text-farm-primary text-xs font-black group-hover:bg-farm-primary/20 transition-colors">
                    {item.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon className="w-4 h-4 text-farm-primary" />
                      <h4 className="text-white font-semibold">{item.title}</h4>
                    </div>
                    <p className="text-farm-muted text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-farm-primary/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-farm-border">
                  <div className="w-9 h-9 rounded-full bg-farm-primary/20 flex items-center justify-center">
                    <PiRobotBold className="w-5 h-5 text-farm-primary" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">AI Farm Advisor</p>
                    <p className="text-farm-primary text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-farm-primary rounded-full animate-pulse inline-block" />
                      Reading your sensors…
                    </p>
                  </div>
                </div>
                <p className="text-farm-muted text-xs mb-3">Suggested questions:</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {suggestions.map((q, i) => (
                    <span key={i} className="bg-farm-surface border border-farm-border rounded-full px-3 py-1 text-xs text-farm-muted hover:border-farm-primary/40 hover:text-white cursor-default transition-colors">
                      {q}
                    </span>
                  ))}
                </div>
                <div className="bg-farm-surface rounded-xl p-4 border border-farm-border">
                  <p className="text-white text-sm leading-relaxed">
                    Your <span className="text-farm-primary font-semibold">soil moisture is at 38%</span> — below the optimal 60–80% range for tomatoes.{' '}
                    <span className="text-yellow-400 font-semibold">Irrigation is recommended now.</span>
                    {' '}With today's temperature at 34°C, soil will dry faster than usual.
                  </p>
                  <div className="mt-3 pt-3 border-t border-farm-border">
                    <button className="w-full py-2 rounded-lg bg-farm-primary/20 border border-farm-primary/40 text-farm-primary text-xs font-semibold hover:bg-farm-primary/30 transition-colors cursor-default">
                      ✓ Apply thresholds to Auto Irrigation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────
const steps = [
  { num: '01', icon: PiUserPlusBold,  title: 'Register & Onboard',    badge: null,               desc: 'Create your account, then go through 4 quick onboarding slides that walk you through the app — shown once on first launch.' },
  { num: '02', icon: PiQrCodeBold,    title: 'Claim Your Device',      badge: 'AGR-XXXX-XXXX',    desc: 'Enter the AGR-XXXX-XXXX code printed on your ESP32 unit. The app links the device to your account and loads crop thresholds automatically.' },
  { num: '03', icon: PiMapPinBold,    title: 'Pin Your Farm Location', badge: null,               desc: 'Drop a GPS marker on the interactive map. Your location powers weather forecasts and farm profile — adjustable anytime.' },
  { num: '04', icon: PiChartLineUpBold,title: 'Monitor Live Data',     badge: 'Live • 5s refresh', desc: 'Your dashboard goes live. Soil, pH, temperature, humidity, and water level stream directly from your ESP32 every 5 seconds.' },
  { num: '05', icon: PiRobotBold,     title: 'AI + Auto Irrigation',   badge: null,               desc: 'Ask the AI crop advisor anything — it reads your sensors before answering. Set auto-irrigation thresholds with one tap and let the system run itself.' },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-farm-muted text-lg">From unboxing to a fully automated farm — in five steps</p>
        </AnimatedSection>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-farm-primary/60 via-farm-primary/30 to-transparent hidden sm:block" />
          <div className="space-y-8">
            {steps.map((s, i) => (
              <AnimatedSection key={i}>
                <div className="flex gap-6 group">
                  <div className="relative flex-shrink-0 hidden sm:flex">
                    <div className="w-12 h-12 rounded-full bg-farm-primary/10 border-2 border-farm-primary flex items-center justify-center glow group-hover:scale-110 group-hover:bg-farm-primary/20 transition-all duration-300 z-10 bg-farm-bg">
                      <span className="text-farm-primary font-black text-sm">{s.num}</span>
                    </div>
                  </div>
                  <div className="flex-1 card p-5 hover:border-farm-primary/30 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(74,222,128,0.07)] transition-all duration-300 ease-out">
                    <div className="flex flex-wrap items-start gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <s.icon className="w-4 h-4 text-farm-primary" />
                        <h3 className="text-white font-bold">{s.title}</h3>
                      </div>
                      {s.badge && (
                        <span className="bg-farm-primary/10 border border-farm-primary/30 text-farm-primary text-[10px] font-mono rounded-full px-2.5 py-0.5">
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-farm-muted text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Notifications Spotlight ──────────────────────────────────
const notifCategories = [
  { label: 'All',      color: 'text-white',        dot: 'bg-white' },
  { label: 'Critical', color: 'text-red-400',       dot: 'bg-red-400' },
  { label: 'Devices',  color: 'text-blue-400',      dot: 'bg-blue-400' },
  { label: 'Water',    color: 'text-cyan-400',      dot: 'bg-cyan-400' },
  { label: 'Crops',    color: 'text-green-400',     dot: 'bg-green-400' },
  { label: 'Weather',  color: 'text-yellow-400',    dot: 'bg-yellow-400' },
  { label: 'System',   color: 'text-purple-400',    dot: 'bg-purple-400' },
  { label: 'Archived', color: 'text-farm-muted',    dot: 'bg-farm-muted' },
]

const sampleNotifs = [
  { icon: '⚠️', title: 'Soil moisture critical',   body: 'Soil at 22% — below threshold for tomatoes',  time: '2m ago',  accent: 'border-l-red-400' },
  { icon: '💧', title: 'Auto irrigation activated', body: 'Pump turned on — soil threshold reached',       time: '5m ago',  accent: '' },
  { icon: '🌡️', title: 'High temperature alert',   body: 'Temperature 38°C — water stress risk',          time: '12m ago', accent: '' },
]

function NotificationsSpotlight() {
  return (
    <section className="py-24 px-4 bg-farm-surface/30">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 text-sm text-red-400 mb-4">
            <PiBellRingingBold className="w-4 h-4" /> Never miss a critical alert
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Smart Notification Inbox</h2>
          <p className="text-farm-muted text-lg max-w-2xl mx-auto">
            All alerts organised into 8 tabs. Swipe left to archive. Swipe right to restore.
            FCM push notifications even when the app is closed.
          </p>
        </AnimatedSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <AnimatedSection>
            <div className="card p-6">
              <p className="text-farm-muted text-xs uppercase tracking-wider mb-4">8 Category Tabs</p>
              <div className="flex flex-wrap gap-2">
                {notifCategories.map((c, i) => (
                  <div key={i} className={`flex items-center gap-1.5 bg-farm-surface border border-farm-border rounded-full px-3 py-1.5 text-sm ${c.color} hover:border-farm-primary/30 transition-colors cursor-default`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    {c.label}
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-farm-border space-y-2">
                {[
                  { icon: '👈', text: 'Swipe left on any alert to archive it' },
                  { icon: '👉', text: 'Swipe right in Archive tab to restore' },
                  { icon: '🗑️', text: '"Clear all" archives everything at once' },
                  { icon: '✅', text: '"Archive read" clears only read alerts' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-farm-muted">
                    <span>{tip.icon}</span> {tip.text}
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
          <AnimatedSection>
            <div className="card p-5 space-y-3">
              <p className="text-farm-muted text-xs uppercase tracking-wider mb-2">Live Alert Feed</p>
              {sampleNotifs.map((n, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-xl bg-farm-surface border border-farm-border hover:border-farm-primary/20 transition-colors ${n.accent ? `border-l-2 ${n.accent}` : ''}`}>
                  <div className="text-xl flex-shrink-0">{n.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      <span className="text-farm-muted text-[10px] flex-shrink-0">{n.time}</span>
                    </div>
                    <p className="text-farm-muted text-xs truncate">{n.body}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-center">
                <span className="text-farm-muted text-xs">+ FCM push even when app is closed</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

// ─── Tech Stack (brand logos) ─────────────────────────────────
const techStack = [
  { icon: SiFlutter,        name: 'Flutter',        desc: 'Mobile framework',        color: 'text-[#54C5F8]',  bg: 'bg-[#54C5F8]/10' },
  { icon: SiFirebase,       name: 'Firebase',       desc: 'RTDB + Firestore + FCM',  color: 'text-[#FFCA28]',  bg: 'bg-[#FFCA28]/10' },
  { icon: SiArduino,        name: 'Arduino / ESP32',desc: 'IoT firmware',            color: 'text-[#00979D]',  bg: 'bg-[#00979D]/10' },
  { icon: SiAnthropic,      name: 'Anthropic',      desc: 'Claude AI advisor',       color: 'text-[#D97706]',  bg: 'bg-[#D97706]/10' },
  { icon: PiCloudSunBold,   name: 'OpenWeatherMap', desc: 'Weather API',             color: 'text-[#EB6E4B]',  bg: 'bg-[#EB6E4B]/10' },
  { icon: SiOpenstreetmap,  name: 'OpenStreetMap',  desc: 'Farm map tiles',          color: 'text-[#7EBC6F]',  bg: 'bg-[#7EBC6F]/10' },
]

function TechStack() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Built With</h2>
          <p className="text-farm-muted">A reliable stack purpose-built for IoT and AI workloads</p>
        </AnimatedSection>
        <AnimatedSection>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((t, i) => (
              <div key={i} className={`card p-5 text-center hover:-translate-y-1.5 hover:border-farm-primary/30 hover:shadow-[0_8px_28px_rgba(74,222,128,0.08)] transition-all duration-300 ease-out cursor-default group ${t.bg} border-farm-border`}>
                <div className={`flex items-center justify-center mb-3 group-hover:scale-125 transition-transform duration-300`}>
                  <t.icon className={`w-9 h-9 ${t.color}`} />
                </div>
                <div className={`text-sm font-bold ${t.color} group-hover:brightness-110 transition-all duration-200`}>{t.name}</div>
                <div className="text-xs text-farm-muted mt-1 leading-tight">{t.desc}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

// ─── Impact Numbers ───────────────────────────────────────────
const impacts = [
  { value: '15',  label: 'Features',          sub: 'Built into the app' },
  { value: '5',   label: 'Sensor Types',       sub: 'Soil · pH · Temp · Humidity · Water' },
  { value: '5s',  label: 'Live Refresh',       sub: 'Real-time RTDB updates' },
  { value: '8',   label: 'Alert Categories',   sub: 'Organised notification inbox' },
  { value: '12+', label: 'Crop Types',         sub: 'FAO-56 thresholds preloaded' },
  { value: '2',   label: 'Languages',          sub: 'English & Bahasa Malaysia' },
]

function ImpactNumbers() {
  return (
    <section className="py-24 px-4 bg-farm-surface/30">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">By the Numbers</h2>
          <p className="text-farm-muted">A complete system — not a prototype</p>
        </AnimatedSection>
        <AnimatedSection>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {impacts.map((item, i) => (
              <div key={i} className="card p-6 text-center hover:-translate-y-1 hover:border-farm-primary/40 hover:shadow-[0_8px_28px_rgba(74,222,128,0.08)] transition-all duration-300 ease-out group">
                <div className="text-5xl font-black text-gradient mb-2 group-hover:scale-110 transition-transform duration-300 inline-block">{item.value}</div>
                <div className="text-white font-semibold">{item.label}</div>
                <div className="text-farm-muted text-xs mt-1">{item.sub}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

// ─── Get Started ──────────────────────────────────────────────
const startSteps = [
  { num: '01', icon: PiDownloadSimpleBold, title: 'Download the APK',       desc: 'Tap the Download button to save the Android installer to your device.' },
  { num: '02', icon: PiGearBold,           title: 'Enable Unknown Sources',  desc: 'Go to Settings → Security → Install Unknown Apps and allow your browser or file manager.' },
  { num: '03', icon: PiDeviceMobileBold,   title: 'Install the App',         desc: 'Open the downloaded APK file and tap Install. Takes about 10 seconds.' },
  { num: '04', icon: PiUserPlusBold,       title: 'Register & Onboard',      desc: 'Create your account with email and complete the 4-slide onboarding walkthrough.' },
  { num: '05', icon: PiScanBold,           title: 'Enter Your AGR Code',     desc: 'Go to Crop Management → Claim Device and enter the AGR-XXXX-XXXX code printed on your ESP32 unit.' },
  { num: '06', icon: PiChartLineUpBold,    title: 'Your Farm is Live',        desc: 'Dashboard activates instantly. Monitor sensor data, control irrigation, and chat with your AI advisor.' },
]

function GetStarted() {
  return (
    <section id="get-started" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Get Started in Minutes</h2>
          <p className="text-farm-muted text-lg mb-8">Install the app and connect your farm in 6 simple steps</p>
          <a
            href={APK_URL}
            download
            className="inline-flex items-center gap-3 bg-farm-primary text-farm-bg font-bold rounded-2xl px-10 py-4 text-lg hover:bg-farm-primary/90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(74,222,128,0.4)] glow"
          >
            <PiDownloadSimpleBold className="w-6 h-6" />
            Download APK (Android)
          </a>
        </AnimatedSection>
        <div className="relative">
          <div className="hidden lg:block absolute top-10 left-[8.33%] right-[8.33%] h-0.5 bg-farm-border" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {startSteps.map((s, i) => (
              <AnimatedSection key={i}>
                <div className="card p-6 relative group hover:border-farm-primary/40 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(74,222,128,0.08)] transition-all duration-300 ease-out">
                  {i < 5 && i % 3 !== 2 && (
                    <div className="hidden lg:flex absolute -right-4 top-10 z-10">
                      <ArrowRight className="w-4 h-4 text-farm-primary/40" />
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-farm-primary/10 border-2 border-farm-primary flex items-center justify-center group-hover:glow group-hover:scale-110 group-hover:shadow-[0_0_14px_rgba(74,222,128,0.3)] transition-all duration-300">
                      <span className="text-farm-primary font-black text-sm">{s.num}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <s.icon className="w-4 h-4 text-farm-muted group-hover:text-farm-primary transition-colors duration-200" />
                        <h3 className="font-semibold text-white">{s.title}</h3>
                      </div>
                      <p className="text-farm-muted text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24 px-4 bg-farm-surface/30">
      <div className="max-w-2xl mx-auto text-center">
        <AnimatedSection>
          <div className="card p-10 relative overflow-hidden hover:border-farm-primary/20 hover:shadow-[0_8px_32px_rgba(74,222,128,0.06)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-farm-primary/5 to-transparent" />
            <div className="relative">
              <GiSprout className="w-14 h-14 text-farm-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-3">Ready to farm smarter?</h2>
              <p className="text-farm-muted mb-8 max-w-md mx-auto leading-relaxed">
                Connect your ESP32, claim your device, and have a fully automated farm
                monitoring system running today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-farm-primary text-farm-bg font-bold rounded-xl px-8 py-3.5 hover:bg-farm-primary/90 transition-all duration-200 hover:-translate-y-0.5 glow">
                  <UserPlus className="w-5 h-5" /> Create Free Account
                </Link>
                <a href={APK_URL} download className="w-full sm:w-auto flex items-center justify-center gap-2 bg-farm-surface border border-farm-border text-farm-primary rounded-xl px-8 py-3.5 hover:border-farm-primary transition-all duration-200 hover:-translate-y-0.5">
                  <Download className="w-5 h-5" /> Download APK
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-farm-border py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/agroezuran_icon_allmode.svg" className="w-8 h-8" alt="AgroEzuran" />
            <span className="text-lg font-bold">AgroEzuran</span>
          </div>
          <p className="text-farm-muted text-sm">© 2026 AgroEzuran. Smart farming for everyone.</p>
          <div className="flex items-center gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-farm-muted hover:text-white hover:-translate-y-0.5 transition-all duration-200 text-sm">
              <ExternalLink className="w-4 h-4" /> GitHub Repo
            </a>
            <a href={APK_URL} download
              className="flex items-center gap-2 bg-farm-primary/10 border border-farm-primary/30 text-farm-primary hover:bg-farm-primary/20 hover:-translate-y-0.5 transition-all duration-200 rounded-lg px-3 py-1.5 text-sm">
              <Download className="w-4 h-4" /> APK
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Landing Page ─────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen bg-farm-bg text-white">
      <Navbar />
      <Hero />
      <AppPreview />
      <Features />
      <AISpotlight />
      <HowItWorks />
      <NotificationsSpotlight />
      <TechStack />
      <ImpactNumbers />
      <GetStarted />
      <CTA />
      <Footer />
    </div>
  )
}
