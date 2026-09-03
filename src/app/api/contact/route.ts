import { NextResponse } from "next/server";
import { z } from "zod";
import { etude } from "@/config/etude";

const schema = z.object({
  nom: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().optional().default(""),
  objet: z.string().min(1),
  message: z.string().min(1),
  consentement: z.literal(true),
  suspect: z.boolean().optional().default(false),
});

const RESEND_KEY = process.env.RESEND_API_KEY;
const DESTINATAIRE = process.env.CONTACT_DESTINATAIRE ?? etude.email;

export async function POST(request: Request) {
  if (!RESEND_KEY) {
    return NextResponse.json(
      { error: "Service de messagerie non configuré." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Champs invalides.", details: result.error.flatten() },
      { status: 422 },
    );
  }

  const { nom, email, telephone, objet, message, suspect } = result.data;

  const marqueSuspect = suspect ? " [SUSPECT — vérification recommandée]" : "";

  const html = `
    <h2>Nouveau message depuis le site${marqueSuspect}</h2>
    <table style="border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Nom</td><td>${escapeHtml(nom)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">E-mail</td><td>${escapeHtml(email)}</td></tr>
      ${telephone ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold">Téléphone</td><td>${escapeHtml(telephone)}</td></tr>` : ""}
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Objet</td><td>${escapeHtml(objet)}</td></tr>
    </table>
    <hr style="margin:16px 0">
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  `.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Site Étude Lévy <onboarding@resend.dev>`,
      to: [DESTINATAIRE],
      reply_to: email,
      subject: `[Contact site] ${objet}${marqueSuspect}`,
      html,
    }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Échec de l'envoi." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
