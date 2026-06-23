const https = require('https');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  try {
    const { pdfBase64, nombre, whatsapp, email_rep, ciudad, canal, opcion, metodo_pago, fecha_firma, instagram } = JSON.parse(event.body);

    const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_j3dk59XW_Df3ZQGKW4rFSNwaHMjXH5FTy';

    // Build email payload
    const emailPayload = {
      from: 'NextGen BioLabs <onboarding@resend.dev>',
      to: ['nextgenbiolabs@gmail.com'],
      subject: `CONTRATO FIRMADO — ${nombre} — ${fecha_firma}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#060610;padding:20px;text-align:center;border-bottom:3px solid #E8B82A">
            <h1 style="color:#E8B82A;margin:0;font-size:20px;letter-spacing:2px">CONTRATO FIRMADO</h1>
            <p style="color:#aaa;margin:4px 0 0;font-size:12px">NextGen BioLabs · ${fecha_firma}</p>
          </div>
          <div style="padding:20px;background:#f9f9f9">
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#555;width:130px"><b>Nombre</b></td><td style="padding:6px 0"><b>${nombre}</b></td></tr>
              <tr><td style="padding:6px 0;color:#555">WhatsApp</td><td style="padding:6px 0">${whatsapp}</td></tr>
              <tr><td style="padding:6px 0;color:#555">Email</td><td style="padding:6px 0">${email_rep}</td></tr>
              <tr><td style="padding:6px 0;color:#555">Instagram</td><td style="padding:6px 0">${instagram || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#555">Ciudad</td><td style="padding:6px 0">${ciudad}</td></tr>
              <tr><td style="padding:6px 0;color:#555">Canal</td><td style="padding:6px 0">${canal}</td></tr>
              <tr><td style="padding:6px 0;color:#555">Comisión</td><td style="padding:6px 0;color:#C8960A"><b>${opcion}</b></td></tr>
              <tr><td style="padding:6px 0;color:#555">Pago</td><td style="padding:6px 0">${metodo_pago} — cada sábado</td></tr>
            </table>
          </div>
          <div style="padding:12px 20px;background:#060610;text-align:center">
            <p style="color:#888;font-size:10px;margin:0">El contrato firmado está adjunto a este email como PDF</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Contrato_${nombre.replace(/[^a-zA-Z0-9_]/g,'_')}_${fecha_firma.replace(/[^a-zA-Z0-9]/g,'_')}.pdf`,
          content: pdfBase64,
        }
      ]
    };

    // Call Resend API
    const result = await new Promise((resolve, reject) => {
      const data = JSON.stringify(emailPayload);
      const options = {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });

    if (result.status >= 200 && result.status < 300) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } else {
      throw new Error(`Resend error ${result.status}: ${result.body}`);
    }

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
