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
  config: { iceServers: ICE_SERVERS },
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
  customPeriodLabel: string | null
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

const getPeriodLabel = (scoreboard: ScoreboardState | null | undefined) => {
  if (!scoreboard) return 'Q1'
  if (scoreboard.customPeriodLabel) return scoreboard.customPeriodLabel
  if (scoreboard.currentPeriod <= 4) return `Q${scoreboard.currentPeriod}`
  return `OT${scoreboard.currentPeriod - 4}`
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function LiveStreamTab({ match }: Props) {
  // ESTADOS
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

  // ✅ Overlay colapsable
  const [overlayVisible, setOverlayVisible] = useState(true)

  // ✅ Input del cuarto editable (local)
  const [periodInput, setPeriodInput] = useState('')
  const periodInputRef = useRef<HTMLInputElement>(null)

  // REFS
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<Peer | null>(null)
  const activeCallsRef = useRef<Map<string, MediaConnection>>(new Map())
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isHost = useRef(false)

  const soyHost = isStreaming && isHost.current
  const soyViewer = isStreaming && !isHost.current
  
  // ============================================
  // CARGA INICIAL
  // ============================================

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try { setCurrentUserId(JSON.parse(userStr).id) } catch {}
    }
  }, [])

  const fetchLiveInfo = useCallback(async () => {
    try {
      const res = await api.get(`/matches/${match.id}/live`)
      setLiveInfo(res.data)
      if (res.data.scoreboard) {
        setScoreboard(res.data.scoreboard)
        setDisplayClock(res.data.scoreboard.clockSeconds)
        setPeriodInput(getPeriodLabel(res.data.scoreboard))
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

  useEffect(() => { fetchLiveInfo() }, [fetchLiveInfo])

  // ============================================
  // ASIGNAR STREAMS
  // ============================================

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('🎥 Asignando stream local')
      localVideoRef.current.srcObject = localStream
      localVideoRef.current.play().catch((err) => console.warn('Autoplay local:', err))
    }
  }, [localStream, soyHost])

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('📺 Asignando stream remoto')
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.play().catch((err) => console.warn('Autoplay remoto:', err))
    }
  }, [remoteStream, soyViewer])

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
        for (const p of permRes.data) permMap[p.userId] = p.canStream
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
    return () => { if (clockIntervalRef.current) clearInterval(clockIntervalRef.current) }
  }, [scoreboard])

  // ============================================
  // AUTO-RECUPERACIÓN
  // ============================================

  useEffect(() => {
    if (!liveInfo?.isLive) return
    if (isStreaming) return
    if (peerRef.current) return

    const timer = setTimeout(async () => {
      console.warn('⚠️ No he podido conectar al stream → saliendo sin matar la emisión')
      try {
        await api.delete(`/matches/${match.id}/live/leave`)
      } catch {}
      fetchLiveInfo()
    }, 15000)

    return () => clearTimeout(timer)
  }, [liveInfo?.isLive, isStreaming, match.id, fetchLiveInfo])

  // ============================================
  // CLEANUP AL CERRAR PESTAÑA
  // ============================================

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isStreaming && isHost.current) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const token = localStorage.getItem('token')
        try {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `${API_URL}/matches/${match.id}/live/stop`, false)
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          xhr.send()
        } catch {}
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isStreaming, match.id])

  // ============================================
  // ACCIONES COACH
  // ============================================

  const handleToggleEnabled = async () => {
    if (!liveInfo) return
    setTogglingEnabled(true)
    try {
      await api.put(`/matches/${match.id}/live/scoreboard/config`, {
        scoreboardEnabled: setupForm.scoreboardEnabled,
        clockEnabled: setupForm.clockEnabled,
        homeTeamName: setupForm.homeTeamName,
        awayTeamName: setupForm.awayTeamName,
        quarterDuration: setupForm.quarterDuration,
        overtimeDuration: setupForm.overtimeDuration,
      })
      await api.post(`/matches/${match.id}/live/enable`, {
        enabled: !liveInfo.streamingEnabled,
      })
      await fetchLiveInfo()
    } catch (err: any) {
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
  // INICIAR / PARAR EMISIÓN
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

        conn.on('open', () => {
          console.log('🔗 Data connection abierta con viewer:', conn.peer)
        })

        conn.on('close', () => {
          console.log('🔗 Viewer desconectado:', conn.peer)
          setConnectedViewers((v) => v.filter((p) => p !== conn.peer))
        })
      })

      newPeer.on('call', (call) => {
        console.log('📞 Viewer llama:', call.peer)
        call.answer(stream)
        activeCallsRef.current.set(call.peer, call)

        call.on('close', () => {
          console.log('📞 Call cerrada con viewer:', call.peer)
          activeCallsRef.current.delete(call.peer)
          setConnectedViewers((v) => v.filter((p) => p !== call.peer))
        })
      })

      newPeer.on('error', (err) => console.error('❌ Peer error:', err))

      setIsStreaming(true)
      await fetchLiveInfo()
    } catch (err: any) {
      console.error('Error iniciando emisión:', err)
      alert(err.response?.data?.message || err.message || 'Error al iniciar la emisión')
    }
  }

  const stopStreaming = async () => {
    if (!confirm('¿Detener la emisión para todos los espectadores?')) return
    try {
      if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; setPeer(null) }
      activeCallsRef.current.forEach((call) => call.close())
      activeCallsRef.current.clear()
      setConnectedViewers([])
      if (localStream) localStream.getTracks().forEach((t) => t.stop())
      setLocalStream(null)
      setIsStreaming(false)
      await api.post(`/matches/${match.id}/live/stop`)
      await fetchLiveInfo()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al detener la emisión')
    }
  }

  const forceReset = async () => {
    if (!confirm('⚠️ ¿Forzar el reset de la emisión? Se cerrará el vídeo para todos los espectadores.')) return

    try {
      if (peerRef.current) {
        try { peerRef.current.destroy() } catch {}
        peerRef.current = null
        setPeer(null)
      }
      activeCallsRef.current.forEach((c) => {
        try { c.close() } catch {}
      })
      activeCallsRef.current.clear()

      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop())
      }
      setLocalStream(null)
      setRemoteStream(null)
      setConnectedViewers([])
      setIsStreaming(false)
      isHost.current = false

      try {
        await api.post(`/matches/${match.id}/live/stop`)
      } catch (err: any) {
        console.warn('Error parando stream en backend:', err?.response?.data?.message)
      }

      await fetchLiveInfo()
      console.log('✅ Reset forzado completado')
    } catch (err) {
      console.error('Error en forceReset:', err)
      alert('Error al forzar el reset')
      await fetchLiveInfo()
    }
  }

  // ============================================
  // UNIRSE COMO ESPECTADOR / SALIR
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

        const dataConn = newPeer.connect(hostPeerId, { reliable: true })

        dataConn.on('open', () => {
          console.log('🔗 Data connection abierta con host')

          const emptyStream = new MediaStream()
          const call = newPeer.call(hostPeerId, emptyStream)

          if (!call) {
            console.error('❌ newPeer.call devolvió null')
            return
          }

          console.log('📞 Call creada, esperando stream...')

          call.on('stream', (remoteStream) => {
            console.log('📺 Stream recibido!')
            setRemoteStream(remoteStream)
          })

          call.on('close', () => {
            console.log('📞 Call cerrada')
            setRemoteStream(null)
          })

          call.on('error', (err) => {
            console.error('❌ Error en call:', err)
          })
        })

        dataConn.on('error', (err) => {
          console.error('❌ Data connection error:', err)
        })

        dataConn.on('close', () => {
          console.log('🔗 Data connection cerrada')
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

  const leaveAsViewer = async () => {
    try {
      if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null }
      activeCallsRef.current.forEach((c) => c.close())
      activeCallsRef.current.clear()
      if (localStream) localStream.getTracks().forEach((t) => t.stop())
      setLocalStream(null)
      setRemoteStream(null)
      setIsStreaming(false)
      setConnectedViewers([])
      try { await api.delete(`/matches/${match.id}/live/leave`) } catch {}
      await fetchLiveInfo()
    } catch (err) {
      console.error('Error al salir:', err)
      await fetchLiveInfo()
    }
  }

  // ============================================
  // CONTROLES CÁMARA/MIC
  // ============================================

  const toggleCamera = () => {
    if (!localStream) return
    const track = localStream.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setCameraOn(track.enabled) }
  }

  const toggleAudio = () => {
    if (!localStream) return
    const track = localStream.getAudioTracks()[0]
    if (track) { track.enabled = !track.enabled; setAudioOn(track.enabled) }
  }

  // ============================================
  // CONTROLES SCOREBOARD
  // ============================================

  const changeScore = async (team: 'home' | 'away', delta: number) => {
    if (!scoreboard) return
    const newHome = team === 'home' ? scoreboard.homeScore + delta : scoreboard.homeScore
    const newAway = team === 'away' ? scoreboard.awayScore + delta : scoreboard.awayScore
    setScoreboard({ ...scoreboard, homeScore: newHome, awayScore: newAway })
    try {
      await api.put(`/matches/${match.id}/live/scoreboard/score`, { homeScore: newHome, awayScore: newAway })
    } catch (err) { console.error('Error score:', err) }
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
    await api.put(`/matches/${match.id}/live/scoreboard/score`, { homeScore: newHome, awayScore: newAway })
  }

  const clockAction = async (action: 'play' | 'pause' | 'reset' | 'set', seconds?: number) => {
    try {
      const res = await api.put(`/matches/${match.id}/live/scoreboard/clock`, { action, seconds })
      setScoreboard((s) => (s ? { ...s, ...res.data } : s))
    } catch (err) { console.error('Error reloj:', err) }
  }

  const setClockManually = async () => {
    const input = prompt('Tiempo en formato MM:SS (ej: 07:30)', formatClock(displayClock))
    if (!input) return
    const [m, s] = input.split(':').map((x) => parseInt(x, 10))
    if (isNaN(m) || isNaN(s)) return
    await clockAction('set', m * 60 + s)
  }

  const handlePeriodInputChange = (value: string) => {
    const clean = value.slice(0, 3)
    setPeriodInput(clean)
  }

  const handlePeriodInputBlur = async () => {
    if (!scoreboard) return
    const currentLabel = getPeriodLabel(scoreboard)
    if (periodInput === currentLabel) return

    try {
      const res = await api.put(`/matches/${match.id}/live/scoreboard/custom-period`, {
        value: periodInput,
      })
      setScoreboard((s) => (s ? { ...s, customPeriodLabel: res.data.customPeriodLabel } : s))
    } catch (err) {
      console.error('Error guardando cuarto:', err)
      setPeriodInput(currentLabel)
    }
  }

  const nextPeriod = async () => {
    try {
      const res = await api.put(`/matches/${match.id}/live/scoreboard/period`)
      setScoreboard((s) => (s ? { ...s, ...res.data } : s))
      if (res.data.customPeriodLabel) setPeriodInput(res.data.customPeriodLabel)
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

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando emisión...</div>

  if (error || !liveInfo) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'No se pudo cargar la emisión'}
      </div>
    )
  }

  // ==== ESTADOS ====

  if (!liveInfo.streamingEnabled) {
    if (!liveInfo.canManage) {
      return (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-5xl mb-4">📺</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Emisión desactivada</h3>
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
              <p className="text-sm text-gray-500 mt-1">Activa la emisión y elige quién puede emitir</p>
            </div>
            <button onClick={handleToggleEnabled} disabled={togglingEnabled}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50">
              {togglingEnabled ? 'Activando...' : '🔴 Activar emisión'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🎛️ Configuración</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🏠 Equipo local</label>
              <input type="text" value={setupForm.homeTeamName}
                onChange={(e) => setSetupForm({ ...setupForm, homeTeamName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">✈️ Equipo visitante</label>
              <input type="text" value={setupForm.awayTeamName}
                onChange={(e) => setSetupForm({ ...setupForm, awayTeamName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={setupForm.scoreboardEnabled}
                onChange={(e) => setSetupForm({ ...setupForm, scoreboardEnabled: e.target.checked })}
                className="w-4 h-4" />
              <span className="text-sm">Mostrar marcador</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={setupForm.clockEnabled}
                onChange={(e) => setSetupForm({ ...setupForm, clockEnabled: e.target.checked })}
                className="w-4 h-4" />
              <span className="text-sm">Mostrar tiempo</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración del cuarto (min)</label>
              <input type="number" min="1" max="20" value={setupForm.quarterDuration / 60}
                onChange={(e) => setSetupForm({ ...setupForm, quarterDuration: Number(e.target.value) * 60 })}
                className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración de prórroga (min)</label>
              <input type="number" min="1" max="15" value={setupForm.overtimeDuration / 60}
                onChange={(e) => setSetupForm({ ...setupForm, overtimeDuration: Number(e.target.value) * 60 })}
                className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">👥 Permisos para emitir</h3>
            </div>
            <button onClick={handleSavePermissions} disabled={savingPermissions}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50">
              {savingPermissions ? 'Guardando...' : '💾 Guardar permisos'}
            </button>
          </div>
          <div className="space-y-2">
            {candidates.map((c) => (
              <label key={c.userId}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 cursor-pointer transition">
                <input type="checkbox" checked={permissions[c.userId] || false}
                  onChange={() => togglePermission(c.userId)} className="w-4 h-4" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{c.name} {c.lastName}</p>
                  <p className="text-xs text-gray-500">{c.role}</p>
                </div>
                {c.userId === currentUserId && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Tú</span>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (liveInfo.isLive && !isStreaming) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              EN DIRECTO
            </span>
            <span className="text-sm text-gray-500">👥 {liveInfo.viewers.length + 1}/{liveInfo.maxUsers}</span>
            {liveInfo.hostName && <span className="text-sm text-gray-500">🎥 {liveInfo.hostName}</span>}
          </div>
          {liveInfo.canManage && (
            <button
              onClick={forceReset}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm transition"
              title="Forzar reset del stream"
            >
              🔄 Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Emisión en directo!</h3>
          <p className="text-gray-500 text-sm mb-1">{liveInfo.hostName} está emitiendo este partido</p>
          <p className="text-xs text-gray-400 mb-6">
            {liveInfo.maxUsers - 1 - liveInfo.viewers.length} plazas disponibles
          </p>
          <button onClick={joinAsViewer}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition">
            ▶️ Ver en directo
          </button>
        </div>
      </div>
    )
  }

  if (!liveInfo.isLive && !isStreaming) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold text-green-800">✅ Emisión activada</h2>
              <p className="text-sm text-green-700 mt-1">Los usuarios con permiso pueden iniciar el directo</p>
            </div>
            {liveInfo.canManage && (
              <div className="flex gap-2">
                <button
                  onClick={handleToggleEnabled}
                  disabled={togglingEnabled}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {togglingEnabled ? 'Desactivando...' : '⏹️ Desactivar emisión'}
                </button>
                <button
                  onClick={forceReset}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm transition"
                  title="Forzar reset del stream"
                >
                  🔄 Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {liveInfo.myPermission ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-5xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Tienes permiso para emitir</h3>
            <p className="text-gray-500 text-sm mb-6">Cuando pulses el botón, se activará tu cámara</p>
            <button onClick={startStreaming}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition">
              🔴 Iniciar emisión
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Esperando a que alguien emita</h3>
            <p className="text-gray-500 text-sm">Nadie está emitiendo todavía</p>
          </div>
        )}
      </div>
    )
  }

  // ==== 4. EN DIRECTO ====
  const periodLabel = scoreboard ? getPeriodLabel(scoreboard) : 'Q1'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            EN DIRECTO
          </span>
          <span className="text-sm text-gray-500">👥 {liveInfo.viewers.length + 1}/{liveInfo.maxUsers}</span>
          {liveInfo.hostName && <span className="text-sm text-gray-500">🎥 {liveInfo.hostName}</span>}
        </div>
        <div className="flex gap-2">
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

          {liveInfo.canManage && (
            <button
              onClick={forceReset}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm transition"
              title="Forzar reset del stream (útil si se queda colgado)"
            >
              🔄 Reset
            </button>
          )}
        </div>
      </div>

      {/* Vídeo con overlay */}
      <div className="relative bg-black rounded-xl overflow-hidden shadow-md">
        {soyHost && (
          <video key={`local-${isStreaming}`} ref={localVideoRef} autoPlay muted playsInline
            className="w-full aspect-video object-cover" />
        )}
        {soyViewer && (
          <video key={`remote-${isStreaming}`} ref={remoteVideoRef} autoPlay playsInline
            className="w-full aspect-video object-cover" />
        )}

        {/* Overlay del marcador */}
        {scoreboard && (scoreboard.enabled || scoreboard.clockEnabled) && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl">
            {soyHost && (
              <button
                onClick={() => setOverlayVisible(!overlayVisible)}
                className="absolute -top-3 right-2 bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-black z-10"
                title={overlayVisible ? 'Ocultar controles' : 'Mostrar controles'}
              >
                {overlayVisible ? '👁️' : '👁️‍🗨️'}
              </button>
            )}

            <div className="bg-black/75 backdrop-blur-md rounded-2xl px-4 py-3 text-white shadow-2xl border border-white/10">
              {scoreboard.enabled && (
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex-1 text-center min-w-0">
                    <p className="text-xs text-gray-300 truncate">{scoreboard.homeTeamName || 'LOCAL'}</p>
                    <p className="text-3xl font-bold">{scoreboard.homeScore}</p>
                  </div>
                  <span className="text-xl text-gray-500">-</span>
                  <div className="flex-1 text-center min-w-0">
                    <p className="text-xs text-gray-300 truncate">{scoreboard.awayTeamName || 'VISIT'}</p>
                    <p className="text-3xl font-bold">{scoreboard.awayScore}</p>
                  </div>
                </div>
              )}

              {scoreboard.clockEnabled && (
                <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/10">
                  <input
                    ref={periodInputRef}
                    type="text"
                    value={periodInput}
                    onChange={(e) => handlePeriodInputChange(e.target.value)}
                    onBlur={handlePeriodInputBlur}
                    maxLength={3}
                    disabled={!soyHost}
                    readOnly={!soyHost}
                    className={`w-14 text-center bg-white/10 rounded px-1 py-0.5 text-sm font-bold uppercase ${
                      soyHost ? 'border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text' : 'border-0'
                    }`}
                  />
                  <span className={`text-2xl font-mono font-bold ${scoreboard.isOvertime ? 'text-orange-400' : ''}`}>
                    {formatClock(displayClock)}
                  </span>
                  {scoreboard.isOvertime && (
                    <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded">PRÓRROGA</span>
                  )}
                </div>
              )}

              {soyHost && overlayVisible && (
                <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
                  {scoreboard.enabled && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => changeScore('home', -1)}
                          className="w-7 h-7 rounded bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold">−</button>
                        <button onClick={() => changeScore('home', 1)}
                          className="w-7 h-7 rounded bg-green-500/80 hover:bg-green-500 text-white text-xs font-bold">+1</button>
                        <button onClick={() => changeScore('home', 2)}
                          className="w-7 h-7 rounded bg-blue-500/80 hover:bg-blue-500 text-white text-xs font-bold">+2</button>
                        <button onClick={() => changeScore('home', 3)}
                          className="w-7 h-7 rounded bg-purple-500/80 hover:bg-purple-500 text-white text-xs font-bold">+3</button>
                        <button onClick={() => setScoreManually('home')}
                          className="w-7 h-7 rounded bg-white/20 hover:bg-white/30 text-white text-xs" title="Ajustar">✏️</button>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => changeScore('away', -1)}
                          className="w-7 h-7 rounded bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold">−</button>
                        <button onClick={() => changeScore('away', 1)}
                          className="w-7 h-7 rounded bg-green-500/80 hover:bg-green-500 text-white text-xs font-bold">+1</button>
                        <button onClick={() => changeScore('away', 2)}
                          className="w-7 h-7 rounded bg-blue-500/80 hover:bg-blue-500 text-white text-xs font-bold">+2</button>
                        <button onClick={() => changeScore('away', 3)}
                          className="w-7 h-7 rounded bg-purple-500/80 hover:bg-purple-500 text-white text-xs font-bold">+3</button>
                        <button onClick={() => setScoreManually('away')}
                          className="w-7 h-7 rounded bg-white/20 hover:bg-white/30 text-white text-xs" title="Ajustar">✏️</button>
                      </div>
                    </div>
                  )}

                  {scoreboard.clockEnabled && (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {!scoreboard.clockRunning ? (
                        <button onClick={() => clockAction('play')}
                          className="px-3 py-1.5 rounded bg-green-500/80 hover:bg-green-500 text-white text-xs font-bold">
                          ▶️ Iniciar
                        </button>
                      ) : (
                        <button onClick={() => clockAction('pause')}
                          className="px-3 py-1.5 rounded bg-orange-500/80 hover:bg-orange-500 text-white text-xs font-bold">
                          ⏸️ Pausar
                        </button>
                      )}
                      <button onClick={() => clockAction('reset')}
                        className="px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 text-white text-xs font-bold">
                        🔄 Reset
                      </button>
                      <button onClick={setClockManually}
                        className="px-3 py-1.5 rounded bg-blue-500/80 hover:bg-blue-500 text-white text-xs font-bold">
                        ✏️ Editar
                      </button>
                      <button onClick={nextPeriod}
                        className="px-3 py-1.5 rounded bg-indigo-500/80 hover:bg-indigo-500 text-white text-xs font-bold">
                        ➡️ Siguiente
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {soyHost && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={toggleCamera}
              className={`px-3 py-2 rounded-full text-xs font-medium transition ${
                cameraOn ? 'bg-white/90 text-gray-800' : 'bg-red-600 text-white'
              }`}>
              {cameraOn ? '📸' : '📸❌'}
            </button>
            <button onClick={toggleAudio}
              className={`px-3 py-2 rounded-full text-xs font-medium transition ${
                audioOn ? 'bg-white/90 text-gray-800' : 'bg-red-600 text-white'
              }`}>
              {audioOn ? '🎤' : '🔇'}
            </button>
          </div>
        )}

        {soyViewer && !remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white text-center">
              <div className="text-5xl mb-4 animate-pulse">📡</div>
              <p>Conectando con la emisión...</p>
            </div>
          </div>
        )}
      </div>

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