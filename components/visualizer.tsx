"use client";

import * as React from "react";

interface VisualizerProps {
  analyser?: AnalyserNode | null;
  isActive: boolean;
}

export function Visualizer({ analyser, isActive }: VisualizerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationFrame: number;

    const render = () => {
      if (!isActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "rgba(111, 79, 242, 0.9)");
      gradient.addColorStop(0.7, "rgba(127, 255, 212, 0.8)");
      gradient.addColorStop(1, "rgba(111, 79, 242, 0.2)");
      ctx.fillStyle = gradient;

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillRect(
          x,
          canvas.height - barHeight,
          barWidth,
          barHeight
        );
        x += barWidth + 2;
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [analyser, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={720}
      height={260}
      className="w-full rounded-2xl border border-white/10 bg-black/40"
    />
  );
}
