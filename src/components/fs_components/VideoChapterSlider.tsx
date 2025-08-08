'use client';

import React, { useMemo, useCallback, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { useEditActorRef, useEditSelector } from './FsEditActorContext';
import {
  useProjectParentActorRef,
  useChapterSelector,
  useSendToChapter
} from './ProjectParentMachineCtx';
import VideoChapterEditButtons from './VideoChapterEditButtons';

interface VideoChapterSliderProps {}

const VideoChapterSlider: React.FC<VideoChapterSliderProps> = ({}) => {
  const sendToChapter = useSendToChapter();
  const fsChapters = useChapterSelector((state) => state.context.fsChapters);
  const rangeStart = useChapterSelector((state) => state.context.rangeStart);
  const rangeEnd = useChapterSelector((state) => state.context.rangeEnd);
  const selectedChapterId = useChapterSelector(
    (state) => state.context.selectedChapterId
  );

  // Get all chapters (not filtered by range for the buttons)
  const allChapters = useMemo(() => {
    const chapters = Object.entries(fsChapters)
      .map(([id, chapter]) => ({
        id,
        ...(chapter as {
          startTime: number;
          endTime: number;
          title: string;
          color: string;
        })
      }))
      // Sort by start time to preserve chronological order
      .sort((a, b) => {
        return a.startTime - b.startTime;
      });

    return chapters;
  }, [fsChapters]);

  // Memoize individual chapter objects to ensure stable references
  const memoizedChapters = useMemo(() => {
    return allChapters
      .sort((a, b) => a.startTime - b.startTime)
      .map((chapter) => ({
        ...chapter,
        // Add a stable reference property
        _stableRef: chapter.id
      }));
  }, [allChapters]);

  // Convert chapter times to actual time values for the slider
  const handlePositions = useMemo(() => {
    if (rangeEnd <= rangeStart) return [];

    return memoizedChapters
      .filter((chapter) => {
        // If there's a selected chapter, only include that chapter
        if (selectedChapterId && chapter.id !== selectedChapterId) {
          return false;
        }

        // Only include times that are actually within the range
        // Don't render thumbs for out-of-range times
        const startInRange =
          chapter.startTime >= rangeStart && chapter.startTime < rangeEnd;
        const endInRange =
          chapter.endTime > rangeStart && chapter.endTime <= rangeEnd;

        // Only include this chapter if both times are in range
        return startInRange && endInRange;
      })
      .map((chapter) => {
        // Use the actual times since we know they're in range
        return [chapter.startTime, chapter.endTime];
      })
      .flat();
  }, [memoizedChapters, rangeStart, rangeEnd, selectedChapterId]);

  // Get visible chapters for the slider (same filtering as handlePositions)
  const visibleChapters = useMemo(() => {
    if (rangeEnd <= rangeStart) return [];

    return memoizedChapters.filter((chapter) => {
      // If there's a selected chapter, only show that chapter's thumbs
      if (selectedChapterId && chapter.id !== selectedChapterId) {
        return false;
      }

      // Only show chapters where both start and end times are in range
      const startInRange =
        chapter.startTime >= rangeStart && chapter.startTime < rangeEnd;
      const endInRange =
        chapter.endTime > rangeStart && chapter.endTime <= rangeEnd;

      return startInRange && endInRange;
    });
  }, [memoizedChapters, rangeStart, rangeEnd, selectedChapterId]);

  // Handle chapter slider change
  const handleChapterChange = useCallback(
    (values: number[]) => {
      if (rangeEnd <= rangeStart) return;

      // Get visible chapters for this update (same filtering as above)
      const visibleChapters = allChapters.filter((chapter) => {
        const startInRange =
          chapter.startTime >= rangeStart && chapter.startTime < rangeEnd;
        const endInRange =
          chapter.endTime > rangeStart && chapter.endTime <= rangeEnd;
        // Only include chapters where both times are in range
        return startInRange && endInRange;
      });

      // Find which chapter changed by comparing values
      for (let i = 0; i < values.length; i += 2) {
        const chapterIndex = Math.floor(i / 2);
        if (chapterIndex < visibleChapters.length) {
          const chapter = visibleChapters[chapterIndex];
          const newStartTime = values[i];
          const newEndTime = values[i + 1];

          // Only update if the new values are within the original chapter's bounds
          // and represent a meaningful change
          const startChanged =
            Math.abs(newStartTime - chapter.startTime) > 0.01;
          const endChanged = Math.abs(newEndTime - chapter.endTime) > 0.01;

          // Ensure the new times are valid (start < end)
          if (newStartTime >= newEndTime) continue;

          // Only update if values actually changed and are meaningful
          if (startChanged) {
            sendToChapter({ type: 'SEEK_VIDEO', time: newStartTime });
          }
          if (endChanged) {
            sendToChapter({ type: 'SEEK_VIDEO', time: newEndTime });
          }
          if (startChanged || endChanged) {
            sendToChapter({
              type: 'UPDATE_CHAPTER',
              chapterId: chapter.id,
              startTime: newStartTime,
              endTime: newEndTime
            });
            // Since only one thumb can be dragged at a time, we can break after finding the changed chapter
            break;
          }
        }
      }
    },
    [allChapters, rangeStart, rangeEnd, sendToChapter]
  );

  const handleChapterCommit = useCallback(
    (values: number[]) => {
      handleChapterChange(values);
    },
    [handleChapterChange]
  );

  // Handle chapter button click (main area) - select chapter and set range
  const handleChapterClick = (chapter: (typeof memoizedChapters)[0]) => {
    // Toggle selection: if already selected, deselect; otherwise select
    const newChapterId = selectedChapterId === chapter.id ? null : chapter.id;
    sendToChapter({
      type: 'SELECT_CHAPTER',
      chapterId: newChapterId
    });
  };

  // Don't render if no chapters or invalid range
  if (allChapters.length === 0 || rangeEnd <= rangeStart) {
    return (
      <div className='w-full'>
        <div className='text-muted-foreground mb-2 text-sm'>
          No chapters in selected range
        </div>
        <div className='bg-muted text-muted-foreground flex h-8 items-center justify-center rounded text-sm'>
          Select a range with chapters to edit
        </div>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <div className='text-muted-foreground mb-2 text-sm'>
        Chapters in Range (
        {
          allChapters.filter((chapter) => {
            const startInRange =
              chapter.startTime >= rangeStart && chapter.startTime < rangeEnd;
            const endInRange =
              chapter.endTime > rangeStart && chapter.endTime <= rangeEnd;
            // Only count chapters where both times are in range
            return startInRange && endInRange;
          }).length
        }
        ): {Math.floor(rangeStart / 60)}:
        {Math.floor(rangeStart % 60)
          .toString()
          .padStart(2, '0')}{' '}
        - {Math.floor(rangeEnd / 60)}:
        {Math.floor(rangeEnd % 60)
          .toString()
          .padStart(2, '0')}
      </div>
      <SliderPrimitive.Root
        className='relative flex w-full touch-none items-center select-none'
        value={handlePositions}
        onValueChange={handleChapterChange}
        onValueCommit={handleChapterCommit}
        max={rangeEnd}
        min={rangeStart}
        step={0.1}
      >
        <SliderPrimitive.Track className='bg-muted relative h-1.5 grow overflow-hidden rounded-full'>
          {/* Render individual ranges for each chapter */}
          {memoizedChapters.map((chapter, idx) => {
            const startPercent =
              ((chapter.startTime - rangeStart) / (rangeEnd - rangeStart)) *
              100;
            const endPercent =
              ((chapter.endTime - rangeStart) / (rangeEnd - rangeStart)) * 100;

            // Only render if chapter is within the range
            if (chapter.startTime > rangeEnd || chapter.endTime < rangeStart) {
              return null;
            }

            return (
              <div
                key={`range-${chapter.id}`}
                className={`${chapter.color} absolute h-full opacity-50`}
                style={{
                  left: `${startPercent}%`,
                  width: `${endPercent - startPercent}%`,
                  zIndex: selectedChapterId === chapter.id ? 10 : 1
                }}
              />
            );
          })}
        </SliderPrimitive.Track>

        {/* Render thumbs for each chapter */}
        {visibleChapters.map((chapter, idx) => {
          return (
            <React.Fragment key={`thumbs-frag-${chapter.id}-${idx}`}>
              <SliderPrimitive.Thumb
                key={`thumb1-${chapter.id}`}
                className={`border-primary ${chapter.color} ring-ring/50 block size-3 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50`}
              />
              <SliderPrimitive.Thumb
                key={`thumb2-${chapter.id}`}
                className={`border-primary ${chapter.color} ring-ring/50 block size-3 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50`}
              />
            </React.Fragment>
          );
        })}
      </SliderPrimitive.Root>

      {/* Chapter edit buttons */}
      <VideoChapterEditButtons
        chapters={memoizedChapters}
        selectedChapterId={selectedChapterId}
        onChapterClick={handleChapterClick}
      />
    </div>
  );
};

export default VideoChapterSlider;
