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
          background: "#3566d6",
          color: "white",
          fontSize: 82,
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
