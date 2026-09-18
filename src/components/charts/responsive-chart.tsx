"use client";

import * as React from "react";

/**
 * A dependable replacement for Recharts' ResponsiveContainer. It measures its
 * own width with a ResizeObserver and hands explicit pixel dimensions to the
 * chart via a render prop, so charts always mount (ResponsiveContainer can fail
 * to render its surface in some React 19 / App Router setups).
 */
export function ResponsiveChart({
  height,
  children,
}: {
  height: number;
  children: (size: { width: number; height: number }) => React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height }}>
      {width > 0 ? children({ width, height }) : null}
    </div>
  );
}
