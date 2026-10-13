// ============================================
// TIPOS COMPARTIDOS DE LA PIZARRA TÁCTICA
// ============================================

export type Tool =
  | 'select'
  | 'pencil'
  | 'arrow'
  | 'arrow-dashed'
  | 'curved-arrow'
  | 'curved-arrow-dashed'
  | 'bounce-arrow'
  | 'bounce-curved-arrow'
  | 'line'
  | 'player'
  | 'cone'
  | 'ball'
  | 'text'
  | 'circle'
  | 'rect'
  | 'eraser'

export interface BaseItem {
  id: string
  type: Tool
  color: string
  strokeWidth: number
}

export interface PencilItem extends BaseItem {
  type: 'pencil'
  points: number[]
}

export interface ArrowItem extends BaseItem {
  type: 'arrow' | 'line' | 'arrow-dashed'
  points: number[]
}

export interface CurvedArrowItem extends BaseItem {
  type: 'curved-arrow' | 'curved-arrow-dashed'
  points: number[]
}

export interface BounceArrowItem extends BaseItem {
  type: 'bounce-arrow'
  points: number[]
}

export interface BounceCurvedArrowItem extends BaseItem {
  type: 'bounce-curved-arrow'
  points: number[]
}

export interface PlayerItem extends BaseItem {
  type: 'player'
  x: number
  y: number
  radius: number
  fill: string
  number?: string
}

export interface ConeItem extends BaseItem {
  type: 'cone'
  x: number
  y: number
  radius: number
  fill: string
}

export interface BallItem extends BaseItem {
  type: 'ball'
  x: number
  y: number
  radius: number
  fill: string
}

export interface TextItem extends BaseItem {
  type: 'text'
  x: number
  y: number
  text: string
  fontSize: number
}

export interface CircleItem extends BaseItem {
  type: 'circle'
  x: number
  y: number
  radius: number
  fill: string
}

export interface RectItem extends BaseItem {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
  fill: string
}

export type DrawableItem =
  | PencilItem
  | ArrowItem
  | CurvedArrowItem
  | BounceArrowItem
  | BounceCurvedArrowItem
  | PlayerItem
  | ConeItem
  | BallItem
  | TextItem
  | CircleItem
  | RectItem

// ✅ NUEVO — Modo de pista
export type TacticalBackgroundMode = 'HALF' | 'FULL'

export interface TacticalBoardProps {
  width?: number
  height?: number
  onSave?: (dataUrl: string) => void
  sport?: string
  backgroundImage?: string

  /** ✅ NUEVO — Fondos personalizados del usuario (uno por modo) */
  userBackground?: {
    urlHalf: string | null
    urlFull: string | null
    mode: TacticalBackgroundMode
  } | null

  /** ✅ NUEVO — Callback cuando el usuario guarda/actualiza su fondo */
  onBackgroundChange?: (
    url: string | null,
    mode: TacticalBackgroundMode,
  ) => void
}

export function isPointItem(
  item: DrawableItem,
): item is PlayerItem | ConeItem | BallItem | TextItem | CircleItem {
  return (
    item.type === 'player' ||
    item.type === 'cone' ||
    item.type === 'ball' ||
    item.type === 'text' ||
    item.type === 'circle'
  )
}

export function isRectItem(item: DrawableItem): item is RectItem {
  return item.type === 'rect'
}

export function isLineItem(item: DrawableItem): item is ArrowItem {
  return (
    item.type === 'arrow' ||
    item.type === 'line' ||
    item.type === 'arrow-dashed'
  )
}

export function isPencilItem(item: DrawableItem): item is PencilItem {
  return item.type === 'pencil'
}

export function isCurvedArrowItem(item: DrawableItem): item is CurvedArrowItem {
  return (
    item.type === 'curved-arrow' || item.type === 'curved-arrow-dashed'
  )
}

export function isPointsItem(
  item: DrawableItem,
): item is
  | PencilItem
  | ArrowItem
  | CurvedArrowItem
  | BounceArrowItem
  | BounceCurvedArrowItem {
  return (
    item.type === 'pencil' ||
    item.type === 'arrow' ||
    item.type === 'arrow-dashed' ||
    item.type === 'line' ||
    item.type === 'curved-arrow' ||
    item.type === 'curved-arrow-dashed' ||
    item.type === 'bounce-arrow' ||
    item.type === 'bounce-curved-arrow'
  )
}