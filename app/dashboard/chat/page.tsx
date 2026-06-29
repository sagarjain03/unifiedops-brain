'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Bot, User, FileText } from 'lucide-react'

interface Source {
  page_number: number
  similarity: number
  preview: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSessionId(data.session_id)
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            sources: data.sources,
          },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Error: ' + data.error },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">AI Chat</h2>

      {/* Messages */}
      <Card className="flex-1 overflow-y-auto p-6 mb-4 flex flex-col gap-6">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Bot size={48} className="mb-4 text-blue-300" />
            <p className="text-lg font-medium">UnifiedOps Brain</p>
            <p className="text-sm">Apne documents ke baare mein kuch bhi pucho</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'
            }`}>
              {msg.role === 'user'
                ? <User size={16} className="text-white" />
                : <Bot size={16} className="text-white" />
              }
            </div>

            {/* Message */}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                {msg.content}
              </div>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.sources.map((s, j) => (
                    <Badge
                      key={j}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                      title={s.preview}
                    >
                      <FileText size={10} />
                      Page {s.page_number} · {s.similarity}% match
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4">
              <Loader2 size={16} className="animate-spin text-slate-500" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </Card>

      {/* Input */}
      <div className="flex gap-3">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Kuch bhi pucho apne documents ke baare mein..."
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading
            ? <Loader2 size={16} className="animate-spin" />
            : <Send size={16} />
          }
        </Button>
      </div>
    </div>
  )
}