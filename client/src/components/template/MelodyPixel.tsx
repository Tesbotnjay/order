import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const melodySvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <!-- hood + ears -->
  <g fill="#FF9BB6" stroke="#D86C8D" stroke-width="4" stroke-linejoin="round">
    <rect x="30" y="4" width="26" height="74" rx="13" />
    <rect x="104" y="4" width="26" height="74" rx="13" />
    <path d="M20 64c0-31 25-56 56-56h8c31 0 56 25 56 56v24c0 35-29 64-64 64h-4c-35 0-64-29-64-64V64z" />
  </g>

  <!-- flower -->
  <g stroke="#E7E7E7" stroke-width="2">
    <circle cx="110" cy="42" r="8" fill="#FFFFFF" />
    <circle cx="124" cy="42" r="8" fill="#FFFFFF" />
    <circle cx="117" cy="30" r="8" fill="#FFFFFF" />
    <circle cx="117" cy="54" r="8" fill="#FFFFFF" />
    <circle cx="117" cy="42" r="5" fill="#FFD84D" stroke="#E3BB37" />
  </g>

  <!-- face -->
  <ellipse cx="80" cy="94" rx="39" ry="35" fill="#FFFFFF" stroke="#EFEFEF" stroke-width="2" />

  <!-- eyes -->
  <ellipse cx="66" cy="91" rx="3.4" ry="5" fill="#2F2A2A" />
  <ellipse cx="94" cy="91" rx="3.4" ry="5" fill="#2F2A2A" />

  <!-- nose -->
  <ellipse cx="80" cy="102" rx="5.5" ry="4.2" fill="#FFD84D" />
</svg>
`;

const defaultSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(melodySvg)}`;

const palette = [
  [255, 155, 182],
  [216, 108, 141],
  [255, 255, 255],
  [239, 239, 239],
  [231, 231, 231],
  [255, 216, 77],
  [227, 187, 55],
  [47, 42, 42],
] as const;

// FIX: type best as the union of all palette entries
function nearestColor(r: number, g: number, b: number): typeof palette[number] {
  let best: typeof palette[number] = palette[0];
  let bestDistance = Infinity;
  for (const color of palette) {
    const dr = r - color[0];
    const dg = g - color[1];
    const db = b - color[2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) { bestDistance = distance; best = color; }
  }
  return best;
}

type MelodyPixelProps = {
  className?: string;
  animated?: boolean;
  delay?: number;
  cols?: number;
  src?: string;
};

export function MelodyPixel({
  className = '',
  animated = true,
  delay = 0,
  cols = 34,
  src = defaultSrc,
}: MelodyPixelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ratio, setRatio] = useState(1);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const rows = Math.max(1, Math.round((img.height / img.width) * cols));
      setRatio(cols / rows);

      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = cols;
      smallCanvas.height = rows;
      const smallCtx = smallCanvas.getContext('2d');
      if (!smallCtx) return;

      smallCtx.clearRect(0, 0, cols, rows);
      smallCtx.imageSmoothingEnabled = true;
      smallCtx.drawImage(img, 0, 0, cols, rows);

      const imageData = smallCtx.getImageData(0, 0, cols, rows);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 20) { data[i + 3] = 0; continue; }
        const [nr, ng, nb] = nearestColor(data[i], data[i + 1], data[i + 2]);
        data[i] = nr; data[i + 1] = ng; data[i + 2] = nb; data[i + 3] = 255;
      }

      smallCtx.putImageData(imageData, 0, 0);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const pixelScale = 12;
      canvas.width = cols * pixelScale;
      canvas.height = rows * pixelScale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(smallCanvas, 0, 0, cols, rows, 0, 0, canvas.width, canvas.height);
    };
  }, [src, cols]);

  return (
    <motion.div
      className={`inline-block ${className}`}
      animate={animated ? { y: [0, -6, 0], rotate: [0, -1, 1, 0] } : undefined}
      transition={animated ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay } : undefined}
      whileHover={{ scale: 1.04 }}
      style={{ width: '100%', maxWidth: 320, aspectRatio: ratio, filter: 'drop-shadow(0 10px 20px rgba(255,155,182,0.28))' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }}
      />
    </motion.div>
  );
}
