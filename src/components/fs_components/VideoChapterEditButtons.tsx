'use client';

import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown } from 'lucide-react';
import { useEditActorRef, useEditSelector } from './FsEditActorContext';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

interface ChapterFormData {
  title: string;
  startTime: number;
  endTime: number;
}

interface VideoChapterEditButtonsProps {
  chapters: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    color: string;
  }>;
  selectedChapterId: string | null;
  onChapterClick: (chapter: any) => void;
}

const VideoChapterEditButtons: React.FC<VideoChapterEditButtonsProps> = ({
  chapters,
  selectedChapterId,
  onChapterClick
}) => {
  const { send } = useEditActorRef();
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
    const currentChapterIndex = chapters.findIndex((c) => c.id === chapterId);

    if (currentChapterIndex === -1) return errors;

    // Check start time against previous chapter
    if (currentChapterIndex > 0) {
      const previousChapter = chapters[currentChapterIndex - 1];
      if (data.startTime <= previousChapter.endTime) {
        errors.startTime = `start time must be after the previous chapter's (${previousChapter.title}) end time`;
      }
    }

    // Check end time against next chapter
    if (currentChapterIndex < chapters.length - 1) {
      const nextChapter = chapters[currentChapterIndex + 1];
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

  // Handle popover open (caret area)
  const handlePopoverOpen = (chapter: any) => {
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
        endTime: formData.endTime
      });
      setOpenPopoverId(null);
    }
  };

  // Handle form cancel
  const handleCancel = () => {
    setOpenPopoverId(null);
    setValidationErrors({});
  };

  return (
    <div className='mt-4'>
      <div className='text-muted-foreground mb-2 text-sm font-medium'>
        All Chapters ({chapters.length})
      </div>
      <div className='scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent flex gap-2 overflow-x-auto pb-2'>
        {chapters.map((chapter) => (
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
                onClick={() => onChapterClick(chapter)}
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
              className='bg-background z-50 w-80 rounded-md border p-4 shadow-lg'
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
  );
};

export default VideoChapterEditButtons;
