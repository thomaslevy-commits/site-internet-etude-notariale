import { ImageResponse } from "next/og";

/**
 * Image Open Graph 1200×630 générée au build (§7) — version générique,
 * à remplacer par un visuel dédié lors de la validation de l'identité.
 * Les couleurs reprennent les tokens night, ivory et gold — état de la
 * palette au moment de sa création, non une obligation : le design system
 * du §5 est abrogé depuis le 3 septembre 2026.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Étude notariale — Paris";

export default function ImageOpenGraph() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#101C2C",
          color: "#FAF7F2",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 500 }}>Étude notariale</div>
        <div style={{ fontSize: 32, marginTop: 20, color: "#A98A4C" }}>
          Paris
        </div>
      </div>
    ),
    size,
  );
}
