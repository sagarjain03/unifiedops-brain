import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/db'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret missing', { status: 400 })
  }

  // Headers verify karo
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    return new Response('Invalid webhook', { status: 400 })
  }

  // User create hone pe Supabase mein save karo
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data

    await supabaseAdmin.from('users').insert({
      clerk_id: id,
      email: email_addresses[0].email_address,
      name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
      role: 'engineer',
    })
  }

  return new Response('OK', { status: 200 })
}