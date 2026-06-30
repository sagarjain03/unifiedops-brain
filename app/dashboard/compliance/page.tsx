'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ShieldX, Shield, Loader2, ChevronDown } from 'lucide-react'

interface Document {
  id: string
  filename: string
  status: string
}

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

const REGULATIONS = [
  'ISO 45001 - Occupational Health and Safety',
  'Factory Act 1948 - Safety Requirements',
  'ISO 9001 - Quality Management System',
  'OSHA 29 CFR 1910 - General Industry Standards',
  'ISO 14001 - Environmental Management',
]

export default function CompliancePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState('')
  const [selectedReg, setSelectedReg] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ComplianceResult | null>(null)

  useEffect(() => {
    fetch('/api/documents/list')
      .then(r => r.json())
      .then(d => setDocuments(d.documents?.filter((d: Document) => d.status === 'indexed') || []))
  }, [])

  const runCheck = async () => {
    if (!selectedDoc || !selectedReg) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: selectedDoc,
          regulation: selectedReg,
        }),
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

  const statusConfig = {
    compliant: {
      icon: ShieldCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
      badge: 'bg-green-100 text-green-700',
      label: 'Compliant',
    },
    non_compliant: {
      icon: ShieldX,
      color: 'text-red-600',
      bg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
      label: 'Non Compliant',
    },
    partial: {
      icon: Shield,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      badge: 'bg-orange-100 text-orange-700',
      label: 'Partially Compliant',
    },
  }

  const severityColor = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Compliance Check</h2>
      <p className="text-slate-500 mb-8">
        Document ko kisi bhi regulation ke against check karo.
      </p>

      {/* Controls */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Document Select */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Document Select Karo
            </label>
            <select
              value={selectedDoc}
              onChange={e => setSelectedDoc(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Document choose karo --</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.filename}</option>
              ))}
            </select>
            {documents.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Pehle Documents page pe PDF upload aur process karo
              </p>
            )}
          </div>

          {/* Regulation Select */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Regulation Select Karo
            </label>
            <select
              value={selectedReg}
              onChange={e => setSelectedReg(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Regulation choose karo --</option>
              {REGULATIONS.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={runCheck}
          disabled={!selectedDoc || !selectedReg || loading}
          className="w-full"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin mr-2" /> Checking...</>
          ) : (
            <><ShieldCheck size={16} className="mr-2" /> Run Compliance Check</>
          )}
        </Button>
      </Card>

      {/* Result */}
      {result && (() => {
        const config = statusConfig[result.overall_status]
        const Icon = config.icon
        return (
          <div className="flex flex-col gap-6">
            {/* Score Card */}
            <Card className={`p-6 ${config.bg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Icon size={32} className={config.color} />
                  <div>
                    <p className="text-lg font-bold text-slate-800">{config.label}</p>
                    <p className="text-sm text-slate-600">{result.summary}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-slate-800">{result.score}</p>
                  <p className="text-sm text-slate-500">/ 100</p>
                </div>
              </div>

              {/* Score Bar */}
              <div className="w-full bg-white rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    result.score >= 70 ? 'bg-green-500' :
                    result.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </Card>

            {/* Issues */}
            {result.issues.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-slate-800 mb-4">
                  Issues Found ({result.issues.length})
                </h3>
                <div className="flex flex-col gap-4">
                  {result.issues.map((issue, i) => (
                    <div key={i} className="border border-slate-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-700">{issue.title}</p>
                        <Badge className={severityColor[issue.severity]}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{issue.description}</p>
                      <p className="text-sm text-blue-600">
                        💡 {issue.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Compliant Areas */}
            {result.compliant_areas.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-slate-800 mb-4">
                  ✅ Compliant Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.compliant_areas.map((area, i) => (
                    <Badge key={i} className="bg-green-100 text-green-700">
                      {area}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )
      })()}
    </div>
  )
}