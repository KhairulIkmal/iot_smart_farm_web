import { useState, useEffect } from 'react'
import { ref, query, orderByKey, startAt, get } from 'firebase/database'
import { rtdb } from '../firebase'

/**
 * Fetches historical sensor data from Firebase RTDB.
 *
 * @param {string|null} deviceId
 * @param {string} sensorType - 'soil' | 'temp' | 'humidity' | 'ph' | 'waterLevel'
 * @param {string} rangeKey   - '7d' | '30d'
 * @returns {{ data: Array<{timestamp: number, value: number}>, loading: boolean, error: string|null }}
 */
export function useSensorHistory(deviceId, sensorType, rangeKey) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!deviceId || !sensorType) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const days = rangeKey === '30d' ? 30 : 7
    const startTimestamp = Math.floor(Date.now() / 1000) - days * 86400

    const historyRef = query(
      ref(rtdb, `sensors/${deviceId}/history/${sensorType}`),
      orderByKey(),
      startAt(String(startTimestamp))
    )

    get(historyRef)
      .then((snap) => {
        if (cancelled) return
        if (!snap.exists()) {
          setData([])
          return
        }
        const raw = snap.val()
        const points = Object.entries(raw)
          .map(([ts, val]) => ({
            timestamp: Number(ts) * 1000, // convert to ms for recharts
            value: Number(val),
          }))
          .sort((a, b) => a.timestamp - b.timestamp)
        setData(points)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [deviceId, sensorType, rangeKey])

  return { data, loading, error }
}
