'use client';

import React, { useState, useCallback } from 'react';
import { useMotionSelector, useMotionActorRef } from './MotionActorContext';
import { useEditSelector } from './FsEditActorContext';
import { ROI } from '@/types/roi-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Edit, Plus, Save, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { nanoid } from 'nanoid';

const RoiControls: React.FC = () => {
  const { send: motionSend } = useMotionActorRef();

  // Get state from motion machine
  const roisObject = useMotionSelector((state) => state.context.rois);
  const selectedROIid = useMotionSelector(
    (state) => state.context.selectedROIid
  );

  // Get current video time from edit machine
  const videoTime = useEditSelector((state) => state.context.videoTime);

  // Local state for editing
  const [editingROI, setEditingROI] = useState<ROI | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Convert rois object to array and sort by start time
  const rois = Object.values(roisObject).sort(
    (a, b) => a.timeStart - b.timeStart
  );

  // Format time from milliseconds to MM:SS (for display purposes)
  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Parse MM:SS format to milliseconds
  const parseTime = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return (minutes * 60 + seconds) * 1000;
    }
    return 0;
  };

  // Handle selecting an ROI for editing
  const handleSelectROI = useCallback(
    (roi: ROI) => {
      setEditingROI({ ...roi });
      setIsEditing(true);
      motionSend({ type: 'SELECT_ROI', roiId: roi.id });
    },
    [motionSend]
  );

  // Handle saving ROI changes
  const handleSaveROI = useCallback(
    (roi: ROI) => {
      console.log('handleSaveROI', roi);
      motionSend({ type: 'UPDATE_ROI', roi });
      setIsEditing(false);
      setEditingROI(null);
    },
    [motionSend]
  );

  // Handle canceling edits
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingROI(null);
    motionSend({ type: 'SELECT_ROI', roiId: null });
  }, [motionSend]);

  // Handle deleting an ROI
  const handleDeleteROI = useCallback(
    (roiId: string) => {
      motionSend({ type: 'REMOVE_ROI', roiId });
      if (editingROI?.id === roiId) {
        setIsEditing(false);
        setEditingROI(null);
      }
    },
    [motionSend, editingROI?.id]
  );

  // Handle creating a new ROI at current time
  const handleAddROI = useCallback(() => {
    const currentTimeMs = videoTime * 1000; // Convert to milliseconds
    const newROI: ROI = {
      id: nanoid(8),
      title: `ROI ${rois.length + 1}`,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      timeStart: currentTimeMs,
      timeEnd: currentTimeMs + 5000 // 5 seconds duration
    };
    motionSend({ type: 'ADD_ROI', roi: newROI });
  }, [videoTime, rois.length, motionSend]);

  // Handle input changes during editing
  const handleInputChange = useCallback(
    (field: keyof ROI, value: string) => {
      if (!editingROI) return;

      let parsedValue: number | string = value;

      // Parse time fields
      if (field === 'timeStart' || field === 'timeEnd') {
        parsedValue = parseTime(value);
      } else if (
        field === 'x' ||
        field === 'y' ||
        field === 'w' ||
        field === 'h'
      ) {
        parsedValue = parseFloat(value) || 0;
      }

      setEditingROI({
        ...editingROI,
        [field]: parsedValue
      });
    },
    [editingROI]
  );

  // Handle ROI accordion trigger click
  const handleROIAccordionClick = useCallback(
    (roi: ROI, event: React.MouseEvent) => {
      const trigger = event.currentTarget as HTMLElement;
      const isExpanded = trigger.getAttribute('data-state') === 'open';

      if (isExpanded) {
        // If it's currently expanded, clicking will close it - deselect the ROI
        console.log('Closing accordion, deselecting ROI');
        motionSend({ type: 'SELECT_ROI', roiId: null });
      } else {
        // If it's currently closed, clicking will open it - select the ROI
        console.log('Opening accordion, selecting ROI', roi);
        motionSend({ type: 'SELECT_ROI', roiId: roi.id });
      }
    },
    [motionSend]
  );

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
              value={selectedROIid || undefined}
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
                    <AccordionTrigger
                      className='px-4 py-3 hover:no-underline'
                      onClick={(event) => handleROIAccordionClick(roi, event)}
                    >
                      <div className='flex w-full items-center justify-between pr-4'>
                        <span className='font-medium'>
                          {roi.title || `ROI ${roi.id}`}
                        </span>
                        <span className='text-muted-foreground text-sm'>
                          {formatTime(roi.timeStart)} -{' '}
                          {formatTime(roi.timeEnd)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='space-y-4 px-4 pb-4'>
                      {/* Coordinates and Dimensions */}
                      <div className='grid grid-cols-4 gap-2'>
                        <div>
                          <Label htmlFor={`x-${roi.id}`}>x</Label>
                          <Input
                            id={`x-${roi.id}`}
                            value={
                              isCurrentlyEditing
                                ? (editingROI?.x ?? roi.x)
                                : roi.x
                            }
                            onChange={(e) =>
                              handleInputChange('x', e.target.value)
                            }
                            disabled={!isCurrentlyEditing}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`y-${roi.id}`}>y</Label>
                          <Input
                            id={`y-${roi.id}`}
                            value={
                              isCurrentlyEditing
                                ? (editingROI?.y ?? roi.y)
                                : roi.y
                            }
                            onChange={(e) =>
                              handleInputChange('y', e.target.value)
                            }
                            disabled={!isCurrentlyEditing}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`w-${roi.id}`}>w</Label>
                          <Input
                            id={`w-${roi.id}`}
                            value={
                              isCurrentlyEditing
                                ? (editingROI?.w ?? roi.w)
                                : roi.w
                            }
                            onChange={(e) =>
                              handleInputChange('w', e.target.value)
                            }
                            disabled={!isCurrentlyEditing}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`h-${roi.id}`}>h</Label>
                          <Input
                            id={`h-${roi.id}`}
                            value={
                              isCurrentlyEditing
                                ? (editingROI?.h ?? roi.h)
                                : roi.h
                            }
                            onChange={(e) =>
                              handleInputChange('h', e.target.value)
                            }
                            disabled={!isCurrentlyEditing}
                          />
                        </div>
                      </div>

                      {/* Time Range */}
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <Label htmlFor={`timeStart-${roi.id}`}>
                            Start Time
                          </Label>
                          <Input
                            id={`timeStart-${roi.id}`}
                            value={formatTime(
                              isCurrentlyEditing
                                ? (editingROI?.timeStart ?? roi.timeStart)
                                : roi.timeStart
                            )}
                            onChange={(e) =>
                              handleInputChange('timeStart', e.target.value)
                            }
                            disabled={!isCurrentlyEditing}
                            placeholder='MM:SS'
                          />
                        </div>
                        <div>
                          <Label htmlFor={`timeEnd-${roi.id}`}>End Time</Label>
                          <Input
                            id={`timeEnd-${roi.id}`}
                            value={formatTime(
                              isCurrentlyEditing
                                ? (editingROI?.timeEnd ?? roi.timeEnd)
                                : roi.timeEnd
                            )}
                            onChange={(e) =>
                              handleInputChange('timeEnd', e.target.value)
                            }
                            disabled={!isCurrentlyEditing}
                            placeholder='MM:SS'
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className='flex justify-end space-x-2'>
                        {!isCurrentlyEditing ? (
                          <>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleSelectROI(roi)}
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleDeleteROI(roi.id)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleSaveROI(editingROI!)}
                            >
                              <Save className='h-4 w-4' />
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={handleCancelEdit}
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </>
                        )}
                      </div>
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
        ADD ROI at {formatTime(videoTime * 1000)}
      </Button>
    </div>
  );
};

export default RoiControls;
