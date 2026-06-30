'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cog, Package, MapPin, GitBranch, Network, X, FileText, Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type EntityType = 'equipment' | 'part' | 'location' | 'process'

interface EntityDoc {
  id: string
  filename: string
}

interface Entity {
  id: string
  name: string
  type: EntityType
  document_count: number
  documents: EntityDoc[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<EntityType, { icon: React.ElementType; color: string; bg: string }> = {
  equipment: { icon: Cog,       color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
  part:      { icon: Package,   color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
  location:  { icon: MapPin,    color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
  process:   { icon: GitBranch, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type as EntityType] ?? TYPE_CONFIG.equipment
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KnowledgeGraphPage() {
  const [entities, setEntities]         = useState<Entity[]>([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState<Entity | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/entities/list')
        const json = await res.json()
        setEntities(json.entities ?? [])
      } catch (err) {
        console.error('[graph] Failed to load entities:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const crossDoc  = entities.filter((e) => e.document_count >= 2)
  const singleDoc = entities.filter((e) => e.document_count < 2)

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <span className="ml-3 text-slate-400 text-sm">Loading knowledge graph…</span>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <Network className="w-14 h-14 text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-300">No entities found</h2>
        <p className="text-slate-500 max-w-sm text-sm">
          Process one or more documents first. The system will automatically extract
          equipment, parts, locations, and processes from each document.
        </p>
      </div>
    )
  }

  // ── Main layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* ── Left panel: entity list ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-1">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-400" />
            Knowledge Graph
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {entities.length} entities extracted from your documents
          </p>
        </div>

        {/* Cross-document entities */}
        {crossDoc.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Connected Across Multiple Documents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {crossDoc.map((entity) => {
                const cfg      = getTypeConfig(entity.type)
                const Icon     = cfg.icon
                const isActive = selected?.id === entity.id

                return (
                  <button
                    key={entity.id}
                    onClick={() => setSelected(isActive ? null : entity)}
                    className={`text-left transition-all duration-200 rounded-xl border p-4 ${cfg.bg} ${
                      isActive
                        ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900'
                        : 'hover:ring-1 hover:ring-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />
                      <Badge variant="outline" className={`text-xs capitalize ${cfg.color} border-current`}>
                        {entity.type}
                      </Badge>
                    </div>
                    <p className="font-semibold text-white text-sm leading-snug mb-2 truncate">
                      {entity.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {entity.document_count} document{entity.document_count !== 1 ? 's' : ''}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Single-document entities */}
        {singleDoc.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Single Document Mentions
            </h2>
            <div className="flex flex-wrap gap-2">
              {singleDoc.map((entity) => {
                const cfg  = getTypeConfig(entity.type)
                const Icon = cfg.icon

                return (
                  <button
                    key={entity.id}
                    onClick={() => setSelected(selected?.id === entity.id ? null : entity)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${cfg.bg} ${cfg.color} ${
                      selected?.id === entity.id ? 'ring-2 ring-blue-500' : 'hover:opacity-80'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {entity.name}
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* ── Right panel: detail sidebar ───────────────────────────────────── */}
      {selected && (
        <aside className="w-72 shrink-0 bg-slate-800 rounded-xl border border-slate-700 p-5 flex flex-col gap-4 self-start sticky top-0">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Entity Details</h3>
            <button
              onClick={() => setSelected(null)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Entity info */}
          <div className={`rounded-lg border p-3 ${getTypeConfig(selected.type).bg}`}>
            <div className="flex items-center gap-2 mb-1">
              {(() => {
                const Icon = getTypeConfig(selected.type).icon
                return <Icon className={`w-4 h-4 ${getTypeConfig(selected.type).color}`} />
              })()}
              <Badge
                variant="outline"
                className={`text-xs capitalize ${getTypeConfig(selected.type).color} border-current`}
              >
                {selected.type}
              </Badge>
            </div>
            <p className="font-bold text-white mt-2">{selected.name}</p>
          </div>

          {/* Connected documents */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Found in {selected.document_count} document{selected.document_count !== 1 ? 's' : ''}
            </p>
            <ul className="space-y-2">
              {selected.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-2 text-sm text-slate-300 bg-slate-700/50 rounded-lg px-3 py-2"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate" title={doc.filename}>{doc.filename}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  )
}
