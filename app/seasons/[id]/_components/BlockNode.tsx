'use client'

import { useState } from 'react'
import type { SeasonBlock } from '../page'
import type { BlockWithChildren } from '../page'
import SectionCard from './SectionCard'
import InlineEditName from './InlineEditName'

interface Props {
  block: BlockWithChildren
  depth: number
  canManage: boolean
  expandedBlocks: Record<string, boolean>
  onToggle: (id: string) => void
  onEdit: (block: SeasonBlock) => void
  onDelete: (block: SeasonBlock) => void
  onMove: (block: SeasonBlock, dir: 'up' | 'down') => void
  onCreateChild: (parentId: string) => void
  onCreateSection: (blockId: string) => void
  onEditSection: (section: any) => void
  onDeleteSection: (section: any) => void
  onMoveSection: (section: any, dir: 'up' | 'down') => void
}

// Configuración visual por profundidad
const DEPTH_STYLES = [
  { border: 'border-blue-400', bg: 'bg-blue-50', emoji: '📦', label: 'text-blue-900' },
  { border: 'border-purple-400', bg: 'bg-purple-50', emoji: '📁', label: 'text-purple-900' },
  { border: 'border-pink-400', bg: 'bg-pink-50', emoji: '📂', label: 'text-pink-900' },
  { border: 'border-orange-400', bg: 'bg-orange-50', emoji: '📃', label: 'text-orange-900' },
]

const getDepthStyle = (depth: number) => DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)]

export default function BlockNode({
  block,
  depth,
  canManage,
  expandedBlocks,
  onToggle,
  onEdit,
  onDelete,
  onMove,
  onCreateChild,
  onCreateSection,
  onEditSection,
  onDeleteSection,
  onMoveSection,
}: Props) {
  const style = getDepthStyle(depth)
  const isExpanded = expandedBlocks[block.id] ?? false
  const hasChildren = block.children.length > 0 || block.sections.length > 0

  return (
    <div
      className={`border-2 rounded-xl overflow-hidden ${style.border}`}
      style={{ marginLeft: depth > 0 ? `${Math.min(depth, 5) * 16}px` : 0 }}
    >
      {/* Header del bloque */}
      <div
        className={`${style.bg} px-4 py-3 flex items-center justify-between cursor-pointer hover:brightness-95 transition`}
        onClick={() => onToggle(block.id)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg shrink-0">{isExpanded ? '▼' : '▶'}</span>
          <span className="text-lg shrink-0">{style.emoji}</span>

          <div className="flex-1 min-w-0">
            <InlineEditName
              value={block.name}
              canEdit={canManage}
              onSave={async (name) => {
                // Llama al padre para guardar el nombre vía API
                // Usamos el callback onEdit pero solo para nombre
                const api = (await import('@/lib/api')).default
                await api.put(`/seasons/blocks/${block.id}`, { name })
              }}
              className={`text-base font-bold ${style.label} truncate`}
            />
            {block.description && (
              <p className="text-xs text-gray-600 mt-0.5 truncate">{block.description}</p>
            )}
          </div>

          {/* Contadores */}
          <span className="text-xs text-gray-500 shrink-0 hidden sm:inline">
            {block.children.length > 0 && `${block.children.length} sub-bloques`}
            {block.children.length > 0 && block.sections.length > 0 && ' · '}
            {block.sections.length > 0 && `${block.sections.length} secciones`}
          </span>
        </div>

        {/* Acciones (solo si canManage) */}
        {canManage && (
          <div
            className="flex items-center gap-1 shrink-0 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onMove(block, 'up')}
              className="p-1.5 rounded hover:bg-white/60 transition text-gray-600"
              title="Mover arriba"
            >
              ⬆️
            </button>
            <button
              onClick={() => onMove(block, 'down')}
              className="p-1.5 rounded hover:bg-white/60 transition text-gray-600"
              title="Mover abajo"
            >
              ⬇️
            </button>
            <button
              onClick={() => onCreateChild(block.id)}
              className="p-1.5 rounded hover:bg-white/60 transition text-blue-600"
              title="Añadir sub-bloque"
            >
              ➕📦
            </button>
            <button
              onClick={() => onCreateSection(block.id)}
              className="p-1.5 rounded hover:bg-white/60 transition text-green-600"
              title="Añadir sección"
            >
              ➕📄
            </button>
            <button
              onClick={() => onEdit(block)}
              className="p-1.5 rounded hover:bg-white/60 transition text-blue-500"
              title="Editar"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(block)}
              className="p-1.5 rounded hover:bg-white/60 transition text-red-500"
              title="Eliminar"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Contenido (si expandido) */}
      {isExpanded && hasChildren && (
        <div className="bg-white p-4 space-y-3">
          {/* Secciones — scroll horizontal */}
{block.sections.length > 0 && (
  <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
    {block.sections.map((section) => (
      <SectionCard
        key={section.id}
        section={section}
        canManage={canManage}
        onEdit={onEditSection}
        onDelete={onDeleteSection}
        onMove={onMoveSection}
      />
    ))}
  </div>
)}

          {/* Sub-bloques (recursivo) */}
          {block.children.length > 0 && (
            <div className="space-y-3 pt-2">
              {block.children.map((child) => (
                <BlockNode
                  key={child.id}
                  block={child}
                  depth={depth + 1}
                  canManage={canManage}
                  expandedBlocks={expandedBlocks}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMove={onMove}
                  onCreateChild={onCreateChild}
                  onCreateSection={onCreateSection}
                  onEditSection={onEditSection}
                  onDeleteSection={onDeleteSection}
                  onMoveSection={onMoveSection}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mensaje si está expandido pero vacío */}
      {isExpanded && !hasChildren && (
        <div className="bg-white p-4 text-center">
          <p className="text-sm text-gray-400 mb-2">Este bloque está vacío</p>
          {canManage && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => onCreateChild(block.id)}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded transition"
              >
                ➕ Sub-bloque
              </button>
              <button
                onClick={() => onCreateSection(block.id)}
                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded transition"
              >
                ➕ Sección
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}