'use client';

import React, { useState, useCallback } from 'react';
import { useMotionSelector, useMotionActorRef } from './MotionActorContext';
import { useEditSelector } from './FsEditActorContext';
import { ROI } from '@/types/roi-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { nanoid } from 'nanoid';
import RoiControlActive from './RoiControlActive';

const RoiControls: React.FC = () => {
  const { send: motionSend } = useMotionActorRef();

  // Get state from motion machine
  const roisObject = useMotionSelector((state) => state.context.rois);
  const selectedROIid = useMotionSelector(
    (state) => state.context.selectedROIid
  );
  const activeROI = useMotionSelector((state) => state.context.activeROI);

  // Get current video time from edit machine
  const videoTime = useEditSelector((state) => state.context.videoTime);

  // Local state for editing
  const [editingROI, setEditingROI] = useState<ROI | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedInactive, setExpandedInactive] = useState<Set<string>>(
    new Set()
  );

  // Convert rois object to array for easier manipulation
  const rois = Object.values(roisObject);

  // Format time from milliseconds to MM:SS (for display purposes)
  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  // Toggle expanded state for inactive ROIs
  const toggleExpanded = useCallback((roiId: string) => {
    setExpandedInactive((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(roiId)) {
        newExpanded.delete(roiId);
      } else {
        newExpanded.add(roiId);
      }
      return newExpanded;
    });
  }, []);

  // Separate active and inactive ROIs
  const currentTimeMs = videoTime * 1000; // Convert video time to milliseconds
  const activeROIs = rois.filter(
    (roi) => roi.timeStart <= currentTimeMs && roi.timeEnd >= currentTimeMs
  );
  const inactiveROIs = rois.filter(
    (roi) => roi.timeStart > currentTimeMs || roi.timeEnd < currentTimeMs
  );

  // Get the ROI to display (selected ROI if editing, otherwise first active ROI)
  const displayROI =
    editingROI ||
    (selectedROIid ? roisObject[selectedROIid] : null) ||
    activeROIs[0];

  return (
    <div className='space-y-4'>
      {/* Active ROI Section */}
      {displayROI && (
        <RoiControlActive
          roi={displayROI}
          isEditing={isEditing}
          onEdit={handleSelectROI}
          onSave={handleSaveROI}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteROI}
        />
      )}

      {/* Inactive ROIs Section */}
      {inactiveROIs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Inactive ROIs</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {inactiveROIs.map((roi, index) => (
              <div key={roi.id}>
                <div className='flex items-center justify-between rounded border p-2'>
                  <div className='flex items-center space-x-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => toggleExpanded(roi.id)}
                    >
                      {expandedInactive.has(roi.id) ? (
                        <ChevronDown className='h-4 w-4' />
                      ) : (
                        <ChevronRight className='h-4 w-4' />
                      )}
                    </Button>
                    <span className='font-medium'> {roi.title || roi.id}</span>
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleSelectROI(roi)}
                  >
                    <Edit className='h-4 w-4' />
                  </Button>
                </div>

                {expandedInactive.has(roi.id) && (
                  <div className='bg-muted mt-2 ml-6 space-y-2 rounded p-2'>
                    <div className='text-sm'>
                      <span className='font-medium'>Time:</span>{' '}
                      {formatTime(roi.timeStart)} - {formatTime(roi.timeEnd)}
                    </div>
                    <div className='text-sm'>
                      <span className='font-medium'>Position:</span> x: {roi.x},
                      y: {roi.y}, w: {roi.w}, h: {roi.h}
                    </div>
                  </div>
                )}
              </div>
            ))}
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
