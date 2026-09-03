import Link from "next/link";

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL;

/**
 * Bouton de prise de rendez-vous (§2) — pointe vers l'outil externe
 * NEXT_PUBLIC_BOOKING_URL, à défaut vers /contact.
 * Styles actuels : primaire night/ivory, secondaire filet night. Ils venaient
 * du §5, qui proscrivait le bouton doré ; cette règle est abrogée depuis le
 * 3 septembre 2026 et l'aspect du bouton est libre, sous la seule réserve du
 * contraste AA.
 */
export function CtaRendezVous({
  variante = "primaire",
  surFondSombre = false,
}: {
  variante?: "primaire" | "secondaire";
  surFondSombre?: boolean;
}) {
  const href = BOOKING_URL && BOOKING_URL.length > 0 ? BOOKING_URL : "/contact";
  const classes =
    variante === "primaire"
      ? surFondSombre
        ? "bg-ivory text-night hover:bg-paper"
        : "bg-night text-ivory hover:bg-anthracite"
      : surFondSombre
        ? "border border-ivory text-ivory hover:bg-night"
        : "border border-night text-night hover:bg-paper";
  return (
    <Link
      href={href}
      className={`inline-block rounded-sm px-6 py-3 text-sm transition-colors ${classes}`}
    >
      Prendre rendez-vous
    </Link>
  );
}
