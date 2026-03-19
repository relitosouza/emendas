// hooks/useCountUp.ts
import { useState, useEffect, useRef } from "react";

export function useCountUp(target: number, duration: number = 2000): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startValueRef.current = current;
    startRef.current = null;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;

      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quadratic
      const eased = 1 - (1 - progress) * (1 - progress);
      const value = startValueRef.current + (target - startValueRef.current) * eased;

      setCurrent(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}
