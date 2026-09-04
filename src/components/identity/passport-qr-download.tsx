"use client";

import { Button } from "@/components/ui/button";

export function PassportQrDownload({ svg }: { svg: string }) {
  function download() {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const png = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = png;
      link.download = "passport-qr.png";
      link.click();
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }
  return (
    <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={download}>
      Download PNG
    </Button>
  );
}
