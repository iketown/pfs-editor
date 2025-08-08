'use client';

import { Slider } from '@/components/ui/slider';
import React, { useCallback } from 'react';
import {
  useChapterActorRef,
  useProjectParentSelector
} from './ProjectParentMachineCtx';

interface VideoRangeSliderProps {}

const VideoRangeSlider: React.FC<VideoRangeSliderProps> = ({}) => {
  const { send } = useChapterActorRef();
  const rangeStart = useProjectParentSelector(
    ({ context }) => context.rangeStart
  );
  const rangeEnd = useProjectParentSelector(({ context }) => context.rangeEnd);
  const videoDuration = useProjectParentSelector((state) =>
    Math.round(state.context.videoDuration)
  );
  console.log('videorangeslider', { rangeStart, rangeEnd, videoDuration });
  // Handle range slider change
  const handleRangeChange = useCallback(
    (values: number[]) => {
      const [rangeStart, rangeEnd] = values;
      // Ensure start is less than end
      if (rangeStart < rangeEnd) {
        console.log('VideoRangeSlider onValueChange', rangeStart, rangeEnd);
        send({ type: 'SET_VIDEO_RANGE', rangeStart, rangeEnd });
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
    <div className='h-6 w-full'>
      {/* <div className='text-muted-foreground mb-2 text-sm'>
        Working Range: {formatTime(rangeStart)} - {formatTime(rangeEnd)}
      </div> */}
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
