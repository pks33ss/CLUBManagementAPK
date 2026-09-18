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

  const [isStreaming, setIsStreaming] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peer, setPeer] = useState<Peer | null>(null)
  const [connectedViewers, setConnectedViewers] = useState<string[]>([])
  const [cameraOn, setCameraOn] = useState(true)
  const [audioOn, setAudioOn] = useState(true)

  const [scoreboard, setScoreboard] = useState<ScoreboardState | null>(null)
  const [displayClock, setDisplayClock] = useState(0)

  const [overlayVisible, setOverlayVisible] = useState(true)
  const [periodInput, setPeriodInput] = useState('')
  const periodInputRef = useRef<HTMLInputElement>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<Peer | null>(null)
  const activeCallsRef = useRef<Map<string, MediaConnection>>(new Map())
  const dataChannelsRef = useRef<Map<string, any>>(new Map()) // ✅ Map de peerId → DataConnection
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
// ✅ POLLING de respaldo (solo viewer, cada 5s)
// ============================================

useEffect(() => {
  if (!soyViewer) return
  if (!liveInfo?.isLive) return

  const interval = setInterval(async () => {
    try {
      const res = await api.get(`/matches/${match.id}/live`)
      if (res.data.scoreboard) {
        setScoreboard(res.data.scoreboard)
      }
    } catch (err) {
      console.warn('Polling error:', err)
    }
  }, 5000) // cada 5 segundos

  return () => clearInterval(interval)
}, [soyViewer, liveInfo?.isLive, match.id])

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

  // ✅ Guardar referencia al data channel
  dataChannelsRef.current.set(conn.peer, conn)

  conn.on('open', () => {
    console.log('🔗 Data connection abierta con viewer:', conn.peer)

    // ✅ Enviar el estado actual del scoreboard al nuevo viewer
    if (scoreboard) {
      try {
        conn.send({
          type: 'scoreboard-sync',
          scoreboard,
        })
      } catch (err) {
        console.warn('Error enviando sync inicial:', err)
      }
    }
  })

  conn.on('close', () => {
    console.log('🔗 Viewer desconectado:', conn.peer)
    setConnectedViewers((v) => v.filter((p) => p !== conn.peer))
    dataChannelsRef.current.delete(conn.peer)
  })
})

      // ✅ on('call') reforzado
      newPeer.on('call', (call) => {
        console.log('📞 Viewer llama:', call.peer)
        console.log('📞 Stream a enviar tiene tracks:', stream.getTracks().map(t => t.kind))

        // 1) Answer
        call.answer(stream)
        console.log('✅ Answer enviado')

        activeCallsRef.current.set(call.peer, call)

        // 2) Verificar senders después de 500ms
        setTimeout(async () => {
          const pc = (call as any).peerConnection as RTCPeerConnection
          if (!pc) {
            console.warn('⚠️ No hay peerConnection')
            return
          }

          const senders = pc.getSenders()
          console.log('🔍 PC senders después de answer:', senders.map((s: any) => ({
            kind: s.track?.kind,
            enabled: s.track?.enabled,
            state: s.track?.readyState,
          })))

          // 3) Si no hay video sender, añadir manualmente
          const videoSender = senders.find((s: any) => s.track?.kind === 'video')
          if (!videoSender) {
            const videoTrack = stream.getVideoTracks()[0]
            if (videoTrack) {
              console.log('➕ Añadiendo video track manualmente')
              pc.addTrack(videoTrack, stream)
            }
          }

          // 4) Si no hay audio sender, añadir manualmente
          const audioSender = senders.find((s: any) => s.track?.kind === 'audio')
          if (!audioSender) {
            const audioTrack = stream.getAudioTracks()[0]
            if (audioTrack) {
              console.log('➕ Añadiendo audio track manualmente')
              pc.addTrack(audioTrack, stream)
            }
          }

          // 5) Renegociar si hemos añadido algo
          if (!videoSender || !audioSender) {
            try {
              console.log('🔄 Renegociando conexión...')
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              console.log('🔄 Oferta de renegociación creada')
            } catch (err) {
              console.error('❌ Error renegociando:', err)
            }
          }

          // 6) Estado final
          setTimeout(() => {
            console.log('🔍 PC senders FINAL:', pc.getSenders().map((s: any) => ({
              kind: s.track?.kind,
              enabled: s.track?.enabled,
            })))
            console.log('🔍 PC state FINAL:', pc.connectionState, pc.iceConnectionState)
          }, 2000)
        }, 500)

        call.on('close', () => {
          console.log('📞 Call cerrada con viewer:', call.peer)
          activeCallsRef.current.delete(call.peer)
          setConnectedViewers((v) => v.filter((p) => p !== call.peer))
        })

        call.on('error', (err) => {
          console.error('❌ Error en call:', err)
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

                // ✅ NUEVO: Escuchar mensajes del host (scoreboard en tiempo real)
    dataConn.on('data', (data: any) => {
      console.log('📨 Mensaje recibido del host:', data)
      if (data?.type === 'scoreboard-update' || data?.type === 'scoreboard-sync') {
        if (data.scoreboard) {
          setScoreboard(data.scoreboard)
        }
      }
    })


// ✅ Stream dummy con canvas para que la negociación SDP incluya los m-line
const canvas = document.createElement('canvas')
canvas.width = 160
canvas.height = 120
const ctx = canvas.getContext('2d')!
ctx.fillStyle = 'black'
ctx.fillRect(0, 0, canvas.width, canvas.height)

const dummyStream = canvas.captureStream(1) // 1 fps, mínimo consumo

const call = newPeer.call(hostPeerId, dummyStream)

          if (!call) {
            console.error('❌ newPeer.call devolvió null')
            return
          }

          console.log('📞 Call creada, esperando stream...')

          call.on('stream', (remoteStream) => {
            console.log('📺 Stream recibido!', remoteStream)
            console.log('📺 Tracks del stream recibido:', remoteStream.getTracks().map(t => t.kind))
            setRemoteStream(remoteStream)
          })

          call.on('close', () => {
            console.log('📞 Call cerrada')
            setRemoteStream(null)
          })

          call.on('error', (err) => {
            console.error('❌ Error en call:', err)
          })

          // ✅ Log estado del peerConnection del viewer
          setTimeout(() => {
            const pc = (call as any).peerConnection as RTCPeerConnection
            if (pc) {
              console.log('🔍 PC viewer state:', pc.connectionState, pc.iceConnectionState)
              console.log('🔍 PC viewer receivers:', pc.getReceivers().map((r: any) => ({
                kind: r.track?.kind,
                enabled: r.track?.enabled,
              })))
            }
          }, 3000)
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

// ✅ Emitir cambio de scoreboard por el data channel a todos los viewers
const broadcastScoreboard = (newScoreboard: ScoreboardState) => {
  dataChannelsRef.current.forEach((conn, peerId) => {
    if (conn.open) {
      try {
        conn.send({
          type: 'scoreboard-update',
          scoreboard: newScoreboard,
        })
      } catch (err) {
        console.warn(`Error enviando a ${peerId}:`, err)
      }
    }
  })
}

const changeScore = async (team: 'home' | 'away', delta: number) => {
  if (!scoreboard) return
  const newHome = team === 'home' ? scoreboard.homeScore + delta : scoreboard.homeScore
  const newAway = team === 'away' ? scoreboard.awayScore + delta : scoreboard.awayScore
  const updated = { ...scoreboard, homeScore: newHome, awayScore: newAway }
  setScoreboard(updated)
  broadcastScoreboard(updated)   // ✅ EMITIR
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
  const updated = { ...scoreboard, homeScore: newHome, awayScore: newAway }
  setScoreboard(updated)
  broadcastScoreboard(updated)   // ✅ EMITIR
  await api.put(`/matches/${match.id}/live/scoreboard/score`, { homeScore: newHome, awayScore: newAway })
}

const clockAction = async (action: 'play' | 'pause' | 'reset' | 'set', seconds?: number) => {
  try {
    const res = await api.put(`/matches/${match.id}/live/scoreboard/clock`, { action, seconds })
    const updated = { ...scoreboard!, ...res.data }
    setScoreboard(updated)
    broadcastScoreboard(updated)   // ✅ EMITIR
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
    const updated = { ...scoreboard, customPeriodLabel: res.data.customPeriodLabel }
    setScoreboard(updated)
    broadcastScoreboard(updated)   // ✅ EMITIR
  } catch (err) {
    console.error('Error guardando cuarto:', err)
    setPeriodInput(currentLabel)
  }
}

const nextPeriod = async () => {
  try {
    const res = await api.put(`/matches/${match.id}/live/scoreboard/period`)
    const updated = { ...scoreboard!, ...res.data }
    setScoreboard(updated)
    broadcastScoreboard(updated)   // ✅ EMITIR
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
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex flex-col max-w-[85%]">
    {soyHost && (
      <button
        onClick={() => setOverlayVisible(!overlayVisible)}
        className="absolute -top-3 right-2 bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-black z-10"
        title={overlayVisible ? 'Ocultar controles' : 'Mostrar controles'}
      >
        {overlayVisible ? '👁️' : '👁️‍🗨️'}
      </button>
    )}

    <div className="rounded-xl overflow-hidden shadow-2xl border border-white/20">
      {/* ===== FILA PRINCIPAL: [A] NOMBRE_A | TIEMPO CUARTO | NOMBRE_B [B] ===== */}
      <div className="flex items-stretch">
        
        {/* --- BLOQUE IZQUIERDO: Marcador A + Nombre A --- */}
        {scoreboard.enabled && (
          <div className="flex items-stretch shrink-0">
            {/* Marcador A: fondo blanco, letras negras */}
            <div className="bg-white text-black px-3 py-1.5 flex items-center justify-center min-w-[50px]">
              <span className="text-2xl font-bold leading-none">
                {scoreboard.homeScore}
              </span>
            </div>
            {/* Nombre A: fondo negro, letras blancas negrita, justificado a la derecha */}
<div className="bg-black text-white px-3 py-1.5 flex items-center justify-end flex-1 min-w-[80px] max-w-[200px]">
  <span className="text-sm font-bold uppercase truncate text-right">
    {scoreboard.homeTeamName || 'LOCAL'}
  </span>
</div>
          </div>
        )}

        {/* --- BLOQUE CENTRAL: Tiempo + Cuarto --- */}
        {scoreboard.clockEnabled && (
          <div className="flex items-stretch shrink-0">
            {/* Tiempo: fondo blanco, letras negras */}
            <div className="bg-white text-black px-3 py-1.5 flex items-center justify-center min-w-[80px]">
              <span
                className={`text-2xl font-mono font-bold leading-none ${
                  scoreboard.isOvertime ? 'text-orange-600' : ''
                }`}
              >
                {formatClock(displayClock)}
              </span>
            </div>
            {/* Cuarto: fondo blanco, letras negras, editable por host */}
            <input
              ref={periodInputRef}
              type="text"
              value={periodInput}
              onChange={(e) => handlePeriodInputChange(e.target.value)}
              onBlur={handlePeriodInputBlur}
              maxLength={3}
              disabled={!soyHost}
              readOnly={!soyHost}
              className={`bg-white text-black px-2 py-1.5 text-center text-sm font-bold uppercase w-12 border-l border-gray-300 ${
                soyHost
                  ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text'
                  : 'cursor-default'
              }`}
            />
            {scoreboard.isOvertime && (
              <div className="bg-orange-500 text-white px-2 py-1.5 flex items-center text-[10px] font-bold uppercase">
                PRÓRROGA
              </div>
            )}
          </div>
        )}

        {/* --- BLOQUE DERECHO: Nombre B + Marcador B --- */}
        {scoreboard.enabled && (
          <div className="flex items-stretch shrink-0">
            {/* Nombre B: fondo negro, letras blancas negrita, justificado a la izquierda */}
<div className="bg-black text-white px-3 py-1.5 flex items-center justify-start flex-1 min-w-[80px] max-w-[200px]">
  <span className="text-sm font-bold uppercase truncate text-left">
    {scoreboard.awayTeamName || 'VISIT'}
  </span>
</div>
            {/* Marcador B: fondo blanco, letras negras */}
            <div className="bg-white text-black px-3 py-1.5 flex items-center justify-center min-w-[50px]">
              <span className="text-2xl font-bold leading-none">
                {scoreboard.awayScore}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ===== CONTROLES DEL HOST (debajo de la barra) ===== */}
      {soyHost && overlayVisible && (
        <div className="bg-black/90 backdrop-blur-md px-3 py-2 border-t border-white/10 space-y-1.5">
          {/* Botones del marcador */}
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
                  className="w-7 h-7 rounded bg-white/20 hover:bg-white/30 text-white text-xs">✏️</button>
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
                  className="w-7 h-7 rounded bg-white/20 hover:bg-white/30 text-white text-xs">✏️</button>
              </div>
            </div>
          )}

          {/* Botones del reloj */}
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