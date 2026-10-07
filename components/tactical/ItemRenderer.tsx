'use client'

import {
  Line,
  Circle,
  Rect,
  Arrow,
  Text as KonvaText,
  Group,
} from 'react-konva'
import type { DrawableItem } from './types'

interface ItemRendererProps {
  item: DrawableItem
  isSelected: boolean
  draggable: boolean
  onSelect?: () => void
  onDragEndDelta?: (dx: number, dy: number) => void
  onDoubleClick?: () => void
}

const BOUNCE_AMPLITUDE = 10
const BOUNCE_WAVELENGTH = 45
const BOUNCE_SEGMENTS_PER_WAVELENGTH = 12
/** Longitud del tramo recto al final de la flecha de bote (antes de la punta). */
const BOUNCE_STRAIGHT_TAIL = 45

function cubicBezierPoints(
  x1: number,
  y1: number,
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number,
  x2: number,
  y2: number,
  segments = 48,
): number[] {
  const points: number[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const mt = 1 - t
    const a = mt * mt * mt
    const b = 3 * mt * mt * t
    const c = 3 * mt * t * t
    const d = t * t * t
    const x = a * x1 + b * cx1 + c * cx2 + d * x2
    const y = a * y1 + b * cy1 + c * cy2 + d * y2
    points.push(x, y)
  }
  return points
}

function bounceArrowPoints(x1: number, y1: number, x2: number, y2: number): number[] {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 1) return [x1, y1, x2, y2]

  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux

  const waveLen = Math.max(0, len - BOUNCE_STRAIGHT_TAIL)
  const k = (2 * Math.PI) / BOUNCE_WAVELENGTH
  const n = Math.max(
    8,
    Math.floor(waveLen / BOUNCE_WAVELENGTH) * BOUNCE_SEGMENTS_PER_WAVELENGTH,
  )

  const points: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * waveLen
    // Forzar offset 0 en el último punto de la onda para que el tramo recto
    // salga perfectamente alineado con la línea base
    const isLast = i === n
    const offset = isLast ? 0 : Math.sin(k * t) * BOUNCE_AMPLITUDE
    const x = x1 + ux * t + px * offset
    const y = y1 + uy * t + py * offset
    points.push(x, y)
  }

  points.push(x2, y2)
  return points
}

function bounceCurvedArrowPoints(
  x1: number,
  y1: number,
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number,
  x2: number,
  y2: number,
): number[] {
  const approxLen =
    Math.hypot(cx1 - x1, cy1 - y1) +
    Math.hypot(cx2 - cx1, cy2 - cy1) +
    Math.hypot(x2 - cx2, y2 - cy2)
  const waveLenTotal = Math.max(0.001, approxLen - BOUNCE_STRAIGHT_TAIL)
  const k = (2 * Math.PI) / BOUNCE_WAVELENGTH
  const n = Math.max(
    24,
    Math.floor(waveLenTotal / BOUNCE_WAVELENGTH) * BOUNCE_SEGMENTS_PER_WAVELENGTH,
  )

  const tEnd = waveLenTotal / approxLen

  const points: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * tEnd
    const mt = 1 - t
    const a = mt * mt * mt
    const b = 3 * mt * mt * t
    const c = 3 * mt * t * t
    const d = t * t * t

    const bx = a * x1 + b * cx1 + c * cx2 + d * x2
    const by = a * y1 + b * cy1 + c * cy2 + d * y2

    const tx = 3 * mt * mt * (cx1 - x1) + 6 * mt * t * (cx2 - cx1) + 3 * t * t * (x2 - cx2)
    const ty = 3 * mt * mt * (cy1 - y1) + 6 * mt * t * (cy2 - cy1) + 3 * t * t * (y2 - cy2)
    const tlen = Math.hypot(tx, ty) || 1
    const ntx = tx / tlen
    const nty = ty / tlen
    const px = -nty
    const py = ntx

    const isLast = i === n
    const offset = isLast ? 0 : Math.sin(k * approxLen * t) * BOUNCE_AMPLITUDE

    points.push(bx + px * offset, by + py * offset)
  }

  points.push(x2, y2)
  return points
}

function arrowheadPoints(x2: number, y2: number, dx: number, dy: number) {
  const len = Math.hypot(dx, dy) || 1
  return [x2 - (dx / len) * 1, y2 - (dy / len) * 1, x2, y2]
}

