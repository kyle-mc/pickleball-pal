import { useRef, useCallback } from "react";

/**
 * Returns event handlers that fire `onLongPress` after `duration` ms when the
 * user holds a touch/mouse press. Cancels on move/leave/up. Designed for
 * games rows so users can open a context menu without blocking taps.
 */
export function useLongPress(onLongPress: () => void, duration = 500) {
  const timer = useRef<number | null>(null);
  const triggered = useRef(false);

  const start = useCallback(() => {
    triggered.current = false;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      triggered.current = true;
      onLongPress();
    }, duration);
  }, [onLongPress, duration]);

  const cancel = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    // Expose whether long-press fired so callers can suppress click
    didFire: () => triggered.current,
  };
}
