'use client';

import React, { useCallback, useMemo } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { useEditActorRef, useEditSelector } from './FsEditActorContext';
import { cn } from '@/lib/utils';

interface VideoPlayheadProps {
  className?: string;
}

export default function VideoPlayhead({ className = '' }: VideoPlayheadProps) {
  const { send } = useEditActorRef();

  // Get video state from the machine context
  const videoTime = useEditSelector((state) => state.context.videoTime);
  const videoDuration = useEditSelector((state) => state.context.videoDuration);
  const rangeStart = useEditSelector((state) => state.context.rangeStart);
  const rangeEnd = useEditSelector((state) => state.context.rangeEnd);

  // Convert videoTime from milliseconds to seconds for display
  const currentTime = videoTime / 1000;
  const duration = videoDuration;

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Memoize the slider value to prevent unnecessary re-renders
  const sliderValue = useMemo(() => {
    return [currentTime];
  }, [currentTime]);

  // Handle slider value change
  const handleValueChange = useCallback(
    (values: number[]) => {
      const newTime = values[0];
      if (newTime !== currentTime) {
        send({ type: 'SEEK_VIDEO', time: newTime });
      }
    },
    [currentTime, send]
  );

  // Handle slider value commit (when user finishes dragging)
  const handleValueCommit = useCallback(
    (values: number[]) => {
      const newTime = values[0];
      send({ type: 'SEEK_VIDEO', time: newTime });
    },
    [send]
  );

  return (
    <div className={`w-full p-4 ${className}`}>
      {/* Row 1: rangeStart - slider - rangeEnd */}
      <div className='flex items-center gap-4'>
        <span className='text-muted-foreground min-w-[40px] text-sm'>
          {formatTime(rangeStart)}
        </span>

        <div className='relative flex-1'>
          <SliderPrimitive.Root
            className='relative flex w-full touch-none items-center select-none'
            value={sliderValue}
            onValueChange={handleValueChange}
            onValueCommit={handleValueCommit}
            max={rangeEnd}
            min={rangeStart}
            step={0.5}
          >
            <SliderPrimitive.Track className='bg-muted relative h-2 grow overflow-hidden rounded-full'>
              <SliderPrimitive.Range className='bg-primary absolute h-full' />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className='border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50' />
          </SliderPrimitive.Root>
        </div>

        <span className='text-muted-foreground min-w-[40px] text-sm'>
          {formatTime(rangeEnd)}
        </span>
      </div>

      {/* Row 2: centered currentTime */}
      <div className='mt-2 flex justify-center'>
        <div className='text-sm font-bold'>{formatTime(currentTime)}</div>
      </div>
    </div>
  );
}
