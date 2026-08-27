const rateLimit = new Map();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
}

function isSpam({ nombre, email, telefono, mensaje }) {
  const text = `${nombre} ${email} ${telefono} ${mensaje}`.toLowerCase();

  // El formulario es para solicitudes inmobiliarias normales; los enlaces suelen ser spam.
  const urls = text.match(/https?:\/\/|www\.|\.ru\b|\.xyz\b|\.top\b/g) || [];
  if (urls.length >= 2) return true;

  // Patrones habituales de mensajes automatizados.
  const spamPatterns = [
    /backlinks?/i,
    /guest\s*post/i,
    /seo\s+(service|services|agency|expert)/i,
    /casino|gambling|betting/i,
    /viagra|cialis/i,
    /crypto\s+(investment|trading)/i,
    /telegram\s+(channel|group)/i,
    /increase\s+(your\s+)?traffic/i,
    /buy\s+(followers|likes|views)/i
  ];
  if (spamPatterns.some(pattern => pattern.test(text))) return true;

  // Evita payloads anormalmente grandes.
  if (String(nombre).length > 100 || String(email).length > 160 || String(telefono).length > 40 || String(mensaje).length > 3000) {
    return true;
  }

  return false;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now - entry.start >= WINDOW_MS) {
    rateLimit.set(ip, { start: now, count: 1 });
    return true;
  }

  entry.count += 1;
  return entry.count <= MAX_REQUESTS;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      res.setHeader('Retry-After', '3600');
      return res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' });
    }

    const { nombre, email, telefono, mensaje, privacidad } = req.body || {};

    if (!nombre || !email || !telefono || !mensaje || !privacidad) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: 'El email no es válido.' });
    }

    if (isSpam({ nombre, email, telefono, mensaje })) {
      console.warn('Spam bloqueado:', { ip, email });
      // No damos una pista útil al bot sobre qué regla lo ha bloqueado.
      return res.status(200).json({ ok: true });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('Falta RESEND_API_KEY');
      return res.status(500).json({ error: 'El servicio de contacto no está configurado.' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'MP Mallén <onboarding@resend.dev>',
        to: ['gestion@modproyect.com'],
        reply_to: email,
        subject: `Nueva solicitud de información — ${nombre}`,
        text: [
          'Nueva solicitud desde mpmallen.es',
          '',
          `Nombre: ${nombre}`,
          `Email: ${email}`,
          `Teléfono: ${telefono}`,
          '',
          'Mensaje:',
          mensaje
        ].join('\n')
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return res.status(502).json({ error: 'No se ha podido enviar la solicitud.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Error interno al enviar la solicitud.' });
  }
}
