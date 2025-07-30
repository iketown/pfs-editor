'use client';

import React, { useCallback, useMemo } from 'react';
import { useMotionSelector, useMotionActorRef } from './MotionActorContext';
import { useEditSelector, useEditActorRef } from './FsEditActorContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ROI } from '@/types/roi-types';

interface ROIRangeSliderProps {
  roi: ROI;
}

const ROIRangeSlider: React.FC<ROIRangeSliderProps> = ({ roi }) => {
  const { send: motionSend } = useMotionActorRef();
  const { send: editSend } = useEditActorRef();
  const rangeStart = useEditSelector((state) => state.context.rangeStart);
  const rangeEnd = useEditSelector((state) => state.context.rangeEnd);
  // Get current video time from edit machine
  const videoTime = useEditSelector((state) => state.context.videoTime);
  const videoDuration = useEditSelector((state) => state.context.videoDuration);

  // Convert ROI times from milliseconds to seconds for the slider
  const startTimeSeconds = useMemo(() => roi.timeStart / 1000, [roi.timeStart]);
  const endTimeSeconds = useMemo(() => roi.timeEnd / 1000, [roi.timeEnd]);
  const currentTimeSeconds = useMemo(() => videoTime, [videoTime]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle range slider change
  const handleRangeChange = useCallback(
    (values: number[]) => {
      const [start, end] = values;

      // Convert back to milliseconds for the ROI
      const startMs = start * 1000;
      const endMs = end * 1000;

      // Update the ROI with new times
      const updatedROI: ROI = {
        ...roi,
        timeStart: startMs,
        timeEnd: endMs
      };

      motionSend({ type: 'UPDATE_ROI', roi: updatedROI });
    },
    [roi, motionSend]
  );

  // Handle setting start time to current playhead position
  const handleSetStartTime = useCallback(() => {
    const currentTimeMs = currentTimeSeconds * 1000;

    // Don't allow setting start time after end time
    if (currentTimeMs >= endTimeSeconds * 1000) return;

    const updatedROI: ROI = {
      ...roi,
      timeStart: currentTimeMs
    };

    motionSend({ type: 'UPDATE_ROI', roi: updatedROI });
  }, [roi, currentTimeSeconds, endTimeSeconds, motionSend]);

  // Handle setting end time to current playhead position
  const handleSetEndTime = useCallback(() => {
    const currentTimeMs = currentTimeSeconds * 1000;

    // Don't allow setting end time before start time
    if (currentTimeMs <= startTimeSeconds * 1000) return;

    const updatedROI: ROI = {
      ...roi,
      timeEnd: currentTimeMs
    };

    motionSend({ type: 'UPDATE_ROI', roi: updatedROI });
  }, [roi, currentTimeSeconds, startTimeSeconds, motionSend]);

  // Check if buttons should be disabled
  const isStartButtonDisabled = currentTimeSeconds >= endTimeSeconds;
  const isEndButtonDisabled = currentTimeSeconds <= startTimeSeconds;

  return (
    <div className='space-y-4 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium'>ROI Time Range</h3>
        <div className='text-muted-foreground text-sm'>
          {formatTime(startTimeSeconds)} - {formatTime(endTimeSeconds)}
        </div>
      </div>

      {/* Range Slider */}
      <div className='space-y-2'>
        <Slider
          min={rangeStart}
          max={rangeEnd}
          value={[startTimeSeconds, endTimeSeconds]}
          step={0.5}
          minStepsBetweenThumbs={1}
          onValueChange={handleRangeChange}
          className='w-full'
        />
        <div className='text-muted-foreground flex justify-between text-xs'>
          <span>0:00</span>
          <span>{formatTime(videoDuration)}</span>
        </div>
      </div>

      {/* Quick Set Buttons */}
      <div className='flex gap-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={handleSetStartTime}
          disabled={isStartButtonDisabled}
          className='flex-1'
        >
          Set start time to {formatTime(currentTimeSeconds)}
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={handleSetEndTime}
          disabled={isEndButtonDisabled}
          className='flex-1'
        >
          Set end time to {formatTime(currentTimeSeconds)}
        </Button>
      </div>
    </div>
  );
};

export default ROIRangeSlider;
