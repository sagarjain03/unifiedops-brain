'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'
interface UploadedFile { name: string; status: UploadStatus; message?: string }
interface Document { id: string; filename: string; doc_type: string; created_at: string; status: string; chunk_count?: number }

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
      {/* Page header */}
      <div className="mb-8 border-b border-[#26282e] pb-6">
        <div className="mb-1 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">MODULE · DOCUMENTS</div>
        <h2 className="text-2xl font-medium text-[#e8e9eb]">Documents</h2>
        <p className="mt-1 text-sm text-[#7a7f8a]">Upload PDF manuals, SOPs, and regulations.</p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className="mb-8 cursor-pointer border border-dashed p-12 text-center transition-colors"
        style={{
          background:   isDragActive ? '#0f1012' : '#0c0d10',
          borderColor:  isDragActive ? '#ff6a1a' : '#26282e',
        }}
      >
        <input {...getInputProps()} />
        <Upload size={36} className="mx-auto mb-4 text-[#3a3d45]" />
        {isDragActive ? (
          <p className="font-mono text-sm tracking-wide text-[#ff6a1a]">DROP TO UPLOAD</p>
        ) : (
          <>
            <p className="font-mono text-sm tracking-wide text-[#a9adb6]">PDF drag &amp; drop karo</p>
            <p className="mt-1 font-mono text-[11px] text-[#7a7f8a]">ya click karo to browse (max 10MB)</p>
          </>
        )}
      </div>

      {/* Upload Progress */}
      {files.length > 0 && (
        <div className="mb-8 flex flex-col gap-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between border border-[#26282e] bg-[#0c0d10] px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText size={15} className="text-[#7a7f8a]" />
                <span className="font-mono text-[12px] text-[#a9adb6]">{file.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (
                  <>
                    <Loader2 size={13} className="animate-spin text-[#7a7f8a]" />
                    <span className="font-mono text-[10px] tracking-wider text-[#7a7f8a]">UPLOADING</span>
                  </>
                )}
                {file.status === 'success' && (
                  <>
                    <CheckCircle size={13} className="text-[#4caf6e]" />
                    <span className="font-mono text-[10px] tracking-wider text-[#4caf6e]">DONE</span>
                  </>
                )}
                {file.status === 'error' && (
                  <>
                    <XCircle size={13} className="text-[#e5484d]" />
                    <span className="font-mono text-[10px] tracking-wider text-[#e5484d]">{file.message?.toUpperCase()}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <div>
          <div className="mb-4 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">
            UPLOADED DOCUMENTS ({documents.length})
          </div>
          <div className="flex flex-col gap-0 divide-y divide-[#26282e] border border-[#26282e]">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-[#0c0d10] px-4 py-3.5 transition-colors hover:bg-[#0f1012]">
                <div className="flex items-center gap-3">
                  <FileText size={15} className="text-[#7a7f8a]" />
                  <div>
                    <p className="text-sm text-[#e8e9eb]">{doc.filename}</p>
                    <p className="font-mono text-[10px] text-[#7a7f8a]">
                      {new Date(doc.created_at).toLocaleDateString('en-IN')}
                      <span className="mx-2 opacity-40">·</span>
                      {doc.doc_type.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {doc.status === 'pending' && (
                    <button
                      onClick={() => processDocument(doc.id)}
                      className="border border-[#26282e] bg-transparent px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-[#a9adb6] transition-colors hover:border-[#ff6a1a] hover:text-[#ff6a1a]"
                    >
                      PROCESS
                    </button>
                  )}
                  {doc.status === 'processing' && (
                    <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-[#ff6a1a]">
                      <Loader2 size={11} className="animate-spin" />
                      PROCESSING
                    </span>
                  )}
                  {doc.status === 'indexed' && (
                    <span className="font-mono text-[10px] tracking-wider text-[#4caf6e]">
                      ✓ INDEXED · {doc.chunk_count} CHUNKS
                    </span>
                  )}
                  {doc.status === 'failed' && (
                    <span className="font-mono text-[10px] tracking-wider text-[#e5484d]">FAILED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && files.length === 0 && (
        <p className="mt-4 text-center font-mono text-[11px] tracking-wider text-[#7a7f8a]">
          NO DOCUMENTS — UPLOAD YOUR FIRST PDF
        </p>
      )}
    </div>
  )
}