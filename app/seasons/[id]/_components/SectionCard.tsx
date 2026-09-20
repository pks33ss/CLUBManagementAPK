'use client'

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
  return (
    <div className="bg-green-50 border-2 border-green-300 rounded-lg px-3 py-2 flex flex-col gap-1 group hover:shadow-md transition min-w-[180px] max-w-[280px] shrink-0">
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
            className="text-sm font-semibold text-green-900"
          />
        </div>

        {canManage && (
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
            <button
              onClick={() => onMove(section, 'up')}
              className="p-1 rounded hover:bg-white/60 text-gray-500 text-xs"
              title="Mover izquierda"
            >
              ⬅️
            </button>
            <button
              onClick={() => onMove(section, 'down')}
              className="p-1 rounded hover:bg-white/60 text-gray-500 text-xs"
              title="Mover derecha"
            >
              ➡️
            </button>
            <button
              onClick={() => onEdit(section)}
              className="p-1 rounded hover:bg-white/60 text-blue-600 text-xs"
              title="Editar"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(section)}
              className="p-1 rounded hover:bg-white/60 text-red-500 text-xs"
              title="Eliminar"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Contenido (texto completo, sin truncar) */}
      {section.description && (
        <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
          {section.description}
        </p>
      )}
    </div>
  )
}