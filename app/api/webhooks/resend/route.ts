import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs'; // svix vajab Node runtime'i, mitte Edge'i
export const dynamic = 'force-dynamic';

interface ResendWebhookEvent {
  type: string; // 'email.sent', 'email.delivered', 'email.bounced', 'email.complained', 'email.opened', 'email.clicked'
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[] | string;
    subject?: string;
    tags?: Array<{ name: string; value: string }> | Record<string, string>;
    bounce?: {
      type?: string; // 'hard' | 'soft' | 'undetermined'
      message?: string;
      subType?: string;
    };
    [key: string]: unknown;
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret || secret === 'your_resend_webhook_secret') {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  // 1. Loe raw body — svix vajab täpset stringi (mitte parsitud JSONi)
  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  };

  // 2. Verifitseeri allkiri
  let evt: ResendWebhookEvent;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, headers) as ResendWebhookEvent;
  } catch (err) {
    console.error('[resend-webhook] Signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Ekstrahti võtmeväljad
  const { type, data } = evt;
  const toArray = Array.isArray(data.to)
    ? data.to
    : typeof data.to === 'string'
    ? [data.to]
    : [];
  const email = toArray[0] ?? null;
  const resendEmailId = typeof data.email_id === 'string' ? data.email_id : null;
  const subject = typeof data.subject === 'string' ? data.subject : null;
  const tags = data.tags ?? null;

  // 4. Logi sündmus alati (audit trail)
  const eventType = type.replace(/^email\./, ''); // 'email.bounced' → 'bounced'
  const { error: logErr } = await supabaseAdmin.from('email_events').insert({
    resend_email_id: resendEmailId,
    event_type: eventType,
    email,
    subject,
    tags,
    payload: evt as unknown as Record<string, unknown>,
  });
  if (logErr) {
    console.error('[resend-webhook] Failed to log event', logErr);
    // Ei breikime — proovime ikka suppression updates'iga edasi
  }

  // 5. Hard bounce → suppression list
  if (type === 'email.bounced' && email) {
    const bounceType =
      typeof data.bounce?.type === 'string'
        ? data.bounce.type.toLowerCase()
        : 'unknown';

    if (bounceType === 'hard') {
      const { error: supErr } = await supabaseAdmin
        .from('email_suppressions')
        .upsert(
          {
            email: email.toLowerCase(),
            reason: 'bounced',
            bounce_type: 'hard',
            resend_email_id: resendEmailId,
            metadata: { bounce: data.bounce ?? null },
          },
          { onConflict: 'email' }
        );
      if (supErr) {
        console.error('[resend-webhook] Failed to upsert bounce suppression', supErr);
      } else {
        console.log(`[resend-webhook] Suppressed (hard bounce): ${email}`);
      }
    } else {
      console.log(`[resend-webhook] Soft/unknown bounce ignored: ${email} (${bounceType})`);
    }
  }

  // 6. Spam complaint → suppression list (ALATI, sõltumata bounce tüübist)
  if (type === 'email.complained' && email) {
    const { error: supErr } = await supabaseAdmin
      .from('email_suppressions')
      .upsert(
        {
          email: email.toLowerCase(),
          reason: 'complained',
          resend_email_id: resendEmailId,
          metadata: data as unknown as Record<string, unknown>,
        },
        { onConflict: 'email' }
      );
    if (supErr) {
      console.error('[resend-webhook] Failed to upsert complaint suppression', supErr);
    } else {
      console.log(`[resend-webhook] Suppressed (complaint): ${email}`);
    }
  }

  return NextResponse.json({ received: true });
}