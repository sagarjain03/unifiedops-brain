'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'
interface UploadedFile { name: string; status: UploadStatus; message?: string }
interface Document { id: string; filename: string; doc_type: string; created_at: string; status: string; chunk_count?: number }

const glass: React.CSSProperties = {
  background: 'hsl(222 40% 10% / 0.85)',
  border: '1px solid hsl(217 30% 20% / 0.6)',
  backdropFilter: 'blur(12px)',
  borderRadius: '1rem',
}

export default function DocumentsPage() {
  const [files, setFiles]         = useState<UploadedFile[]>([])
  const [documents, setDocuments] = useState<Document[]>([])

  const fetchDocuments = async () => {
    const res = await fetch('/api/documents/list')
    const data = await res.json()
    if (data.documents) setDocuments(data.documents)
  }

  const processDocument = async (documentId: string) => {
    setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, status: 'processing' } : d))
    const res = await fetch('/api/documents/process', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId }),
    })
    const data = await res.json()
    if (res.ok) { fetchDocuments() } else { alert('Processing failed: ' + data.error); fetchDocuments() }
  }

  useEffect(() => { fetchDocuments() }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      setFiles(prev => [...prev, { name: file.name, status: 'uploading' }])
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('doc_type', 'manual')
        const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok) {
          setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'success', message: 'Uploaded!' } : f))
          fetchDocuments()
        } else {
          setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'error', message: data.error } : f))
        }
      } catch {
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'error', message: 'Upload failed' } : f))
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxSize: 10 * 1024 * 1024,
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Documents</h2>
      <p className="text-sm mb-8" style={{ color: 'hsl(0 0% 52%)' }}>Upload PDF manuals, SOPs, and regulations.</p>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className="p-12 border-2 border-dashed cursor-pointer text-center transition-all mb-8 rounded-2xl"
        style={{
          background: isDragActive ? 'hsl(0 0% 14% / 0.8)' : 'hsl(0 0% 10% / 0.6)',
          borderColor: isDragActive ? 'hsl(0 0% 40%)' : 'hsl(0 0% 22%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <input {...getInputProps()} />
        <Upload size={40} className="mx-auto mb-4" style={{ color: 'hsl(0 0% 42%)' }} />
        {isDragActive ? (
          <p className="font-medium text-white/80">Drop karo yahan!</p>
        ) : (
          <>
            <p className="font-medium mb-1 text-white/80">PDF drag &amp; drop karo</p>
            <p className="text-sm" style={{ color: 'hsl(0 0% 42%)' }}>ya click karo to browse (max 10MB)</p>
          </>
        )}
      </div>

      {/* Upload Progress */}
      {files.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {files.map((file, i) => (
            <div key={i} className="p-4 flex items-center justify-between" style={glass}>
              <div className="flex items-center gap-3">
                <FileText size={18} style={{ color: 'hsl(0 0% 48%)' }} />
                <span className="text-sm font-medium text-white/85">{file.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (<><Loader2 size={16} className="animate-spin" style={{ color: 'hsl(0 0% 55%)' }} /><Badge variant="secondary">Uploading...</Badge></>)}
                {file.status === 'success'  && (<><CheckCircle size={16} className="text-[hsl(142_70%_50%)]" /><Badge className="bg-[hsl(142_40%_12%)] text-[hsl(142_70%_55%)]">Done</Badge></>)}
                {file.status === 'error'    && (<><XCircle size={16} className="text-[hsl(0_84%_60%)]" /><Badge variant="destructive">{file.message}</Badge></>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'hsl(0 0% 42%)' }}>
            Uploaded Documents ({documents.length})
          </h3>
          <div className="flex flex-col gap-3">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between" style={glass}>
                <div className="flex items-center gap-3">
                  <FileText size={18} style={{ color: 'hsl(0 0% 48%)' }} />
                  <div>
                    <p className="text-sm font-medium text-white/90">{doc.filename}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(0 0% 42%)' }}>
                      {new Date(doc.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize border-[hsl(0_0%_22%)] text-[hsl(0_0%_55%)]">{doc.doc_type}</Badge>
                  {doc.status === 'pending'    && <Button size="sm" onClick={() => processDocument(doc.id)} className="bg-[hsl(0_0%_20%)] hover:bg-[hsl(0_0%_26%)] text-white border-none">Process</Button>}
                  {doc.status === 'processing' && <Badge className="bg-[hsl(25_60%_15%)] text-[hsl(25_95%_65%)]"><Loader2 size={12} className="animate-spin mr-1" />Processing...</Badge>}
                  {doc.status === 'indexed'    && <Badge className="bg-[hsl(142_40%_12%)] text-[hsl(142_70%_55%)]">✓ Indexed ({doc.chunk_count} chunks)</Badge>}
                  {doc.status === 'failed'     && <Badge variant="destructive">Failed</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && files.length === 0 && (
        <p className="text-center text-sm mt-4" style={{ color: 'hsl(0 0% 38%)' }}>
          Koi document nahi hai — pehla PDF upload karo!
        </p>
      )}
    </div>
  )
}