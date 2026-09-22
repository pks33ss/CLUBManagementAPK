'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

import SeasonHeader from './_components/SeasonHeader'
import BlockNode from './_components/BlockNode'
import BlockModal from './_components/BlockModal'
import SectionModal from './_components/SectionModal'

export interface SeasonBlock {
  id: string
  name: string
  description: string | null
  color: string | null
  order: number
  startDate: string | null
  endDate: string | null
  parentId: string | null
  seasonId: string
  sections: SeasonSection[]
}

export interface SeasonSection {
  id: string
  name: string
  description: string | null
  color: string | null
  order: number
  startDate: string | null
  endDate: string | null
  blockId: string
}

export interface SeasonDetail {
  id: string
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  color: string | null
  teamId: string
  canManage: boolean
  blocks: SeasonBlock[]
  team: {
    id: string
    name: string
    sport?: string
    club: { id: string; name: string }
  }
}

export interface BlockWithChildren extends SeasonBlock {
  children: BlockWithChildren[]
}

export function buildTree(blocks: SeasonBlock[]): BlockWithChildren[] {
  const map = new Map<string, BlockWithChildren>()
  const roots: BlockWithChildren[] = []

  for (const b of blocks) {
    map.set(b.id, { ...b, children: [] })
  }

  for (const b of blocks) {
    const node = map.get(b.id)!
    if (b.parentId) {
      const parent = map.get(b.parentId)
      if (parent) parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortRecursive = (arr: BlockWithChildren[]) => {
    arr.sort((a, b) => a.order - b.order)
    for (const child of arr) {
      child.sections.sort((a, b) => a.order - b.order)
      sortRecursive(child.children)
    }
  }
  sortRecursive(roots)

  return roots
}

function SeasonDetailContent() {
  const router = useRouter()
  const params = useParams()
  const seasonId = params.id as string

  const [season, setSeason] = useState<SeasonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showBlockModal, setShowBlockModal] = useState(false)
  const [editingBlock, setEditingBlock] = useState<SeasonBlock | null>(null)
  const [parentBlockId, setParentBlockId] = useState<string | null>(null)

  const [showSectionModal, setShowSectionModal] = useState(false)
  const [editingSection, setEditingSection] = useState<SeasonSection | null>(null)
  const [sectionBlockId, setSectionBlockId] = useState<string | null>(null)

  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({})

  const fetchSeason = useCallback(async () => {
    try {
      const res = await api.get(`/seasons/${seasonId}`)
      setSeason(res.data)
      setError(null)
    } catch (err: any) {
      if (err.response?.status === 404) setError('Planificación no encontrada')
      else if (err.response?.status === 403) setError('No tienes acceso a esta planificación')
      else setError('Error al cargar la planificación')
    } finally {
      setLoading(false)
    }
  }, [seasonId])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchSeason()
  }, [seasonId, router, fetchSeason])

  useEffect(() => {
    if (!season) return
    const key = `season-expanded-${seasonId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setExpandedBlocks(JSON.parse(saved))
        return
      } catch {}
    }
    const initial: Record<string, boolean> = {}
    for (const b of season.blocks) {
      if (!b.parentId) initial[b.id] = true
    }
    setExpandedBlocks(initial)
  }, [season, seasonId])

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks((prev) => {
      const next = { ...prev, [blockId]: !prev[blockId] }
      localStorage.setItem(`season-expanded-${seasonId}`, JSON.stringify(next))
      return next
    })
  }

  const expandAll = () => {
    if (!season) return
    const all: Record<string, boolean> = {}
    for (const b of season.blocks) all[b.id] = true
    setExpandedBlocks(all)
    localStorage.setItem(`season-expanded-${seasonId}`, JSON.stringify(all))
  }

  const collapseAll = () => {
    setExpandedBlocks({})
    localStorage.setItem(`season-expanded-${seasonId}`, JSON.stringify({}))
  }

  const handleCreateRootBlock = () => {
    setEditingBlock(null)
    setParentBlockId(null)
    setShowBlockModal(true)
  }

  const handleCreateChildBlock = (parentId: string) => {
    setEditingBlock(null)
    setParentBlockId(parentId)
    setShowBlockModal(true)
  }

  const handleEditBlock = (block: SeasonBlock) => {
    setEditingBlock(block)
    setParentBlockId(null)
    setShowBlockModal(true)
  }

  const handleDeleteBlock = async (block: SeasonBlock) => {
    const childCount = season?.blocks.filter((b) => b.parentId === block.id).length || 0
    const sectionCount = block.sections.length
    const warning =
      childCount + sectionCount > 0
        ? `\n\n⚠️ Se eliminarán ${childCount} sub-bloques y ${sectionCount} secciones.`
        : ''
    if (!confirm(`¿Eliminar el bloque "${block.name}"?${warning}`)) return
    try {
      await api.delete(`/seasons/blocks/${block.id}`)
      await fetchSeason()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar')
    }
  }

  const handleMoveBlock = async (block: SeasonBlock, direction: 'up' | 'down') => {
    if (!season) return
    const siblings = season.blocks
      .filter((b) => b.parentId === block.parentId)
      .sort((a, b) => a.order - b.order)
    const idx = siblings.findIndex((b) => b.id === block.id)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === siblings.length - 1) return

    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    const reordered = [...siblings]
    const [moved] = reordered.splice(idx, 1)
    reordered.splice(newIdx, 0, moved)

    const payload = reordered.map((b, i) => ({
      id: b.id,
      order: i,
      parentId: b.parentId,
    }))

    try {
      await api.put(`/seasons/${seasonId}/blocks/reorder`, { blocks: payload })
      await fetchSeason()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al reordenar')
    }
  }

  const handleCreateSection = (blockId: string) => {
    setEditingSection(null)
    setSectionBlockId(blockId)
    setShowSectionModal(true)
  }

  const handleEditSection = (section: SeasonSection) => {
    setEditingSection(section)
    setSectionBlockId(null)
    setShowSectionModal(true)
  }

  const handleDeleteSection = async (section: SeasonSection) => {
    if (!confirm(`¿Eliminar la sección "${section.name}"?`)) return
    try {
      await api.delete(`/seasons/sections/${section.id}`)
      await fetchSeason()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar')
    }
  }

  const handleMoveSection = async (section: SeasonSection, direction: 'up' | 'down') => {
    if (!season) return
    const block = season.blocks.find((b) => b.id === section.blockId)
    if (!block) return
    const siblings = block.sections.sort((a, b) => a.order - b.order)
    const idx = siblings.findIndex((s) => s.id === section.id)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === siblings.length - 1) return

    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    const reordered = [...siblings]
    const [moved] = reordered.splice(idx, 1)
    reordered.splice(newIdx, 0, moved)

    const payload = reordered.map((s, i) => ({ id: s.id, order: i }))

    try {
      await api.put(`/seasons/blocks/${block.id}/sections/reorder`, { sections: payload })
      await fetchSeason()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al reordenar')
    }
  }

  // ---------- Render ----------

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando planificación...</div>
  }

  if (error || !season) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Planificación no encontrada'}</p>
        <Link href="/seasons" className="text-brand-primary hover:underline">
          ← Volver a planificaciones
        </Link>
      </div>
    )
  }

  const tree = buildTree(season.blocks)

  return (
    <div>
      <Link href="/seasons" className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver a planificaciones
      </Link>

      <SeasonHeader
        season={season}
        onUpdate={fetchSeason}
        onCreateBlock={handleCreateRootBlock}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />

      {tree.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No hay bloques todavía
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            Crea el primer bloque de la planificación
          </p>
          {season.canManage && (
            <button
              onClick={handleCreateRootBlock}
              className="bg-brand-primary hover:bg-brand-primary-dark text-bg-base px-6 py-2 rounded-lg transition font-medium"
            >
              ➕ Crear Primer Bloque
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tree.map((block) => (
            <BlockNode
              key={block.id}
              block={block}
              depth={0}
              canManage={season.canManage}
              expandedBlocks={expandedBlocks}
              onToggle={toggleBlock}
              onEdit={handleEditBlock}
              onDelete={handleDeleteBlock}
              onMove={handleMoveBlock}
              onCreateChild={handleCreateChildBlock}
              onCreateSection={handleCreateSection}
              onEditSection={handleEditSection}
              onDeleteSection={handleDeleteSection}
              onMoveSection={handleMoveSection}
            />
          ))}
        </div>
      )}

      {showBlockModal && (
        <BlockModal
          seasonId={seasonId}
          block={editingBlock}
          parentId={parentBlockId}
          onClose={() => setShowBlockModal(false)}
          onSuccess={async () => {
            setShowBlockModal(false)
            await fetchSeason()
          }}
        />
      )}

      {showSectionModal && (
        <SectionModal
          blockId={
            sectionBlockId ||
            (editingSection ? editingSection.blockId : '')
          }
          section={editingSection}
          onClose={() => setShowSectionModal(false)}
          onSuccess={async () => {
            setShowSectionModal(false)
            await fetchSeason()
          }}
        />
      )}
    </div>
  )
}

export default function SeasonDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-text-muted">Cargando...</div>}>
      <SeasonDetailContent />
    </Suspense>
  )
}