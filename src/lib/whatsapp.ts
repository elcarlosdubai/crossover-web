import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  Browsers,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import path from "path";
import fs from "fs";

// Carpeta donde se almacenan las llaves de sesión
const AUTH_DIR = path.join(process.cwd(), "baileys_auth_info");

export interface WhatsAppStatus {
  status: "disconnected" | "connecting" | "qr_ready" | "connected";
  qrCodeDataUrl: string | null;
  phoneNumber: string | null;
  lastConnected: string | null;
}

// Variables globales para mantener el estado del socket y la cola de goteo serializada
declare global {
  var __crossover_wapi_sock: WASocket | null | undefined;
  var __crossover_wapi_status: WhatsAppStatus | undefined;
  var __crossover_wapi_init_promise: Promise<void> | undefined;
  var __crossover_wapi_mutex_queue: Promise<any> | undefined;
}

const defaultStatus: WhatsAppStatus = {
  status: "disconnected",
  qrCodeDataUrl: null,
  phoneNumber: null,
  lastConnected: null,
};

if (!global.__crossover_wapi_status) {
  global.__crossover_wapi_status = { ...defaultStatus };
}

// Inicializar cola mutex global en memoria si no existe
if (!global.__crossover_wapi_mutex_queue) {
  global.__crossover_wapi_mutex_queue = Promise.resolve();
}

export function getWhatsAppStatus(): WhatsAppStatus {
  return global.__crossover_wapi_status || defaultStatus;
}

/**
 * Inicializa el socket de Baileys
 */
export async function initWhatsAppSocket(): Promise<void> {
  if (global.__crossover_wapi_sock && global.__crossover_wapi_status?.status === "connected") {
    return;
  }

  if (global.__crossover_wapi_init_promise) {
    return global.__crossover_wapi_init_promise;
  }

  global.__crossover_wapi_init_promise = (async () => {
    try {
      if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

      global.__crossover_wapi_status = {
        ...global.__crossover_wapi_status!,
        status: "connecting",
      };

      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Chrome"),
      });

      global.__crossover_wapi_sock = sock;

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        console.log("[Baileys Connection Update]:", { connection, hasQr: !!qr });

        if (qr) {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              width: 280,
              color: {
                dark: "#111827",
                light: "#ffffff",
              },
            });
            global.__crossover_wapi_status = {
              status: "qr_ready",
              qrCodeDataUrl: qrDataUrl,
              phoneNumber: null,
              lastConnected: null,
            };
            console.log("[Baileys]: QR Code generado exitosamente en DataURL.");
          } catch (err) {
            console.error("Error generando QR DataURL:", err);
          }
        }

        if (connection === "close") {
          const error = lastDisconnect?.error as any;
          const statusCode = error?.output?.statusCode;
          console.log("[Baileys Closed Detail]:", { statusCode, message: error?.message, stack: error?.stack });

          // Si el cierre fue para generar el primer QR o un handshake normal de reconexión, mantener el QR visible
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          if (isLoggedOut) {
            global.__crossover_wapi_status = {
              status: "disconnected",
              qrCodeDataUrl: null,
              phoneNumber: null,
              lastConnected: null,
            };
            global.__crossover_wapi_sock = null;
          } else {
            // Reconectar manteniendo el QR anterior si aún no hay uno nuevo
            setTimeout(() => {
              global.__crossover_wapi_init_promise = undefined;
              initWhatsAppSocket();
            }, 3000);
          }
        } else if (connection === "open") {
          const userJid = sock.user?.id || "";
          const phone = userJid.split(":")[0] || userJid.split("@")[0] || "Conectado";

          global.__crossover_wapi_status = {
            status: "connected",
            qrCodeDataUrl: null,
            phoneNumber: phone,
            lastConnected: new Date().toISOString(),
          };
          console.log("[Baileys Connected]: Teléfono conectado exitosamente ->", phone);
        }
      });
    } catch (err) {
      console.error("Error al inicializar Baileys:", err);
      global.__crossover_wapi_status = {
        status: "disconnected",
        qrCodeDataUrl: null,
        phoneNumber: null,
        lastConnected: null,
      };
      global.__crossover_wapi_sock = null;
    } finally {
      global.__crossover_wapi_init_promise = undefined;
    }
  })();

  return global.__crossover_wapi_init_promise;
}

