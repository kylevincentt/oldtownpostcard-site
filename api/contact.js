// Vercel serverless function: POST /api/contact
// Receives a contact-form submission and forwards it as an email.
// Provider: Resend (primary) — set RESEND_API_KEY in Vercel env.
//   Optional: CONTACT_FROM_EMAIL (default: "Old Town Postcard <onboarding@resend.dev>")
//   Optional: CONTACT_TO_EMAIL   (default: "kylevcrum@gmail.com")
// Falls back to a clear "service not configured" error response if the key is missing.

const TO_EMAIL_DEFAULT = 'kylevcrum@gmail.com';
const FROM_EMAIL_DEFAULT = 'Old Town Postcard <onboarding@resend.dev>';

function isEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;
}
function clip(s, n) {
  if (typeof s !== 'string') return '';
  return s.length > n ? s.slice(0, n) : s;
}
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]);
  });
}

async function readJsonBody(req) {
  // Vercel parses JSON bodies for us when Content-Type is application/json,
  // but parse defensively in case it's a string.
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = '';
  if (typeof req.body === 'string') raw = req.body;
  else if (Buffer.isBuffer(req.body)) raw = req.body.toString('utf8');
  else {
    raw = await new Promise(function (resolve, reject) {
      const chunks = [];
      req.on('data', function (c) { chunks.push(c); });
      req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
      req.on('error', reject);
    });
  }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) { return null; }
}

module.exports = async function handler(req, res) {
  // CORS / method gating
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: 'Invalid JSON body' });

  // Honeypot — return 200 silently so bots don't probe
  if (body.website && String(body.website).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const name = clip((body.name || '').trim(), 200);
  const email = clip((body.email || '').trim(), 200);
  const business = clip((body.business || '').trim(), 200);
  const phone = clip((body.phone || '').trim(), 60);
  const category = clip((body.category || '').trim(), 200);
  const message = clip((body.message || '').trim(), 5000);
  const subject = clip((body.subject || 'General inquiry').trim(), 200);
  const plan = clip((body.plan || '').trim(), 200);
  const source = clip((body.source || '').trim(), 80);

  if (!name) return res.status(400).json({ error: 'Name is required.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });
  if (!message) return res.status(400).json({ error: 'Please include a short message.' });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.CONTACT_TO_EMAIL || TO_EMAIL_DEFAULT;
  const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || FROM_EMAIL_DEFAULT;

  const subjectLine = `[Old Town Postcard] ${subject}${business ? ` — ${business}` : ''}`;
  const lines = [
    `Name:     ${name}`,
    `Email:    ${email}`,
    business && `Business: ${business}`,
    phone &&    `Phone:    ${phone}`,
    category && `Interest: ${category}`,
    plan &&     `Plan:     ${plan}`,
    source &&   `Source:   ${source}`,
    '',
    'Message:',
    message,
  ].filter(Boolean);
  const text = lines.join('\n');
  const html = `<div style="font-family:Georgia,serif;line-height:1.5;color:#1a1a1a;">
<p style="margin:0 0 12px"><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
${business ? `<p style="margin:0 0 4px"><strong>Business:</strong> ${escapeHtml(business)}</p>` : ''}
${phone ? `<p style="margin:0 0 4px"><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
${category ? `<p style="margin:0 0 4px"><strong>Interest:</strong> ${escapeHtml(category)}</p>` : ''}
${plan ? `<p style="margin:0 0 4px"><strong>Plan:</strong> ${escapeHtml(plan)}</p>` : ''}
${source ? `<p style="margin:0 0 4px;color:#5a5a5a;font-size:0.9em"><strong>Source:</strong> ${escapeHtml(source)}</p>` : ''}
<hr style="border:none;border-top:1px solid #eee;margin:14px 0">
<div style="white-space:pre-wrap">${escapeHtml(message)}</div>
</div>`;

  if (!RESEND_API_KEY) {
    // No provider configured — log so it shows in Vercel function logs, return clear error.
    console.warn('[contact] RESEND_API_KEY not set. Submission not delivered. Body:\n' + text);
    return res.status(503).json({
      error: 'Email service not configured yet. Please call/text 540-263-2343 or email kylevcrum@gmail.com directly.',
    });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: subjectLine,
        text: text,
        html: html,
      }),
    });
    if (r.ok) {
      return res.status(200).json({ ok: true });
    }
    const detail = await r.text().catch(() => '');
    console.error('[contact] Resend error', r.status, detail);
    return res.status(502).json({ error: 'Email send failed. Please try again or call 540-263-2343.' });
  } catch (e) {
    console.error('[contact] Resend exception', e);
    return res.status(500).json({ error: 'Email send failed. Please try again or call 540-263-2343.' });
  }
};
