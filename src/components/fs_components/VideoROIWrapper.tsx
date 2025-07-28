import React, {
  useRef,
  useState,
  useEffect,
  ReactNode,
  CSSProperties
} from 'react';
import Moveable, { OnDrag, OnResize } from 'react-moveable';
import { useMotionSelector, useMotionActorRef } from './MotionActorContext';
import { ROI } from '@/types/roi-types';

interface VideoROIWrapperProps {
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}

export const VideoROIWrapper: React.FC<VideoROIWrapperProps> = ({
  style,
  className,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useMotionSelector(
    (state) => state.context.playerRef
  ) as React.RefObject<HTMLVideoElement> | null;
  const currentROI = useMotionSelector((state) => state.context.currentROI);

  const selectedROIid = useMotionSelector(
    (state) => state.context.selectedROIid
  );
  const motionActorRef = useMotionActorRef();

  // TODO: update frame when currentROI changes
  // todo: when frame is changed, add a new roi to the rois array
  // todo: frames can be on timeline too.   prevFrame and nextFrame buttons to move frame on timeline
  // todo: frames can be adjusted or dragged in X space on the timeline.
  // todo: selectedFrame in ctx.
  const [frame, setFrame] = useState<ROI>(currentROI);
  const [target, setTarget] = useState<SVGRectElement | null>(null);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  // Update frame when currentROI changes
  useEffect(() => {
    setFrame(currentROI);
  }, [currentROI]);

  // Update SVG overlay size when video metadata loads
  useEffect(() => {
    const vid = playerRef?.current;
    if (!vid) {
      console.log('no video ref');
      return;
    }
    console.log('video ref', vid);
    const onLoaded = () => {
      setSvgSize({ w: vid.videoWidth, h: vid.videoHeight });
      console.log('setting svg size', {
        w: vid.videoWidth,
        h: vid.videoHeight
      });
    };
    vid.addEventListener('loadedmetadata', onLoaded);
    // If already loaded, set size immediately
    if (vid.readyState >= 1) {
      setSvgSize({ w: vid.videoWidth, h: vid.videoHeight });
    }
    return () => vid.removeEventListener('loadedmetadata', onLoaded);
  }, [playerRef]);

  const onUpdateROI = (updatedFrame: ROI) => {
    console.log('onUpdateROI', updatedFrame);
    motionActorRef.send({
      type: 'UPDATE_ROI',
      roi: updatedFrame
    });
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      {children}

      <svg
        width={svgSize.w}
        height={svgSize.h}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <rect
          ref={setTarget}
          x={frame.x}
          y={frame.y}
          width={frame.w}
          height={frame.h}
          fill='rgba(0,255,0,0.1)'
          stroke='lime'
          strokeWidth={2}
          style={{ pointerEvents: 'all', cursor: 'move' }}
        />
      </svg>

      <Moveable
        target={target}
        container={containerRef.current}
        draggable
        resizable
        throttleDrag={1}
        throttleResize={1}
        keepRatio={false}
        origin={false}
        onDrag={({ beforeTranslate }: OnDrag) => {
          console.log('dragging', { beforeTranslate });
          setFrame((p) => ({
            ...p,
            x: beforeTranslate[0],
            y: beforeTranslate[1]
          }));
        }}
        onResize={({ width, height, drag }: OnResize) => {
          console.log('resizing', { width, height, drag });
          setFrame((p) => ({
            ...p,
            x: drag.beforeTranslate[0],
            y: drag.beforeTranslate[1],
            width,
            height
          }));
        }}
        onDragEnd={() => onUpdateROI(frame)}
        onResizeEnd={() => onUpdateROI(frame)}
      />
      {/* <pre>{JSON.stringify(frame, null, 2)}</pre> */}
    </div>
  );
};
