'use client';

import React from 'react';
import { FSGraph } from './FSGraph';
import {
  useCurrentMode,
  useProjectParentSelector
} from './ProjectParentMachineCtx';
import VideoChapterSlider from './VideoChapterSlider';
import VideoRangeSlider from './VideoRangeSlider';

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
  const rangeStart = useProjectParentSelector(
    ({ context }) => context.rangeStart
  );
  const rangeEnd = useProjectParentSelector(({ context }) => context.rangeEnd);
  const videoDuration = useProjectParentSelector(
    ({ context }) => context.videoDuration
  );
  const editMode = useCurrentMode();

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const getEditControls = () => {
    switch (editMode) {
      case 'chapters_editing':
        return (
          <div className='bg-card rounded-lg border p-4'>
            <h3 className='mb-2 text-sm font-medium'>Chapter Editor</h3>
            {!!videoDuration && <VideoChapterSlider />}
          </div>
        );
      case 'fsaction_editing':
        return (
          <div className='bg-card rounded-lg border p-4'>
            <h3 className='mb-2 text-sm font-medium'>Action Editor</h3>
            {!!videoDuration && <FSGraph />}
          </div>
        );
      default:
        return <div>no edit controls for {editMode}</div>;
    }
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
      {getEditControls()}
    </div>
  );
};

export default VideoTimeSliders;
