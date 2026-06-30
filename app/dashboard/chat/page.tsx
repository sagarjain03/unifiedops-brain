'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Bot, User, FileText } from 'lucide-react'

interface Source { page_number: number; similarity: number; preview: string }
interface Message { role: 'user' | 'assistant'; content: string; sources?: Source[]; id: string }

// ── Shared panel style — pure neutral, no hue ─────────────────────────────
const glass: React.CSSProperties = {
  background: 'hsl(0 0% 8% / 0.9)',
  border: '1px solid hsl(0 0% 16% / 0.7)',
  backdropFilter: 'blur(12px)',
  borderRadius: '1rem',
}

// ── Typewriter hook ───────────────────────────────────────────────────────
function useTypewriter(fullText: string, active: boolean, chunkSize = 3, intervalMs = 18) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!active) { setDisplayed(fullText); setDone(true); return }
    setDisplayed('')
    setDone(false)
    let idx = 0
    const id = setInterval(() => {
      idx += chunkSize
      setDisplayed(fullText.slice(0, idx))
      if (idx >= fullText.length) {
        setDisplayed(fullText)
        setDone(true)
        clearInterval(id)
      }
    }, intervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullText, active])

  return { displayed, done }
}

// ── Blinking cursor ────────────────────────────────────────────────────────
function Cursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      className="inline-block ml-0.5 w-[2px] h-[1em] bg-white/60 align-middle"
    />
  )
}

// ── Three-dot loading indicator ────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-white/35"
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ── Single message bubble ──────────────────────────────────────────────────
function MessageBubble({ msg, isLatestAI }: { msg: Message; isLatestAI: boolean }) {
  const isUser = msg.role === 'user'
  const { displayed, done } = useTypewriter(msg.content, isLatestAI && !isUser)

  const text = isLatestAI && !isUser ? displayed : msg.content

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
        style={{ background: isUser ? 'hsl(0 0% 28%)' : 'hsl(0 0% 18%)' }}
      >
        {isUser ? <User size={15} className="text-white" /> : <Bot size={15} className="text-white" />}
      </div>

      {/* Bubble + citations */}
      <div className={`max-w-[75%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="p-4 text-sm leading-relaxed"
          style={{
            borderRadius: isUser ? '1rem 0.25rem 1rem 1rem' : '0.25rem 1rem 1rem 1rem',
            background: isUser ? 'hsl(0 0% 18%)' : 'hsl(0 0% 12%)',
            color: 'hsl(0 0% 90%)',
            border: '1px solid hsl(0 0% 18%)',
          }}
        >
          <span>{text}</span>
          {isLatestAI && !isUser && !done && <Cursor />}
        </div>

        {/* Citation badges — stagger in after typing is done */}
        <AnimatePresence>
          {done && msg.sources && msg.sources.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
              }}
            >
              {msg.sources.map((s, j) => (
                <motion.div
                  key={j}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
                  }}
                >
                  <Badge
                    variant="outline"
                    className="text-xs flex items-center gap-1 border-[hsl(0_0%_22%)] text-[hsl(0_0%_48%)] cursor-default"
                    title={s.preview}
                  >
                    <FileText size={10} />
                    Page {s.page_number} · {s.similarity}% match
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sendPulse, setSendPulse] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Smooth scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return
    const userMessage = input.trim()

    // Send button pulse
    setSendPulse(true)
    setTimeout(() => setSendPulse(false), 200)

    setInput('')
    const uid = crypto.randomUUID()
    setMessages(prev => [...prev, { role: 'user', content: userMessage, id: uid }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, session_id: sessionId }),
      })
      const data = await res.json()
      const aid = crypto.randomUUID()
      if (res.ok) {
        setSessionId(data.session_id)
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer, sources: data.sources, id: aid }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + data.error, id: aid }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.', id: crypto.randomUUID() }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, sessionId])

  const latestAIId = [...messages].reverse().find(m => m.role === 'assistant')?.id

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h2 className="text-2xl font-bold text-white mb-6">AI Chat</h2>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 mb-4 flex flex-col gap-6" style={glass}>

        {/* ── Empty state ── */}
        <AnimatePresence>
          {messages.length === 0 && !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center select-none"
            >
              {/* Floating bot icon */}
              <motion.div
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-5"
              >
                <Bot size={52} style={{ color: 'hsl(0 0% 36%)' }} />
              </motion.div>
              <p className="text-lg font-medium text-white/75">UnifiedOps Brain</p>
              <p className="text-sm mt-1.5" style={{ color: 'hsl(0 0% 40%)' }}>
                Apne documents ke baare mein kuch bhi pucho
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Message list ── */}
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isLatestAI={msg.id === latestAIId}
            />
          ))}
        </AnimatePresence>

        {/* ── AI thinking indicator ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.25 }}
              className="flex gap-3"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                style={{ background: 'hsl(0 0% 18%)' }}
              >
                <Bot size={15} className="text-white" />
              </div>
              <div
                className="px-5 py-3"
                style={{
                  borderRadius: '0.25rem 1rem 1rem 1rem',
                  background: 'hsl(0 0% 12%)',
                  border: '1px solid hsl(0 0% 18%)',
                }}
              >
                <ThinkingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="flex gap-3">
        <Input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Kuch bhi pucho apne documents ke baare mein..."
          disabled={loading}
          className={[
            'flex-1 text-white transition-all duration-200',
            'bg-[hsl(0_0%_8%)]',
            'border-[hsl(0_0%_20%)]',
            'placeholder:text-[hsl(0_0%_32%)]',
            // neutral focus ring — no blue
            'focus-visible:ring-1',
            'focus-visible:ring-[hsl(0_0%_35%)]',
            'focus-visible:border-[hsl(0_0%_35%)]',
          ].join(' ')}
        />

        <motion.div
          animate={sendPulse ? { scale: 0.88 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
        >
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-[hsl(0_0%_20%)] hover:bg-[hsl(0_0%_26%)] text-white border-none transition-colors"
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />
            }
          </Button>
        </motion.div>
      </div>
    </div>
  )
}