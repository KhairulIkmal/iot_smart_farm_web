import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import {
  Thermometer, Droplets, Wind, FlaskConical, Waves, Wifi, WifiOff, Sprout, RefreshCw,
  Download, Smartphone, Cpu, ArrowRight
} from 'lucide-react'

const APK_URL = 'https://drive.google.com/uc?export=download&id=1mjnvoelnVVTWk8fdPntIBN2V0wVoyXG1'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { useSensorData } from '../hooks/useSensorData'
import Sidebar from '../components/Sidebar'
import SensorCard from '../components/SensorCard'
import PumpControl from '../components/PumpControl'
import AiChat from '../components/AiChat'
import { AppPromoCard, AppPromoHint } from '../components/AppPromo'
import Analytics from '../components/Analytics'

const SENSOR_ICONS = {
  temp: Thermometer,
  humidity: Wind,
  soil: Droplets,
  ph: FlaskConical,
  waterLevel: Waves,
}

function formatLastSeen(ts) {
  if (!ts) return 'Never'
  const dt = new Date(ts * 1000)
  return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}:${String(dt.getSeconds()).padStart(2,'0')}`
}

export default function Dashboard() {
  const { firebaseUser, customUserId, userData } = useAuth()
  const [activeSection, setActiveSection] = useState('overview')
  const [activeCrop, setActiveCrop] = useState(null)
  const [allCrops, setAllCrops] = useState([])
  const [deviceId, setDeviceId] = useState(null)
  const [loadingCrop, setLoadingCrop] = useState(true)

  const { liveData, sensorHealth, pumpStatus, deviceOnline, loading: sensorLoading } = useSensorData(deviceId)

  useEffect(() => {
    if (!firebaseUser) return
    async function fetchCrops() {
      setLoadingCrop(true)
      try {
        // The Flutter app stores farmer_id as Firebase Auth UID (user.uid)
        // Some migrated accounts may use USER_XXX — try both
        const farmerIds = [firebaseUser.uid]
        if (customUserId && customUserId !== firebaseUser.uid) {
          farmerIds.push(customUserId)
        }

        let activeCropFound = null
        let allCropsFound = []

        for (const farmerId of farmerIds) {
          // Get active crop
          if (!activeCropFound) {
            const activeQ = query(
              collection(db, 'crops'),
              where('farmer_id', '==', farmerId),
              where('status', '==', 'active')
            )
            const activeSnap = await getDocs(activeQ)
            if (!activeSnap.empty) {
              activeCropFound = { id: activeSnap.docs[0].id, ...activeSnap.docs[0].data() }
            }
          }

          // Get all crops
          const allQ = query(collection(db, 'crops'), where('farmer_id', '==', farmerId))
          const allSnap = await getDocs(allQ)
          allCropsFound = [...allCropsFound, ...allSnap.docs.map(d => ({ id: d.id, ...d.data() }))]
        }

        if (activeCropFound) {
          setActiveCrop(activeCropFound)
          setDeviceId(activeCropFound.device_id)
        }
        setAllCrops(allCropsFound)
      } catch (err) {
        console.error('Error fetching crops:', err)
      } finally {
        setLoadingCrop(false)
      }
    }
    fetchCrops()
  }, [firebaseUser, customUserId])

  const sensors = [
    { type: 'temp',       icon: SENSOR_ICONS.temp,       value: liveData?.temp },
    { type: 'humidity',   icon: SENSOR_ICONS.humidity,   value: liveData?.humidity },
    { type: 'soil',       icon: SENSOR_ICONS.soil,       value: liveData?.soil },
    { type: 'ph',         icon: SENSOR_ICONS.ph,         value: liveData?.ph },
    { type: 'waterLevel', icon: SENSOR_ICONS.waterLevel, value: liveData?.waterLevel },
  ]

  function renderSection() {
    if (loadingCrop) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-farm-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }

    if (!activeCrop) {
      return (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="w-full max-w-md">
            <div className="card p-8 text-center border-farm-border/60">
              {/* Icon */}
              <div className="w-20 h-20 bg-farm-surface2 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-farm-border">
                <Smartphone className="w-9 h-9 text-farm-muted" />
              </div>

              <h2 className="text-white text-xl font-bold mb-2">No device claimed yet</h2>
              <p className="text-farm-muted text-sm leading-relaxed mb-7">
                To see live sensor data here, you need to claim your ESP32 device using the <span className="text-white font-medium">AgroEzuran mobile app</span> first.
              </p>

              {/* Steps */}
              <div className="flex items-center justify-center gap-2 mb-7 text-xs text-farm-muted">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 bg-farm-primary/10 border border-farm-primary/30 rounded-xl flex items-center justify-center">
                    <Download className="w-4 h-4 text-farm-primary" />
                  </div>
                  <span>Install App</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 mb-3 flex-shrink-0" />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 bg-farm-primary/10 border border-farm-primary/30 rounded-xl flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-farm-primary" />
                  </div>
                  <span>Claim Device</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 mb-3 flex-shrink-0" />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 bg-farm-primary/10 border border-farm-primary/30 rounded-xl flex items-center justify-center">
                    <Sprout className="w-4 h-4 text-farm-primary" />
                  </div>
                  <span>Add a Crop</span>
                </div>
              </div>

              {/* CTA */}
              <a
                href={APK_URL}
                download
                className="flex items-center justify-center gap-2 w-full bg-farm-primary text-farm-bg font-bold rounded-xl px-6 py-3 text-sm hover:bg-farm-primary/90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(19,236,55,0.3)]"
              >
                <Download className="w-4 h-4" />
                Download AgroEzuran APK
              </a>
              <p className="text-farm-muted text-xs mt-3">Android only · Free · No Play Store required</p>
            </div>
          </div>
        </div>
      )
    }

    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {sensors.map(({ type, icon, value }) => (
                <SensorCard
                  key={type}
                  type={type}
                  value={value}
                  health={sensorHealth?.[type]}
                  icon={icon}
                />
              ))}
            </div>
            <div className="card p-4 flex items-center gap-2 text-sm text-farm-muted">
              <RefreshCw className="w-4 h-4" />
              Last updated: {formatLastSeen(liveData?.lastSeen)}
            </div>
            <AppPromoCard />
          </div>
        )

      case 'sensors':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sensors.map(({ type, icon, value }) => {
              const health = sensorHealth?.[type]
              const isError = health === 'error'
              return (
                <div key={type} className={`card p-5 ${isError ? 'border-red-500/40' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      type === 'temp' ? 'bg-orange-400/10' :
                      type === 'humidity' ? 'bg-teal-400/10' :
                      type === 'soil' ? 'bg-blue-400/10' :
                      type === 'ph' ? 'bg-purple-400/10' : 'bg-red-400/10'
                    }`}>
                      {icon && (() => { const Icon = icon; return <Icon className={`w-5 h-5 ${
                        type === 'temp' ? 'text-orange-400' :
                        type === 'humidity' ? 'text-teal-400' :
                        type === 'soil' ? 'text-blue-400' :
                        type === 'ph' ? 'text-purple-400' : 'text-red-400'
                      }`} /> })()}
                    </div>
                    <div>
                      <p className="text-white font-semibold capitalize">
                        {type === 'ph' ? 'pH Level' : type === 'waterLevel' ? 'Water Level' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-red-400 animate-pulse' : 'bg-farm-primary'}`} />
                        <span className={`text-xs ${isError ? 'text-red-400' : 'text-farm-muted'}`}>
                          {isError ? 'Sensor Error' : 'Healthy'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <SensorCard type={type} value={value} health={health} icon={icon} />
                </div>
              )
            })}
          <AppPromoHint feature="Historical graphs & trend analysis" />
        </div>
        )

      case 'analytics':
        return (
          <Analytics
            deviceId={deviceId}
            userData={userData}
            firebaseUser={firebaseUser}
            liveData={liveData}
            activeCrop={activeCrop}
          />
        )

      case 'irrigation':
        return (
          <div className="w-full max-w-sm mx-auto md:mx-0">
            <PumpControl deviceId={deviceId} pumpStatus={pumpStatus} liveData={liveData} />
          </div>
        )

      case 'ai-chat':
        return (
          <AiChat
            cropType={activeCrop?.crop_type}
            liveData={liveData}
            sensorHealth={sensorHealth}
            pumpStatus={pumpStatus}
            deviceOnline={deviceOnline}
          />
        )

      case 'crops':
        return (
          <div className="space-y-3">
            {allCrops.length === 0 ? (
              <p className="text-farm-muted text-sm">No crops found.</p>
            ) : (
              allCrops.map((crop) => (
                <div key={crop.id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-farm-primary/10 rounded-xl flex items-center justify-center">
                      <Sprout className="w-5 h-5 text-farm-primary" />
                    </div>
                    <div>
                      <p className="text-white font-semibold capitalize">{crop.crop_type}</p>
                      <p className="text-farm-muted text-xs">{crop.field_name ?? 'Field A'} · {crop.device_id}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    crop.status === 'active'
                      ? 'bg-farm-primary/10 text-farm-primary'
                      : crop.status === 'harvested'
                      ? 'bg-yellow-400/10 text-yellow-400'
                      : 'bg-farm-muted/10 text-farm-muted'
                  }`}>
                    {crop.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )

      case 'settings':
        return (
          <div className="w-full max-w-md space-y-4">
            <div className="card p-6 space-y-4">
              <h3 className="text-white font-semibold">Profile</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-farm-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-farm-primary text-xl font-bold">
                    {userData?.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold">{userData?.name ?? 'Farmer'}</p>
                  <p className="text-farm-muted text-sm">{userData?.email ?? ''}</p>
                  <p className="text-farm-muted text-xs mt-0.5 capitalize">{userData?.role ?? 'farmer'}</p>
                </div>
              </div>
            </div>
            <div className="card p-4 text-farm-muted text-sm">
              <p className="font-medium text-white mb-2">Device</p>
              <p>Active device: <span className="text-white">{deviceId ?? 'None'}</span></p>
              <p>Active crop: <span className="text-white capitalize">{activeCrop?.crop_type ?? 'None'}</span></p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-farm-bg">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Top bar */}
        <div className="sticky top-0 bg-farm-bg/80 backdrop-blur border-b border-farm-border pl-16 pr-4 md:px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h1 className="text-white font-bold text-lg">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}
            </h1>
            {activeCrop && (
              <p className="text-farm-muted text-xs capitalize mt-0.5">
                {activeCrop.crop_type} · {activeCrop.field_name ?? 'Field A'}
              </p>
            )}
          </div>
          {deviceId && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              deviceOnline
                ? 'bg-farm-primary/10 border-farm-primary/30 text-farm-primary'
                : 'bg-farm-muted/10 border-farm-border text-farm-muted'
            }`}>
              {deviceOnline
                ? <Wifi className="w-3.5 h-3.5 animate-pulse-green" />
                : <WifiOff className="w-3.5 h-3.5" />
              }
              <span className="text-xs font-medium">{deviceOnline ? 'Online' : 'Offline'}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 md:p-6">
          {renderSection()}
        </div>
      </main>
    </div>
  )
}
