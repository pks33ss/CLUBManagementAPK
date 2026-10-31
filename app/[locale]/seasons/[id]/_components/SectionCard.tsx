'use client'

import { useTranslations } from 'next-intl'
import type { SeasonSection } from '../page'
import InlineEditName from './InlineEditName'

interface Props {
  section: SeasonSection
  canManage: boolean
  onEdit: (section: SeasonSection) => void
  onDelete: (section: SeasonSection) => void
  onMove: (section: SeasonSection, dir: 'up' | 'down') => void
}

export default function SectionCard({ section, canManage, onEdit, onDelete, onMove }: Props) {
  const t = useTranslations('Seasons.detail.sectionCard')

  return (
    <div className="bg-brand-primary/5 border-2 border-brand-primary/30 rounded-lg px-3 py-2 flex flex-col gap-1 group hover:border-brand-primary/50 transition min-w-[180px] max-w-[280px] shrink-0">
      {/* Header: nombre + acciones */}
      <div className="flex items-center gap-2">
        <span className="text-base shrink-0">📄</span>
        <div className="flex-1 min-w-0">
          <InlineEditName
            value={section.name}
            canEdit={canManage}
            onSave={async (name) => {
              const api = (await import('@/lib/api')).default
              await api.put(`/seasons/sections/${section.id}`, { name })
            }}
            className="text-sm font-semibold text-brand-primary"
          />
        </div>

        {/* Acciones: SIEMPRE visibles en móvil, hover en desktop */}
        {canManage && (
          <div className="flex gap-0.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMove(section, 'up')
              }}
              className="p-1 rounded hover:bg-surface-elevated text-text-muted text-xs transition"
              title={t('moveLeft')}
            >
              ⬅️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMove(section, 'down')
              }}
              className="p-1 rounded hover:bg-surface-elevated text-text-muted text-xs transition"
              title={t('moveRight')}
            >
              ➡️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(section)
              }}
              className="p-1 rounded hover:bg-surface-elevated text-brand-primary text-xs transition"
              title={t('edit')}
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(section)
              }}
              className="p-1 rounded hover:bg-surface-elevated text-danger text-xs transition"
              title={t('delete')}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Contenido (texto completo, sin truncar) */}
      {section.description && (
        <p className="text-xs text-text-secondary whitespace-pre-wrap break-words">
          {section.description}
        </p>
      )}
    </div>
  )
}