export function ItemRenderer({
  item,
  isSelected,
  draggable,
  onSelect,
  onDragEndDelta,
  onDoubleClick,
}: ItemRendererProps) {
  const commonProps = {
    name: 'deletable',
    id: item.id,
    onClick: onSelect,
    onTap: onSelect,
    onDblClick: onDoubleClick,
    onDblTap: onDoubleClick,
  }

  const selectionColor = '#00E676'

  // ─── Lápiz ───
  if (item.type === 'pencil') {
    return (
      <Group
        x={0} y={0}
        draggable={draggable}
        onDragEnd={(e) => {
          const dx = e.target.x()
          const dy = e.target.y()
          e.target.x(0); e.target.y(0)
          onDragEndDelta?.(dx, dy)
        }}
      >
        <Line
          {...commonProps}
          points={item.points}
          stroke={item.color}
          strokeWidth={item.strokeWidth}
          lineCap="round"
          lineJoin="round"
          tension={0.4}
          hitStrokeWidth={Math.max(20, item.strokeWidth * 4)}
        />
        {isSelected && (
          <Line
            points={item.points}
            stroke={selectionColor}
            strokeWidth={2}
            dash={[6, 4]}
            lineCap="round"
            lineJoin="round"
            tension={0.4}
            listening={false}
            opacity={0.8}
          />
        )}
      </Group>
    )
  }

  // ─── Flecha recta ───
  if (item.type === 'arrow') {
    return (
      <Group
        x={0} y={0}
        draggable={draggable}
        onDragEnd={(e) => {
          const dx = e.target.x()
          const dy = e.target.y()
          e.target.x(0); e.target.y(0)
          onDragEndDelta?.(dx, dy)
        }}
      >
        <Arrow
          {...commonProps}
          points={item.points}
          stroke={item.color}
          fill={item.color}
          strokeWidth={item.strokeWidth}
          pointerLength={12}
          pointerWidth={12}
          hitStrokeWidth={Math.max(20, item.strokeWidth * 4)}
        />
      </Group>
    )
  }

  // ─── Línea ───
  if (item.type === 'line') {
    return (
      <Group
        x={0} y={0}
        draggable={draggable}
        onDragEnd={(e) => {
          const dx = e.target.x()
          const dy = e.target.y()
          e.target.x(0); e.target.y(0)
          onDragEndDelta?.(dx, dy)
        }}
      >
        <Line
          {...commonProps}
          points={item.points}
          stroke={item.color}
          strokeWidth={item.strokeWidth}
          lineCap="round"
          hitStrokeWidth={Math.max(20, item.strokeWidth * 4)}
        />
      </Group>
    )
  }

  // ─── Flecha curva ───
  if (item.type === 'curved-arrow') {
    const [x1, y1, cx1, cy1, cx2, cy2, x2, y2] = item.points
    const curvePoints = cubicBezierPoints(x1, y1, cx1, cy1, cx2, cy2, x2, y2, 48)
    const head = arrowheadPoints(x2, y2, x2 - cx2, y2 - cy2)
    return (
      <Group
        x={0} y={0}
        draggable={draggable}
        onDragEnd={(e) => {
          const dx = e.target.x()
          const dy = e.target.y()
          e.target.x(0); e.target.y(0)
          onDragEndDelta?.(dx, dy)
        }}
      >
        <Line
          {...commonProps}
          points={curvePoints}
          stroke={item.color}
          strokeWidth={item.strokeWidth}
          lineCap="round"
          lineJoin="round"
          hitStrokeWidth={Math.max(20, item.strokeWidth * 4)}
        />
        <Arrow
          points={head}
          stroke={item.color}
          fill={item.color}
          strokeWidth={item.strokeWidth}
          pointerLength={12}
          pointerWidth={12}
          listening={false}
        />
      </Group>
    )
  }

  // ─── Bote recto ───
  if (item.type === 'bounce-arrow') {
    const [x1, y1, x2, y2] = item.points
    const points = bounceArrowPoints(x1, y1, x2, y2)
    const head = arrowheadPoints(x2, y2, x2 - x1, y2 - y1)
    return (
      <Group
        x={0} y={0}
        draggable={draggable}
        onDragEnd={(e) => {
          const dx = e.target.x()
          const dy = e.target.y()
          e.target.x(0); e.target.y(0)
          onDragEndDelta?.(dx, dy)
        }}
      >
        <Line
          {...commonProps}
          points={points}
          stroke={item.color}
          strokeWidth={item.strokeWidth}
          lineCap="round"
          lineJoin="round"
          hitStrokeWidth={Math.max(20, item.strokeWidth * 4)}
        />
        <Arrow
          points={head}
          stroke={item.color}
          fill={item.color}
          strokeWidth={item.strokeWidth}
          pointerLength={12}
          pointerWidth={12}
          listening={false}
        />
      </Group>
    )
  }

  // ─── Bote curvo ───
  if (item.type === 'bounce-curved-arrow') {
    const [x1, y1, cx1, cy1, cx2, cy2, x2, y2] = item.points
    const points = bounceCurvedArrowPoints(x1, y1, cx1, cy1, cx2, cy2, x2, y2)
    const head = arrowheadPoints(x2, y2, x2 - cx2, y2 - cy2)
    return (
      <Group
        x={0} y={0}
        draggable={draggable}
        onDragEnd={(e) => {
          const dx = e.target.x()
          const dy = e.target.y()
          e.target.x(0); e.target.y(0)
          onDragEndDelta?.(dx, dy)
        }}
      >
        <Line
          {...commonProps}
          points={points}
          stroke={item.color}
          strokeWidth={item.strokeWidth}
          lineCap="round"
          lineJoin="round"
          hitStrokeWidth={Math.max(20, item.strokeWidth * 4)}
        />
        <Arrow
          points={head}
          stroke={item.color}
          fill={item.color}
          strokeWidth={item.strokeWidth}
          pointerLength={12}
          pointerWidth={12}
          listening={false}
        />
      </Group>
    )
  }

  // ─── Jugador ───
  if (item.type === 'player') {
    const label = item.number ?? ''
    const fontSize = Math.max(12, item.radius * 0.9)
    return (
      <>
        <Group
          {...commonProps}
          x={item.x} y={item.y}
          draggable={draggable}
          onDragEnd={(e) => {
            const node = e.target
            const dx = node.x() - item.x
            const dy = node.y() - item.y
            onDragEndDelta?.(dx, dy)
            node.x(item.x); node.y(item.y)
          }}
        >
          <Circle radius={item.radius} fill={item.fill} stroke="#ffffff" strokeWidth={2} />
          {label && (
            <KonvaText
              text={label}
              fontSize={fontSize}
              fill="#ffffff"
              fontStyle="bold"
              width={item.radius * 2}
              height={item.radius * 2}
              offsetX={item.radius}
              offsetY={item.radius}
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          )}
        </Group>
        {isSelected && (
          <Circle
            x={item.x} y={item.y}
            radius={item.radius + 5}
            stroke={selectionColor}
            strokeWidth={2}
            dash={[4, 3]}
            listening={false}
          />
        )}
      </>
    )
  }

  // ─── Cono ───
  if (item.type === 'cone') {
    return (
      <>
        <Group
          {...commonProps}
          x={item.x} y={item.y}
          draggable={draggable}
          onDragEnd={(e) => {
            const node = e.target
            const dx = node.x() - item.x
            const dy = node.y() - item.y
            onDragEndDelta?.(dx, dy)
            node.x(item.x); node.y(item.y)
          }}
        >
          <Circle radius={item.radius} fill={item.fill} stroke="#ffffff" strokeWidth={2} />
        </Group>
        {isSelected && (
          <Circle
            x={item.x} y={item.y}
            radius={item.radius + 5}
            stroke={selectionColor}
            strokeWidth={2}
            dash={[4, 3]}
            listening={false}
          />
        )}
      </>
    )
  }

  // ─── Balón ───
  if (item.type === 'ball') {
    const r = item.radius
    return (
      <>
        <Group
          {...commonProps}
          x={item.x} y={item.y}
          draggable={draggable}
          onDragEnd={(e) => {
            const node = e.target
            const dx = node.x() - item.x
            const dy = node.y() - item.y
            onDragEndDelta?.(dx, dy)
            node.x(item.x); node.y(item.y)
          }}
        >
          <Circle radius={r} fill="#f97316" stroke="#000000" strokeWidth={3} />
        </Group>
        {isSelected && (
          <Circle
            x={item.x} y={item.y}
            radius={r + 5}
            stroke={selectionColor}
            strokeWidth={2}
            dash={[4, 3]}
            listening={false}
          />
        )}
      </>
    )
  }

  // ─── Texto ───
  if (item.type === 'text') {
    return (
      <>
        <Group
          {...commonProps}
          x={item.x} y={item.y}
          draggable={draggable}
          onDragEnd={(e) => {
            const node = e.target
            const dx = node.x() - item.x
            const dy = node.y() - item.y
            onDragEndDelta?.(dx, dy)
            node.x(item.x); node.y(item.y)
          }}
        >
          <KonvaText
            text={item.text}
            fontSize={item.fontSize}
            fill={item.color}
            fontStyle="bold"
          />
        </Group>
        {isSelected && (
          <Rect
            x={item.x - 4} y={item.y - 4}
            width={item.text.length * item.fontSize * 0.6 + 8}
            height={item.fontSize + 8}
            stroke={selectionColor}
            strokeWidth={2}
            dash={[4, 3]}
            listening={false}
          />
        )}
      </>
    )
  }

  // ─── Círculo ───
  if (item.type === 'circle') {
    return (
      <>
        <Group
          {...commonProps}
          x={item.x} y={item.y}
          draggable={draggable}
          onDragEnd={(e) => {
            const node = e.target
            const dx = node.x() - item.x
            const dy = node.y() - item.y
            onDragEndDelta?.(dx, dy)
            node.x(item.x); node.y(item.y)
          }}
        >
          <Circle
            radius={item.radius}
            stroke={item.color}
            strokeWidth={item.strokeWidth}
            fill={item.fill}
          />
        </Group>
        {isSelected && (
          <Circle
            x={item.x} y={item.y}
            radius={item.radius + 5}
            stroke={selectionColor}
            strokeWidth={2}
            dash={[4, 3]}
            listening={false}
          />
        )}
      </>
    )
  }

  // ─── Rectángulo ───
  if (item.type === 'rect') {
    return (
      <>
        <Group
          {...commonProps}
          x={item.x} y={item.y}
          draggable={draggable}
          onDragEnd={(e) => {
            const node = e.target
            const dx = node.x() - item.x
            const dy = node.y() - item.y
            onDragEndDelta?.(dx, dy)
            node.x(item.x); node.y(item.y)
          }}
        >
          <Rect
            x={0} y={0}
            width={item.width} height={item.height}
            stroke={item.color}
            strokeWidth={item.strokeWidth}
            fill={item.fill}
          />
        </Group>
        {isSelected && (
          <Rect
            x={item.x - 5} y={item.y - 5}
            width={item.width + 10} height={item.height + 10}
            stroke={selectionColor}
            strokeWidth={2}
            dash={[4, 3]}
            listening={false}
          />
        )}
      </>
    )
  }

  return null
}

