'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, FileText } from 'lucide-react'

interface Source { page_number: number; similarity: number; preview: string }
interface Message { role: 'user' | 'assistant'; content: string; sources?: Source[]; id: string }

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
      if (idx >= fullText.length) { setDisplayed(fullText); setDone(true); clearInterval(id) }
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
      className="inline-block ml-0.5 w-[2px] h-[1em] bg-[#ff6a1a] align-middle"
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
          className="h-1.5 w-1.5 bg-[#ff6a1a]"
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
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
      <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center border ${
        isUser ? 'border-[#ff6a1a]/40 bg-[#ff6a1a]/10' : 'border-[#26282e] bg-[#0c0d10]'
      }`}>
        {isUser
          ? <User size={13} className="text-[#ff6a1a]" />
          : <Bot size={13} className="text-[#7a7f8a]" />
        }
      </div>

      {/* Bubble + citations */}
      <div className={`flex max-w-[75%] flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`border px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'border-[#ff6a1a]/20 bg-[#ff6a1a]/[0.07] text-[#e8e9eb]'
            : 'border-[#26282e] bg-[#0c0d10] text-[#a9adb6]'
        }`}>
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
                  <span
                    className="inline-flex items-center gap-1.5 border border-[#26282e] bg-[#0c0d10] px-2 py-1 font-mono text-[10px] tracking-wider text-[#7a7f8a]"
                    title={s.preview}
                  >
                    <FileText size={9} />
                    PG.{s.page_number} · {s.similarity}% MATCH
                  </span>
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
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
      {/* Page header */}
      <div className="mb-6 border-b border-[#26282e] pb-4">
        <div className="mb-1 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">MODULE · AI CHAT</div>
        <h2 className="text-2xl font-medium text-[#e8e9eb]">AI Chat</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto border border-[#26282e] bg-[#0c0d10] p-6 mb-4 flex flex-col gap-5">
        {/* Empty state */}
        <AnimatePresence>
          {messages.length === 0 && !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center select-none py-20"
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-5"
              >
                <Bot size={40} className="text-[#26282e]" strokeWidth={1} />
              </motion.div>
              <p className="font-mono text-sm tracking-[0.1em] text-[#a9adb6]">UNIFIEDOPS BRAIN</p>
              <p className="mt-2 font-mono text-[11px] text-[#7a7f8a]">
                Apne documents ke baare mein kuch bhi pucho
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message list */}
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} isLatestAI={msg.id === latestAIId} />
          ))}
        </AnimatePresence>

        {/* AI thinking indicator */}
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
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center border border-[#26282e] bg-[#0c0d10]">
                <Bot size={13} className="text-[#7a7f8a]" />
              </div>
              <div className="border border-[#26282e] bg-[#0c0d10] px-4 py-3">
                <ThinkingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex gap-0 border border-[#26282e]">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Kuch bhi pucho apne documents ke baare mein..."
          disabled={loading}
          className="flex-1 bg-[#0c0d10] px-4 py-3 font-mono text-sm text-[#e8e9eb] placeholder:text-[#3a3d45] focus:outline-none disabled:opacity-50"
        />
        <motion.button
          animate={sendPulse ? { scale: 0.92 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="border-l border-[#26282e] bg-[#0c0d10] px-4 text-[#7a7f8a] transition-colors hover:bg-[#ff6a1a]/10 hover:text-[#ff6a1a] disabled:opacity-30"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </motion.button>
      </div>
    </div>
  )
}