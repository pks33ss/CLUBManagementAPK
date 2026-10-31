'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api'
import { Card, CardBody } from '@/components/ui'

interface DashboardData {
  totals: {
    demoOpens: number
    users: number
    clubs: number
    teams: number
    sessions: number
    exercises: number
    plays: number
  }
  trends: {
    demoOpens: { date: string; value: number }[]
    users: { date: string; value: number }[]
    clubs: { date: string; value: number }[]
    teams: { date: string; value: number }[]
    sessions: { date: string; value: number }[]
    exercises: { date: string; value: number }[]
    plays: { date: string; value: number }[]
  }
}

type MetricKey = keyof DashboardData['totals']

const METRICS: MetricKey[] = ['users', 'clubs', 'teams', 'sessions', 'exercises', 'plays', 'demoOpens']

export default function AdminDashboard() {
  const t = useTranslations('Settings.dashboard')
  
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Gráfica seleccionada por defecto
  const [activeMetric, setActiveMetric] = useState<MetricKey>('users')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/analytics/dashboard')
        setData(res.data)
      } catch (e: any) {
        console.error('Error loading dashboard:', e)
        setError(e?.response?.data?.message || t('errorLoad'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [t])

  if (loading) {
    return <div className="text-center py-12 text-text-muted">{t('loading')}</div>
  }

  if (error || !data) {
    return <div className="text-center py-12 text-danger">{error || 'Error'}</div>
  }

  // Colores para cada métrica
  const metricColors: Record<MetricKey, string> = {
    demoOpens: '#f59e0b', // amber
    users: '#3b82f6',     // blue
    clubs: '#8b5cf6',     // violet
    teams: '#ec4899',     // pink
    sessions: '#10b981',  // emerald
    exercises: '#06b6d4', // cyan
    plays: '#ef4444',     // red
  }

  const activeColor = metricColors[activeMetric]
  const activeData = data.trends[activeMetric]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">{t('title')}</h2>
        <p className="text-text-secondary mt-1">{t('subtitle')}</p>
      </div>

      {/* CONTADORES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRICS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveMetric(key)}
            className={`text-left transition ${
              activeMetric === key 
                ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-bg-base rounded-xl' 
                : 'opacity-80 hover:opacity-100'
            }`}
          >
            <Card>
              <CardBody className="p-4 flex flex-col justify-center">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                  {t(`metrics.${key}`)}
                </p>
                <p className="text-3xl font-bold text-text-primary" style={{ color: activeMetric === key ? activeColor : undefined }}>
                  {data.totals[key].toLocaleString()}
                </p>
              </CardBody>
            </Card>
          </button>
        ))}
      </div>

      {/* GRÁFICA */}
      <Card>
        <CardBody className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('chartTitle')}
            </h3>
            <p className="text-sm text-text-muted">
              {t('chartDesc')} · <strong style={{ color: activeColor }}>{t(`metrics.${activeMetric}`)}</strong>
            </p>
          </div>

          <div className="h-[400px] w-full">
            {activeData.every(d => d.value === 0) ? (
              <div className="flex items-center justify-center h-full text-text-muted">
                {t('chartEmpty')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666" 
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(val) => {
                      const parts = val.split('-')
                      return `${parts[2]}/${parts[1]}` // DD/MM
                    }}
                  />
                  <YAxis 
                    stroke="#666" 
                    tick={{ fill: '#888', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: activeColor }}
                    labelFormatter={(label) => {
                      const parts = label.split('-')
                      return `${parts[2]}/${parts[1]}/${parts[0]}`
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={activeColor} 
                    strokeWidth={3}
                    dot={{ r: 4, fill: activeColor, strokeWidth: 0 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}