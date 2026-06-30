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
  equipment: { icon: Cog,       color: 'text-blue-400',   bg: 'bg-blue-500/5  border-blue-500/20'  },
  part:      { icon: Package,   color: 'text-amber-400',  bg: 'bg-amber-500/5 border-amber-500/20' },
  location:  { icon: MapPin,    color: 'text-green-400',  bg: 'bg-green-500/5 border-green-500/20' },
  process:   { icon: GitBranch, color: 'text-purple-400', bg: 'bg-purple-500/5 border-purple-500/20'},
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type as EntityType] ?? TYPE_CONFIG.equipment
}

// ─── Legend strip ─────────────────────────────────────────────────────────────

const LEGEND_ITEMS: { type: EntityType; label: string; description: string; dotColor: string }[] = [
  { type: 'equipment', label: 'Equipment', description: 'Machines & assets',     dotColor: 'hsl(213 94% 68%)' },
  { type: 'part',      label: 'Part',      description: 'Components & spares',   dotColor: 'hsl(38 92% 65%)'  },
  { type: 'location',  label: 'Location',  description: 'Zones & areas',         dotColor: 'hsl(142 52% 52%)' },
  { type: 'process',   label: 'Process',   description: 'Systems & procedures',  dotColor: 'hsl(270 52% 68%)' },
]

function Legend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl px-4 py-3"
      style={{
        background: 'hsl(0 0% 10% / 0.7)',
        border:     '1px solid hsl(0 0% 18% / 0.6)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <span className="text-xs font-semibold uppercase tracking-widest shrink-0" style={{ color: 'hsl(0 0% 40%)' }}>
        Legend
      </span>
      {LEGEND_ITEMS.map(({ label, description, dotColor }) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: dotColor, boxShadow: `0 0 6px 1px ${dotColor}55` }}
          />
          <span className="text-xs font-medium" style={{ color: 'hsl(0 0% 80%)' }}>{label}</span>
          <span className="text-xs hidden sm:inline" style={{ color: 'hsl(0 0% 42%)' }}>— {description}</span>
        </div>
      ))}
    </div>
  )
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(0 0% 45%)' }} />
        <span className="ml-3 text-sm" style={{ color: 'hsl(0 0% 45%)' }}>Loading knowledge graph…</span>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <Network className="w-14 h-14" style={{ color: 'hsl(215 16% 45%)' }} />
        <h2 className="text-xl font-semibold" style={{ color: 'hsl(0 0% 85%)' }}>No entities found</h2>
        <p className="max-w-sm text-sm" style={{ color: 'hsl(215 16% 50%)' }}>
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
            <Network className="w-6 h-6" style={{ color: 'hsl(0 0% 55%)' }} />
            Knowledge Graph
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(0 0% 48%)' }}>
            {entities.length} entities extracted from your documents
          </p>
        </div>

        {/* Legend */}
        <Legend />

        {/* Cross-document entities */}
        {crossDoc.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'hsl(0 0% 45%)' }}>
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
                        ? 'ring-1 ring-white/20 ring-offset-1 ring-offset-black'
                        : 'hover:ring-1 hover:ring-white/10'
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
                    <p className="text-xs" style={{ color: 'hsl(0 0% 48%)' }}>
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
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'hsl(0 0% 45%)' }}>
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
                      selected?.id === entity.id ? 'ring-1 ring-white/20' : 'hover:opacity-80'
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
        <aside
          className="w-72 shrink-0 rounded-xl p-5 flex flex-col gap-4 self-start sticky top-0"
          style={{
            background:     'hsl(0 0% 9%)',
            border:         '1px solid hsl(0 0% 16%)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Entity Details</h3>
            <button
              onClick={() => setSelected(null)}
              className="transition-colors hover:text-white" style={{ color: 'hsl(215 16% 55%)' } as React.CSSProperties}
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
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'hsl(0 0% 45%)' }}>
              Found in {selected.document_count} document{selected.document_count !== 1 ? 's' : ''}
            </p>
            <ul className="space-y-2">
              {selected.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-2 text-sm rounded-lg px-3 py-2"
                  style={{ color: 'hsl(0 0% 75%)', background: 'hsl(0 0% 13%)' }}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(0 0% 48%)' }} />
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
