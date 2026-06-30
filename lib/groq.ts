import Groq from 'groq-sdk'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

// Text generation model
export const GROQ_MODEL = 'llama-3.3-70b-versatile'

// Vision model for OCR (image understanding)
// meta-llama/llama-4-scout-17b-16e-instruct replaced deprecated llava + llama-3.2-vision
// Verified active on GroqCloud as of 2026 — check https://console.groq.com/docs/models for updates
export const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'