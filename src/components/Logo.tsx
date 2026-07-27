import type { CSSProperties } from "react";

// The ITeC mark. The source asset is a single-colour alpha mask, so the shape
// is punched out of a `currentColor` fill rather than shipped pre-tinted --
// set `color` on this element (or an ancestor) to recolour it.
export function Logo({
  size = 48,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const mask: CSSProperties = {
    display: "block",
    width: size,
    height: size,
    backgroundColor: "currentColor",
    maskImage: "url(/itec-logo.png)",
    maskRepeat: "no-repeat",
    maskPosition: "center",
    maskSize: "contain",
    WebkitMaskImage: "url(/itec-logo.png)",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    WebkitMaskSize: "contain",
  };

  return <span role="img" aria-label="ITeC" className={className} style={mask} />;
}
