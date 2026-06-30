'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, AlertTriangle, Wrench, TrendingUp, Lightbulb } from 'lucide-react'

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

export default function RCAPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RCAResult | null>(null)

  const runAnalysis = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/rca/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (res.ok) setResult(data.result)
      else alert('Error: ' + data.error)
    } catch {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const exampleQueries = [
    'Pump failure history',
    'Motor breakdown causes',
    'Why did equipment fail last time',
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Root Cause Analysis</h2>
      <p className="text-slate-500 mb-8">
        Purani failures aur unke fixes dhundo apne maintenance records mein.
      </p>

      {/* Search Box */}
      <Card className="p-6 mb-8">
        <div className="flex gap-3 mb-4">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runAnalysis()}
            placeholder="e.g. Pump P-204 kyu kharab hua tha pichle saal?"
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={runAnalysis} disabled={loading || !query.trim()}>
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <><Search size={16} className="mr-2" /> Analyze</>
            )}
          </Button>
        </div>

        {/* Example queries */}
        {!result && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-400">Try:</span>
            {exampleQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuery(q)}
                className="text-xs text-blue-600 hover:underline"
              >
                {q}{i < exampleQueries.length - 1 ? ' ·' : ''}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-6">
          {/* Summary */}
          <Card className={`p-6 ${result.found_incidents ? 'bg-blue-50' : 'bg-slate-50'}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className={result.found_incidents ? 'text-blue-600' : 'text-slate-400'} />
              <div>
                <p className="font-semibold text-slate-800 mb-1">
                  {result.found_incidents ? `${result.incidents.length} Related Incident(s) Found` : 'No Matching History Found'}
                </p>
                <p className="text-sm text-slate-600">{result.summary}</p>
              </div>
            </div>
          </Card>

          {/* Incidents */}
          {result.incidents.map((incident, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">{incident.title}</h3>
                <Badge variant="secondary">Page {incident.source_page}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">ROOT CAUSE</p>
                    <p className="text-sm text-slate-700">{incident.root_cause}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Wrench size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">RESOLUTION</p>
                    <p className="text-sm text-slate-700">{incident.resolution}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <TrendingUp size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">OUTCOME</p>
                    <p className="text-sm text-slate-700">{incident.outcome}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Search size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">DATE</p>
                    <p className="text-sm text-slate-700">{incident.date_mentioned}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={18} className="text-yellow-500" />
                <h3 className="font-semibold text-slate-800">Recommendations</h3>
              </div>
              <ul className="flex flex-col gap-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                    <span className="text-blue-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}