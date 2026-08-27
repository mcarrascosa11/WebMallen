export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { nombre, email, telefono, mensaje, privacidad } = req.body || {};

    if (!nombre || !email || !telefono || !mensaje || !privacidad) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: 'El email no es válido.' });
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
