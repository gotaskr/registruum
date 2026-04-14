import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3B82F6 0%, #7C3AED 60%, #06B6D4 100%)",
          color: "white",
          fontSize: 96,
          fontWeight: 700,
          fontFamily: "Arial, sans-serif",
          borderRadius: 36,
        }}
      >
        R
      </div>
    ),
    size,
  );
}
