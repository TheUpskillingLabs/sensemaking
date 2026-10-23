import { useMemo } from "react";
import qrcode from "qrcode-generator";

/** A QR code as crisp SVG squares. Alphanumeric text (capitals, digits, $%*+-./: and space) packs smallest. */
export function QR({ text, size, title }: { text: string; size: string; title?: string }) {
  const { n, d } = useMemo(() => {
    const alnum = /^[0-9A-Z $%*+\-./:]*$/.test(text);
    const q = qrcode(0, "L");
    q.addData(text, alnum ? "Alphanumeric" : "Byte");
    q.make();
    const n = q.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { n, d };
  }, [text]);
  const pad = 2; // quiet zone, in modules
  return (
    <svg className="qr" viewBox={`${-pad} ${-pad} ${n + pad * 2} ${n + pad * 2}`} width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} shapeRendering="crispEdges">
      <rect x={-pad} y={-pad} width={n + pad * 2} height={n + pad * 2} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}
