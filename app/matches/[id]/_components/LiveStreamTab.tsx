'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import api from '@/lib/api'
import Peer, { MediaConnection } from 'peerjs'
import type { MatchDetail } from '../page'

interface Props {
  match: MatchDetail
}

// ============================================
// TURN / STUN (Metered.ca)
// ============================================
const ICE_SERVERS = [
  { urls: 'stun:stun.relay.metered.ca:80' },
  {
    urls: 'turn:global.relay.metered.ca:80',
    username: 'bb0f3cf601b6106dd7a65749',
    credential: 'zKeP36p564tSnE25',
  },
  {
    urls: 'turn:global.relay.metered.ca:80?transport=tcp',
    username: 'bb0f3cf601b6106dd7a65749',
    credential: 'zKeP36p564tSnE25',
  },
  {
    urls: 'turn:global.relay.metered.ca:443',
    username: 'bb0f3cf601b6106dd7a65749',
    credential: 'zKeP36p564tSnE25',
  },
  {
    urls: 'turn:global.relay.metered.ca:443?transport=tcp',
    username: 'bb0f3cf601b6106dd7a65749',
    credential: 'zKeP36p564tSnE25',
  },
]

const PEER_CONFIG = {
  config: {
    iceServers: ICE_SERVERS,
  },
}

// ============================================
// TIPOS
// ============================================

interface ScoreboardState {
  enabled: boolean
  clockEnabled: boolean
  homeTeamName: string | null
  awayTeamName: string | null
  homeScore: number
  awayScore: number
  clockSeconds: number
  clockRunning: boolean
  clockDirection: string
  clockStartedAt: string | null
  clockDuration: number
  currentPeriod: number
  isOvertime: boolean
  quarterDuration: number
  overtimeDuration: number
}

interface LiveInfo {
  isLive: boolean
  streamingEnabled: boolean
  hostPeerId: string | null
  hostName: string | null
  viewers: { id: string; userId: string; name: string }[]
  maxUsers: number
  startedAt: string | null
  canManage: boolean
  myPermission: boolean
  scoreboard?: ScoreboardState
}

interface Candidate {
  userId: string
  name: string
  lastName: string
  email: string
  avatar: string | null
  role: string
}

// ============================================
// HELPERS
// ============================================

