// frontend-web/components/TrendChart.tsx

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
import { useTranslations } from 'next-intl'
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

// 👇 NUEVO COMPONENTE para pintar múltiples líneas en el eje X
const CustomTick = (props: any) => {
  const { x, y, payload } = props
  const lines = String(payload.value).split('\n')

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line: string, index: number) => (
        <text
          key={index}
          x={0}
          y={index * 14}
          dy={12}
          textAnchor="middle"
          fill="#888"
          fontSize={11}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

export default function TrendChart({
  series,
  label,
  unit,
  color = '#00E676',
  height = 256,
  isPercentage = false,
}: Props) {
  const t = useTranslations('Stats.chart')

  if (series.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-text-muted text-sm"
        style={{ height }}
      >
        {t('noData')}
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
          // Aumentamos el margen inferior para dejar espacio a las líneas del eje X
          margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="month"
            stroke="#888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={<CustomTick />} // 👈 Usamos el custom tick
            height={60}           // 👈 Damos altura para las 3 líneas
            interval="preserveStartEnd" // Evita que se solapen si hay muchos
            // tickFormatter={(m) => String(m).slice(2)} // 👈 ELIMINADO
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
            // En el tooltip, cambiamos los saltos de línea por comas para que no quede feo
            labelFormatter={(l) => String(l).replace(/\n/g, ' · ')}
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