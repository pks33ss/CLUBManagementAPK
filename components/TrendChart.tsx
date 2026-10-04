'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { TrendSeriesPoint } from '@/lib/api/teams'

interface Props {
  series: TrendSeriesPoint[]
  label: string
  unit?: string
  color?: string
  height?: number
  /** Si true, no pinta el dominio [0,100] y deja a recharts calcularlo. */
  isPercentage?: boolean
}

export default function TrendChart({
  series,
  label,
  unit,
  color = '#00E676',
  height = 256,
  isPercentage = false,
}: Props) {
  if (series.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-text-muted text-sm"
        style={{ height }}
      >
        Sin datos para esta métrica.
      </div>
    )
  }

  const formatter = (value: unknown) => {
    const n = value as number
    return unit ? [`${n}${unit === '%' ? '%' : ` ${unit}`}`, label] : [n, label]
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={series}
          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="month"
            stroke="#888"
            fontSize={12}
            tickFormatter={(m) => String(m).slice(2)}
          />
          <YAxis
            stroke="#888"
            fontSize={12}
            domain={isPercentage ? [0, 100] : undefined}
            tickFormatter={(v) => (unit === '%' ? `${v}%` : `${v}`)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0A0A0A',
              border: '1px solid #333',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={formatter as any}
            labelFormatter={((l: unknown) => `Mes: ${l}`) as any}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}