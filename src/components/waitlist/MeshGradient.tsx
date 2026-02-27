import { CSSProperties } from "react";

type MeshGradientProps = {
  colors?: [string, string, string, string];
  speed?: number;
  style?: CSSProperties;
  className?: string;
};

export function MeshGradient({
  colors = ["#001c80", "#1ac7ff", "#04ffb1", "#ff1ff1"],
  style,
  className,
}: MeshGradientProps) {
  return (
    <div
      className={className}
      style={{
        ...style,
        background: `
          radial-gradient(ellipse at 20% 20%, ${colors[0]} 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, ${colors[1]} 0%, transparent 50%),
          radial-gradient(ellipse at 40% 80%, ${colors[2]} 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, ${colors[3]} 0%, transparent 50%),
          linear-gradient(180deg, ${colors[0]}22 0%, ${colors[3]}22 100%)
        `,
        backgroundSize: "100% 100%",
      }}
    />
  );
}
