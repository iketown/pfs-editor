'use client';

import React, { useMemo, useCallback, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as Popover from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown } from 'lucide-react';
import { useEditActorRef, useEditSelector } from './FsEditActorContext';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

interface VideoChapterSliderProps {
  onChaptersChange?: (chapters: any[]) => void;
}

interface ChapterFormData {
  title: string;
  startTime: number;
  endTime: number;
}

const VideoChapterSlider: React.FC<VideoChapterSliderProps> = ({
  onChaptersChange
}) => {
  const { send } = useEditActorRef();
  const fsChapters = useEditSelector((state) => state.context.fsChapters);
  const rangeStart = useEditSelector((state) => state.context.rangeStart);
  const rangeEnd = useEditSelector((state) => state.context.rangeEnd);
  const selectedChapterId = useEditSelector(
    (state) => state.context.selectedChapterId
  );
  const params = useParams();
  const projectId = params.project_id as string;

  // State for popover
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ChapterFormData>({
    title: '',
    startTime: 0,
    endTime: 0
  });
  const [validationErrors, setValidationErrors] = useState<{
    startTime?: string;
    endTime?: string;
  }>({});

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

        // Check if chapter overlaps with the range (start time in range OR end time in range OR chapter spans the range)
        const startInRange =
          chapter.startTime >= rangeStart && chapter.startTime < rangeEnd;
        const endInRange =
          chapter.endTime > rangeStart && chapter.endTime <= rangeEnd;
        const spansRange =
          chapter.startTime <= rangeStart && chapter.endTime >= rangeEnd;

        return startInRange || endInRange || spansRange;
      })
      .map((chapter) => [chapter.startTime, chapter.endTime])
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

      // Check if chapter overlaps with the range (start time in range OR end time in range OR chapter spans the range)
      const startInRange =
        chapter.startTime >= rangeStart && chapter.startTime < rangeEnd;
      const endInRange =
        chapter.endTime > rangeStart && chapter.endTime <= rangeEnd;
      const spansRange =
        chapter.startTime <= rangeStart && chapter.endTime >= rangeEnd;

      return startInRange || endInRange || spansRange;
    });
  }, [memoizedChapters, rangeStart, rangeEnd, selectedChapterId]);

  // Handle chapter slider change
  const handleChapterChange = useCallback(
    (values: number[]) => {
      if (rangeEnd <= rangeStart) return;

      // Get visible chapters for this update
      const visibleChapters = allChapters.filter((chapter) => {
        return (
          chapter.startTime < rangeEnd &&
          chapter.startTime >= rangeStart &&
          chapter.endTime >= rangeStart &&
          chapter.endTime < rangeEnd
        );
      });

      // Find which chapter changed by comparing values
      for (let i = 0; i < values.length; i += 2) {
        const chapterIndex = Math.floor(i / 2);
        if (chapterIndex < visibleChapters.length) {
          const chapter = visibleChapters[chapterIndex];
          const newStartTime = values[i];
          const newEndTime = values[i + 1];
          const startChanged =
            Math.abs(newStartTime - chapter.startTime) > 0.01;
          const endChanged = Math.abs(newEndTime - chapter.endTime) > 0.01;
          // Only update if values actually changed
          if (startChanged) {
            send({ type: 'SEEK_VIDEO', time: newStartTime });
          }
          if (endChanged) {
            send({ type: 'SEEK_VIDEO', time: newEndTime });
          }
          if (startChanged || endChanged) {
            send({
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
    [allChapters, rangeStart, rangeEnd, send]
  );

  const handleChapterCommit = useCallback(
    (values: number[]) => {
      handleChapterChange(values);

      // Auto-save to backend after chapter changes are committed
      if (projectId) {
        send({ type: 'SAVE_PROJECT', projectId });
      }
    },
    [handleChapterChange, projectId, send]
  );

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse time input (accepts MM:SS format)
  const parseTimeInput = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    return 0;
  };

  // Validate form data
  const validateForm = (
    data: ChapterFormData,
    chapterId: string
  ): { startTime?: string; endTime?: string } => {
    const errors: { startTime?: string; endTime?: string } = {};
    const currentChapterIndex = memoizedChapters.findIndex(
      (c) => c.id === chapterId
    );

    if (currentChapterIndex === -1) return errors;

    // Check start time against previous chapter
    if (currentChapterIndex > 0) {
      const previousChapter = memoizedChapters[currentChapterIndex - 1];
      if (data.startTime <= previousChapter.endTime) {
        errors.startTime = `start time must be after the previous chapter's (${previousChapter.title}) end time`;
      }
    }

    // Check end time against next chapter
    if (currentChapterIndex < memoizedChapters.length - 1) {
      const nextChapter = memoizedChapters[currentChapterIndex + 1];
      if (data.endTime >= nextChapter.startTime) {
        errors.endTime = `end time must be before the next chapter's (${nextChapter.title}) start time`;
      }
    }

    // Check that start time is before end time
    if (data.startTime >= data.endTime) {
      errors.endTime = 'end time must be after start time';
    }

    return errors;
  };

  // Handle form input changes
  const handleFormChange = (
    field: keyof ChapterFormData,
    value: string | number
  ) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (openPopoverId) {
      const errors = validateForm(newFormData, openPopoverId);
      setValidationErrors(errors);
    }
  };

  // Handle chapter button click (main area) - select chapter and set range
  const handleChapterClick = (chapter: (typeof memoizedChapters)[0]) => {
    // Toggle selection: if already selected, deselect; otherwise select
    const newChapterId = selectedChapterId === chapter.id ? null : chapter.id;
    send({
      type: 'SELECT_CHAPTER',
      chapterId: newChapterId
    });
  };

  // Handle popover open (caret area)
  const handlePopoverOpen = (chapter: (typeof memoizedChapters)[0]) => {
    setFormData({
      title: chapter.title,
      startTime: chapter.startTime,
      endTime: chapter.endTime
    });
    setValidationErrors({});
    setOpenPopoverId(chapter.id);
  };

  // Handle form save
  const handleSave = () => {
    if (openPopoverId && Object.keys(validationErrors).length === 0) {
      send({
        type: 'UPDATE_CHAPTER_AND_SAVE',
        chapterId: openPopoverId,
        title: formData.title,
        startTime: formData.startTime,
        endTime: formData.endTime,
        projectId: projectId
      });
      setOpenPopoverId(null);
    }
  };

  // Handle form cancel
  const handleCancel = () => {
    setOpenPopoverId(null);
    setValidationErrors({});
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
          allChapters.filter(
            (chapter) =>
              chapter.startTime < rangeEnd &&
              chapter.startTime >= rangeStart &&
              chapter.endTime >= rangeStart &&
              chapter.endTime < rangeEnd
          ).length
        }
        ): {formatTime(rangeStart)} - {formatTime(rangeEnd)}
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

      {/* Chapter buttons in horizontally scrollable container */}
      <div className='mt-4'>
        <div className='text-muted-foreground mb-2 text-sm font-medium'>
          All Chapters ({allChapters.length})
        </div>
        <div className='scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent flex gap-2 overflow-x-auto pb-2'>
          {memoizedChapters.map((chapter) => (
            <Popover.Root
              key={chapter.id}
              open={openPopoverId === chapter.id}
              onOpenChange={(open) => {
                if (!open) setOpenPopoverId(null);
              }}
            >
              <div className='flex items-center'>
                <Button
                  variant={
                    selectedChapterId === chapter.id ? 'default' : 'outline'
                  }
                  size='sm'
                  className='shrink-0 rounded-r-none whitespace-nowrap'
                  onClick={() => handleChapterClick(chapter)}
                >
                  {chapter.title} ({formatTime(chapter.startTime)} -{' '}
                  {formatTime(chapter.endTime)})
                </Button>
                <Popover.Trigger asChild>
                  <Button
                    variant={
                      selectedChapterId === chapter.id ? 'default' : 'outline'
                    }
                    size='sm'
                    className='shrink-0 rounded-l-none border-l-0 px-2'
                    onClick={() => handlePopoverOpen(chapter)}
                  >
                    <ChevronDown className='h-4 w-4' />
                  </Button>
                </Popover.Trigger>
              </div>
              <Popover.Content
                className='bg-background w-80 rounded-md border p-4 shadow-lg'
                align='start'
              >
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <h4 className='leading-none font-medium'>Edit Chapter</h4>
                    <p className='text-muted-foreground text-sm'>
                      Update chapter properties
                    </p>
                  </div>
                  <div className='space-y-3'>
                    <div className='space-y-2'>
                      <Label htmlFor='title'>Title</Label>
                      <Input
                        id='title'
                        value={formData.title}
                        onChange={(e) =>
                          handleFormChange('title', e.target.value)
                        }
                        placeholder='Chapter title'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='startTime'>Start Time (MM:SS)</Label>
                      <Input
                        id='startTime'
                        value={formatTime(formData.startTime)}
                        onChange={(e) =>
                          handleFormChange(
                            'startTime',
                            parseTimeInput(e.target.value)
                          )
                        }
                        placeholder='0:00'
                        className={cn(
                          validationErrors.startTime && 'border-red-500'
                        )}
                      />
                      {validationErrors.startTime && (
                        <p className='text-sm text-red-500'>
                          {validationErrors.startTime}
                        </p>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='endTime'>End Time (MM:SS)</Label>
                      <Input
                        id='endTime'
                        value={formatTime(formData.endTime)}
                        onChange={(e) =>
                          handleFormChange(
                            'endTime',
                            parseTimeInput(e.target.value)
                          )
                        }
                        placeholder='0:00'
                        className={cn(
                          validationErrors.endTime && 'border-red-500'
                        )}
                      />
                      {validationErrors.endTime && (
                        <p className='text-sm text-red-500'>
                          {validationErrors.endTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='flex gap-2 pt-2'>
                    <Button
                      variant='outline'
                      onClick={handleCancel}
                      className='flex-1'
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={Object.keys(validationErrors).length > 0}
                      className='flex-1'
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </Popover.Content>
            </Popover.Root>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoChapterSlider;
