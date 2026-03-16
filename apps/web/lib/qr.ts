import QRCode from "qrcode"

export async function qrToSvg(data: string, options?: { margin?: number; scale?: number }) {
  const trimmed = data.trim()
  if (!trimmed) {
    throw new Error("QR payload is empty.")
  }
  if (trimmed.length > 4096) {
    throw new Error("QR payload is too large.")
  }

  const svg = await QRCode.toString(trimmed, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: options?.margin ?? 1,
    scale: options?.scale ?? 6,
    color: {
      dark: "#0b0b0f",
      // Always render a solid light background so the QR is readable in dark mode too.
      light: "#ffffff",
    },
  })

  return svg
}
