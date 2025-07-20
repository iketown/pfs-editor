import React, { useMemo } from 'react';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';

interface FrameIndicatorProps {
  chartRef: React.RefObject<ChartJSOrUndefined<
    'line',
    { x: number; y: number }[],
    unknown
  > | null>;
  fps: number;
  currentTimeMs?: number;
  onFrameClick: (timeMs: number) => void;
  height?: number;
}

const FrameIndicator: React.FC<FrameIndicatorProps> = ({
  chartRef,
  fps,
  currentTimeMs,
  onFrameClick,
  height = 30
}) => {
  const frames = useMemo(() => {
    const chart = chartRef.current;
    if (!chart) return [];

    const xScale = chart.scales.x;
    if (!xScale) return [];

    const minTime = xScale.min;
    const maxTime = xScale.max;
    const visibleDuration = maxTime - minTime;

    // Only show frame indicators when zoomed in enough (less than 5 seconds visible)
    if (visibleDuration > 5000) return [];

    const frameDuration = 1000 / fps; // Duration of one frame in ms
    const startFrame = Math.floor(minTime / frameDuration);
    const endFrame = Math.ceil(maxTime / frameDuration);
    const totalFrames = endFrame - startFrame;

    // Limit the number of frames to display to prevent performance issues
    if (totalFrames > 200) return [];

    const frames = [];
    for (let i = startFrame; i <= endFrame; i++) {
      const frameTime = i * frameDuration;
      if (frameTime >= minTime && frameTime <= maxTime) {
        frames.push({
          frameNumber: i,
          timeMs: frameTime,
          position: ((frameTime - minTime) / visibleDuration) * 100
        });
      }
    }

    return frames;
  }, [
    chartRef,
    fps,
    chartRef.current?.scales.x?.min,
    chartRef.current?.scales.x?.max
  ]);

  if (frames.length === 0) return null;

  return (
    <div
      style={{
        height,
        width: '100%',
        position: 'relative',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        fontSize: '10px',
        color: 'rgba(0, 0, 0, 0.6)'
      }}
    >
      {/* Frame count indicator */}
      <div style={{ position: 'absolute', left: 8, top: 2 }}>
        {frames.length} frames
      </div>

      {/* FPS indicator */}
      <div style={{ position: 'absolute', right: 8, top: 2 }}>{fps}fps</div>

      {frames.map((frame) => {
        const isCurrentFrame =
          currentTimeMs !== undefined &&
          Math.abs(frame.timeMs - currentTimeMs) < 1000 / fps / 2;

        return (
          <button
            key={frame.frameNumber}
            onClick={() => onFrameClick(frame.timeMs)}
            style={{
              position: 'absolute',
              left: `${frame.position}%`,
              transform: 'translateX(-50%)',
              width: isCurrentFrame ? '3px' : '1px',
              height: isCurrentFrame ? '100%' : '70%',
              backgroundColor: isCurrentFrame
                ? 'rgba(255, 99, 132, 0.8)'
                : 'rgba(75, 192, 192, 0.5)',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '0px',
              transition: 'all 0.1s ease',
              minWidth: isCurrentFrame ? '3px' : '1px'
            }}
            onMouseEnter={(e) => {
              if (!isCurrentFrame) {
                e.currentTarget.style.backgroundColor =
                  'rgba(75, 192, 192, 0.9)';
                e.currentTarget.style.height = '90%';
                e.currentTarget.style.width = '2px';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCurrentFrame) {
                e.currentTarget.style.backgroundColor =
                  'rgba(75, 192, 192, 0.5)';
                e.currentTarget.style.height = '70%';
                e.currentTarget.style.width = '1px';
              }
            }}
            title={`Frame ${frame.frameNumber} (${(frame.timeMs / 1000).toFixed(3)}s)${isCurrentFrame ? ' - Current' : ''}`}
          />
        );
      })}
    </div>
  );
};

export default FrameIndicator;
