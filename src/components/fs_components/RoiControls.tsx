'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ROI } from '@/types/roi-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus, Save, Trash2, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  // useRoiSelector,
  useFsEditActorRef,
  useProjectParentSelector,
  useRoiActorRef
} from './ProjectParentMachineCtx';
import { useRoiSelector } from './TypedSelectors';

// Form schema for ROI validation
const roiFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  x: z.number().min(0, 'X must be 0 or greater'),
  y: z.number().min(0, 'Y must be 0 or greater'),
  w: z.number().min(1, 'Width must be at least 1'),
  h: z.number().min(1, 'Height must be at least 1'),
  timeStart: z.number().min(0, 'Start time must be 0 or greater')
});

type RoiFormData = z.infer<typeof roiFormSchema>;

const RoiControls: React.FC = () => {
  const { send: roiSend } = useRoiActorRef();
  const { send: editSend } = useFsEditActorRef();

  // Get state from roi machine
  const roisObject = useRoiSelector((state) => state.context.rois);
  const selectedROIid = useRoiSelector((state) => state.context.selectedROIid);

  // Get current video time from edit machine
  const currentTime = useProjectParentSelector(
    (state) => state.context.currentTime
  );

  // Local state for editing
  const [editingROI, setEditingROI] = useState<ROI | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Convert rois object to array and sort by start time
  const rois = Object.values(roisObject).sort(
    (a, b) => a.timeStart - b.timeStart
  );

  // Format time from seconds to MM:SS (for display purposes)
  const formatTime = (timeSeconds: number): string => {
    const totalSeconds = Math.floor(timeSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Parse MM:SS format to seconds
  const parseTime = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    return 0;
  };

  // Create form instance
  const form = useForm<RoiFormData>({
    resolver: zodResolver(roiFormSchema),
    defaultValues: {
      title: '',
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      timeStart: 0
    }
  });

  // Watch form values for change detection
  const watchedValues = form.watch();
  const [originalValues, setOriginalValues] = useState<RoiFormData | null>(
    null
  );

  // Check if form has changes
  const hasChanges =
    originalValues &&
    Object.keys(watchedValues).some(
      (key) =>
        watchedValues[key as keyof RoiFormData] !==
        originalValues[key as keyof RoiFormData]
    );

  // Handle selecting an ROI for editing
  const handleSelectROI = useCallback(
    (roi: ROI) => {
      const formData: RoiFormData = {
        title: roi.title || `ROI ${roi.id}`,
        x: roi.x,
        y: roi.y,
        w: roi.w,
        h: roi.h,
        timeStart: roi.timeStart
      };

      form.reset(formData);
      setOriginalValues(formData);
      setEditingROI(roi);
      setIsEditing(true);
      roiSend({ type: 'SELECT_ROI', roiId: roi.id });
      editSend({ type: 'SEEK_VIDEO', time: roi.timeStart });
    },
    [form, roiSend, editSend]
  );

  // Handle saving ROI changes
  const handleSaveROI = useCallback(
    (data: RoiFormData) => {
      if (!editingROI) return;

      const updatedROI: ROI = {
        ...editingROI,
        title: data.title,
        x: data.x,
        y: data.y,
        w: data.w,
        h: data.h,
        timeStart: data.timeStart
      };

      console.log('handleSaveROI', updatedROI);
      roiSend({ type: 'UPDATE_ROI', roi: updatedROI });
      setIsEditing(false);
      setEditingROI(null);
      setOriginalValues(null);
    },
    [roiSend, editingROI]
  );

  // Handle canceling edits
  const handleCancelEdit = useCallback(() => {
    if (originalValues) {
      form.reset(originalValues);
    }
    setIsEditing(false);
    setEditingROI(null);
    setOriginalValues(null);
    roiSend({ type: 'SELECT_ROI', roiId: null });
  }, [roiSend, form, originalValues]);

  // Handle deleting an ROI
  const handleDeleteROI = useCallback(
    (roiId: string) => {
      roiSend({ type: 'REMOVE_ROI', roiId });
      if (editingROI?.id === roiId) {
        setIsEditing(false);
        setEditingROI(null);
        setOriginalValues(null);
      }
    },
    [roiSend, editingROI?.id]
  );

  // Handle creating a new ROI at current time
  const handleAddROI = useCallback(() => {
    const newROI: ROI = {
      id: nanoid(8),
      title: `ROI ${rois.length + 1}`,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      timeStart: currentTime
    };
    roiSend({ type: 'ADD_ROI', roi: newROI });
  }, [currentTime, rois.length, roiSend]);

  // Handle ROI accordion trigger click
  const handleClickROIListItem = useCallback(
    (value: string) => {
      roiSend({ type: 'SELECT_ROI', roiId: value });
      if (!!value) {
        // send a VIDEO_TIME_UPDATE event to the roi machine
        const roi = roisObject[value];
        console.log('selected roi', roi);

        if (roi) {
          editSend({ type: 'VIDEO_TIME_UPDATE', time: roi.timeStart });
        }
      }
    },
    [roiSend, roisObject, editSend]
  );

  // Handle setting start time to current video time
  const handleSetCurrentTime = useCallback(() => {
    form.setValue('timeStart', currentTime);
  }, [form, currentTime]);

  return (
    <div className='space-y-4'>
      {/* ROIs List */}
      {rois.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>ROIs</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion
              type='single'
              onValueChange={handleClickROIListItem}
              collapsible
              value={selectedROIid || ''}
              className='space-y-2'
            >
              {rois.map((roi) => {
                const isCurrentlyEditing =
                  isEditing && editingROI?.id === roi.id;

                return (
                  <AccordionItem
                    key={roi.id}
                    value={roi.id}
                    className='rounded-lg border'
                  >
                    <AccordionTrigger className='px-4 py-3 hover:no-underline'>
                      <div className='flex w-full items-center justify-between pr-4'>
                        <span className='font-medium'>
                          {roi.title || `ROI ${roi.id}`}
                        </span>
                        <span className='text-muted-foreground text-sm'>
                          Starts at {formatTime(roi.timeStart)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='space-y-4 px-4 pb-4'>
                      {isCurrentlyEditing ? (
                        <Form {...form}>
                          <form
                            onSubmit={form.handleSubmit(handleSaveROI)}
                            className='space-y-4'
                          >
                            {/* Title */}
                            <FormField
                              control={form.control}
                              name='title'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input placeholder='ROI Title' {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Coordinates and Dimensions */}
                            <div className='grid grid-cols-4 gap-2'>
                              <FormField
                                control={form.control}
                                name='x'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>X</FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='y'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Y</FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='w'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Width</FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='h'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Height</FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Start Time */}
                            <div className='grid grid-cols-2 gap-2'>
                              <FormField
                                control={form.control}
                                name='timeStart'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='MM:SS'
                                        value={formatTime(field.value)}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseTime(e.target.value)
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className='flex flex-col justify-end'>
                                <Button
                                  type='button'
                                  variant='outline'
                                  onClick={handleSetCurrentTime}
                                  className='text-sm'
                                >
                                  Set to {formatTime(currentTime)}
                                </Button>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className='flex justify-end space-x-2'>
                              <Button
                                type='button'
                                size='sm'
                                variant='outline'
                                onClick={handleCancelEdit}
                              >
                                <X className='h-4 w-4' />
                              </Button>
                              <Button
                                type='submit'
                                size='sm'
                                variant='outline'
                                disabled={!hasChanges}
                              >
                                <Save className='h-4 w-4' />
                              </Button>
                            </div>
                          </form>
                        </Form>
                      ) : (
                        <>
                          {/* Read-only view */}
                          <div className='grid grid-cols-4 gap-2'>
                            <div>
                              <label className='text-sm font-medium'>X</label>
                              <div className='text-muted-foreground text-sm'>
                                {roi.x}
                              </div>
                            </div>
                            <div>
                              <label className='text-sm font-medium'>Y</label>
                              <div className='text-muted-foreground text-sm'>
                                {roi.y}
                              </div>
                            </div>
                            <div>
                              <label className='text-sm font-medium'>
                                Width
                              </label>
                              <div className='text-muted-foreground text-sm'>
                                {roi.w}
                              </div>
                            </div>
                            <div>
                              <label className='text-sm font-medium'>
                                Height
                              </label>
                              <div className='text-muted-foreground text-sm'>
                                {roi.h}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className='text-sm font-medium'>
                              Start Time
                            </label>
                            <div className='text-muted-foreground text-sm'>
                              {formatTime(roi.timeStart)}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className='flex justify-between space-x-2'>
                            <div>
                              <Button size={'sm'} variant={'outline'}>
                                Delete
                              </Button>
                            </div>
                            <div className='flex space-x-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handleSelectROI(roi)}
                              >
                                <Edit className='h-4 w-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='destructive'
                                onClick={() => handleDeleteROI(roi.id)}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Add ROI Button */}
      <Button onClick={handleAddROI} className='w-full' variant='outline'>
        <Plus className='mr-2 h-4 w-4' />
        ADD ROI at {formatTime(currentTime)}
      </Button>
    </div>
  );
};

export default RoiControls;
