import QRCode from "qrcode";

export async function PassportQr({ url }: { url: string }) {
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 176,
    color: { dark: "#111827", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
  return (
    <div
      className="size-44 overflow-hidden rounded-xl border border-border bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
      aria-label="QR code for this professional passport"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
