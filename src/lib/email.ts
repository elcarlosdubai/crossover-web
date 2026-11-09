import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "premium239.web-hosting.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "465");
const smtpUser = process.env.SMTP_USER || "info@crossoverrd.com";
const smtpPass = process.env.SMTP_PASS || "Crossover*2026#Secure!";
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
  customText?: string;
}

/**
 * Convierte cualquier HTML en texto plano limpio para los clientes de correo que no usan HTML
 * (Obligatorio para que los filtros antispam de Google verifiquen coherencia MIME multipart/alternative).
 */
function extraerTextoPlano(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<[^>]+>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

export function generarTextoPlanoInscripcion({
  nombre,
  curso,
  horario,
}: {
  nombre: string;
  curso: string;
  horario: string;
}) {
  return `Centro Educativo Crossover
Trasciende con los mejores

¡Hola, ${nombre}!

Hemos recibido formalmente tu solicitud de pre-inscripción en nuestra plataforma web. Tu plaza preliminar ha sido reservada en el sistema.

Detalles de tu Solicitud:
- Programa / Curso: ${curso}
- Horario Elegido: ${horario}
- Sede Presencial: Av. Las Palmas #58, Herrera, Santo Domingo Oeste, RD.

Un asesor de admisiones te contactará en breve vía llamada o correo institucional para coordinar los detalles de formalización y entrega de credenciales estudiantiles.

--
Centro Educativo Crossover
Av. Las Palmas #58, Herrera, Santo Domingo Oeste, RD
Teléfono: (809) 922-0880 • info@crossoverrd.com • www.crossoverrd.com`;
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
              <td style="background-color: #990000; padding: 32px 32px 24px; text-align: center;">
                <img 
                  src="https://www.crossoverrd.com/blanco.png" 
                  alt="Centro Educativo Crossover" 
                  width="170" 
                  style="display: block; margin: 0 auto 12px; max-width: 170px; height: auto; border: 0;"
                />
                <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                  Trasciende con los mejores
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 36px 32px 28px;">
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
                      <td align="right" style="padding: 6px 0; font-size: 13px; color: #111827; font-weight: 800;">Av. Las Palmas #58, Herrera, Santo Domingo Oeste, RD</td>
                    </tr>
                  </table>
                </div>

                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4b5563;">
                  Un asesor de admisiones te contactará en breve vía llamada o correo institucional para coordinar los detalles de formalización y entrega de credenciales estudiantiles.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background-color: #fafafa; border-top: 1px solid #e5e7eb; padding: 24px 32px; text-align: center;">
                <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #374151;">
                  Centro Educativo Crossover
                </p>
                <p style="margin: 0 0 6px; font-size: 11px; color: #9ca3af;">
                  Av. Las Palmas #58, Herrera, Santo Domingo Oeste, RD
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

export function generarHtmlBienvenidaUsuario({
  nombre,
  username,
  password,
  rol,
}: {
  nombre: string;
  username: string;
  password?: string;
  rol: string;
}) {
  const passwordText = password || "Crossover*2026!";
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <title>Bienvenido al Sistema de Gestión — Crossover</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
            <tr>
              <td style="background-color: #990000; padding: 36px 32px; text-align: center;">
                <img src="https://www.crossoverrd.com/blanco.png" alt="Centro Educativo Crossover" width="180" style="display: block; margin: 0 auto 12px; border: 0;" />
                <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                  Portal de Gestión Institucional
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 36px 32px; color: #1f2937;">
                <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  ¡Hola, ${nombre}! 👋
                </h1>
                <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4b5563;">
                  Se ha creado exitosamente tu cuenta de acceso para el personal administrativo y académico de <strong>Centro Educativo Crossover</strong>.
                </p>

                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px; margin: 24px 0;">
                  <h3 style="margin: 0 0 14px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #990000;">
                    Tus Credenciales de Acceso
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280; width: 140px;">Usuario de acceso:</td>
                      <td style="padding: 6px 0; font-weight: 800; color: #111827; font-family: monospace; font-size: 15px;">@${username}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280;">Contraseña inicial:</td>
                      <td style="padding: 6px 0; font-weight: 800; color: #111827; font-family: monospace; font-size: 15px;">${passwordText}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280;">Rol en el sistema:</td>
                      <td style="padding: 6px 0; font-weight: 700; color: #990000; text-transform: capitalize;">${rol}</td>
                    </tr>
                  </table>
                </div>

                <div style="text-align: center; margin: 32px 0 20px;">
                  <a href="https://www.crossoverrd.com/admin" style="display: inline-block; background-color: #990000; color: #ffffff; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(153, 0, 0, 0.3);">
                    Ingresar al Sistema
                  </a>
                </div>

                <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                  🔒 Por seguridad, te recomendamos cambiar tu contraseña una vez hayas ingresado al portal.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #fafafa; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                  Centro Educativo Crossover • Av. Las Palmas #58, Herrera • Tel: (809) 922-0880
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

export function generarHtmlRecuperarPassword({
  nombre,
  username,
  resetUrl,
}: {
  nombre: string;
  username: string;
  resetUrl: string;
}) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <title>Recuperación de Contraseña — Crossover</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
            <tr>
              <td style="background-color: #990000; padding: 36px 32px; text-align: center;">
                <img src="https://www.crossoverrd.com/blanco.png" alt="Centro Educativo Crossover" width="180" style="display: block; margin: 0 auto 12px; border: 0;" />
                <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                  Recuperación de Contraseña
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 36px 32px; color: #1f2937;">
                <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  Hola, ${nombre}
                </h1>
                <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4b5563;">
                  Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de acceso (<strong style="font-family: monospace;">@${username}</strong>).
                </p>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background-color: #990000; color: #ffffff; padding: 15px 36px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(153, 0, 0, 0.3);">
                    Restablecer Mi Contraseña
                  </a>
                </div>

                <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.5; color: #6b7280; text-align: center;">
                  ⏳ <strong>Este enlace es seguro y caduca en 60 minutos.</strong>
                </p>
                <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                  Si tú no solicitaste este cambio, puedes ignorar este mensaje con tranquilidad; tu contraseña actual continuará siendo la misma.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #fafafa; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                  Centro Educativo Crossover • Av. Las Palmas #58, Herrera • Tel: (809) 922-0880
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
  customText,
}: SendEmailPayload) {
  try {
    const html = customHtml
      ? customHtml
      : generarHtmlInscripcion({ nombre, curso, horario });

    const text = customText
      ? customText
      : customHtml
      ? extraerTextoPlano(customHtml)
      : generarTextoPlanoInscripcion({ nombre, curso, horario });

    const messageIdDomain = "crossoverrd.com";
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 10);
    const customMessageId = `<crossover-${timestamp}-${randomHex}@${messageIdDomain}>`;

    const info = await transporter.sendMail({
      from: `"Centro Educativo Crossover" <info@crossoverrd.com>`,
      to,
      replyTo: "info@crossoverrd.com",
      subject,
      text, // VERSIÓN TEXTO PLANO OBLIGATORIA PARA MÁXIMA ENTREGABILIDAD
      html, // VERSIÓN HTML CORPORATIVA
      messageId: customMessageId,
      headers: {
        "X-Mailer": "Crossover Education Mail Engine 2026",
        "X-Entity-Ref-ID": `CR-${timestamp}`,
        "Auto-Submitted": "auto-generated",
        "List-Unsubscribe": "<mailto:info@crossoverrd.com?subject=unsubscribe>",
      },
    });

    console.log(`[Email Transaccional Entregado]: ${to} -> ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error al enviar email via SMTP:", error);
    return { success: false, error: error.message };
  }
}
