'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadedFile {
  name: string
  status: UploadStatus
  message?: string
}

interface Document {
  id: string
  filename: string
  doc_type: string
  created_at: string
  status: string
  chunk_count?: number
}

export default function DocumentsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [documents, setDocuments] = useState<Document[]>([])

  const fetchDocuments = async () => {
    const res = await fetch('/api/documents/list')
    const data = await res.json()
    if (data.documents) setDocuments(data.documents)
  }

  const processDocument = async (documentId: string) => {
    // Optimistically show processing state
    setDocuments(prev =>
      prev.map(d => d.id === documentId ? { ...d, status: 'processing' } : d)
    )

    const res = await fetch('/api/documents/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId }),
    })

    const data = await res.json()

    if (res.ok) {
      fetchDocuments()
    } else {
      alert('Processing failed: ' + data.error)
      fetchDocuments()
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      setFiles(prev => [...prev, { name: file.name, status: 'uploading' }])

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('doc_type', 'manual')

        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (res.ok) {
          setFiles(prev =>
            prev.map(f =>
              f.name === file.name
                ? { ...f, status: 'success', message: 'Uploaded successfully!' }
                : f
            )
          )
          fetchDocuments()
        } else {
          setFiles(prev =>
            prev.map(f =>
              f.name === file.name
                ? { ...f, status: 'error', message: data.error }
                : f
            )
          )
        }
      } catch {
        setFiles(prev =>
          prev.map(f =>
            f.name === file.name
              ? { ...f, status: 'error', message: 'Upload failed' }
              : f
          )
        )
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Documents</h2>
      <p className="text-slate-500 mb-8">Upload PDF manuals, SOPs, and regulations.</p>

      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={`p-12 border-2 border-dashed cursor-pointer text-center transition-colors mb-8 ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={40} className="mx-auto mb-4 text-slate-400" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop karo yahan!</p>
        ) : (
          <>
            <p className="text-slate-600 font-medium mb-1">PDF drag & drop karo</p>
            <p className="text-slate-400 text-sm">ya click karo to browse (max 10MB)</p>
          </>
        )}
      </Card>

      {/* Upload Progress */}
      {files.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {files.map((file, i) => (
            <Card key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{file.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (
                  <><Loader2 size={16} className="animate-spin text-blue-500" />
                  <Badge variant="secondary">Uploading...</Badge></>
                )}
                {file.status === 'success' && (
                  <><CheckCircle size={16} className="text-green-500" />
                  <Badge className="bg-green-100 text-green-700">Done</Badge></>
                )}
                {file.status === 'error' && (
                  <><XCircle size={16} className="text-red-500" />
                  <Badge variant="destructive">{file.message}</Badge></>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-4">
            Uploaded Documents ({documents.length})
          </h3>
          <div className="flex flex-col gap-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{doc.filename}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="capitalize">{doc.doc_type}</Badge>

                  {doc.status === 'pending' && (
                    <Button size="sm" onClick={() => processDocument(doc.id)}>
                      Process
                    </Button>
                  )}
                  {doc.status === 'processing' && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      <Loader2 size={12} className="animate-spin mr-1" />
                      Processing...
                    </Badge>
                  )}
                  {doc.status === 'indexed' && (
                    <Badge className="bg-green-100 text-green-700">
                      ✓ Indexed ({doc.chunk_count} chunks)
                    </Badge>
                  )}
                  {doc.status === 'failed' && (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && files.length === 0 && (
        <p className="text-center text-slate-400 text-sm mt-4">
          Koi document nahi hai — pehla PDF upload karo!
        </p>
      )}
    </div>
  )
}