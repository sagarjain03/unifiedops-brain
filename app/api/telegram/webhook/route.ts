import { NextRequest, NextResponse } from 'next/server'
import { searchSimilarChunks } from '@/lib/search'
import { groq, GROQ_MODEL } from '@/lib/groq'
import { supabaseAdmin } from '@/lib/db'

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

async function sendMessage(chatId: number, text: string) {
  console.log(`[Telegram] Sending message to chatId ${chatId}:`, text)
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id:    chatId,
      text,
      parse_mode: 'Markdown',
    }),
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Telegram sendMessage failed with status ${res.status}: ${errorText}`)
  }
  console.log(`[Telegram] Message sent successfully to ${chatId}`)
}

async function sendTyping(chatId: number) {
  const res = await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  })
  if (!res.ok) {
    const errorText = await res.text()
    console.warn(`[Telegram] sendChatAction failed with status ${res.status}: ${errorText}`)
  }
}

export async function POST(req: NextRequest) {
  console.log('TELEGRAM WEBHOOK HIT', new Date().toISOString())
  try {
    const body = await req.json()
    console.log('Telegram webhook body:', JSON.stringify(body, null, 2))
    const message = body?.message
    if (!message) {
      console.log('Telegram webhook: No message object in request body')
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text   = message.text?.trim()

    if (!text) {
      console.log('Telegram webhook: Empty text or non-text message type')
      return NextResponse.json({ ok: true })
    }

    // /start command
    if (text === '/start') {
      await sendMessage(chatId, `🧠 *UnifiedOps Brain Bot*\n\nNamaste! Main aapke industrial documents ke baare mein sawaal ka jawab de sakta hoon.\n\nBas apna sawaal Hindi ya English mein type karo!\n\n_Example: "Pump P-204 ka pressure limit kya hai?"_`)
      return NextResponse.json({ ok: true })
    }

    // /help command
    if (text === '/help') {
      await sendMessage(chatId, `*Kya pooch sakte ho:*\n\n• Machine ya equipment ke baare mein\n• Maintenance procedures\n• Safety regulations\n• Past failures aur fixes\n• Compliance requirements\n\nBas sawaal type karo — main documents search karke jawab dunga! 🔍`)
      return NextResponse.json({ ok: true })
    }

    // Show typing indicator
    await sendTyping(chatId)

    // Check karo ki koi documents indexed hain
    const { count } = await supabaseAdmin
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })

    if (!count || count === 0) {
      await sendMessage(chatId, '⚠️ Koi documents indexed nahi hain abhi. Pehle UnifiedOps Brain web app pe documents upload aur process karo.')
      return NextResponse.json({ ok: true })
    }

    // Vector search
    const chunks = await searchSimilarChunks(text, 5)

    const context = chunks.length > 0
      ? chunks.map((c, i) => `[Source ${i + 1} - Page ${c.page_number}]:\n${c.content}`).join('\n\n')
      : 'No relevant documents found.'

    // Groq se answer lo
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role:    'system',
          content: `You are UnifiedOps Brain, an AI assistant for industrial operations.
Answer questions based ONLY on the provided document context.
Always cite your sources like "Source 1, Page 3 ke according..."
If the answer is not in the context, say "Main is baare mein documents mein koi information nahi paa saka."
Keep answers concise and clear. You can respond in Hindi or English based on the question language.
Format your response for Telegram (use *bold* for important terms, avoid complex markdown).`,
        },
        {
          role:    'user',
          content: `Context:\n${context}\n\nSawaal: ${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens:  600,
    })

    const answer = completion.choices[0].message.content || 'Koi jawab nahi mila.'

    // Citation footer add karo
    const citations = chunks.length > 0
      ? '\n\n📄 _Sources: ' + chunks.map(c => `Page ${c.page_number}`).join(', ') + '_'
      : ''

    await sendMessage(chatId, answer + citations)

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}

// GET request to verify webhook is alive
export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook active' })
}