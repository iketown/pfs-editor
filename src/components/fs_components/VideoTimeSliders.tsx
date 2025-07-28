'use client';

import React from 'react';
import VideoChapterSlider from './VideoChapterSlider';
import VideoRangeSlider from './VideoRangeSlider';
import { useEditSelector } from './FsEditActorContext';

interface Chapter {
  name?: string;
  startTime: number; // seconds
  endTime: number; // seconds
}

interface VideoTimeSlidersProps {
  onChaptersChange?: (chapters: Chapter[]) => void;
}

const VideoTimeSliders: React.FC<VideoTimeSlidersProps> = ({
  onChaptersChange
}) => {
  const rangeStart = useEditSelector((state) => state.context.rangeStart);
  const rangeEnd = useEditSelector((state) => state.context.rangeEnd);
  const videoDuration = useEditSelector((state) => state.context.videoDuration);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='w-full space-y-4'>
      {/* Top Slider - Range Selector */}
      <div className='bg-card rounded-lg border p-4'>
        {/* <h3 className='mb-2 text-sm font-medium'>Range Selector</h3> */}
        {!!videoDuration && <VideoRangeSlider />}

        {/* Range Summary */}
        <div className='text-muted-foreground mt-2 flex justify-between text-xs'>
          <div>Full: {formatTime(videoDuration)}</div>
          <div>
            Range: {formatTime(rangeStart)} - {formatTime(rangeEnd)}
          </div>
          <div>Size: {formatTime(rangeEnd - rangeStart)}</div>
        </div>
      </div>
      {/*  Slider - Chapter Editor */}
      <div className='bg-card rounded-lg border p-4'>
        <h3 className='mb-2 text-sm font-medium'>Chapter Editor</h3>
        {!!videoDuration && (
          <VideoChapterSlider onChaptersChange={onChaptersChange} />
        )}
      </div>
    </div>
  );
};

export default VideoTimeSliders;
