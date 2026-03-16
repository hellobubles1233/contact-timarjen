declare module "qrcode" {
  export type QRCodeErrorCorrectionLevel = "L" | "M" | "Q" | "H"

  export type QRCodeColor = {
    dark?: string
    light?: string
  }

  export type QRCodeToStringOptions = {
    type?: "svg" | "terminal" | "utf8" | "png"
    errorCorrectionLevel?: QRCodeErrorCorrectionLevel
    margin?: number
    scale?: number
    color?: QRCodeColor
  }

  export function toString(text: string, options?: QRCodeToStringOptions): Promise<string>

  const QRCode: {
    toString: typeof toString
  }

  export default QRCode
}

