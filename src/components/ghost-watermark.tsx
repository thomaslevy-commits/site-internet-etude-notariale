/**
 * Filigrane décoratif « Levy Notaires » — à poser dans une section en
 * position relative. Purement ornemental (aria-hidden), contraste quasi nul
 * assumé : l'élément ne porte aucune information.
 */
export function GhostWatermark({
  align = "right",
}: {
  align?: "left" | "right";
}) {
  const style: React.CSSProperties = {
    fontSize: "clamp(4rem, 12vw, 11rem)",
    color: "rgba(16,28,44,0.035)",
    ...(align === "left" ? { left: "-2%" } : { right: "-2%" }),
  };

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-[-4%] z-0 select-none whitespace-nowrap font-serif font-medium leading-none"
      style={style}
    >
      Levy Notaires
    </span>
  );
}
