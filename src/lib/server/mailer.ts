import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import type { Booking } from "@/lib/bookings";

const STUDIO_ADDRESS = "18 rue de la Folie-Méricourt, 75011 Paris";
const STUDIO_PHONE = "01 99 00 12 34";

type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  studio?: string;
};

export type MailResult = {
  sent: boolean;
  skipped: boolean;
};

function readConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);

  if (!host || !from || !Number.isFinite(port)) {
    return null;
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user: user || undefined,
    pass: pass || undefined,
    from,
    studio: process.env.STUDIO_EMAIL?.trim() || undefined,
  };
}

let transporter: Transporter | null = null;
let transporterKey = "";

function getTransporter(config: MailConfig) {
  const key = `${config.host}:${config.port}:${config.user ?? ""}:${config.pass ?? ""}`;
  if (transporter && transporterKey === key) return transporter;

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth:
      config.user && config.pass
        ? { user: config.user, pass: config.pass }
        : undefined,
    pool: true,
    maxConnections: 2,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  transporterKey = key;
  return transporter;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function buildClientEmail(booking: Booking) {
  const name = escapeHtml(booking.name);
  const course = escapeHtml(booking.course);
  const coach = escapeHtml(booking.coach);
  const date = escapeHtml(`${booking.dateLong} à ${booking.time}`);
  const code = escapeHtml(booking.code);

  const subjectDate = `${booking.dateLong.charAt(0).toLowerCase()}${booking.dateLong.slice(1)}`;
  const subject =
    booking.status === "confirmed"
      ? `Votre séance Basic IT du ${subjectDate} à ${booking.time}`
      : `Votre réservation Basic IT du ${subjectDate} à ${booking.time}`;

  const intro =
    booking.status === "confirmed"
      ? "Votre séance est confirmée. Voici le récapitulatif :"
      : "Votre réservation est enregistrée. Elle sera confirmée dès réception du paiement :";

  const text = [
    `Bonjour ${booking.name},`,
    "",
    intro,
    "",
    `Code : ${booking.code}`,
    `Séance : ${booking.course}`,
    `Créneau : ${booking.dateLong} à ${booking.time}`,
    `Coach : ${booking.coach} (${booking.duration} min)`,
    `Lieu : ${STUDIO_ADDRESS}`,
    `Montant : ${booking.price} €`,
    "",
    "Présentez votre code à l'accueil dix minutes avant la séance.",
    "Démonstration : aucun paiement réel n'a été effectué.",
    "",
    "Basic IT",
    STUDIO_ADDRESS,
    STUDIO_PHONE,
  ].join("\n");

  const html = `
    <div style="margin:0;padding:0;background:#f7f8f5;font-family:Arial,Helvetica,sans-serif;color:#0f1f18;">
      <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
        <div style="background:#0b2b20;border-radius:18px 18px 0 0;padding:22px 26px;">
          <p style="margin:0;color:#f7f8f5;font-size:16px;letter-spacing:0.16em;font-weight:700;">BASIC IT</p>
        </div>
        <div style="background:#ffffff;border-radius:0 0 18px 18px;padding:28px 26px 26px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Bonjour ${name},</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#3d4a44;">${intro}</p>

          <div style="background:#f7f8f5;border-radius:12px;padding:16px 18px;margin:0 0 22px;">
            <p style="margin:0 0 4px;font-size:13px;color:#5b6a62;">Votre code de confirmation</p>
            <p style="margin:0;font-size:22px;letter-spacing:0.04em;font-weight:700;color:#0b2b20;">${code}</p>
          </div>

          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
            <tr><td style="padding:6px 0;color:#5b6a62;">Séance</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#0b2b20;">${course}</td></tr>
            <tr><td style="padding:6px 0;color:#5b6a62;">Créneau</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#0b2b20;">${date}</td></tr>
            <tr><td style="padding:6px 0;color:#5b6a62;">Coach</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#0b2b20;">${coach} (${booking.duration} min)</td></tr>
            <tr><td style="padding:6px 0;color:#5b6a62;">Lieu</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#0b2b20;">${STUDIO_ADDRESS}</td></tr>
            <tr><td style="padding:6px 0;color:#5b6a62;">Montant</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#0b2b20;">${booking.price} €</td></tr>
          </table>

          <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#5b6a62;">
            Présentez votre code à l'accueil dix minutes avant la séance. Démonstration : aucun
            paiement réel n'a été effectué.
          </p>
          <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#5b6a62;">
            Basic IT, ${STUDIO_ADDRESS} · ${STUDIO_PHONE}
          </p>
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
}

function buildStudioEmail(booking: Booking) {
  const subject = `Nouvelle réservation ${booking.code}`;
  const text = [
    `Nouvelle réservation ${booking.code}`,
    "",
    `Client : ${booking.name}`,
    `Email : ${booking.email}`,
    `Téléphone : ${booking.phone}`,
    `Séance : ${booking.course} (${booking.coach}, ${booking.duration} min)`,
    `Créneau : ${booking.dateLong} à ${booking.time}`,
    `Montant : ${booking.price} €`,
    `Statut : ${booking.status}`,
  ].join("\n");

  return { subject, text };
}

/**
 * Sends the client confirmation and, when STUDIO_EMAIL is set, a copy to the
 * studio. A mail failure never rolls back a confirmed booking.
 */
export async function sendBookingEmails(booking: Booking): Promise<MailResult> {
  const config = readConfig();

  if (!config) {
    console.info("[mail] SMTP non configuré, email de réservation ignoré.");
    return { sent: false, skipped: true };
  }

  let sent = false;

  try {
    const transporter = getTransporter(config);
    const clientEmail = buildClientEmail(booking);

    await transporter.sendMail({
      from: config.from,
      to: booking.email,
      replyTo: config.from,
      subject: clientEmail.subject,
      text: clientEmail.text,
      html: clientEmail.html,
    });
    sent = true;

    if (config.studio) {
      const studioEmail = buildStudioEmail(booking);
      await transporter.sendMail({
        from: config.from,
        to: config.studio,
        replyTo: booking.email,
        subject: studioEmail.subject,
        text: studioEmail.text,
      });
    }
  } catch (error) {
    console.error(
      "[mail] Envoi impossible :",
      error instanceof Error ? error.message : error,
    );
  }

  return { sent, skipped: false };
}
