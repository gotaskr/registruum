import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 220,
          fontWeight: 700,
          fontFamily: "Arial, sans-serif",
        }}
      >
        R
      </div>
    ),
    size,
  );
}
