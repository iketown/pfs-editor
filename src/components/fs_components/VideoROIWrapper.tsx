import React, {
  useRef,
  useState,
  useEffect,
  ReactNode,
  CSSProperties,
  useMemo,
  useCallback
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

  // Get the raw data from the motion machine
  const rois = useMotionSelector(({ context }) => context.rois);
  const activeROIid = useMotionSelector(({ context }) => context.activeROIid);
  const selectedROIid = useMotionSelector(
    (state) => state.context.selectedROIid
  );
  const motionActorRef = useMotionActorRef();

  // Get the single active ROI
  const activeROI = useMemo(() => {
    return activeROIid ? rois[activeROIid] : null;
  }, [rois, activeROIid]);

  const [target, setTarget] = useState<SVGRectElement | null>(null);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [containerElement, setContainerElement] =
    useState<HTMLDivElement | null>(null);

  // Set container element when ref is available
  const setContainerRef = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
    setContainerElement(element);
  }, []);

  // Update SVG overlay size when video metadata loads
  useEffect(() => {
    const vid = playerRef?.current;
    if (!vid) {
      return;
    }
    const onLoaded = () => {
      setSvgSize({ w: vid.videoWidth, h: vid.videoHeight });
    };
    vid.addEventListener('loadedmetadata', onLoaded);
    // If already loaded, set size immediately
    if (vid.readyState >= 1) {
      setSvgSize({ w: vid.videoWidth, h: vid.videoHeight });
    }
    return () => vid.removeEventListener('loadedmetadata', onLoaded);
  }, [playerRef]);

  const onUpdateROI = useCallback(
    (updatedROI: ROI) => {
      motionActorRef.send({
        type: 'UPDATE_ROI',
        roi: updatedROI
      });
    },
    [motionActorRef]
  );

  // Track initial position for drag operations
  const initialPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleDrag = useCallback(
    ({ beforeTranslate }: OnDrag) => {
      if (!activeROI) return;

      const updatedROI: ROI = {
        ...activeROI,
        x: initialPositionRef.current.x + beforeTranslate[0],
        y: initialPositionRef.current.y + beforeTranslate[1]
      };

      onUpdateROI(updatedROI);
    },
    [activeROI, onUpdateROI]
  );

  const handleResize = useCallback(
    ({ width, height, drag }: OnResize) => {
      if (!activeROI) return;

      const updatedROI: ROI = {
        ...activeROI,
        x: initialPositionRef.current.x + drag.beforeTranslate[0],
        y: initialPositionRef.current.y + drag.beforeTranslate[1],
        w: width,
        h: height
      };

      onUpdateROI(updatedROI);
    },
    [activeROI, onUpdateROI]
  );

  const handleDragStart = useCallback(() => {
    if (activeROI) {
      initialPositionRef.current = {
        x: activeROI.x,
        y: activeROI.y
      };
    }
  }, [activeROI]);

  const handleResizeStart = useCallback(() => {
    if (activeROI) {
      initialPositionRef.current = {
        x: activeROI.x,
        y: activeROI.y
      };
    }
  }, [activeROI]);

  return (
    <div
      ref={setContainerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      {children}

      {/* Only render SVG and Moveable if there's an active ROI */}
      {activeROI && (
        <>
          <svg
            width={svgSize.w}
            height={svgSize.h}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          >
            <rect
              ref={setTarget}
              x={activeROI.x}
              y={activeROI.y}
              width={activeROI.w}
              height={activeROI.h}
              fill='rgba(0,255,0,0.1)'
              stroke={selectedROIid === activeROI.id ? 'red' : 'lime'}
              strokeWidth={selectedROIid === activeROI.id ? 3 : 2}
              style={{ pointerEvents: 'all', cursor: 'move' }}
            />
          </svg>

          {target && (
            <Moveable
              target={target}
              container={containerElement}
              draggable
              resizable
              throttleDrag={1}
              throttleResize={1}
              keepRatio={false}
              origin={false}
              onDragStart={handleDragStart}
              onResizeStart={handleResizeStart}
              onDrag={handleDrag}
              onResize={handleResize}
            />
          )}
        </>
      )}
    </div>
  );
};