const formatClock = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const periodLabel = (period: number) => {
  if (period <= 4) return `Q${period}`
  return `OT${period - 4}`
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function LiveStreamTab({ match }: Props) {
  const [loading, setLoading] = useState(true)
  const [liveInfo, setLiveInfo] = useState<LiveInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Setup (coach)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [togglingEnabled, setTogglingEnabled] = useState(false)

  const [setupForm, setSetupForm] = useState({
    homeTeamName: match.team.name,
    awayTeamName: match.opponent,
    scoreboardEnabled: true,
    clockEnabled: true,
    quarterDuration: 600,
    overtimeDuration: 300,
  })

  // Emisión
  const [isStreaming, setIsStreaming] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peer, setPeer] = useState<Peer | null>(null)
  const [connectedViewers, setConnectedViewers] = useState<string[]>([])
  const [cameraOn, setCameraOn] = useState(true)
  const [audioOn, setAudioOn] = useState(true)

  // Scoreboard
  const [scoreboard, setScoreboard] = useState<ScoreboardState | null>(null)
  const [displayClock, setDisplayClock] = useState(0)

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<Peer | null>(null)
  const activeCallsRef = useRef<Map<string, MediaConnection>>(new Map())
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isHost = useRef(false)

  // ============================================
  // CARGA INICIAL
  // ============================================

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const u = JSON.parse(userStr)
        setCurrentUserId(u.id)
      } catch {}
    }
  }, [])

  const fetchLiveInfo = useCallback(async () => {
    try {
      const res = await api.get(`/matches/${match.id}/live`)
      setLiveInfo(res.data)
      if (res.data.scoreboard) {
        setScoreboard(res.data.scoreboard)
        setDisplayClock(res.data.scoreboard.clockSeconds)
        setSetupForm((f) => ({
          ...f,
          homeTeamName: res.data.scoreboard.homeTeamName || match.team.name,
          awayTeamName: res.data.scoreboard.awayTeamName || match.opponent,
          scoreboardEnabled: res.data.scoreboard.enabled,
          clockEnabled: res.data.scoreboard.clockEnabled,
          quarterDuration: res.data.scoreboard.quarterDuration,
          overtimeDuration: res.data.scoreboard.overtimeDuration,
        }))
      }
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar la emisión')
    } finally {
      setLoading(false)
    }
  }, [match.id, match.team.name, match.opponent])

  useEffect(() => {
    fetchLiveInfo()
  }, [fetchLiveInfo])

  // ============================================
  // CANDIDATOS Y PERMISOS
  // ============================================

  useEffect(() => {
    if (!liveInfo?.canManage) return

    const loadCandidates = async () => {
      try {
        const [candRes, permRes] = await Promise.all([
          api.get(`/matches/${match.id}/live/candidates`),
          api.get(`/matches/${match.id}/live/permissions`),
        ])
        setCandidates(candRes.data)

        const permMap: Record<string, boolean> = {}
        for (const p of permRes.data) {
          permMap[p.userId] = p.canStream
        }
        setPermissions(permMap)
      } catch (err) {
        console.error('Error cargando candidatos:', err)
      }
    }
    loadCandidates()
  }, [liveInfo?.canManage, match.id])

  // ============================================
  // RELOJ LOCAL
  // ============================================

  useEffect(() => {
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current)
    if (!scoreboard) return

    const tick = () => {
      if (!scoreboard.clockRunning || !scoreboard.clockStartedAt) {
        setDisplayClock(scoreboard.clockSeconds)
        return
      }
      const elapsed = Math.floor(
        (Date.now() - new Date(scoreboard.clockStartedAt).getTime()) / 1000,
      )
      const newVal =
        scoreboard.clockDirection === 'DOWN'
          ? Math.max(0, scoreboard.clockSeconds - elapsed)
          : scoreboard.clockSeconds + elapsed
      setDisplayClock(newVal)
    }

    tick()
    clockIntervalRef.current = setInterval(tick, 1000)

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current)
    }
  }, [scoreboard])

  // ============================================
  // AUTO-RECUPERACIÓN (estado pegado)
  // ============================================

  useEffect(() => {
    if (!liveInfo?.isLive || isStreaming) return
    if (peerRef.current) return

    const timer = setTimeout(async () => {
      console.warn('⚠️ Estado pegado detectado → limpiando')
      try {
        await api.delete(`/matches/${match.id}/live/leave`)
      } catch {}
      fetchLiveInfo()
    }, 10000)

    return () => clearTimeout(timer)
  }, [liveInfo?.isLive, isStreaming, match.id, fetchLiveInfo])

  // ============================================
  // ACCIONES DEL COACH
  // ============================================

  const handleToggleEnabled = async () => {
    if (!liveInfo) return
    setTogglingEnabled(true)
    try {
      // 1) Guardar config del scoreboard primero
      await api.put(`/matches/${match.id}/live/scoreboard/config`, {
        scoreboardEnabled: setupForm.scoreboardEnabled,
        clockEnabled: setupForm.clockEnabled,
        homeTeamName: setupForm.homeTeamName,
        awayTeamName: setupForm.awayTeamName,
        quarterDuration: setupForm.quarterDuration,
        overtimeDuration: setupForm.overtimeDuration,
      })

      // 2) Activar/desactivar
      await api.post(`/matches/${match.id}/live/enable`, {
        enabled: !liveInfo.streamingEnabled,
      })

      // 3) Refrescar
      await fetchLiveInfo()
    } catch (err: any) {
      console.error('Error en toggle:', err)
      alert(err.response?.data?.message || 'Error al actualizar la emisión')
    } finally {
      setTogglingEnabled(false)
    }
  }

  const handleSavePermissions = async () => {
    setSavingPermissions(true)
    try {
      const payload = candidates.map((c) => ({
        userId: c.userId,
        canStream: permissions[c.userId] || false,
      }))
      await api.post(`/matches/${match.id}/live/permissions`, { permissions: payload })
      await fetchLiveInfo()
      alert('✅ Permisos guardados')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar permisos')
    } finally {
      setSavingPermissions(false)
    }
  }

  const togglePermission = (userId: string) => {
    setPermissions((p) => ({ ...p, [userId]: !p[userId] }))
  }

  // ============================================
  // INICIAR EMISIÓN (host)
  // ============================================

  const startStreaming = async () => {
    try {
      const res = await api.post(`/matches/${match.id}/live/start`)
      const hostPeerId = res.data.hostPeerId

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 854, height: 480 },
        audio: true,
      })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      const newPeer = new Peer(hostPeerId, PEER_CONFIG)
      peerRef.current = newPeer
      setPeer(newPeer)
      isHost.current = true

      newPeer.on('open', () => {
        console.log('✅ Peer host abierto:', hostPeerId)
      })

      newPeer.on('connection', (conn) => {
        console.log('🔗 Viewer conectado (data):', conn.peer)
        setConnectedViewers((v) => [...v, conn.peer])

        conn.on('close', () => {
          setConnectedViewers((v) => v.filter((p) => p !== conn.peer))
        })
      })

      newPeer.on('call', (call) => {
        console.log('📞 Viewer llama:', call.peer)
        call.answer(stream)
        activeCallsRef.current.set(call.peer, call)

        call.on('close', () => {
          activeCallsRef.current.delete(call.peer)
          setConnectedViewers((v) => v.filter((p) => p !== call.peer))
        })
      })

      newPeer.on('error', (err) => {
        console.error('❌ Peer error:', err)
      })

      setIsStreaming(true)
      await fetchLiveInfo()
    } catch (err: any) {
      console.error('Error iniciando emisión:', err)
      alert(err.response?.data?.message || err.message || 'Error al iniciar la emisión')
    }
  }

  // ============================================
  // PARAR EMISIÓN
  // ============================================

  const stopStreaming = async () => {
    if (!confirm('¿Detener la emisión para todos los espectadores?')) return

    try {
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
        setPeer(null)
      }
      activeCallsRef.current.forEach((call) => call.close())
      activeCallsRef.current.clear()
      setConnectedViewers([])

      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop())
      }
      setLocalStream(null)
      setIsStreaming(false)

      await api.post(`/matches/${match.id}/live/stop`)
      await fetchLiveInfo()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al detener la emisión')
    }
  }

  // ============================================
  // UNIRSE COMO ESPECTADOR
  // ============================================

  const joinAsViewer = async () => {
    try {
      const res = await api.post(`/matches/${match.id}/live/join`)
      const hostPeerId = res.data.hostPeerId

      const newPeer = new Peer(PEER_CONFIG)
      peerRef.current = newPeer
      setPeer(newPeer)
      isHost.current = false

      newPeer.on('open', (myId) => {
        console.log('✅ Viewer peer abierto:', myId)
        api.post(`/matches/${match.id}/live/peer`, { peerId: myId }).catch(console.error)

        newPeer.connect(hostPeerId)

        // Crear llamada vacía para recibir el stream
        const emptyStream = new MediaStream()
        const call = newPeer.call(hostPeerId, emptyStream)
        if (!call) return

        call.on('stream', (remoteStream) => {
          console.log('📺 Stream recibido')
          setRemoteStream(remoteStream)
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
          }
        })

        call.on('close', () => {
          setRemoteStream(null)
        })
      })

      newPeer.on('error', (err) => {
        console.error('❌ Peer viewer error:', err)
        alert('Error de conexión: ' + err.type)
      })

      setIsStreaming(true)
      await fetchLiveInfo()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al unirse a la emisión')
    }
  }

  // ============================================
  // SALIR (viewer o estado pegado)
  // ============================================

  const leaveAsViewer = async () => {
    try {
      // Cerrar peer
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
      }
      activeCallsRef.current.forEach((c) => c.close())
      activeCallsRef.current.clear()

      // Limpiar vídeos
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop())
      }
      setLocalStream(null)
      setRemoteStream(null)
      setIsStreaming(false)
      setConnectedViewers([])

      // Notificar al backend
      try {
        await api.delete(`/matches/${match.id}/live/leave`)
      } catch {}
      await fetchLiveInfo()
    } catch (err) {
      console.error('Error al salir:', err)
      await fetchLiveInfo()
    }
  }

  // ============================================
  // CONTROLES DE CÁMARA/MIC
  // ============================================

  const toggleCamera = () => {
    if (!localStream) return
    const videoTrack = localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setCameraOn(videoTrack.enabled)
    }
  }

  const toggleAudio = () => {
    if (!localStream) return
    const audioTrack = localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setAudioOn(audioTrack.enabled)
    }
  }

  // ============================================
  // CONTROLES DEL SCOREBOARD
  // ============================================

  const changeScore = async (team: 'home' | 'away', delta: number) => {
    if (!scoreboard) return
    const newHome = team === 'home' ? scoreboard.homeScore + delta : scoreboard.homeScore
    const newAway = team === 'away' ? scoreboard.awayScore + delta : scoreboard.awayScore

    setScoreboard({ ...scoreboard, homeScore: newHome, awayScore: newAway })

    try {
      await api.put(`/matches/${match.id}/live/scoreboard/score`, {
        homeScore: newHome,
        awayScore: newAway,
      })
    } catch (err) {
      console.error('Error actualizando marcador:', err)
    }
  }

  const setScoreManually = async (team: 'home' | 'away') => {
    if (!scoreboard) return
    const current = team === 'home' ? scoreboard.homeScore : scoreboard.awayScore
    const input = prompt('Nuevo valor:', String(current))
    if (input === null) return
    const value = parseInt(input, 10)
    if (isNaN(value) || value < 0) return

    const newHome = team === 'home' ? value : scoreboard.homeScore
    const newAway = team === 'away' ? value : scoreboard.awayScore

    setScoreboard({ ...scoreboard, homeScore: newHome, awayScore: newAway })
    await api.put(`/matches/${match.id}/live/scoreboard/score`, {
      homeScore: newHome,
      awayScore: newAway,
    })
  }

  const clockAction = async (action: 'play' | 'pause' | 'reset' | 'set', seconds?: number) => {
    try {
      const res = await api.put(`/matches/${match.id}/live/scoreboard/clock`, {
        action,
        seconds,
      })
      setScoreboard((s) => (s ? { ...s, ...res.data } : s))
    } catch (err) {
      console.error('Error reloj:', err)
    }
  }

  const setClockManually = async () => {
    const input = prompt('Tiempo en formato MM:SS (ej: 07:30)', formatClock(displayClock))
    if (!input) return
    const [m, s] = input.split(':').map((x) => parseInt(x, 10))
    if (isNaN(m) || isNaN(s)) return
    await clockAction('set', m * 60 + s)
  }

  const nextPeriod = async () => {
    const isOT = scoreboard && scoreboard.currentPeriod >= 4
    const message = isOT
      ? '¿Añadir prórroga?'
      : `¿Pasar a Q${(scoreboard?.currentPeriod || 1) + 1}?`
    if (!confirm(message)) return

    try {
      const res = await api.put(`/matches/${match.id}/live/scoreboard/period`)
      setScoreboard((s) => (s ? { ...s, ...res.data } : s))
    } catch (err) {
      console.error('Error periodo:', err)
    }
  }

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      if (peerRef.current) peerRef.current.destroy()
      activeCallsRef.current.forEach((c) => c.close())
      if (localStream) localStream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando emisión...</div>
  }

  if (error || !liveInfo) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'No se pudo cargar la emisión'}
      </div>
    )
  }

  const soyHost = isStreaming && isHost.current
  const soyViewer = isStreaming && !isHost.current

  // ==== 1. Emisión DESACTIVADA ====
  if (!liveInfo.streamingEnabled) {
    if (!liveInfo.canManage) {
      return (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-5xl mb-4">📺</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Emisión desactivada
          </h3>
          <p className="text-gray-500 text-sm">
            El entrenador todavía no ha activado la emisión para este partido
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">📺 Emisión en directo</h2>
              <p className="text-sm text-gray-500 mt-1">
                Activa la emisión y elige quién puede emitir el partido
              </p>
            </div>
            <button
              onClick={handleToggleEnabled}
              disabled={togglingEnabled}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
            >
              {togglingEnabled ? 'Activando...' : '🔴 Activar emisión'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🎛️ Configuración del marcador</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏠 Equipo local
              </label>
              <input
                type="text"
                value={setupForm.homeTeamName}
                onChange={(e) => setSetupForm({ ...setupForm, homeTeamName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ✈️ Equipo visitante
              </label>
              <input
                type="text"
                value={setupForm.awayTeamName}
                onChange={(e) => setSetupForm({ ...setupForm, awayTeamName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={setupForm.scoreboardEnabled}
                onChange={(e) => setSetupForm({ ...setupForm, scoreboardEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Mostrar marcador</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={setupForm.clockEnabled}
                onChange={(e) => setSetupForm({ ...setupForm, clockEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Mostrar tiempo</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración del cuarto (min)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={setupForm.quarterDuration / 60}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, quarterDuration: Number(e.target.value) * 60 })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración de prórroga (min)
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={setupForm.overtimeDuration / 60}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, overtimeDuration: Number(e.target.value) * 60 })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">👥 Permisos para emitir</h3>
              <p className="text-xs text-gray-500 mt-1">
                Marca quién puede iniciar una emisión de este partido
              </p>
            </div>
            <button
              onClick={handleSavePermissions}
              disabled={savingPermissions}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {savingPermissions ? 'Guardando...' : '💾 Guardar permisos'}
            </button>
          </div>

          <div className="space-y-2">
            {candidates.map((c) => (
              <label
                key={c.userId}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={permissions[c.userId] || false}
                  onChange={() => togglePermission(c.userId)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {c.name} {c.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{c.role}</p>
                </div>
                {c.userId === currentUserId && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    Tú
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ==== 2. Emisión EN VIVO pero yo NO estoy conectado ====
  if (liveInfo.isLive && !isStreaming) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              EN DIRECTO
            </span>
            <span className="text-sm text-gray-500">
              👥 {liveInfo.viewers.length + 1}/{liveInfo.maxUsers}
            </span>
            {liveInfo.hostName && (
              <span className="text-sm text-gray-500">🎥 {liveInfo.hostName}</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            ¡Emisión en directo!
          </h3>
          <p className="text-gray-500 text-sm mb-1">
            {liveInfo.hostName} está emitiendo este partido
          </p>
          <p className="text-xs text-gray-400 mb-6">
            {liveInfo.maxUsers - 1 - liveInfo.viewers.length} plazas disponibles
          </p>
          <button
            onClick={joinAsViewer}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition"
          >
            ▶️ Ver en directo
          </button>
        </div>
      </div>
    )
  }

  // ==== 3. Emisión ACTIVADA pero NO en directo ====
  if (!liveInfo.isLive && !isStreaming) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold text-green-800">✅ Emisión activada</h2>
              <p className="text-sm text-green-700 mt-1">
                Los usuarios con permiso pueden iniciar el directo. Ahora mismo no hay emisión en curso.
              </p>
            </div>
            {liveInfo.canManage && (
              <button
                onClick={handleToggleEnabled}
                disabled={togglingEnabled}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {togglingEnabled ? 'Desactivando...' : '⏹️ Desactivar emisión'}
              </button>
            )}
          </div>
        </div>

        {liveInfo.myPermission ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-5xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Tienes permiso para emitir
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Cuando pulses el botón, se activará tu cámara y comenzará la emisión en directo
            </p>
            <button
              onClick={startStreaming}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition"
            >
              🔴 Iniciar emisión
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Esperando a que alguien emita
            </h3>
            <p className="text-gray-500 text-sm">
              El entrenador ha activado la emisión pero nadie está emitiendo todavía
            </p>
            {liveInfo.canManage && (
              <p className="text-xs text-blue-600 mt-4">
                💡 Como entrenador, puedes darte permiso a ti mismo en el panel de gestión
              </p>
            )}
          </div>
        )}

        {liveInfo.canManage && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">👥 Permisos para emitir</h3>
              <button
                onClick={handleSavePermissions}
                disabled={savingPermissions}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {savingPermissions ? 'Guardando...' : '💾 Guardar permisos'}
              </button>
            </div>
            <div className="space-y-2">
              {candidates.map((c) => (
                <label
                  key={c.userId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={permissions[c.userId] || false}
                    onChange={() => togglePermission(c.userId)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {c.name} {c.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{c.role}</p>
                  </div>
                  {c.userId === currentUserId && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      Tú
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==== 4. EN DIRECTO (emisor o espectador conectado) ====
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            EN DIRECTO
          </span>
          <span className="text-sm text-gray-500">
            👥 {liveInfo.viewers.length + 1}/{liveInfo.maxUsers}
          </span>
          {liveInfo.hostName && (
            <span className="text-sm text-gray-500">🎥 {liveInfo.hostName}</span>
          )}
        </div>
        {soyHost ? (
          <button
            onClick={stopStreaming}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            ⏹️ Detener emisión
          </button>
        ) : (
          <button
            onClick={leaveAsViewer}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm transition"
          >
            🚪 Salir
          </button>
        )}
      </div>

      <div className="relative bg-black rounded-xl overflow-hidden shadow-md">
        {soyHost && (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full aspect-video object-cover"
          />
        )}
        {soyViewer && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full aspect-video object-cover"
          />
        )}

        {scoreboard && (scoreboard.enabled || scoreboard.clockEnabled) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-6 py-3 text-white shadow-lg flex items-center gap-6">
              {scoreboard.enabled && (
                <>
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs text-gray-300 truncate max-w-[100px]">
                      {scoreboard.homeTeamName || 'LOCAL'}
                    </p>
                    <p className="text-3xl font-bold">{scoreboard.homeScore}</p>
                  </div>
                  <span className="text-2xl text-gray-400">-</span>
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs text-gray-300 truncate max-w-[100px]">
                      {scoreboard.awayTeamName || 'VISIT'}
                    </p>
                    <p className="text-3xl font-bold">{scoreboard.awayScore}</p>
                  </div>
                </>
              )}
              {scoreboard.clockEnabled && (
                <>
                  <div className="w-px h-10 bg-gray-500" />
                  <div className="text-center">
                    <p className="text-xs text-gray-300 flex items-center gap-1 justify-center">
                      {periodLabel(scoreboard.currentPeriod)}
                      {scoreboard.isOvertime && (
                        <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-1">
                          PRÓRROGA
                        </span>
                      )}
                    </p>
                    <p
                      className={`text-2xl font-mono font-bold ${
                        scoreboard.isOvertime ? 'text-orange-400' : ''
                      }`}
                    >
                      {formatClock(displayClock)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {soyHost && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={toggleCamera}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                cameraOn ? 'bg-white/90 text-gray-800' : 'bg-red-600 text-white'
              }`}
            >
              {cameraOn ? '📸 Cámara ON' : '📸 Cámara OFF'}
            </button>
            <button
              onClick={toggleAudio}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                audioOn ? 'bg-white/90 text-gray-800' : 'bg-red-600 text-white'
              }`}
            >
              {audioOn ? '🎤 Mic ON' : '🔇 Mic OFF'}
            </button>
          </div>
        )}

        {soyViewer && !remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-5xl mb-4 animate-pulse">📡</div>
              <p>Conectando con la emisión...</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel de control del emisor */}
      {soyHost && scoreboard && (
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">🎛️ Controles del partido</h3>

          {scoreboard.enabled && (
            <div>
              <p className="text-xs text-gray-500 mb-2">MARCADOR</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2 truncate">
                    🏠 {scoreboard.homeTeamName}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => changeScore('home', -1)}
                      className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
                    >
                      −
                    </button>
                    <div className="text-3xl font-bold text-center flex-1 min-w-[60px]">
                      {scoreboard.homeScore}
                    </div>
                    <button
                      onClick={() => changeScore('home', 1)}
                      className="w-10 h-10 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => changeScore('home', 2)}
                      className="w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold"
                    >
                      +2
                    </button>
                    <button
                      onClick={() => changeScore('home', 3)}
                      className="w-10 h-10 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-bold"
                    >
                      +3
                    </button>
                  </div>
                  <button
                    onClick={() => setScoreManually('home')}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    ✏️ Ajustar manualmente
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2 truncate">
                    ✈️ {scoreboard.awayTeamName}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => changeScore('away', -1)}
                      className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
                    >
                      −
                    </button>
                    <div className="text-3xl font-bold text-center flex-1 min-w-[60px]">
                      {scoreboard.awayScore}
                    </div>
                    <button
                      onClick={() => changeScore('away', 1)}
                      className="w-10 h-10 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => changeScore('away', 2)}
                      className="w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold"
                    >
                      +2
                    </button>
                    <button
                      onClick={() => changeScore('away', 3)}
                      className="w-10 h-10 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-bold"
                    >
                      +3
                    </button>
                  </div>
                  <button
                    onClick={() => setScoreManually('away')}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    ✏️ Ajustar manualmente
                  </button>
                </div>
              </div>
            </div>
          )}

          {scoreboard.clockEnabled && (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                RELOJ · {periodLabel(scoreboard.currentPeriod)}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="text-4xl font-mono font-bold text-gray-800">
                  {formatClock(displayClock)}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!scoreboard.clockRunning ? (
                    <button
                      onClick={() => clockAction('play')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold"
                    >
                      ▶️ Iniciar
                    </button>
                  ) : (
                    <button
                      onClick={() => clockAction('pause')}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold"
                    >
                      ⏸️ Pausar
                    </button>
                  )}
                  <button
                    onClick={() => clockAction('reset')}
                    className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold"
                  >
                    🔄 Reset
                  </button>
                  <button
                    onClick={setClockManually}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold"
                  >
                    ✏️ Editar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={nextPeriod}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition"
            >
              {scoreboard.currentPeriod >= 4
                ? '➕ Añadir prórroga'
                : `➡️ Siguiente cuarto (Q${scoreboard.currentPeriod + 1})`}
            </button>
          </div>
        </div>
      )}

      {soyHost && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-500">
            👥 <strong>{connectedViewers.length}</strong> espectadores conectados
            {connectedViewers.length === 0 && ' (esperando...)'}
          </p>
        </div>
      )}
    </div>
  )
}