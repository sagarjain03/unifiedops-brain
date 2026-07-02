'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

interface Incident {
  title: string
  date_mentioned: string
  root_cause: string
  resolution: string
  outcome: string
  source_page: number
}

interface RCAResult {
  found_incidents: boolean
  summary: string
  incidents: Incident[]
  recommendations: string[]
}

function ReportContent() {
  const params = useSearchParams()
  const [result, setResult] = useState<RCAResult | null>(null)
  const [query, setQuery]   = useState('')

  useEffect(() => {
    const data = params.get('data')
    const q    = params.get('query')
    if (data) setResult(JSON.parse(decodeURIComponent(data)))
    if (q)    setQuery(decodeURIComponent(q))
    setTimeout(() => window.print(), 800)
  }, [params])

  if (!result) return <p style={{ fontFamily: 'monospace', padding: 40 }}>Loading...</p>

  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div style={{ fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto', padding: '48px 40px', color: '#111', background: '#fff' }}>

      {/* Header */}
      <div style={{ borderBottom: '2px solid #111', paddingBottom: 20, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', color: '#666', marginBottom: 6 }}>
              UNIFIEDOPS BRAIN · ROOT CAUSE ANALYSIS REPORT
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Failure Analysis Report</h1>
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: '#666' }}>
            <div>Generated: {date}</div>
            <div style={{ marginTop: 4 }}>Powered by UnifiedOps Brain</div>
          </div>
        </div>
      </div>

      {/* Query */}
      <div style={{ border: '1px solid #e5e5e5', padding: '12px 16px', marginBottom: 32 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', color: '#888', marginBottom: 4 }}>ANALYSIS QUERY</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{query || 'N/A'}</div>
      </div>

      {/* Summary */}
      <div style={{ border: `2px solid ${result.found_incidents ? '#ff6a1a' : '#e5e5e5'}`, padding: '16px 20px', marginBottom: 32 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.14em', color: result.found_incidents ? '#ff6a1a' : '#888', fontWeight: 700, marginBottom: 8 }}>
          {result.found_incidents ? `${result.incidents.length} INCIDENT(S) FOUND` : 'NO MATCHING HISTORY'}
        </div>
        <div style={{ fontSize: 13, color: '#444' }}>{result.summary}</div>
      </div>

      {/* Incidents */}
      {result.incidents.map((incident, i) => (
        <div key={i} style={{ border: '1px solid #e5e5e5', marginBottom: 24 }}>
          {/* Incident header */}
          <div style={{ background: '#f9f9f9', padding: '12px 16px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', color: '#ff6a1a', marginRight: 12 }}>
                INCIDENT.{String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{incident.title}</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>
              {incident.date_mentioned} · Pg.{incident.source_page}
            </div>
          </div>

          {/* Incident body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div style={{ padding: '14px 16px', borderRight: '1px solid #e5e5e5' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', color: '#888', marginBottom: 6 }}>ROOT CAUSE</div>
              <div style={{ fontSize: 13, color: '#333' }}>{incident.root_cause}</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', color: '#888', marginBottom: 6 }}>RESOLUTION</div>
              <div style={{ fontSize: 13, color: '#333' }}>{incident.resolution}</div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid #e5e5e5' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', color: '#888', marginBottom: 6 }}>OUTCOME</div>
            <div style={{ fontSize: 13, color: '#333' }}>{incident.outcome}</div>
          </div>
        </div>
      ))}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', color: '#888', marginBottom: 16, borderBottom: '1px solid #e5e5e5', paddingBottom: 8 }}>
            RECOMMENDATIONS
          </div>
          {result.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 13 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#ff6a1a', fontWeight: 700, minWidth: 24 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ color: '#333' }}>{rec}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 16, marginTop: 40, display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 10, color: '#aaa' }}>
        <span>UNIFIEDOPS BRAIN · AI-POWERED INDUSTRIAL INTELLIGENCE</span>
        <span>GROQ + JINA AI + SUPABASE</span>
      </div>
    </div>
  )
}

export default function RCAReportPage() {
  return (
    <Suspense fallback={<p style={{ fontFamily: 'monospace', padding: 40 }}>Loading...</p>}>
      <ReportContent />
    </Suspense>
  )
}