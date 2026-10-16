'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Rect, Line, Circle, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'

import type {
  DrawableItem,
  TacticalBoardProps,
  Tool,
  TacticalBackgroundMode,
  ArrowItem,
  CurvedArrowItem,
  BounceArrowItem,
  BounceCurvedArrowItem,
  PencilItem,
  CircleItem,
  RectItem,
  PlayerItem,
  ConeItem,
  BallItem,
  TextItem,
} from './types'
import { isPointItem, isRectItem, isPointsItem } from './types'
import {
  CANVAS_SIZE,
  CANVAS_FULL_HEIGHT,
  getSportBackground,
  uid,
} from './constants'
import { Toolbar } from './Toolbar'
import { ItemRenderer, ItemHandles } from './ItemRenderer'
import { TextInputOverlay } from './TextInputOverlay'
import { BackgroundPickerModal } from './BackgroundPickerModal'

export default function TacticalBoard({
  width = CANVAS_SIZE,
  height = CANVAS_SIZE,
  onSave,
  sport = 'BASKETBALL',
  backgroundImage,
  userBackground,
  onBackgroundChange,
}: TacticalBoardProps) {
  // ============================================
  // FONDO — LÓGICA DE PRIORIDAD
  // ============================================

  const [mode, setMode] = useState<TacticalBackgroundMode>(
    userBackground?.mode ?? 'HALF',
  )

  const [localBackgroundUrl, setLocalBackgroundUrl] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (userBackground?.mode && userBackground.mode !== mode) {
      setMode(userBackground.mode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userBackground?.mode])

  useEffect(() => {
    setLocalBackgroundUrl(null)
  }, [mode])

  const userUrlForMode =
    mode === 'FULL' ? userBackground?.urlFull : userBackground?.urlHalf

  const finalBackgroundUrl = useMemo(() => {
    if (localBackgroundUrl) return localBackgroundUrl
    if (userUrlForMode) return userUrlForMode
    if (backgroundImage) return backgroundImage
    return getSportBackground(sport, mode)
  }, [localBackgroundUrl, userUrlForMode, backgroundImage, sport, mode])

  const [courtImage, courtStatus] = useImage(
    finalBackgroundUrl ?? '',
    'anonymous',
  )

  const canvasHeight = mode === 'FULL' ? CANVAS_FULL_HEIGHT : CANVAS_SIZE

  const [bgPickerOpen, setBgPickerOpen] = useState(false)

  // ============================================
  // ESTADO DE LA PIZARRA
  // ============================================

  const [items, setItems] = useState<DrawableItem[]>([])
  const [redoStack, setRedoStack] = useState<DrawableItem[][]>([])

  const [tool, setTool] = useState<Tool>('arrow')
  const [color, setColor] = useState('#ffffff')
  const [strokeWidth, setStrokeWidth] = useState(4)

  const [currentItem, setCurrentItem] = useState<DrawableItem | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [textModal, setTextModal] = useState<{
    mode: 'create' | 'edit'
    itemId?: string
    initialText?: string
    initialFontSize?: number
    initialColor?: string
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [boardSize, setBoardSize] = useState({ width, height })

  const stageRef = useRef<Konva.Stage>(null)

  const scale = boardSize.width / CANVAS_SIZE
  const scaleY = boardSize.height / canvasHeight

  // ============================================
  // RESPONSIVE
  // ============================================
  // - Mide el contenedor con getBoundingClientRect para evitar 0 en el
  //   primer render y usar el ancho real (incluyendo padding del padre).
  // - Usa ResizeObserver para responder a cambios de layout (rotación,
  //   apertura/cierre de barras del navegador móvil, sidebar, etc.).
  // - Reserva altura en función del viewport real (visualViewport si está).
  // - Nunca supera el ancho del contenedor.

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const compute = () => {
      const rect = el.getBoundingClientRect()
      const w = Math.max(0, rect.width - 24) // 24px de padding (p-3)

      const vh =
        typeof window !== 'undefined' && window.visualViewport
          ? window.visualViewport.height
          : window.innerHeight

      // Reserva para header de app + toolbar de la pizarra + márgenes.
      // En móvil el header + toolbar ocupan ~320px; en desktop ~260px.
      const reserved = w < 640 ? 320 : 260
      const availableHeight = Math.max(200, vh - reserved)

      const ratio = canvasHeight / CANVAS_SIZE
      const maxByWidth = w
      const maxByHeight = availableHeight / ratio

      const size = Math.min(
        Math.max(180, maxByWidth), // nunca menos de 180
        Math.max(180, maxByHeight),
        900,
      )

      setBoardSize({
        width: Math.round(size),
        height: Math.round(size * ratio),
      })
    }

    // Primer cálculo tras el primer paint.
    const raf = requestAnimationFrame(compute)

    // Recalcula en cualquier cambio de tamaño del contenedor.
    const ro = new ResizeObserver(() => {
      // Pequeño debounce para no recalcular 60 veces por segundo.
      requestAnimationFrame(compute)
    })
    ro.observe(el)

    // Fallback: también escuchamos resize de la ventana.
    window.addEventListener('resize', compute)
    window.addEventListener('orientationchange', compute)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', compute)
      window.removeEventListener('orientationchange', compute)
    }
  }, [canvasHeight])

  // ============================================
  // HISTORIAL
  // ============================================

  const pushItem = useCallback((item: DrawableItem) => {
    setItems((prev) => [...prev, item])
    setRedoStack([])
  }, [])

  const undo = useCallback(() => {
    setItems((prev) => {
      if (prev.length === 0) return prev
      setRedoStack((r) => [...r, prev])
      return prev.slice(0, -1)
    })
    setSelectedId(null)
  }, [])

  const redo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo
      const next = prevRedo[prevRedo.length - 1]
      setItems(next)
      return prevRedo.slice(0, -1)
    })
    setSelectedId(null)
  }, [])

  const clearAll = useCallback(() => {
    if (items.length === 0) return
    if (!confirm('¿Seguro que quieres borrar todo el dibujo?')) return
    setRedoStack((r) => [...r, items])
    setItems([])
    setSelectedId(null)
  }, [items])

  const getPointer = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return null
    const pos = stage.getPointerPosition()
    if (!pos) return null
    return { x: pos.x / scale, y: pos.y / scaleY }
  }, [scale, scaleY])

  // ============================================
  // EVENTOS DE PUNTERO
  // ============================================

  const handlePointerDown = () => {
    const pos = getPointer()
    if (!pos) return

    if (tool === 'eraser') {
      const stage = stageRef.current
      if (!stage) return
      const pointer = stage.getPointerPosition()
      if (!pointer) return
      const shape = stage.getIntersection(pointer)
      if (shape && shape.hasName('deletable')) {
        const id = shape.id()
        if (id) {
          setItems((prev) => prev.filter((it) => it.id !== id))
          setRedoStack([])
          setSelectedId(null)
        }
      }
      return
    }

        if (tool === 'select') {
      const stage = stageRef.current
      if (stage) {
        const pointer = stage.getPointerPosition()
        if (pointer) {
          const shape = stage.getIntersection(pointer)
          if (!shape || !shape.hasName('deletable')) {
            setSelectedId(null)
          }
        }
      }
      return
    }

    if (tool === 'text') {
      setTextModal({ mode: 'create' })
      return
    }

    if (tool === 'player' || tool === 'cone' || tool === 'ball') {
      const base = {
        id: uid(),
        color,
        strokeWidth,
        x: pos.x,
        y: pos.y,
        radius: tool === 'player' ? 22 : tool === 'cone' ? 16 : 14,
        fill: tool === 'player' ? '#3b82f6' : tool === 'cone' ? '#f59e0b' : '#f97316',
      }
      if (tool === 'player') pushItem({ ...base, type: 'player' } as PlayerItem)
      else if (tool === 'cone') pushItem({ ...base, type: 'cone' } as ConeItem)
      else pushItem({ ...base, type: 'ball' } as BallItem)
      return
    }

    if (
      tool === 'arrow' ||
      tool === 'arrow-dashed' ||
      tool === 'line' ||
      tool === 'bounce-arrow'
    ) {
      setCurrentItem({
        id: uid(),
        type: tool,
        color,
        strokeWidth,
        points: [pos.x, pos.y, pos.x, pos.y],
      } as ArrowItem | BounceArrowItem)
      return
    }

    if (
      tool === 'curved-arrow' ||
      tool === 'curved-arrow-dashed' ||
      tool === 'bounce-curved-arrow'
    ) {
      setCurrentItem({
        id: uid(),
        type: tool,
        color,
        strokeWidth,
        points: [pos.x, pos.y, pos.x, pos.y, pos.x, pos.y, pos.x, pos.y],
      } as CurvedArrowItem | BounceCurvedArrowItem)
      return
    }

    if (tool === 'pencil') {
      setCurrentItem({
        id: uid(),
        type: 'pencil',
        color,
        strokeWidth,
        points: [pos.x, pos.y],
      } as PencilItem)
      return
    }

    if (tool === 'circle') {
      const c = {
        id: uid(),
        type: 'circle' as const,
        color,
        strokeWidth,
        x: pos.x,
        y: pos.y,
        radius: 0,
        fill: 'transparent',
        startX: pos.x,
        startY: pos.y,
      }
      setCurrentItem(c as unknown as CircleItem)
      return
    }

    if (tool === 'rect') {
      const r = {
        id: uid(),
        type: 'rect' as const,
        color,
        strokeWidth,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fill: 'transparent',
        startX: pos.x,
        startY: pos.y,
      }
      setCurrentItem(r as unknown as RectItem)
      return
    }
  }

  const handlePointerMove = () => {
    if (!currentItem) return
    const pos = getPointer()
    if (!pos) return

    if (
      currentItem.type === 'arrow' ||
      currentItem.type === 'arrow-dashed' ||
      currentItem.type === 'line' ||
      currentItem.type === 'bounce-arrow'
    ) {
      setCurrentItem({
        ...currentItem,
        points: [currentItem.points[0], currentItem.points[1], pos.x, pos.y],
      })
    } else if (
      currentItem.type === 'curved-arrow' ||
      currentItem.type === 'curved-arrow-dashed' ||
      currentItem.type === 'bounce-curved-arrow'
    ) {
      const [x1, y1] = currentItem.points
      const dx = pos.x - x1
      const dy = pos.y - y1
      const len = Math.hypot(dx, dy) || 1
      const px = -dy / len
      const py = dx / len
      const offset = len * 0.25
      const cx1 = x1 + dx * 0.33 + px * offset
      const cy1 = y1 + dy * 0.33 + py * offset
      const cx2 = x1 + dx * 0.66 + px * offset
      const cy2 = y1 + dy * 0.66 + py * offset
      setCurrentItem({
        ...currentItem,
        points: [x1, y1, cx1, cy1, cx2, cy2, pos.x, pos.y],
      })
    } else if (currentItem.type === 'pencil') {
      setCurrentItem({
        ...currentItem,
        points: [...currentItem.points, pos.x, pos.y],
      })
    } else if (currentItem.type === 'circle') {
      const c = currentItem as CircleItem & { startX: number; startY: number }
      const radius = Math.hypot(pos.x - c.startX, pos.y - c.startY)
      setCurrentItem({ ...c, radius })
    } else if (currentItem.type === 'rect') {
      const r = currentItem as RectItem & { startX: number; startY: number }
      setCurrentItem({
        ...r,
        x: Math.min(r.startX, pos.x),
        y: Math.min(r.startY, pos.y),
        width: Math.abs(pos.x - r.startX),
        height: Math.abs(pos.y - r.startY),
      })
    }
  }

  const handlePointerUp = () => {
    if (!currentItem) return

    if (currentItem.type === 'pencil' && currentItem.points.length < 4) {
      setCurrentItem(null)
      return
    }

    const isTwoPointLine =
      currentItem.type === 'arrow' ||
      currentItem.type === 'arrow-dashed' ||
      currentItem.type === 'line' ||
      currentItem.type === 'bounce-arrow'
    const isCurved =
      currentItem.type === 'curved-arrow' ||
      currentItem.type === 'curved-arrow-dashed' ||
      currentItem.type === 'bounce-curved-arrow'

    if (
      isTwoPointLine &&
      currentItem.points[0] === currentItem.points[2] &&
      currentItem.points[1] === currentItem.points[3]
    ) {
      setCurrentItem(null)
      return
    }

    if (
      isCurved &&
      currentItem.points[0] === currentItem.points[6] &&
      currentItem.points[1] === currentItem.points[7]
    ) {
      setCurrentItem(null)
      return
    }

    if (currentItem.type === 'circle' && currentItem.radius < 5) {
      setCurrentItem(null)
      return
    }
    if (
      currentItem.type === 'rect' &&
      (currentItem.width < 5 || currentItem.height < 5)
    ) {
      setCurrentItem(null)
      return
    }

    const cleaned = { ...currentItem } as any
    delete cleaned.startX
    delete cleaned.startY
    pushItem(cleaned)

    if (
      cleaned.type === 'curved-arrow' ||
      cleaned.type === 'curved-arrow-dashed' ||
      cleaned.type === 'arrow' ||
      cleaned.type === 'arrow-dashed' ||
      cleaned.type === 'line' ||
      cleaned.type === 'bounce-arrow' ||
      cleaned.type === 'bounce-curved-arrow'
    ) {
      setSelectedId(cleaned.id)
      setTool('select')
    }

    setCurrentItem(null)
  }

  // ============================================
  // EDICIÓN DE ITEMS
  // ============================================

  const handleItemDragEndDelta = (item: DrawableItem, dx: number, dy: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== item.id) return it
        if (isPointsItem(it)) {
          return {
            ...it,
            points: it.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy)),
          }
        }
        if (isPointItem(it) || isRectItem(it)) {
          return { ...it, x: it.x + dx, y: it.y + dy }
        }
        return it
      }),
    )
    setRedoStack([])
  }

  const handleItemDoubleClick = (item: DrawableItem) => {
    if (item.type === 'text') {
      setTextModal({
        mode: 'edit',
        itemId: item.id,
        initialText: item.text,
        initialFontSize: item.fontSize,
        initialColor: item.color,
      })
    } else if (item.type === 'player') {
      const value = prompt('Número del jugador:', item.number ?? '') ?? ''
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, number: value.trim() } : it,
        ),
      )
    }
  }

  const handleControlPointDrag = useCallback(
    (itemId: string, pointIndex: number, x: number, y: number) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it
          if (it.type === 'text') {
            return { ...it, x, y }
          }
          if (isPointsItem(it)) {
            const newPoints = [...it.points]
            newPoints[pointIndex] = x
            newPoints[pointIndex + 1] = y
            return { ...it, points: newPoints }
          }
          return it
        }),
      )
    },
    [],
  )

  // ============================================
  // MODAL DE TEXTO
  // ============================================

  const handleTextModalSubmit = (
    text: string,
    fontSize: number,
    color: string,
  ) => {
    if (!textModal) return

    if (textModal.mode === 'create') {
      const newId = uid()
      pushItem({
        id: newId,
        type: 'text',
        color,
        strokeWidth,
        x: CANVAS_SIZE / 2 - 50,
        y: canvasHeight / 2 - 10,
        text,
        fontSize,
      } as TextItem)
      setSelectedId(newId)
      setTool('select')
    } else if (textModal.mode === 'edit' && textModal.itemId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === textModal.itemId && it.type === 'text'
            ? { ...it, text, fontSize, color }
            : it,
        ),
      )
    }

    setTextModal(null)
  }

  // ============================================
  // MODAL DE FONDO
  // ============================================

  const handleBackgroundApply = (
    url: string | null,
    targetMode: TacticalBackgroundMode,
    persist: boolean,
  ) => {
    if (persist) {
      onBackgroundChange?.(url, targetMode)
    } else {
      if (targetMode === mode) {
        setLocalBackgroundUrl(url)
      }
    }
  }

  // ============================================
  // GUARDAR
  // ============================================

  const handleSave = () => {
    const stage = stageRef.current
    if (!stage) return
    const prevSelected = selectedId
    setSelectedId(null)
    setTimeout(() => {
      const pixelRatio = 1 / scale
      const dataUrl = stage.toDataURL({ pixelRatio, mimeType: 'image/png' })
      if (onSave) onSave(dataUrl)
      setSelectedId(prevSelected)
    }, 50)
  }

  // ============================================
  // ATAJOS DE TECLADO
  // ============================================

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
        return

      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (
        (ctrl && e.key.toLowerCase() === 'y') ||
        (ctrl && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        redo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault()
          setItems((prev) => prev.filter((it) => it.id !== selectedId))
          setRedoStack([])
          setSelectedId(null)
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null)
        setCurrentItem(null)
        setTextModal(null)
        setBgPickerOpen(false)
      } else if (!ctrl) {
        const map: Record<string, Tool> = {
          v: 'select',
          p: 'pencil',
          a: 'arrow',
          f: 'curved-arrow',
          l: 'line',
          j: 'player',
          c: 'cone',
          b: 'ball',
          t: 'text',
          o: 'circle',
          r: 'rect',
          e: 'eraser',
        }
        const newTool = map[e.key.toLowerCase()]
        if (newTool) setTool(newTool)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, selectedId])

  // ============================================
  // ACCIONES SOBRE SELECCIÓN
  // ============================================

  const bringToFront = () => {
    if (!selectedId) return
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === selectedId)
      if (idx < 0) return prev
      const copy = [...prev]
      const [item] = copy.splice(idx, 1)
      copy.push(item)
      return copy
    })
  }

  const sendToBack = () => {
    if (!selectedId) return
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === selectedId)
      if (idx < 0) return prev
      const copy = [...prev]
      const [item] = copy.splice(idx, 1)
      copy.unshift(item)
      return copy
    })
  }

  const duplicateSelected = () => {
    if (!selectedId) return
    const item = items.find((it) => it.id === selectedId)
    if (!item) return
    const clone: DrawableItem = { ...item, id: uid() } as DrawableItem
    if (isPointsItem(clone)) {
      clone.points = clone.points.map((p) => p + 30)
    } else if (isPointItem(clone) || isRectItem(clone)) {
      clone.x += 30
      clone.y += 30
    }
    pushItem(clone)
    setSelectedId(null)
  }

  // ============================================
  // FALLBACK DE FONDO
  // ============================================

  const showCourtImage = courtImage && courtStatus === 'loaded'

  const fallbackBackground = useMemo(
    () => (
      <>
        <Rect
          x={0}
          y={0}
          width={CANVAS_SIZE}
          height={canvasHeight}
          fill="#1a5c2e"
        />
        <Rect
          x={20}
          y={20}
          width={CANVAS_SIZE - 40}
          height={canvasHeight - 40}
          stroke="#ffffff"
          strokeWidth={3}
          fill="transparent"
        />
        <Line
          points={[CANVAS_SIZE / 2, 20, CANVAS_SIZE / 2, canvasHeight - 20]}
          stroke="#ffffff"
          strokeWidth={3}
        />
        <Circle
          x={CANVAS_SIZE / 2}
          y={canvasHeight / 2}
          radius={70}
          stroke="#ffffff"
          strokeWidth={3}
        />
      </>
    ),
    [canvasHeight],
  )

  const cursor = tool === 'select' ? 'default' : 'crosshair'

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex flex-col gap-3 min-w-0 max-w-full">
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        canUndo={items.length > 0}
        canRedo={redoStack.length > 0}
        canActOnSelection={!!selectedId}
        hasItems={items.length > 0}
        onUndo={undo}
        onRedo={redo}
        onDuplicate={duplicateSelected}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onClearAll={clearAll}
        onSave={onSave ? handleSave : undefined}
        mode={mode}
        onModeChange={setMode}
        onOpenBackgroundPicker={() => setBgPickerOpen(true)}
      />

      <div
        ref={containerRef}
        className="bg-surface border border-border-subtle rounded-xl p-3 flex justify-center max-w-full min-w-0 overflow-hidden"
      >
        <div
          className="rounded-lg overflow-hidden border border-border-subtle max-w-full"
          style={{ width: boardSize.width, height: boardSize.height }}
        >
          <Stage
            ref={stageRef}
            width={boardSize.width}
            height={boardSize.height}
            scaleX={scale}
            scaleY={scaleY}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{ cursor, touchAction: 'none' }}
          >
            <Layer listening={false}>
              {showCourtImage ? (
                <KonvaImage
                  image={courtImage}
                  width={CANVAS_SIZE}
                  height={canvasHeight}
                />
              ) : (
                fallbackBackground
              )}
            </Layer>

            <Layer>
              {items.map((item) => (
                <ItemRenderer
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onSelect={() => {
                    if (tool === 'select') setSelectedId(item.id)
                  }}
                  onDragEndDelta={(dx, dy) =>
                    handleItemDragEndDelta(item, dx, dy)
                  }
                  onDoubleClick={() => handleItemDoubleClick(item)}
                  draggable={tool === 'select'}
                />
              ))}

              {currentItem && (
                <ItemRenderer
                  item={currentItem}
                  isSelected={false}
                  draggable={false}
                />
              )}
            </Layer>

            <Layer>
              {tool === 'select' &&
                selectedId &&
                (() => {
                  const selected = items.find((it) => it.id === selectedId)
                  if (!selected) return null
                  return (
                    <ItemHandles
                      item={selected}
                      onControlPointDrag={(index, x, y) =>
                        handleControlPointDrag(selected.id, index, x, y)
                      }
                    />
                  )
                })()}
            </Layer>
          </Stage>
        </div>
      </div>

      {textModal && (
        <TextInputOverlay
          mode={textModal.mode}
          initialText={textModal.initialText}
          initialFontSize={textModal.initialFontSize}
          initialColor={textModal.initialColor}
          onSubmit={handleTextModalSubmit}
          onCancel={() => setTextModal(null)}
        />
      )}

      {bgPickerOpen && (
        <BackgroundPickerModal
          isOpen={bgPickerOpen}
          onClose={() => setBgPickerOpen(false)}
          onApply={handleBackgroundApply}
          currentMode={mode}
          hasCustomBackground={
            mode === 'FULL'
              ? !!userBackground?.urlFull
              : !!userBackground?.urlHalf
          }
          customBackgroundUrl={
            mode === 'FULL'
              ? userBackground?.urlFull ?? null
              : userBackground?.urlHalf ?? null
          }
        />
      )}
    </div>
  )
}

export type { TacticalBoardProps } from './types'