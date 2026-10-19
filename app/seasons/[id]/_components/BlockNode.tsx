'use client'

import type { SeasonBlock, BlockWithChildren } from '../page'
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

const DEPTH_STYLES = [
  {
    border: 'border-brand-primary',
    bg: 'bg-brand-primary/10',
    emoji: '📦',
    label: 'text-brand-primary',
  },
  {
    border: 'border-info',
    bg: 'bg-info/10',
    emoji: '📁',
    label: 'text-info',
  },
  {
    border: 'border-warning',
    bg: 'bg-warning/10',
    emoji: '📂',
    label: 'text-warning',
  },
  {
    border: 'border-danger',
    bg: 'bg-danger/10',
    emoji: '📃',
    label: 'text-danger',
  },
]

const getDepthStyle = (depth: number) =>
  DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)]

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
  const hasChildren =
    block.children.length > 0 || block.sections.length > 0

  return (
    <div
      className={`border-2 rounded-xl overflow-hidden ${style.border}`}
      style={{ marginLeft: depth > 0 ? `${Math.min(depth, 5) * 16}px` : 0 }}
    >
      {/* ─── Header ─── */}
      <div
        className={`${style.bg} px-3 py-2 md:px-4 md:py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2`}
      >
        {/* Zona clicable para toggle (solo esta parte) */}
        <button
          type="button"
          onClick={() => onToggle(block.id)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left touch-manipulation"
          aria-label={isExpanded ? 'Colapsar bloque' : 'Expandir bloque'}
        >
          <span className="text-lg shrink-0">
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="text-lg shrink-0">{style.emoji}</span>

          <div className="flex-1 min-w-0">
            <InlineEditName
              value={block.name}
              canEdit={canManage}
              onSave={async (name) => {
                const api = (await import('@/lib/api')).default
                await api.put(`/seasons/blocks/${block.id}`, { name })
              }}
              className={`text-base font-bold ${style.label} truncate`}
            />
            {block.description && (
              <p className="text-xs text-text-secondary mt-0.5 truncate">
                {block.description}
              </p>
            )}
          </div>

          {/* Contadores (solo desktop) */}
          <span className="text-xs text-text-muted shrink-0 hidden md:inline">
            {block.children.length > 0 &&
              `${block.children.length} sub-bloques`}
            {block.children.length > 0 &&
              block.sections.length > 0 &&
              ' · '}
            {block.sections.length > 0 &&
              `${block.sections.length} secciones`}
          </span>
        </button>

        {/* ─── Zona de acciones ─── */}
        {canManage && (
          <div className="flex items-center gap-1 flex-wrap md:justify-end md:shrink-0">
            <ActionBtn
              onClick={() => onMove(block, 'up')}
              title="Mover arriba"
              ariaLabel="Mover bloque arriba"
            >
              ⬆️
            </ActionBtn>
            <ActionBtn
              onClick={() => onMove(block, 'down')}
              title="Mover abajo"
              ariaLabel="Mover bloque abajo"
            >
              ⬇️
            </ActionBtn>
            <ActionBtn
              onClick={() => onCreateChild(block.id)}
              title="Añadir sub-bloque"
              ariaLabel="Añadir sub-bloque"
            >
              ➕📦
            </ActionBtn>
            <ActionBtn
              onClick={() => onCreateSection(block.id)}
              title="Añadir sección"
              ariaLabel="Añadir sección"
            >
              ➕📄
            </ActionBtn>
            <ActionBtn
              onClick={() => onEdit(block)}
              title="Editar"
              ariaLabel="Editar bloque"
            >
              ✏️
            </ActionBtn>
            <ActionBtn
              onClick={() => onDelete(block)}
              title="Eliminar"
              ariaLabel="Eliminar bloque"
              danger
            >
              🗑️
            </ActionBtn>
          </div>
        )}
      </div>

      {/* ─── Contenido expandido ─── */}
      {isExpanded && hasChildren && (
        <div className="bg-surface p-4 space-y-3">
          {/* Secciones */}
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

          {/* Sub-bloques */}
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

      {/* ─── Mensaje si está expandido pero vacío ─── */}
      {isExpanded && !hasChildren && (
        <div className="bg-surface p-4 text-center">
          <p className="text-sm text-text-muted mb-2">
            Este bloque está vacío
          </p>
          {canManage && (
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                type="button"
                onClick={() => onCreateChild(block.id)}
                className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded transition touch-manipulation"
              >
                ➕ Sub-bloque
              </button>
              <button
                type="button"
                onClick={() => onCreateSection(block.id)}
                className="text-xs bg-success/10 hover:bg-success/20 text-success px-3 py-1.5 rounded transition touch-manipulation"
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

// ─────────────────────────────────────────────
// Botón de acción con área táctil mínima
// ─────────────────────────────────────────────

function ActionBtn({
  onClick,
  title,
  ariaLabel,
  danger,
  children,
}: {
  onClick: () => void
  title: string
  ariaLabel: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded transition touch-manipulation ${
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}