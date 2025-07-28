import React, { useMemo } from 'react';
import TimeRange from 'react-video-timelines-slider';
import { useEditActorRef, useEditSelector } from './FsEditActorContext';
import { format } from 'date-fns';
import type { FunscriptObject, FSChapter } from '@/types/funscript-types';

interface VideoTimelineProps {
  className?: string;
}

const VideoTimeline: React.FC<VideoTimelineProps> = ({ className = '' }) => {
  const { send: editSend } = useEditActorRef();

  // Get state from context
  const videoTime = useEditSelector((state) => state.context.videoTime);
  const videoFps = useEditSelector((state) => state.context.videoFps);
  const funscript = useEditSelector(
    (state) => state.context.funscript
  ) as FunscriptObject | null;
  const loopStart = useEditSelector((state) => state.context.loopStart);
  const loopEnd = useEditSelector((state) => state.context.loopEnd);

  // Convert video time to milliseconds for the timeline
  const currentTimeMs = videoTime;

  // Calculate video duration from funscript or use a default
  const videoDuration = useMemo(() => {
    if (funscript?.metadata?.duration) {
      // actual duration of video
      return funscript.metadata.duration * 1000; // Convert to ms
    }
    if (funscript?.actions && funscript.actions.length > 0) {
      // Fallback: calculate from last action time
      const lastAction = funscript.actions[funscript.actions.length - 1];
      return lastAction.at * 1000; // Convert to ms
    }
    return 60000; // Default 1 minute
  }, [funscript]);

  // Chapter markers removed as requested - will handle differently

  // Set up loop interval (if not set, use full video)
  const loopInterval = useMemo(() => {
    const start = loopStart !== null ? loopStart * 1000 : 0;
    const end = loopEnd !== null ? loopEnd * 1000 : videoDuration;
    return [start, end];
  }, [loopStart, loopEnd, videoDuration]);

  // Handle timeline changes
  const handleTimelineChange = (selectedInterval: [number, number]) => {
    const [startMs, endMs] = selectedInterval;
    editSend({
      type: 'SET_LOOP_POINTS',
      start: startMs / 1000,
      end: endMs / 1000
    });
  };

  // Handle timeline updates (for error handling)
  const handleTimelineUpdate = ({ error }: { error: boolean }) => {
    if (error) {
      console.warn('Timeline selection error:', error);
    }
  };

  // Format time for ticks (MM:SS)
  const formatTick = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format time for tooltips (MM:SS.SSS)
  const formatTooltip = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  if (!funscript) {
    return (
      <div
        className={`bg-muted flex h-16 items-center justify-center rounded ${className}`}
      >
        <p className='text-muted-foreground text-sm'>
          Load a funscript to see timeline
        </p>
      </div>
    );
  }

  return (
    <div className={`video-timeline-container w-full ${className}`}>
      <style jsx>{`
        .video-timeline-container :global(.react_time_range__rail__inner) {
          background-color: #d1d5db;
        }
        .video-timeline-container :global(.react_time_range__track) {
          background-color: lightblue !important;
        }
      `}</style>
      <TimeRange
        timelineInterval={[0, videoDuration]}
        selectedInterval={loopInterval as [number, number]}
        onChangeCallback={handleTimelineChange}
        onUpdateCallback={handleTimelineUpdate}
        formatTick={formatTick}
        formatTooltip={formatTooltip}
        showTooltip={false}
        showTimelineError={false}
        step={1000} // 1 second steps
        ticksNumber={Math.min(20, Math.floor(videoDuration / 5000))} // Max 20 ticks, every 5 seconds
        mode={3} // Pushable handles, step apart
        containerClassName='w-full'
        error={false}
        disabledIntervals={[{ start: 0, end: 2000 }]}
      />

      {/* Chapter labels */}
      {funscript.metadata?.chapters && (
        <div className='mt-2 flex flex-wrap gap-2'>
          {funscript.metadata.chapters.map((chapter, index) => (
            <div
              key={index}
              className='bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer rounded px-2 py-1 text-xs'
              onClick={() => {
                // Seek to chapter start
                editSend({ type: 'SEEK_VIDEO', time: chapter.startTime });
              }}
              title={`Chapter ${index + 1}: ${chapter.name || `Chapter ${index + 1}`}`}
            >
              {chapter.name || `Ch ${index + 1}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoTimeline;
