import { ImageResponse } from "next/og";
import { ogLogoSrc } from "@/lib/og-logo";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js reads this image metadata export.
export const alt = "Saeed, software engineer";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js reads this image metadata export.
export const size = {
  width: 1200,
  height: 630,
};

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js reads this image metadata export.
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        color: "#171717",
        padding: "72px 80px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: ImageResponse renders an embedded data URL and cannot use next/image. */}
        <img
          src={ogLogoSrc}
          alt=""
          width={88}
          height={88}
          style={{
            borderRadius: 999,
            border: "2px solid rgba(0, 0, 0, 0.08)",
          }}
        />
        <span
          style={{
            fontSize: 52,
            fontWeight: 600,
            letterSpacing: "-2px",
          }}
        >
          Saeed
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: "-3px",
          }}
        >
          Software engineer
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#666666",
          }}
        >
          Mobile products, performance, accessibility, and agent-assisted
          engineering.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "14px",
          fontSize: 22,
          color: "#666666",
        }}
      >
        <span>React Native</span>
        <span>·</span>
        <span>TypeScript</span>
        <span>·</span>
        <span>Mobile systems</span>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
