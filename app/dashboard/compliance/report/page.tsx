'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { ShieldCheck, ShieldX, Shield } from 'lucide-react'

interface ComplianceResult {
  overall_status: 'compliant' | 'non_compliant' | 'partial'
  score: number
  summary: string
  issues: {
    title: string
    severity: 'high' | 'medium' | 'low'
    description: string
    recommendation: string
  }[]
  compliant_areas: string[]
}

const STATUS_CONFIG = {
  compliant:     { icon: ShieldCheck, color: '#4caf6e', label: 'COMPLIANT'          },
  non_compliant: { icon: ShieldX,    color: '#e5484d', label: 'NON COMPLIANT'       },
  partial:       { icon: Shield,     color: '#ff6a1a', label: 'PARTIALLY COMPLIANT' },
}

const SEVERITY_COLOR = {
  high:   '#e5484d',
  medium: '#ff6a1a',
  low:    '#7a7f8a',
}

function ReportContent() {
  const params     = useSearchParams()
  const [result, setResult]     = useState<ComplianceResult | null>(null)
  const [docName, setDocName]   = useState('')
  const [regulation, setRegulation] = useState('')

  useEffect(() => {
    const data = params.get('data')
    const doc  = params.get('doc')
    const reg  = params.get('reg')
    if (data) setResult(JSON.parse(decodeURIComponent(data)))
    if (doc)  setDocName(decodeURIComponent(doc))
    if (reg)  setRegulation(decodeURIComponent(reg))

    // Auto print after render
    setTimeout(() => window.print(), 800)
  }, [params])

  if (!result) return <p style={{ fontFamily: 'monospace', padding: 40 }}>Loading...</p>

  const sc   = STATUS_CONFIG[result.overall_status]
  const Icon = sc.icon
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div style={{ fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto', padding: '48px 40px', color: '#111', background: '#fff' }}>

      {/* Header */}
      <div style={{ borderBottom: '2px solid #111', paddingBottom: 20, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', color: '#666', marginBottom: 6 }}>
              UNIFIEDOPS BRAIN · COMPLIANCE REPORT
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              Compliance Audit Report
            </h1>
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: '#666' }}>
            <div>Generated: {date}</div>
            <div style={{ marginTop: 4 }}>Powered by UnifiedOps Brain</div>
          </div>
        </div>
      </div>

      {/* Document + Regulation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ border: '1px solid #e5e5e5', padding: '12px 16px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', color: '#888', marginBottom: 4 }}>DOCUMENT</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{docName || 'N/A'}</div>
        </div>
        <div style={{ border: '1px solid #e5e5e5', padding: '12px 16px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', color: '#888', marginBottom: 4 }}>REGULATION</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{regulation || 'N/A'}</div>
        </div>
      </div>

      {/* Score card */}
      <div style={{ border: `2px solid ${sc.color}`, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: sc.color, fontSize: 28 }}>■</div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.14em', color: sc.color, fontWeight: 700 }}>{sc.label}</div>
            <div style={{ fontSize: 13, color: '#444', marginTop: 4, maxWidth: 480 }}>{result.summary}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1, color: sc.color }}>{result.score}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#888' }}>/ 100</div>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ height: 4, background: '#f0f0f0', marginBottom: 32 }}>
        <div style={{ height: 4, width: `${result.score}%`, background: sc.color }} />
      </div>

      {/* Issues */}
      {result.issues.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', color: '#888', marginBottom: 16, borderBottom: '1px solid #e5e5e5', paddingBottom: 8 }}>
            ISSUES FOUND ({result.issues.length})
          </div>
          {result.issues.map((issue, i) => (
            <div key={i} style={{ marginBottom: 20, paddingLeft: 16, borderLeft: `3px solid ${SEVERITY_COLOR[issue.severity]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{issue.title}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', color: SEVERITY_COLOR[issue.severity], fontWeight: 700 }}>
                  {issue.severity.toUpperCase()}
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#444', marginBottom: 6 }}>{issue.description}</div>
              <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>→ {issue.recommendation}</div>
            </div>
          ))}
        </div>
      )}

      {/* Compliant areas */}
      {result.compliant_areas.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', color: '#888', marginBottom: 16, borderBottom: '1px solid #e5e5e5', paddingBottom: 8 }}>
            COMPLIANT AREAS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {result.compliant_areas.map((area, i) => (
              <span key={i} style={{ border: '1px solid #4caf6e', color: '#4caf6e', padding: '4px 10px', fontSize: 11, fontFamily: 'monospace' }}>
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 16, marginTop: 40, display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 10, color: '#aaa' }}>
        <span>UNIFIEDOPS BRAIN · AI-POWERED INDUSTRIAL COMPLIANCE</span>
        <span>GROQ + JINA AI + SUPABASE</span>
      </div>
    </div>
  )
}

export default function ComplianceReportPage() {
  return (
    <Suspense fallback={<p style={{ fontFamily: 'monospace', padding: 40 }}>Loading...</p>}>
      <ReportContent />
    </Suspense>
  )
}