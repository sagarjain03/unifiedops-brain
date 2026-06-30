'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

const glass: React.CSSProperties = {
  background:     'hsl(0 0% 8% / 0.9)',
  border:         '1px solid hsl(0 0% 16% / 0.7)',
  backdropFilter: 'blur(12px)',
  borderRadius:   '1rem',
}

const selectStyle: React.CSSProperties = {
  width:        '100%',
  background:   'hsl(0 0% 8%)',
  border:       '1px solid hsl(0 0% 20%)',
  color:        'hsl(0 0% 90%)',
  borderRadius: '0.625rem',
  padding:      '0.625rem 0.75rem',
  fontSize:     '0.875rem',
  outline:      'none',
}

export default function CompliancePage() {
  const [documents, setDocuments]   = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState('')
  const [selectedReg, setSelectedReg] = useState('')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState<ComplianceResult | null>(null)

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

  const statusConfig = {
    compliant:     { icon: ShieldCheck, color: 'hsl(142 70% 50%)', bg: 'hsl(142 40% 10%)', border: 'hsl(142 40% 20%)', label: 'Compliant' },
    non_compliant: { icon: ShieldX,    color: 'hsl(0 84% 60%)',   bg: 'hsl(0 50% 10%)',   border: 'hsl(0 50% 20%)',   label: 'Non Compliant' },
    partial:       { icon: Shield,     color: 'hsl(25 95% 60%)',  bg: 'hsl(25 60% 10%)',  border: 'hsl(25 60% 20%)',  label: 'Partially Compliant' },
  }

  const severityBadge = {
    high:   'bg-[hsl(0_50%_14%)] text-[hsl(0_84%_65%)] border-[hsl(0_50%_22%)]',
    medium: 'bg-[hsl(25_60%_12%)] text-[hsl(25_95%_62%)] border-[hsl(25_60%_22%)]',
    low:    'bg-[hsl(0_0%_12%)] text-[hsl(0_0%_55%)] border-[hsl(0_0%_22%)]',
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Compliance Check</h2>
      <p className="text-sm mb-8" style={{ color: 'hsl(0 0% 52%)' }}>
        Document ko kisi bhi regulation ke against check karo.
      </p>

      {/* Controls */}
      <div className="p-6 mb-8" style={glass}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'hsl(0 0% 42%)' }}>
              Document Select Karo
            </label>
            <select value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)} style={selectStyle}>
              <option value="">-- Document choose karo --</option>
              {documents.map(doc => <option key={doc.id} value={doc.id}>{doc.filename}</option>)}
            </select>
            {documents.length === 0 && (
              <p className="text-xs mt-1" style={{ color: 'hsl(0 84% 60%)' }}>Pehle Documents page pe PDF upload aur process karo</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'hsl(0 0% 42%)' }}>
              Regulation Select Karo
            </label>
            <select value={selectedReg} onChange={e => setSelectedReg(e.target.value)} style={selectStyle}>
              <option value="">-- Regulation choose karo --</option>
              {REGULATIONS.map(reg => <option key={reg} value={reg}>{reg}</option>)}
            </select>
          </div>
        </div>
        <Button
          onClick={runCheck}
          disabled={!selectedDoc || !selectedReg || loading}
          className="w-full bg-[hsl(0_0%_20%)] hover:bg-[hsl(0_0%_26%)] text-white border-none"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin mr-2" /> Checking...</>
            : <><ShieldCheck size={16} className="mr-2" /> Run Compliance Check</>
          }
        </Button>
      </div>

      {/* Result */}
      {result && (() => {
        const cfg  = statusConfig[result.overall_status]
        const Icon = cfg.icon
        return (
          <div className="flex flex-col gap-6">
            {/* Score card */}
            <div className="p-6 rounded-2xl" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Icon size={28} style={{ color: cfg.color }} />
                  <div>
                    <p className="font-bold text-white">{cfg.label}</p>
                    <p className="text-sm" style={{ color: 'hsl(0 0% 60%)' }}>{result.summary}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold text-white">{result.score}</p>
                  <p className="text-xs" style={{ color: 'hsl(0 0% 42%)' }}>/ 100</p>
                </div>
              </div>
              {/* Score bar */}
              <div className="w-full rounded-full h-2.5" style={{ background: 'hsl(0 0% 16%)' }}>
                <div
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    width: `${result.score}%`,
                    background: result.score >= 70 ? 'hsl(142 70% 50%)' : result.score >= 40 ? 'hsl(25 95% 60%)' : 'hsl(0 84% 60%)',
                  }}
                />
              </div>
            </div>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="p-6" style={glass}>
                <h3 className="font-semibold text-white mb-4">Issues Found ({result.issues.length})</h3>
                <div className="flex flex-col gap-4">
                  {result.issues.map((issue, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: 'hsl(0 0% 7%)', border: '1px solid hsl(0 0% 16%)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-white/90">{issue.title}</p>
                        <Badge className={severityBadge[issue.severity]}>{issue.severity}</Badge>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'hsl(0 0% 60%)' }}>{issue.description}</p>
                      <p className="text-sm" style={{ color: 'hsl(142 60% 55%)' }}>💡 {issue.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliant areas */}
            {result.compliant_areas.length > 0 && (
              <div className="p-6" style={glass}>
                <h3 className="font-semibold text-white mb-4">✅ Compliant Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {result.compliant_areas.map((area, i) => (
                    <Badge key={i} className="bg-[hsl(142_40%_12%)] text-[hsl(142_70%_55%)] border-[hsl(142_40%_22%)]">{area}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}