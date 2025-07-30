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
  const activeROIIds = useMotionSelector(({ context }) => context.activeROIs);

  // Memoize the activeROIs array to prevent infinite re-renders
  const activeROIs = useMemo(() => {
    return Object.values(rois).filter((roi) => activeROIIds.includes(roi.id));
  }, [rois, activeROIIds]);

  const selectedROIid = useMotionSelector(
    (state) => state.context.selectedROIid
  );
  const motionActorRef = useMotionActorRef();

  // Local state for frames - maps ROI ID to ROI object
  const [frames, setFrames] = useState<{ [roi_id: string]: ROI }>({});
  const framesRef = useRef(frames);

  // Keep framesRef in sync with frames state
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  // Track initial positions for drag operations
  const initialPositionsRef = useRef<{
    [roi_id: string]: { x: number; y: number };
  }>({});

  const [targets, setTargets] = useState<{
    [roi_id: string]: SVGRectElement | null;
  }>({});
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [containerElement, setContainerElement] =
    useState<HTMLDivElement | null>(null);

  // Set container element when ref is available
  const setContainerRef = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
    setContainerElement(element);
  }, []);

  // Update frames when activeROIs changes
  useEffect(() => {
    const newFrames: { [roi_id: string]: ROI } = {};
    activeROIs.forEach((roi) => {
      newFrames[roi.id] = roi;
    });
    setFrames(newFrames);
  }, [activeROIs]);

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
    (updatedFrame: ROI) => {
      motionActorRef.send({
        type: 'UPDATE_ROI',
        roi: updatedFrame
      });
    },
    [motionActorRef]
  );

  // Create stable ref callbacks for each ROI to prevent infinite loops
  const createRefCallback = useCallback((roiId: string) => {
    return (element: SVGRectElement | null) => {
      setTargets((prev) => {
        // Only update if the value actually changed
        if (prev[roiId] === element) {
          return prev;
        }
        return {
          ...prev,
          [roiId]: element
        };
      });
    };
  }, []);

  // Use a ref to store ref callbacks to prevent recreation
  const refCallbacksRef = useRef<{
    [roiId: string]: (element: SVGRectElement | null) => void;
  }>({});

  // Get or create ref callback for a specific ROI
  const getRefCallback = useCallback(
    (roiId: string) => {
      if (!refCallbacksRef.current[roiId]) {
        refCallbacksRef.current[roiId] = createRefCallback(roiId);
      }
      return refCallbacksRef.current[roiId];
    },
    [createRefCallback]
  );

  const handleDrag = useCallback(
    (roiId: string) =>
      ({ beforeTranslate }: OnDrag) => {
        setFrames((prev) => {
          const currentFrame = prev[roiId];
          if (!currentFrame) return prev;

          // Get the initial position for this drag operation
          const initialPos = initialPositionsRef.current[roiId];
          if (!initialPos) return prev;

          return {
            ...prev,
            [roiId]: {
              ...currentFrame,
              x: initialPos.x + beforeTranslate[0],
              y: initialPos.y + beforeTranslate[1]
            }
          };
        });
      },
    []
  );

  const handleResize = useCallback(
    (roiId: string) =>
      ({ width, height, drag }: OnResize) => {
        setFrames((prev) => {
          const currentFrame = prev[roiId];
          if (!currentFrame) return prev;

          // Get the initial position for this resize operation
          const initialPos = initialPositionsRef.current[roiId];
          if (!initialPos) return prev;

          return {
            ...prev,
            [roiId]: {
              ...currentFrame,
              x: initialPos.x + drag.beforeTranslate[0],
              y: initialPos.y + drag.beforeTranslate[1],
              w: width,
              h: height
            }
          };
        });
      },
    []
  );

  const handleDragEnd = useCallback(
    (roiId: string) => () => {
      const frame = framesRef.current[roiId];
      if (frame) {
        onUpdateROI(frame);
      }
    },
    [onUpdateROI]
  );

  const handleResizeEnd = useCallback(
    (roiId: string) => () => {
      const frame = framesRef.current[roiId];
      if (frame) {
        onUpdateROI(frame);
      }
    },
    [onUpdateROI]
  );

  return (
    <div
      ref={setContainerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      {children}

      <svg
        width={svgSize.w}
        height={svgSize.h}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {activeROIs.map((roi) => {
          const frame = frames[roi.id];
          if (!frame) return null;

          const isSelected = selectedROIid === roi.id;

          return (
            <rect
              key={roi.id}
              ref={getRefCallback(roi.id)}
              x={frame.x}
              y={frame.y}
              width={frame.w}
              height={frame.h}
              fill='rgba(0,255,0,0.1)'
              stroke={isSelected ? 'red' : 'lime'}
              strokeWidth={isSelected ? 3 : 2}
              style={{ pointerEvents: 'all', cursor: 'move' }}
            />
          );
        })}
      </svg>

      {activeROIs.map((roi) => {
        const target = targets[roi.id];
        if (!target) return null;

        return (
          <Moveable
            key={roi.id}
            target={target}
            container={containerElement}
            draggable
            resizable
            throttleDrag={1}
            throttleResize={1}
            keepRatio={false}
            origin={false}
            onDragStart={() => {
              const currentFrame = frames[roi.id];
              if (currentFrame) {
                initialPositionsRef.current[roi.id] = {
                  x: currentFrame.x,
                  y: currentFrame.y
                };
              }
            }}
            onResizeStart={() => {
              const currentFrame = frames[roi.id];
              if (currentFrame) {
                initialPositionsRef.current[roi.id] = {
                  x: currentFrame.x,
                  y: currentFrame.y
                };
              }
            }}
            onDrag={handleDrag(roi.id)}
            onResize={handleResize(roi.id)}
            onDragEnd={handleDragEnd(roi.id)}
            onResizeEnd={handleResizeEnd(roi.id)}
          />
        );
      })}
      {/* <pre>{JSON.stringify(frames, null, 2)}</pre> */}
    </div>
  );
};
