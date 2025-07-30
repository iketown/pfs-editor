'use client';

import React, { useCallback, useMemo } from 'react';
import { useMotionSelector, useMotionActorRef } from './MotionActorContext';
import { useEditSelector, useEditActorRef } from './FsEditActorContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ROI } from '@/types/roi-types';

const ROIRangeSlider: React.FC = () => {
  const { send: motionSend } = useMotionActorRef();
  const { send: editSend } = useEditActorRef();
  const rangeStart = useEditSelector((state) => state.context.rangeStart);
  const rangeEnd = useEditSelector((state) => state.context.rangeEnd);
  // Get current video time from edit machine
  const videoTime = useEditSelector((state) => state.context.videoTime);
  const videoDuration = useEditSelector((state) => state.context.videoDuration);

  // Get all ROIs from motion machine
  const roisObject = useMotionSelector((state) => state.context.rois);
  const rois = Object.values(roisObject).sort(
    (a, b) => a.timeStart - b.timeStart
  );

  // Convert ROI times to seconds for the slider (they're already in seconds now)
  const roiPositions = useMemo(() => rois.map((roi) => roi.timeStart), [rois]);
  const currentTimeSeconds = useMemo(() => videoTime, [videoTime]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle adding a new ROI at current time
  const handleAddROI = useCallback(() => {
    const currentTime = currentTimeSeconds; // Already in seconds
    const newROI: ROI = {
      id: `roi-${Date.now()}`,
      title: `ROI ${rois.length + 1}`,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      timeStart: currentTime
    };
    motionSend({ type: 'ADD_ROI', roi: newROI });
  }, [currentTimeSeconds, rois.length, motionSend]);

  // Handle removing an ROI
  const handleRemoveROI = useCallback(
    (roiId: string) => {
      motionSend({ type: 'REMOVE_ROI', roiId });
    },
    [motionSend]
  );

  // Handle seeking to a specific ROI
  const handleSeekToROI = useCallback(
    (roi: ROI) => {
      const timeInSeconds = roi.timeStart; // Already in seconds
      editSend({ type: 'SEEK', time: timeInSeconds });
    },
    [editSend]
  );

  return (
    <div className='space-y-4 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium'>ROI Timeline</h3>
        <Button size='sm' variant='outline' onClick={handleAddROI}>
          Add ROI at {formatTime(currentTimeSeconds)}
        </Button>
      </div>

      {/* Timeline with ROI markers */}
      <div className='space-y-2'>
        <div className='bg-muted relative h-8 rounded'>
          {/* Video duration line */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='bg-foreground/20 h-1 w-full rounded'></div>
          </div>

          {/* ROI markers */}
          {roiPositions.map((position, index) => {
            const roi = rois[index];
            const percentage = (position / videoDuration) * 100;

            return (
              <div
                key={roi.id}
                className='absolute top-0 bottom-0 flex items-center'
                style={{ left: `${percentage}%` }}
              >
                <div className='group relative'>
                  {/* ROI marker */}
                  <div className='bg-primary border-background h-3 w-3 cursor-pointer rounded-full border-2 transition-transform hover:scale-125' />

                  {/* ROI tooltip */}
                  <div className='bg-background absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform rounded border px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100'>
                    {roi.title || `ROI ${index + 1}`}
                    <br />
                    {formatTime(position)}
                  </div>

                  {/* ROI actions */}
                  <div className='absolute top-full left-1/2 mt-1 flex -translate-x-1/2 transform gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleSeekToROI(roi)}
                      className='h-6 px-2 text-xs'
                    >
                      Seek
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => handleRemoveROI(roi.id)}
                      className='h-6 px-2 text-xs'
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Current time indicator */}
          <div
            className='absolute top-0 bottom-0 w-0.5 bg-red-500'
            style={{ left: `${(currentTimeSeconds / videoDuration) * 100}%` }}
          />
        </div>

        <div className='text-muted-foreground flex justify-between text-xs'>
          <span>0:00</span>
          <span>{formatTime(videoDuration)}</span>
        </div>
      </div>

      {/* ROI List */}
      {rois.length > 0 && (
        <div className='space-y-2'>
          <h4 className='text-sm font-medium'>ROIs</h4>
          <div className='max-h-32 space-y-1 overflow-y-auto'>
            {rois.map((roi, index) => (
              <div
                key={roi.id}
                className='bg-muted/50 flex items-center justify-between rounded p-2 text-sm'
              >
                <div>
                  <span className='font-medium'>
                    {roi.title || `ROI ${index + 1}`}
                  </span>
                  <span className='text-muted-foreground ml-2'>
                    {formatTime(roi.timeStart)}
                  </span>
                </div>
                <div className='flex gap-1'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleSeekToROI(roi)}
                  >
                    Seek
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => handleRemoveROI(roi.id)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ROIRangeSlider;
