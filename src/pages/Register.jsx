import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react'
import { PiPlantBold, PiDeviceMobileBold, PiWifiHighBold } from 'react-icons/pi'
import { auth } from '../firebase'
import { createUserDoc } from '../context/AuthContext'

const AUTH_ERRORS = {
  'email-already-in-use': 'An account already exists with this email.',
  'invalid-email':        'Invalid email address.',
  'weak-password':        'Password is too weak. Use at least 6 characters.',
  'network-request-failed': 'Network error. Please check your connection.',
}

function getAuthError(code) {
  return AUTH_ERRORS[code] ?? 'An error occurred. Please try again.'
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 700, color: '#9db9a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9db9a6' }} />
        {children}
      </div>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [name, setName]                   = useState('')
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]   = useState(false)
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 6)          { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      await createUserDoc(cred.user.uid, name, email)
      navigate('/dashboard')
    } catch (err) {
      setError(getAuthError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const inputBase = {
    width: '100%',
    background: '#0f1c12',
    border: '1px solid #3b5443',
    color: '#fff',
    borderRadius: '10px',
    padding: '11px 14px 11px 38px',
    fontSize: '13.5px',
    outline: 'none',
    transition: 'border 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  }

  const featurePills = [
    { Icon: PiPlantBold,        text: 'Monitor crops with real-time IoT sensors' },
    { Icon: PiWifiHighBold,     text: 'Claim your ESP32 device with a unique ID' },
    { Icon: PiDeviceMobileBold, text: 'Access from mobile app or web dashboard' },
  ]

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: '#0a1a0e' }}
    >
      {/* ── Animated background ──────────────────────────────── */}
      <style>{`
        @keyframes lp-pulse {
          0%,100% { transform: scale(1);    opacity: 1;   }
          50%      { transform: scale(1.12); opacity: 0.7; }
        }
        @keyframes lp-float {
          0%,100% { transform: translateY(0px);  }
          50%      { transform: translateY(-18px); }
        }
        @keyframes lp-slidein {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .lp-input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #0f1c12 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>

      {/* ── Top nav ──────────────────────────────────────────── */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid rgba(59,84,67,0.4)' }}>
        <Link to="/" className="flex items-center gap-2">
          <img src="/agroezuran_icon_allmode.svg" style={{ width:32, height:32 }} alt="AgroEzuran" />
          <span style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.3px' }}>
            <span style={{ color:'#2bec6c' }}>Agro</span><span style={{ color:'#CE6630' }}>Ezuran</span>
          </span>
        </Link>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:6, color:'#9db9a6', fontSize:13, textDecoration:'none', transition:'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color='#fff'}
          onMouseLeave={e => e.currentTarget.style.color='#9db9a6'}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* Blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position:'absolute', top:'-15%', left:'-10%', width:'55vw', height:'55vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(43,238,108,0.13) 0%,transparent 70%)', animation:'lp-pulse 8s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'-10%', right:'-8%', width:'40vw', height:'40vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(43,238,108,0.09) 0%,transparent 70%)', animation:'lp-pulse 10s ease-in-out infinite reverse' }} />
        <div style={{ position:'absolute', top:'45%', left:'55%', width:'20vw', height:'20vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(43,238,108,0.07) 0%,transparent 70%)', animation:'lp-pulse 6s ease-in-out infinite 2s' }} />

        {/* Grid lines */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.06 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="lp-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#2bec6c" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lp-grid)" />
        </svg>

        {/* Floating dots */}
        {[
          { top:'12%',  left:'18%',  size:6, opacity:0.35, delay:'0s',   dur:'7s'  },
          { top:'68%',  left:'12%',  size:4, opacity:0.25, delay:'1.5s', dur:'9s'  },
          { top:'30%',  right:'14%', size:5, opacity:0.30, delay:'3s',   dur:'8s'  },
          { top:'80%',  right:'22%', size:4, opacity:0.20, delay:'0.5s', dur:'11s' },
          { top:'50%',  left:'40%',  size:3, opacity:0.20, delay:'4s',   dur:'6s'  },
        ].map((d, i) => (
          <div key={i} style={{
            position:'absolute', top:d.top, left:d.left, right:d.right,
            width:`${d.size}px`, height:`${d.size}px`, borderRadius:'50%',
            background:'#2bec6c', opacity:d.opacity,
            animation:`lp-float ${d.dur} ease-in-out infinite ${d.delay}`,
          }} />
        ))}
      </div>

      {/* ── Left branding (desktop only) ─────────────────────── */}
      <div className="hidden lg:flex flex-col justify-center flex-1 max-w-lg pr-16" style={{ animation: 'lp-slidein 0.6s ease both' }}>
        <Link to="/" className="flex items-center gap-3 mb-10">
          <img src="/agroezuran_icon_allmode.svg" style={{ width: 44, height: 44 }} alt="AgroEzuran" />
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>
            <span style={{ color: '#2bec6c' }}>Agro</span><span style={{ color: '#CE6630' }}>Ezuran</span>
          </span>
        </Link>

        <h2 style={{ color: '#fff', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
          Start Farming<br /><span style={{ color: '#2bec6c' }}>Smarter Today</span>
        </h2>
        <p style={{ color: '#9db9a6', fontSize: 15, lineHeight: 1.7, maxWidth: 380, marginBottom: 40 }}>
          Create your free account, claim your ESP32 device, and have a fully automated farm monitoring system running in minutes.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {featurePills.map(({ Icon, text }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width:28, height:28, borderRadius:8, background:'rgba(43,238,108,0.1)', border:'1px solid rgba(43,238,108,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon style={{ color: '#2bec6c', width: 15, height: 15 }} />
              </span>
              <span style={{ color: '#9db9a6', fontSize: 13 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Register card ────────────────────────────────────── */}
      <div className="w-full max-w-sm relative" style={{ animation: 'lp-slidein 0.7s ease 0.1s both' }}>
        {/* Glow ring behind card */}
        <div style={{ position:'absolute', inset:-1, borderRadius:22, background:'linear-gradient(135deg,rgba(43,238,108,0.25),transparent 60%)', zIndex:0, filter:'blur(1px)' }} />

        <div style={{ position:'relative', zIndex:1, background:'rgba(28,39,31,0.85)', backdropFilter:'blur(20px)', border:'1px solid rgba(59,84,67,0.8)', borderRadius:22, padding:'36px 32px', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>

          {/* Card header */}
          <div className="flex flex-col items-center mb-8">
            <div style={{ width:70, height:70, borderRadius:16, background:'rgba(43,238,108,0.08)', border:'1.5px solid rgba(43,238,108,0.25)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, boxShadow:'0 0 28px rgba(43,238,108,0.15)', padding:10 }}>
              <img src="/agroezuran_icon_allmode.svg" style={{ width: '100%', height: '100%' }} alt="AgroEzuran" />
            </div>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Create Account</h1>
            <p style={{ color: '#9db9a6', fontSize: 12.5 }}>Start monitoring your smart farm</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', fontSize:12.5, borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <Field label="Full Name" icon={User}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="lp-input"
                style={inputBase}
                onFocus={e => { e.target.style.borderColor='#2bec6c'; e.target.style.boxShadow='0 0 0 3px rgba(43,238,108,0.12)' }}
                onBlur={e  => { e.target.style.borderColor='#3b5443'; e.target.style.boxShadow='none' }}
              />
            </Field>

            <Field label="Email" icon={Mail}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="lp-input"
                style={inputBase}
                onFocus={e => { e.target.style.borderColor='#2bec6c'; e.target.style.boxShadow='0 0 0 3px rgba(43,238,108,0.12)' }}
                onBlur={e  => { e.target.style.borderColor='#3b5443'; e.target.style.boxShadow='none' }}
              />
            </Field>

            <Field label="Password" icon={Lock}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                className="lp-input"
                style={{ ...inputBase, paddingRight: 38 }}
                onFocus={e => { e.target.style.borderColor='#2bec6c'; e.target.style.boxShadow='0 0 0 3px rgba(43,238,108,0.12)' }}
                onBlur={e  => { e.target.style.borderColor='#3b5443'; e.target.style.boxShadow='none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#9db9a6' }}
                onMouseEnter={e => e.currentTarget.style.color='#fff'}
                onMouseLeave={e => e.currentTarget.style.color='#9db9a6'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </Field>

            <Field label="Confirm Password" icon={Lock}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                className="lp-input"
                style={inputBase}
                onFocus={e => { e.target.style.borderColor='#2bec6c'; e.target.style.boxShadow='0 0 0 3px rgba(43,238,108,0.12)' }}
                onBlur={e  => { e.target.style.borderColor='#3b5443'; e.target.style.boxShadow='none' }}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-bold transition-all duration-200"
              style={{ background:'#2bec6c', color:'#080f0a', borderRadius:10, padding:'12px 0', fontSize:14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow:'0 0 20px rgba(43,238,108,0.3)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow='0 0 28px rgba(43,238,108,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 20px rgba(43,238,108,0.3)' }}
            >
              {loading ? (
                <div style={{ width:18, height:18, border:'2.5px solid #080f0a', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center mt-5" style={{ color: '#9db9a6', fontSize: 13 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2bec6c', fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration='none'}
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>

    </div>
  )
}
