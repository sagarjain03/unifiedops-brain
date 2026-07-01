'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ShieldX, Shield, Loader2 } from 'lucide-react'

interface Document { id: string; filename: string; status: string }
interface ComplianceResult {
  overall_status: 'compliant' | 'non_compliant' | 'partial'
  score: number; summary: string
  issues: { title: string; severity: 'high'|'medium'|'low'; description: string; recommendation: string }[]
  compliant_areas: string[]
}

const REGULATIONS = [
  'ISO 45001 - Occupational Health and Safety',
  'Factory Act 1948 - Safety Requirements',
  'ISO 9001 - Quality Management System',
  'OSHA 29 CFR 1910 - General Industry Standards',
  'ISO 14001 - Environmental Management',
]

const STATUS_CONFIG = {
  compliant:     { icon: ShieldCheck, color: '#4caf6e', label: 'COMPLIANT',           barColor: '#4caf6e' },
  non_compliant: { icon: ShieldX,    color: '#e5484d', label: 'NON COMPLIANT',        barColor: '#e5484d' },
  partial:       { icon: Shield,     color: '#ff6a1a', label: 'PARTIALLY COMPLIANT',  barColor: '#ff6a1a' },
}

const SEVERITY_COLOR = {
  high:   { text: '#e5484d', label: 'HIGH'   },
  medium: { text: '#ff6a1a', label: 'MEDIUM' },
  low:    { text: '#7a7f8a', label: 'LOW'    },
}

const selectCls = [
  'w-full border border-[#26282e] bg-[#08090b] px-3 py-2.5',
  'font-mono text-[12px] text-[#e8e9eb] tracking-wide',
  'focus:border-[#ff6a1a] focus:outline-none',
].join(' ')

export default function CompliancePage() {
  const [documents, setDocuments]     = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState('')
  const [selectedReg, setSelectedReg] = useState('')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<ComplianceResult | null>(null)

  useEffect(() => {
    fetch('/api/documents/list')
      .then(r => r.json())
      .then(d => setDocuments(d.documents?.filter((d: Document) => d.status === 'indexed') || []))
  }, [])

  const runCheck = async () => {
    if (!selectedDoc || !selectedReg) return
    setLoading(true); setResult(null)
    try {
      const res  = await fetch('/api/compliance/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: selectedDoc, regulation: selectedReg }),
      })
      const data = await res.json()
      if (res.ok) setResult(data.result)
      else alert('Error: ' + data.error)
    } catch { alert('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page header */}
      <div className="mb-8 border-b border-[#26282e] pb-6">
        <div className="mb-1 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">MODULE · COMPLIANCE</div>
        <h2 className="text-2xl font-medium text-[#e8e9eb]">Compliance Check</h2>
        <p className="mt-1 text-sm text-[#7a7f8a]">Document ko kisi bhi regulation ke against check karo.</p>
      </div>

      {/* Controls */}
      <div className="mb-8 border border-[#26282e] bg-[#0c0d10]">
        <div className="grid grid-cols-1 divide-y divide-[#26282e] md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="p-5">
            <div className="mb-2 font-mono text-[9px] tracking-[0.18em] text-[#7a7f8a]">DOCUMENT</div>
            <select value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)} className={selectCls}>
              <option value="">-- Document choose karo --</option>
              {documents.map(doc => <option key={doc.id} value={doc.id}>{doc.filename}</option>)}
            </select>
            {documents.length === 0 && (
              <p className="mt-2 font-mono text-[10px] tracking-wider text-[#e5484d]">
                PEHLE PDF UPLOAD + PROCESS KARO
              </p>
            )}
          </div>
          <div className="p-5">
            <div className="mb-2 font-mono text-[9px] tracking-[0.18em] text-[#7a7f8a]">REGULATION</div>
            <select value={selectedReg} onChange={e => setSelectedReg(e.target.value)} className={selectCls}>
              <option value="">-- Regulation choose karo --</option>
              {REGULATIONS.map(reg => <option key={reg} value={reg}>{reg}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-[#26282e] p-5">
          <button
            onClick={runCheck}
            disabled={!selectedDoc || !selectedReg || loading}
            className="flex w-full items-center justify-center gap-2 border border-[#26282e] bg-[#08090b] py-3 font-mono text-[11px] tracking-[0.14em] text-[#a9adb6] transition-colors hover:border-[#ff6a1a] hover:text-[#ff6a1a] disabled:opacity-30"
          >
            {loading
              ? <><Loader2 size={13} className="animate-spin" /> CHECKING…</>
              : <><ShieldCheck size={13} /> RUN COMPLIANCE CHECK</>
            }
          </button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (() => {
          const sc   = STATUS_CONFIG[result.overall_status]
          const Icon = sc.icon
          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4"
            >
              {/* Score card */}
              <div className="border border-[#26282e] bg-[#0c0d10]">
                {/* Header row */}
                <div className="flex items-center justify-between border-b border-[#26282e] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Icon size={18} style={{ color: sc.color }} />
                    <span className="font-mono text-[11px] tracking-[0.14em]" style={{ color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-3xl font-medium text-[#e8e9eb]">{result.score}</span>
                    <span className="font-mono text-[11px] text-[#7a7f8a]"> / 100</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="px-5 py-4">
                  <div className="mb-3 h-1 w-full bg-[#26282e]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.score}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-1"
                      style={{ background: sc.barColor }}
                    />
                  </div>
                  <p className="text-sm text-[#7a7f8a]">{result.summary}</p>
                </div>
              </div>

              {/* Issues */}
              {result.issues.length > 0 && (
                <div className="border border-[#26282e] bg-[#0c0d10]">
                  <div className="border-b border-[#26282e] px-5 py-3 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">
                    ISSUES FOUND ({result.issues.length})
                  </div>
                  <ul className="divide-y divide-[#26282e]">
                    {result.issues.map((issue, i) => {
                      const sv = SEVERITY_COLOR[issue.severity]
                      return (
                        <li key={i} className="px-5 py-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-[#e8e9eb]">{issue.title}</p>
                            <span className="shrink-0 font-mono text-[9px] tracking-[0.14em]" style={{ color: sv.text }}>
                              {sv.label}
                            </span>
                          </div>
                          <p className="mb-2 text-sm text-[#7a7f8a]">{issue.description}</p>
                          <div className="flex items-start gap-2 border-l-2 border-[#ff6a1a]/40 pl-3">
                            <p className="text-sm text-[#a9adb6]">{issue.recommendation}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Compliant areas */}
              {result.compliant_areas.length > 0 && (
                <div className="border border-[#26282e] bg-[#0c0d10]">
                  <div className="border-b border-[#26282e] px-5 py-3 font-mono text-[10px] tracking-[0.18em] text-[#4caf6e]">
                    COMPLIANT AREAS
                  </div>
                  <div className="flex flex-wrap gap-2 p-5">
                    {result.compliant_areas.map((area, i) => (
                      <span
                        key={i}
                        className="border border-[#4caf6e]/20 bg-[#4caf6e]/[0.06] px-3 py-1 font-mono text-[10px] tracking-wider text-[#4caf6e]"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && (
        <div className="border border-dashed border-[#26282e] py-20 text-center">
          <Shield size={28} className="mx-auto mb-3 text-[#26282e]" strokeWidth={1} />
          <p className="font-mono text-[11px] tracking-wider text-[#3a3d45]">
            SELECT A DOCUMENT AND REGULATION TO BEGIN
          </p>
        </div>
      )}
    </div>
  )
}