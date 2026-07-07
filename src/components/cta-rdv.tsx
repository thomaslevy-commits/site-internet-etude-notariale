import Link from "next/link";

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL;

/**
 * Bouton de prise de rendez-vous (§2) — pointe vers l'outil externe
 * NEXT_PUBLIC_BOOKING_URL, à défaut vers /contact.
 * Styles §5 : primaire night/ivory, secondaire filet night. Jamais de doré.
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
