'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cog, Package, MapPin, GitBranch, Network, X, FileText, Loader2 } from 'lucide-react'

type EntityType = 'equipment' | 'part' | 'location' | 'process'
interface EntityDoc { id: string; filename: string }
interface Entity { id: string; name: string; type: EntityType; document_count: number; documents: EntityDoc[] }

const TYPE_CONFIG: Record<EntityType, {
  icon: React.ElementType
  color: string
  dot: string
  label: string
  description: string
}> = {
  equipment: { icon: Cog,       color: '#60a5fa', dot: '#60a5fa', label: 'Equipment', description: 'Machines & assets'    },
  part:      { icon: Package,   color: '#fbbf24', dot: '#fbbf24', label: 'Part',      description: 'Components & spares'  },
  location:  { icon: MapPin,    color: '#4ade80', dot: '#4ade80', label: 'Location',  description: 'Zones & areas'        },
  process:   { icon: GitBranch, color: '#c084fc', dot: '#c084fc', label: 'Process',   description: 'Systems & procedures' },
}

function cfg(type: string) { return TYPE_CONFIG[type as EntityType] ?? TYPE_CONFIG.equipment }

export default function KnowledgeGraphPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Entity | null>(null)

  useEffect(() => {
    fetch('/api/entities/list')
      .then(r => r.json())
      .then(j => setEntities(j.entities ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const crossDoc  = entities.filter(e => e.document_count >= 2)
  const singleDoc = entities.filter(e => e.document_count < 2)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 size={20} className="animate-spin text-[#7a7f8a]" />
        <span className="font-mono text-[11px] tracking-wider text-[#7a7f8a]">LOADING GRAPH…</span>
      </div>
    )
  }

  if (entities.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <Network size={36} className="text-[#26282e]" strokeWidth={1} />
        <p className="font-mono text-[11px] tracking-wider text-[#3a3d45]">NO ENTITIES FOUND</p>
        <p className="max-w-sm text-sm text-[#7a7f8a]">
          Process one or more documents first. Entities are extracted automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* Left panel */}
      <div className="flex-1 space-y-8 overflow-y-auto pr-1">

        {/* Header */}
        <div className="border-b border-[#26282e] pb-6">
          <div className="mb-1 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">MODULE · KNOWLEDGE GRAPH</div>
          <h2 className="text-2xl font-medium text-[#e8e9eb]">Knowledge Graph</h2>
          <p className="mt-1 text-sm text-[#7a7f8a]">{entities.length} entities extracted from your documents</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-[#26282e] bg-[#0c0d10] px-4 py-3">
          <span className="font-mono text-[9px] tracking-[0.18em] text-[#3a3d45] shrink-0">LEGEND</span>
          {Object.values(TYPE_CONFIG).map(({ label, description, dot }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0" style={{ background: dot }} />
              <span className="font-mono text-[10px] tracking-wider" style={{ color: dot }}>{label.toUpperCase()}</span>
              <span className="hidden font-mono text-[10px] text-[#3a3d45] sm:inline">— {description}</span>
            </div>
          ))}
        </div>

        {/* Cross-document entities */}
        {crossDoc.length > 0 && (
          <section>
            <div className="mb-4 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">
              CONNECTED ACROSS MULTIPLE DOCUMENTS ({crossDoc.length})
            </div>
            <div className="grid grid-cols-1 gap-0 divide-y divide-[#26282e] border border-[#26282e] sm:grid-cols-2 sm:divide-x lg:grid-cols-3">
              {crossDoc.map((entity) => {
                const c      = cfg(entity.type)
                const Icon   = c.icon
                const active = selected?.id === entity.id

                return (
                  <button
                    key={entity.id}
                    onClick={() => setSelected(active ? null : entity)}
                    className={`group p-4 text-left transition-colors ${
                      active ? 'bg-[#ff6a1a]/[0.06]' : 'bg-[#0c0d10] hover:bg-[#0f1012]'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <Icon size={15} style={{ color: c.color }} />
                      <span
                        className="font-mono text-[9px] tracking-[0.14em]"
                        style={{ color: active ? '#ff6a1a' : c.color }}
                      >
                        {c.label.toUpperCase()}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium text-[#e8e9eb]">{entity.name}</p>
                    <p className="mt-1 font-mono text-[10px] text-[#7a7f8a]">
                      {entity.document_count} DOCS
                    </p>
                    {active && (
                      <div className="mt-2 h-px w-full" style={{ background: '#ff6a1a', opacity: 0.4 }} />
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Single-document entities */}
        {singleDoc.length > 0 && (
          <section>
            <div className="mb-4 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">
              SINGLE DOCUMENT MENTIONS ({singleDoc.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {singleDoc.map((entity) => {
                const c    = cfg(entity.type)
                const Icon = c.icon
                const active = selected?.id === entity.id

                return (
                  <button
                    key={entity.id}
                    onClick={() => setSelected(active ? null : entity)}
                    className="inline-flex items-center gap-1.5 border border-[#26282e] bg-[#0c0d10] px-3 py-1.5 font-mono text-[10px] tracking-wider transition-colors hover:border-[#3a3d45]"
                    style={{ color: active ? '#ff6a1a' : c.color }}
                  >
                    <Icon size={10} />
                    {entity.name}
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Right detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-0 w-64 shrink-0 self-start border border-[#26282e] bg-[#0c0d10]"
          >
            {/* Detail header */}
            <div className="flex items-center justify-between border-b border-[#26282e] px-4 py-3">
              <span className="font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">ENTITY DETAIL</span>
              <button
                onClick={() => setSelected(null)}
                className="text-[#7a7f8a] transition-colors hover:text-[#e8e9eb]"
              >
                <X size={14} />
              </button>
            </div>

            {/* Entity name + type */}
            <div className="border-b border-[#26282e] px-4 py-4">
              <div className="mb-2 flex items-center gap-2">
                {(() => {
                  const c    = cfg(selected.type)
                  const Icon = c.icon
                  return (
                    <>
                      <Icon size={13} style={{ color: c.color }} />
                      <span className="font-mono text-[9px] tracking-[0.14em]" style={{ color: c.color }}>
                        {c.label.toUpperCase()}
                      </span>
                    </>
                  )
                })()}
              </div>
              <p className="text-sm font-medium text-[#e8e9eb]">{selected.name}</p>
            </div>

            {/* Connected documents */}
            <div className="px-4 py-4">
              <div className="mb-3 font-mono text-[9px] tracking-[0.18em] text-[#7a7f8a]">
                FOUND IN {selected.document_count} DOCUMENT{selected.document_count !== 1 ? 'S' : ''}
              </div>
              <ul className="flex flex-col divide-y divide-[#26282e] border border-[#26282e]">
                {selected.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center gap-2 bg-[#08090b] px-3 py-2.5"
                  >
                    <FileText size={11} className="shrink-0 text-[#7a7f8a]" />
                    <span className="truncate font-mono text-[10px] text-[#a9adb6]" title={doc.filename}>
                      {doc.filename}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}