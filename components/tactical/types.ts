// ============================================
// TIPOS COMPARTIDOS DE LA PIZARRA TÁCTICA
// ============================================

export type Tool =
  | 'select'
  | 'pencil'
  | 'arrow'
  | 'curved-arrow'
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
  type: 'arrow' | 'line'
  points: number[] // [x1, y1, x2, y2]
}

export interface CurvedArrowItem extends BaseItem {
  type: 'curved-arrow'
  // Curva cúbica: [x1, y1, cx1, cy1, cx2, cy2, x2, y2]
  points: number[]
}

export interface BounceArrowItem extends BaseItem {
  type: 'bounce-arrow'
  // [x1, y1, x2, y2] — la onda se genera a partir de estos dos puntos
  points: number[]
}

export interface BounceCurvedArrowItem extends BaseItem {
  type: 'bounce-curved-arrow'
  // Cúbica base: [x1, y1, cx1, cy1, cx2, cy2, x2, y2]
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

export interface TacticalBoardProps {
  width?: number
  height?: number
  onSave?: (dataUrl: string) => void
  sport?: string
  backgroundImage?: string
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
  return item.type === 'arrow' || item.type === 'line'
}

export function isPencilItem(item: DrawableItem): item is PencilItem {
  return item.type === 'pencil'
}

export function isCurvedArrowItem(item: DrawableItem): item is CurvedArrowItem {
  return item.type === 'curved-arrow'
}

/** ¿Este item guarda puntos como array plano? (para mover sumando delta) */
export function isPointsItem(
  item: DrawableItem,
): item is PencilItem | ArrowItem | CurvedArrowItem | BounceArrowItem | BounceCurvedArrowItem {
  return (
    item.type === 'pencil' ||
    item.type === 'arrow' ||
    item.type === 'line' ||
    item.type === 'curved-arrow' ||
    item.type === 'bounce-arrow' ||
    item.type === 'bounce-curved-arrow'
  )
}