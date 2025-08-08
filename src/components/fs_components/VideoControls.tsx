import React from 'react';
import {
  useFsEditActorRef,
  useFsEditSelector,
  useProjectParentSelector,
  useRoiActorRef
} from './ProjectParentMachineCtx';
import { useActiveRoiZoomState, useActiveRoiWithZoom } from './TypedSelectors';
import { Button } from '@/components/ui/button';
import {
  Eye,
  EyeOff,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface VideoControlsProps {
  className?: string;
}

const VideoControls: React.FC<VideoControlsProps> = ({ className = '' }) => {
  const { send: editSend } = useFsEditActorRef();
  const { send: roiSend } = useRoiActorRef();
  const currentTime = useProjectParentSelector(
    (state) => state.context.currentTime
  );
  // Get current state from contexts
  const playerRef = useFsEditSelector(
    (state) => state.context.playerRef
  ) as React.RefObject<HTMLVideoElement> | null;
  const videoFps = useProjectParentSelector((state) => state.context.videoFps);
  const hideVideo = useFsEditSelector((state) => state.context.hideVideo);

  // Local state for play/pause
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Get zoom state and active ROI from ROI machine
  const isZoomed = useActiveRoiZoomState();
  const activeROI = useActiveRoiWithZoom();

  // Handle play/pause
  const handlePlayPause = () => {
    const video = playerRef?.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.currentTime = currentTime;
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle previous frame
  const handlePrevious = () => {
    const video = playerRef?.current;
    if (video && videoFps) {
      const frameTime = 1 / videoFps; // Time per frame in seconds
      const newTime = Math.max(0, currentTime - frameTime);
      editSend({ type: 'SEEK_VIDEO', time: newTime });
    }
  };

  // Handle next frame
  const handleNext = () => {
    const video = playerRef?.current;
    if (video && videoFps) {
      const frameTime = 1 / videoFps; // Time per frame in seconds
      const newTime = currentTime + frameTime;
      editSend({ type: 'SEEK_VIDEO', time: newTime });
    }
  };

  // Handle zoom toggle - toggle the active ROI's zoom state
  const handleZoomToggle = () => {
    roiSend({
      type: 'TOGGLE_ROI_ZOOM'
    });
  };

  // Handle video visibility toggle
  const handleVideoVisibilityToggle = () => {
    editSend({
      type: 'SHOW_HIDE_VIDEO',
      hideVideo: !hideVideo
    });
  };

  // Listen for video play/pause events
  React.useEffect(() => {
    const video = playerRef?.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [playerRef]);

  return (
    <div
      className={`bg-background flex items-center gap-2 border-b p-2 ${className}`}
    >
      {/* Play/Pause Button */}
      <Button
        variant='outline'
        size='sm'
        onClick={handlePlayPause}
        className='flex items-center gap-1'
      >
        {isPlaying ? (
          <Pause className='h-4 w-4' />
        ) : (
          <Play className='h-4 w-4' />
        )}
        {isPlaying ? 'Pause' : 'Play'}
      </Button>

      {/* Previous Frame Button */}
      <Button
        variant='outline'
        size='sm'
        onClick={handlePrevious}
        disabled={!videoFps}
        className='flex items-center gap-1'
      >
        <SkipBack className='h-4 w-4' />
        Prev
      </Button>

      {/* Next Frame Button */}
      <Button
        variant='outline'
        size='sm'
        onClick={handleNext}
        disabled={!videoFps}
        className='flex items-center gap-1'
      >
        <SkipForward className='h-4 w-4' />
        Next
      </Button>

      {/* Right side controls */}
      <div className='ml-auto flex items-center gap-2'>
        {/* Video Visibility Toggle */}
        <Button
          variant='outline'
          size='sm'
          onClick={handleVideoVisibilityToggle}
          className='flex items-center gap-1'
        >
          {hideVideo ? (
            <EyeOff className='h-4 w-4' />
          ) : (
            <Eye className='h-4 w-4' />
          )}
        </Button>

        {/* Zoom Toggle Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={handleZoomToggle}
          disabled={!activeROI}
          className='flex items-center gap-1'
          title={
            !activeROI
              ? 'No active ROI to zoom'
              : isZoomed
                ? 'Zoom out'
                : 'Zoom in'
          }
        >
          {isZoomed ? (
            <ZoomOut className='h-4 w-4' />
          ) : (
            <ZoomIn className='h-4 w-4' />
          )}
          {isZoomed ? 'Zoom Out' : 'Zoom In'}
        </Button>
      </div>
    </div>
  );
};

export default VideoControls;
