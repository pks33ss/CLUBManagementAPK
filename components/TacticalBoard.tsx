'use client'

import { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Line, Circle, Arrow, Image as KonvaImage, Text } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'

// ============================================
// TIPOS
// ============================================

export type Tool = 'select' | 'arrow' | 'line' | 'player' | 'cone' | 'ball' | 'text' | 'eraser'

export interface TacticalBoardProps {
  width?: number
  height?: number
  onSave?: (dataUrl: string) => void
}

interface DrawableItem {
  id: string
  type: Tool
  points?: number[]
  x?: number
  y?: number
  radius?: number
  color: string
  fill?: string
  text?: string
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function TacticalBoard({ 
  width = 800, 
  height = 800,
  onSave 
}: TacticalBoardProps) {
  const [courtImage] = useImage('/basketball-court.png')
  const [items, setItems] = useState<DrawableItem[]>([])
  const [tool, setTool] = useState<Tool>('arrow')
  const [color, setColor] = useState('#ffffff')
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const stageRef = useRef<Konva.Stage>(null)

  // ============================================
  // MANEJO DE EVENTOS
  // ============================================

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    
    if (tool === 'select') return
    if (tool === 'eraser') {
      // Eliminar el item más cercano
      return
    }

    setIsDrawing(true)

    if (tool === 'arrow' || tool === 'line') {
      setCurrentPoints([pos.x, pos.y, pos.x, pos.y])
    } else if (tool === 'player' || tool === 'cone' || tool === 'ball') {
      const newItem: DrawableItem = {
        id: `item-${Date.now()}`,
        type: tool,
        x: pos.x,
        y: pos.y,
        radius: tool === 'player' ? 20 : tool === 'cone' ? 15 : 10,
        color,
        fill: tool === 'player' ? '#3b82f6' : tool === 'cone' ? '#f59e0b' : '#ef4444',
      }
      setItems([...items, newItem])
      setIsDrawing(false)
    }
  }

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()

    if (tool === 'arrow' || tool === 'line') {
      setCurrentPoints([
        currentPoints[0],
        currentPoints[1],
        pos.x,
        pos.y,
      ])
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (tool === 'arrow' || tool === 'line') {
      if (currentPoints.length === 4) {
        const newItem: DrawableItem = {
          id: `item-${Date.now()}`,
          type: tool,
          points: currentPoints,
          color,
        }
        setItems([...items, newItem])
      }
      setCurrentPoints([])
    }
  }

  // ============================================
  // GUARDAR COMO IMAGEN
  // ============================================

  const handleSave = () => {
    if (!stageRef.current) return
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })
    if (onSave) {
      onSave(dataUrl)
    }
    return dataUrl
  }

  // ============================================
  // LIMPIAR
  // ============================================

  const handleClear = () => {
    setItems([])
  }

  const handleUndo = () => {
    setItems(items.slice(0, -1))
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de herramientas */}
      <div className="bg-white rounded-xl shadow-md p-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 border-r border-gray-200 pr-3">
          <ToolButton
            active={tool === 'select'}
            onClick={() => setTool('select')}
            title="Seleccionar"
          >
            🖱️
          </ToolButton>
          <ToolButton
            active={tool === 'arrow'}
            onClick={() => setTool('arrow')}
            title="Flecha"
          >
            ➡️
          </ToolButton>
          <ToolButton
            active={tool === 'line'}
            onClick={() => setTool('line')}
            title="Línea"
          >
            ➖
          </ToolButton>
          <ToolButton
            active={tool === 'player'}
            onClick={() => setTool('player')}
            title="Jugador"
          >
            🔵
          </ToolButton>
          <ToolButton
            active={tool === 'cone'}
            onClick={() => setTool('cone')}
            title="Cono"
          >
            🔺
          </ToolButton>
          <ToolButton
            active={tool === 'ball'}
            onClick={() => setTool('ball')}
            title="Balón"
          >
            🏀
          </ToolButton>
        </div>

        <div className="flex gap-1 border-r border-gray-200 pr-3">
          {['#ffffff', '#000000', '#ef4444', '#3b82f6', '#f59e0b', '#10b981'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 ${
                color === c ? 'border-gray-800 scale-110' : 'border-gray-300'
              } transition`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex gap-1">
          <button
            onClick={handleUndo}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm"
            title="Deshacer"
          >
            ↩️
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition text-sm"
            title="Limpiar"
          >
            🗑️
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
            >
              💾 Guardar
            </button>
          )}
        </div>
      </div>

      {/* Pizarra */}
      <div className="bg-white rounded-xl shadow-md p-4 overflow-auto">
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Fondo: pista de baloncesto */}
          <Layer>
            {courtImage && (
              <KonvaImage
                image={courtImage}
                width={width}
                height={height}
              />
            )}
          </Layer>

          {/* Dibujos */}
          <Layer>
            {items.map((item) => {
              if (item.type === 'arrow' && item.points) {
                return (
                  <Arrow
                    key={item.id}
                    points={item.points}
                    stroke={item.color}
                    fill={item.color}
                    strokeWidth={3}
                    pointerLength={10}
                    pointerWidth={10}
                  />
                )
              }
              if (item.type === 'line' && item.points) {
                return (
                  <Line
                    key={item.id}
                    points={item.points}
                    stroke={item.color}
                    strokeWidth={3}
                  />
                )
              }
              if (item.type === 'player') {
                return (
                  <Circle
                    key={item.id}
                    x={item.x}
                    y={item.y}
                    radius={item.radius}
                    fill={item.fill}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )
              }
              if (item.type === 'cone') {
                return (
                  <Circle
                    key={item.id}
                    x={item.x}
                    y={item.y}
                    radius={item.radius}
                    fill={item.fill}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )
              }
              if (item.type === 'ball') {
                return (
                  <Circle
                    key={item.id}
                    x={item.x}
                    y={item.y}
                    radius={item.radius}
                    fill={item.fill}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )
              }
              return null
            })}

            {/* Dibujo actual */}
            {isDrawing && (tool === 'arrow' || tool === 'line') && currentPoints.length === 4 && (
              tool === 'arrow' ? (
                <Arrow
                  points={currentPoints}
                  stroke={color}
                  fill={color}
                  strokeWidth={3}
                  pointerLength={10}
                  pointerWidth={10}
                />
              ) : (
                <Line
                  points={currentPoints}
                  stroke={color}
                  strokeWidth={3}
                />
              )
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE AUXILIAR
// ============================================

function ToolButton({ 
  active, 
  onClick, 
  title, 
  children 
}: { 
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}