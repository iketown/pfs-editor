import React, { useEffect, useRef } from 'react';
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
  const videoUrl = useEditSelector((state) => state.context.videoUrl);
  const { send: editSend } = useEditActorRef();
  const { send: motionSend } = useMotionActorRef();

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

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const timeMs = Math.round(e.currentTarget.currentTime * 1000);

    if (onTimeUpdate) {
      onTimeUpdate(timeMs);
    }

    motionSend({
      type: 'VIDEO_TIME_UPDATE',
      time: timeMs
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

  if (!videoUrl) return null;

  return (
    <VideoROIWrapper>
      <video
        ref={playerRef}
        src={videoUrl}
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        {...props}
      />
    </VideoROIWrapper>
  );
};

export default VideoPlayer;