// ============================================
// TIRADORES
// ============================================

interface ItemHandlesProps {
  item: DrawableItem
  onControlPointDrag: (index: number, x: number, y: number) => void
}

export function ItemHandles({ item, onControlPointDrag }: ItemHandlesProps) {
  const selectionColor = '#00E676'

  if (item.type === 'arrow' || item.type === 'line' || item.type === 'bounce-arrow') {
    return (
      <>
        <ControlHandle x={item.points[0]} y={item.points[1]} onDrag={(x, y) => onControlPointDrag(0, x, y)} />
        <ControlHandle x={item.points[2]} y={item.points[3]} onDrag={(x, y) => onControlPointDrag(2, x, y)} />
      </>
    )
  }

  if (item.type === 'curved-arrow' || item.type === 'bounce-curved-arrow') {
    const [x1, y1, cx1, cy1, cx2, cy2, x2, y2] = item.points
    return (
      <>
        <Line points={[x1, y1, cx1, cy1]} stroke={selectionColor} strokeWidth={1} dash={[4, 4]} opacity={0.5} listening={false} />
        <Line points={[cx1, cy1, cx2, cy2]} stroke={selectionColor} strokeWidth={1} dash={[4, 4]} opacity={0.3} listening={false} />
        <Line points={[cx2, cy2, x2, y2]} stroke={selectionColor} strokeWidth={1} dash={[4, 4]} opacity={0.5} listening={false} />

        <ControlHandle x={x1} y={y1} onDrag={(x, y) => onControlPointDrag(0, x, y)} />
        <ControlHandle x={cx1} y={cy1} onDrag={(x, y) => onControlPointDrag(2, x, y)} />
        <ControlHandle x={cx2} y={cy2} onDrag={(x, y) => onControlPointDrag(4, x, y)} />
        <ControlHandle x={x2} y={y2} onDrag={(x, y) => onControlPointDrag(6, x, y)} />
      </>
    )
  }

  if (item.type === 'text') {
    return (
      <ControlHandle
        x={item.x}
        y={item.y}
        onDrag={(x, y) => onControlPointDrag(0, x, y)}
      />
    )
  }

  return null
}

function ControlHandle({
  x,
  y,
  onDrag,
}: {
  x: number
  y: number
  onDrag: (x: number, y: number) => void
}) {
  return (
    <Circle
      x={x} y={y}
      radius={10}
      fill="#ffffff"
      stroke="#00E676"
      strokeWidth={2}
      draggable={true}
      onMouseDown={(e) => { e.cancelBubble = true }}
      onDragStart={(e) => { e.cancelBubble = true }}
      onDragMove={(e) => {
        e.cancelBubble = true
        onDrag(e.target.x(), e.target.y())
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true
        onDrag(e.target.x(), e.target.y())
      }}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container()
        if (container) container.style.cursor = 'grab'
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container()
        if (container) container.style.cursor = 'default'
      }}
    />
  )
}