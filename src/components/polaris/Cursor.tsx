import { useEffect, useRef } from "react";

export function PolarisCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let x = -100, y = -100, tx = -100, ty = -100;
    const move = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; };
    const tick = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    const over = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t?.closest('button, a, [role="button"], input, textarea, select')) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="polaris-cursor" aria-hidden />;
}