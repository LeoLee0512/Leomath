/** Small Canvas2D plotting helper shared by the experiments. */
export interface ThemeColors {
  paper: string;
  ink: string;
  ink2: string;
  muted: string;
  rule: string;
  leo: string;
  grid: string;
  gridStrong: string;
  e1: string;
  e2: string;
  accent2: string;
}

export function readThemeColors(): ThemeColors {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    paper: v("--paper"), ink: v("--ink"), ink2: v("--ink-2"), muted: v("--muted"), rule: v("--rule"),
    leo: v("--leo"), grid: v("--grid"), gridStrong: v("--grid-strong"), e1: v("--e1"), e2: v("--e2"), accent2: v("--accent-2"),
  };
}

export class Plot {
  constructor(
    public ctx: CanvasRenderingContext2D,
    public width: number,
    public height: number,
    public xRange: [number, number],
    public yRange: [number, number],
    public pad = 0,
  ) {}

  x(v: number): number {
    const [a, b] = this.xRange;
    return this.pad + ((v - a) / (b - a)) * (this.width - 2 * this.pad);
  }
  y(v: number): number {
    const [a, b] = this.yRange;
    return this.height - this.pad - ((v - a) / (b - a)) * (this.height - 2 * this.pad);
  }
  invX(px: number): number {
    const [a, b] = this.xRange;
    return a + ((px - this.pad) / (this.width - 2 * this.pad)) * (b - a);
  }
  invY(py: number): number {
    const [a, b] = this.yRange;
    return a + ((this.height - this.pad - py) / (this.height - 2 * this.pad)) * (b - a);
  }

  grid(color: string, step = 1, strong?: string) {
    const { ctx } = this;
    ctx.save();
    ctx.lineWidth = 1;
    const [x0, x1] = this.xRange;
    const [y0, y1] = this.yRange;
    for (let x = Math.ceil(x0 / step) * step; x <= x1 + 1e-9; x += step) {
      ctx.strokeStyle = Math.abs(x) < 1e-9 && strong ? strong : color;
      ctx.beginPath();
      ctx.moveTo(this.x(x), 0);
      ctx.lineTo(this.x(x), this.height);
      ctx.stroke();
    }
    for (let y = Math.ceil(y0 / step) * step; y <= y1 + 1e-9; y += step) {
      ctx.strokeStyle = Math.abs(y) < 1e-9 && strong ? strong : color;
      ctx.beginPath();
      ctx.moveTo(0, this.y(y));
      ctx.lineTo(this.width, this.y(y));
      ctx.stroke();
    }
    ctx.restore();
  }

  axes(color: string) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, this.y(0));
    ctx.lineTo(this.width, this.y(0));
    ctx.moveTo(this.x(0), 0);
    ctx.lineTo(this.x(0), this.height);
    ctx.stroke();
    ctx.restore();
  }

  polyline(points: Iterable<readonly [number, number]>, color: string, width = 2, dash: number[] = []) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.lineJoin = "round";
    ctx.beginPath();
    let first = true;
    for (const [x, y] of points) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        first = true;
        continue;
      }
      const px = this.x(x);
      const py = this.y(y);
      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  fn(f: (x: number) => number, color: string, width = 2, dash: number[] = [], samples = 400) {
    const [a, b] = this.xRange;
    const pts: [number, number][] = [];
    for (let i = 0; i <= samples; i++) {
      const x = a + ((b - a) * i) / samples;
      pts.push([x, f(x)]);
    }
    this.polyline(pts, color, width, dash);
  }

  dot(x: number, y: number, color: string, r = 4) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x(x), this.y(y), r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  arrow(from: readonly [number, number], to: readonly [number, number], color: string, width = 2.5) {
    const { ctx } = this;
    const x0 = this.x(from[0]);
    const y0 = this.y(from[1]);
    const x1 = this.x(to[0]);
    const y1 = this.y(to[1]);
    const angle = Math.atan2(y1 - y0, x1 - x0);
    const head = 10;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1 - Math.cos(angle) * head * 0.6, y1 - Math.sin(angle) * head * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - head * Math.cos(angle - Math.PI / 7), y1 - head * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(x1 - head * Math.cos(angle + Math.PI / 7), y1 - head * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  label(text: string, x: number, y: number, color: string, dx = 6, dy = -6, font = "12px ui-sans-serif, system-ui") {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(text, this.x(x) + dx, this.y(y) + dy);
    ctx.restore();
  }
}

/** Sets a canvas's backing store to match its CSS size × devicePixelRatio. Returns CSS width/height. */
export function fitCanvas(canvas: HTMLCanvasElement, aspect: number): { width: number; height: number; ctx: CanvasRenderingContext2D } {
  const width = canvas.clientWidth || 600;
  const height = Math.round(width / aspect);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, ctx };
}
