'use client';

import React, { useCallback } from 'react';
import { useEditActorRef, useEditSelector } from './FsEditActorContext';
import { Slider } from '@/components/ui/slider';

interface VideoRangeSliderProps {}

const VideoRangeSlider: React.FC<VideoRangeSliderProps> = ({}) => {
  const { send } = useEditActorRef();
  const rangeStart = useEditSelector((state) =>
    Math.round(state.context.rangeStart)
  );
  const rangeEnd = useEditSelector((state) =>
    Math.round(state.context.rangeEnd)
  );
  const videoDuration = useEditSelector((state) =>
    Math.round(state.context.videoDuration)
  );

  // Handle range slider change
  const handleRangeChange = useCallback(
    (values: number[]) => {
      const [start, end] = values;

      // Ensure start is less than end
      if (start < end) {
        send({ type: 'SET_RANGE_START', start });
        send({ type: 'SET_RANGE_END', end });
      }
    },
    [send]
  );

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='h-10 w-full'>
      <div className='text-muted-foreground mb-2 text-sm'>
        Working Range: {formatTime(rangeStart)} - {formatTime(rangeEnd)}
      </div>
      <Slider
        min={0}
        max={videoDuration}
        value={[rangeStart, rangeEnd]}
        step={1}
        minStepsBetweenThumbs={1}
        onValueChange={(values: number[]) => {
          handleRangeChange(values);
        }}
      />
    </div>
  );
};

export default VideoRangeSlider;
