"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import type { Vec2 } from "@/lib/math/linear";

/** Snap to the half-integer grid when close to it, so nice coordinates are easy to hit. */
export function snapHalf(v: number): number {
  const r = Math.round(v * 2) / 2;
  return Math.abs(v - r) < 0.08 ? r : Math.round(v * 100) / 100;
}

/** Points kept in the URL as "x1,y1,x2,y2,…"; each coordinate clamped to ±bound, anything unreadable → fallback. */
export function parsePoints(text: string, fallback: readonly Vec2[], bound: number): Vec2[] {
  const v = text.split(",").map(Number);
  if (v.length !== fallback.length * 2 || !v.every(Number.isFinite)) return fallback.map((p) => [p[0], p[1]] as Vec2);
  const c = (x: number) => Math.max(-bound, Math.min(bound, x));
  return fallback.map((_, i) => [c(v[2 * i]), c(v[2 * i + 1])] as Vec2);
}

export function pointsText(points: readonly Vec2[]): string {
  return points.map((p) => `${Math.round(p[0] * 100) / 100},${Math.round(p[1] * 100) / 100}`).join(",");
}

/**
 * Draggable points on a canvas whose Plot spans xRange × yRange (no padding). Pointer: grab the nearest
 * handle within `grab` units. Keyboard: the canvas is focusable; arrow keys move the selected handle by 0.1
 * (0.5 with Shift), and the caller renders buttons to choose which handle is selected.
 */
export function useDragHandles({ canvasRef, xRange, yRange, handles, onDrag, grab = 0.45 }: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  xRange: [number, number];
  yRange: [number, number];
  handles: readonly Vec2[];
  onDrag: (index: number, p: Vec2) => void;
  grab?: number;
}) {
  const dragging = useRef<number | null>(null);
  const [selected, setSelected] = useState(0);
  const clampX = (x: number) => Math.max(xRange[0] + 0.1, Math.min(xRange[1] - 0.1, x));
  const clampY = (y: number) => Math.max(yRange[0] + 0.1, Math.min(yRange[1] - 0.1, y));

  function toMath(ev: PointerEvent<HTMLCanvasElement>): Vec2 {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [
      xRange[0] + ((ev.clientX - rect.left) / rect.width) * (xRange[1] - xRange[0]),
      yRange[1] - ((ev.clientY - rect.top) / rect.height) * (yRange[1] - yRange[0]),
    ];
  }

  function onPointerDown(ev: PointerEvent<HTMLCanvasElement>) {
    const [x, y] = toMath(ev);
    let best = -1;
    let bestD = grab;
    handles.forEach((h, i) => {
      const d = Math.hypot(x - h[0], y - h[1]);
      if (d <= bestD) {
        best = i;
        bestD = d;
      }
    });
    if (best < 0) return;
    dragging.current = best;
    setSelected(best);
    ev.currentTarget.setPointerCapture(ev.pointerId);
  }
  function onPointerMove(ev: PointerEvent<HTMLCanvasElement>) {
    if (dragging.current === null) return;
    const [x, y] = toMath(ev);
    onDrag(dragging.current, [snapHalf(clampX(x)), snapHalf(clampY(y))]);
  }
  function onPointerUp(ev: PointerEvent<HTMLCanvasElement>) {
    if (dragging.current === null) return;
    dragging.current = null;
    ev.currentTarget.releasePointerCapture(ev.pointerId);
  }
  function onKeyDown(ev: KeyboardEvent<HTMLCanvasElement>) {
    const step = ev.shiftKey ? 0.5 : 0.1;
    const d: Vec2 | null =
      ev.key === "ArrowLeft" ? [-step, 0] : ev.key === "ArrowRight" ? [step, 0]
      : ev.key === "ArrowUp" ? [0, step] : ev.key === "ArrowDown" ? [0, -step] : null;
    if (!d) return;
    ev.preventDefault();
    const h = handles[selected];
    const r = (v: number) => Math.round(v * 100) / 100;
    onDrag(selected, [r(clampX(h[0] + d[0])), r(clampY(h[1] + d[1]))]);
  }

  return {
    selected,
    setSelected,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onKeyDown },
  };
}