/**
 * Cierra la sesión activa y elimina las credenciales locales
 */
export async function desconectarWhatsApp(): Promise<{ success: boolean }> {
  try {
    if (global.__crossover_wapi_sock) {
      await global.__crossover_wapi_sock.logout().catch(() => {});
      global.__crossover_wapi_sock = null;
    }

    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }

    global.__crossover_wapi_status = { ...defaultStatus };
    return { success: true };
  } catch (err: any) {
    console.error("Error al desconectar WhatsApp:", err);
    return { success: false };
  }
}

/**
 * Normaliza cualquier formato de teléfono internacional a JID de WhatsApp
 */
export function normalizarJid(telefono: string): string {
  let clean = telefono.replace(/\D/g, "");

  if (clean.length === 10) {
    clean = "1" + clean;
  }

  return `${clean}@s.whatsapp.net`;
}

/**
 * Resuelve sintaxis Spintax: {Hola|Saludos|Buen día} -> elige uno al azar
 */
export function resolverSpintax(texto: string): string {
  const spintaxRegex = /\{([^{}]+)\}/g;
  return texto.replace(spintaxRegex, (match, opciones) => {
    const lista = opciones.split("|");
    const randomIndex = Math.floor(Math.random() * lista.length);
    return lista[randomIndex].trim();
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Envío individual interno
 */
async function _ejecutarEnvioWhatsApp(
  telefono: string,
  mensaje: string,
  opciones?: { simularEscritura?: boolean }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!global.__crossover_wapi_sock || global.__crossover_wapi_status?.status !== "connected") {
      await initWhatsAppSocket();
      return {
        success: false,
        error: "WhatsApp no está conectado. Escanea el código QR primero.",
      };
    }

    const sock = global.__crossover_wapi_sock;
    const jid = normalizarJid(telefono);
    const textoFinal = resolverSpintax(mensaje);

    const simular = opciones?.simularEscritura ?? true;

    if (simular) {
      await sock.sendPresenceUpdate("available").catch(() => {});
      await sleep(1000 + Math.random() * 1000);

      await sock.sendPresenceUpdate("composing", jid).catch(() => {});

      const duracionEscribiendo = Math.min(
        5000,
        Math.max(2000, textoFinal.length * 30 + Math.random() * 1000)
      );
      await sleep(duracionEscribiendo);

      await sock.sendPresenceUpdate("paused", jid).catch(() => {});
      await sleep(300);
    }

    const result = await sock.sendMessage(jid, {
      text: textoFinal,
    });

    // Pausa mínima de seguridad después de enviar para que el próximo mensaje no salga pegado
    await sleep(1500 + Math.random() * 1500);

    return {
      success: true,
      messageId: result?.key?.id || undefined,
    };
  } catch (err: any) {
    console.error("Error enviando mensaje humano via Baileys:", err);
    return {
      success: false,
      error: err.message || "Error al enviar mensaje por Baileys",
    };
  }
}

/**
 * COLA MUTEX SERIALIZADA UNIVERSAL (ANTI-COLISIÓN Y GOTEO UNIVERSAL):
 * Si entran 5, 10 o 20 solicitudes al mismo segundo exacto,
 * esta función las enfila de manera estricta y las despacha una por una
 * con su simulación humana, sin que se encimen ni colisionen ante Meta.
 */
export async function enviarMensajeHumanoWhatsApp(
  telefono: string,
  mensaje: string,
  opciones?: { simularEscritura?: boolean }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!global.__crossover_wapi_mutex_queue) {
    global.__crossover_wapi_mutex_queue = Promise.resolve();
  }

  // Encadenar en la cola serializada
  const ejecucion = global.__crossover_wapi_mutex_queue.then(async () => {
    return await _ejecutarEnvioWhatsApp(telefono, mensaje, opciones);
  });

  // Mantener la cadena viva para la siguiente petición concurrente
  global.__crossover_wapi_mutex_queue = ejecucion.catch(() => {});

  return ejecucion;
}

const BOT_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || "https://sys.crossoverrd.com";
const BOT_API_SECRET = process.env.WHATSAPP_API_SECRET || "Crossover*2026#SecureWaBot";

export async function enviarMensajeWhatsApp(
  telefono: string,
  mensaje: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch(`${BOT_SERVICE_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": BOT_API_SECRET,
      },
      body: JSON.stringify({
        telefono,
        mensaje,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
