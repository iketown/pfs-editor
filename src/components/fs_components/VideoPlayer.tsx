import React, { useEffect, useRef, useState } from 'react';
import { useEditActorRef, useEditSelector } from './FsEditActorContext';
import { useMotionActorRef } from './MotionActorContext';
import { VideoROIWrapper } from './VideoROIWrapper';

interface VideoPlayerProps
  extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'onTimeUpdate'> {
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  onTimeUpdate,
  ...props
}) => {
  const playerRef = useRef<HTMLVideoElement>(null);
  const isSeekingRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const videoUrl = useEditSelector((state) => state.context.videoUrl);
  const hideVideo = useEditSelector((state) => state.context.hideVideo);
  const { send: editSend } = useEditActorRef();
  const { send: motionSend } = useMotionActorRef();

  // Ensure component only renders on client side to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    motionSend({
      type: 'SET_PLAYER_REF',
      playerRef: playerRef as React.RefObject<HTMLVideoElement>
    });
    editSend({
      type: 'SET_PLAYER_REF',
      playerRef: playerRef as React.RefObject<HTMLVideoElement>
    });
  }, [playerRef, motionSend, editSend]);

  // Listen for seek events to prevent time update loops
  useEffect(() => {
    const video = playerRef.current;
    if (!video) return;

    const handleSeeking = () => {
      isSeekingRef.current = true;
    };

    const handleSeeked = () => {
      // Small delay to ensure the seek is complete
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 50);
    };

    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, []);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;

    // Skip time update events if we're currently seeking
    if (isSeekingRef.current) {
      return;
    }

    if (onTimeUpdate) {
      onTimeUpdate(video.currentTime);
    }

    motionSend({
      type: 'VIDEO_TIME_UPDATE',
      time: video.currentTime
    });

    editSend({
      type: 'VIDEO_TIME_UPDATE',
      time: video.currentTime
    });
  };

  const handleLoadedData = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.log('onLoadedData', e.currentTarget);
    const video = e.currentTarget;

    // For now, use a default FPS of 30 as it's most common
    // In a real implementation, you might want to analyze the video stream
    console.log('Using default FPS: 30');
    motionSend({ type: 'SET_VIDEO_FPS', fps: 30 });
    editSend({ type: 'SET_VIDEO_FPS', fps: 30 });
    editSend({ type: 'SET_VIDEO_DURATION', duration: video.duration });
  };

  if (!videoUrl || !mounted) return null;

  return (
    <VideoROIWrapper>
      <video
        ref={playerRef}
        src={videoUrl}
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        {...props}
      />
      {hideVideo && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded bg-black/80'>
          <div className='text-center'>
            <div className='mb-2 text-sm text-white'>Video Hidden</div>
            <div className='text-xs text-white/70'>
              Toggle visibility in controls
            </div>
          </div>
        </div>
      )}
    </VideoROIWrapper>
  );
};

export default VideoPlayer;
