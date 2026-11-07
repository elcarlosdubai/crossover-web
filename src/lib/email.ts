import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "premium239.web-hosting.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "465");
const smtpUser = process.env.SMTP_USER || "info@crossoverrd.com";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || `"Centro Educativo Crossover" <info@crossoverrd.com>`;

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export interface SendEmailPayload {
  to: string;
  subject: string;
  nombre: string;
  curso: string;
  horario: string;
  customHtml?: string;
}

export function generarHtmlInscripcion({
  nombre,
  curso,
  horario,
}: {
  nombre: string;
  curso: string;
  horario: string;
}) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Solicitud - Crossover</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 40px 10px;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
            <tr>
              <td style="background-color: #990000; padding: 28px 32px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
                  Centro Educativo Crossover
                </h1>
                <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 12px; font-weight: 500;">
                  Capacitación Técnica & Formación Continua
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 36px 32px 24px;">
                <p style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #111827;">
                  ¡Hola, ${nombre}! 👋
                </p>
                <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #4b5563;">
                  Hemos recibido formalmente tu solicitud de pre-inscripción en nuestra plataforma web. Tu plaza preliminar ha sido reservada en el sistema.
                </p>

                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding: 6px 0; font-size: 13px; color: #6b7280; font-weight: 600;">Programa / Curso:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; color: #111827; font-weight: 800;">${curso}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 13px; color: #6b7280; font-weight: 600;">Horario Elegido:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; color: #111827; font-weight: 800;">${horario}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 13px; color: #6b7280; font-weight: 600;">Sede Presencial:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; color: #111827; font-weight: 800;">Herrera, Av. Las Palmas #58</td>
                    </tr>
                  </table>
                </div>

                <p style="margin: 0 0 28px; font-size: 13px; line-height: 1.6; color: #4b5563;">
                  Un asesor de admisiones te contactará en breve vía llamada o WhatsApp para coordinar los detalles de formalización y entrega de credenciales.
                </p>

                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <a href="https://wa.me/18099220880?text=Hola,%20acabo%20de%20preinscribirme%20en%20${encodeURIComponent(curso)}" target="_blank" style="display: inline-block; background-color: #990000; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 14px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                        Confirmar Cupo vía WhatsApp
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color: #fafafa; border-top: 1px solid #e5e7eb; padding: 24px 32px; text-align: center;">
                <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #374151;">
                  Centro Educativo Crossover
                </p>
                <p style="margin: 0 0 6px; font-size: 11px; color: #9ca3af;">
                  Av. Las Palmas #58, esquina Calle 4, Herrera • Santo Domingo Oeste
                </p>
                <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                  Teléfono: (809) 922-0880 • info@crossoverrd.com • www.crossoverrd.com
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export async function enviarEmailConfirmacion({
  to,
  subject,
  nombre,
  curso,
  horario,
  customHtml,
}: SendEmailPayload) {
  try {
    const html = customHtml
      ? customHtml
      : generarHtmlInscripcion({ nombre, curso, horario });

    const info = await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error al enviar email via SMTP:", error);
    return { success: false, error: error.message };
  }
}
