'use client';

import React, { useState, useCallback } from 'react';
import { ROI } from '@/types/roi-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Save, X, Trash2 } from 'lucide-react';

interface RoiControlActiveProps {
  roi: ROI;
  isEditing: boolean;
  onEdit: (roi: ROI) => void;
  onSave: (roi: ROI) => void;
  onCancel: () => void;
  onDelete: (roiId: string) => void;
}

// Format time from milliseconds to MM:SS
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

const RoiControlActive: React.FC<RoiControlActiveProps> = ({
  roi,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete
}) => {
  const [editingROI, setEditingROI] = useState<ROI | null>(null);

  // Initialize editing ROI when entering edit mode
  React.useEffect(() => {
    if (isEditing && !editingROI) {
      setEditingROI({ ...roi });
    } else if (!isEditing) {
      setEditingROI(null);
    }
  }, [isEditing, roi, editingROI]);

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

  // Handle starting edit mode
  const handleStartEdit = useCallback(() => {
    onEdit(roi);
  }, [onEdit, roi]);

  // Handle saving changes
  const handleSave = useCallback(() => {
    if (editingROI) {
      onSave(editingROI);
    }
  }, [editingROI, onSave]);

  // Handle canceling edits
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Handle deleting ROI
  const handleDelete = useCallback(() => {
    onDelete(roi.id);
  }, [onDelete, roi.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>
          {isEditing ? 'Editing' : 'Active'} ROI {roi.id}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Coordinates and Dimensions */}
        <div className='grid grid-cols-4 gap-2'>
          <div>
            <Label htmlFor='x'>x</Label>
            <Input
              id='x'
              value={editingROI?.x ?? roi.x}
              onChange={(e) => handleInputChange('x', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor='y'>y</Label>
            <Input
              id='y'
              value={editingROI?.y ?? roi.y}
              onChange={(e) => handleInputChange('y', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor='w'>w</Label>
            <Input
              id='w'
              value={editingROI?.w ?? roi.w}
              onChange={(e) => handleInputChange('w', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor='h'>h</Label>
            <Input
              id='h'
              value={editingROI?.h ?? roi.h}
              onChange={(e) => handleInputChange('h', e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Time Range */}
        <div className='grid grid-cols-2 gap-2'>
          <div>
            <Label htmlFor='timeStart'>Start Time</Label>
            <Input
              id='timeStart'
              value={formatTime(editingROI?.timeStart ?? roi.timeStart)}
              onChange={(e) => handleInputChange('timeStart', e.target.value)}
              disabled={!isEditing}
              placeholder='MM:SS'
            />
          </div>
          <div>
            <Label htmlFor='timeEnd'>End Time</Label>
            <Input
              id='timeEnd'
              value={formatTime(editingROI?.timeEnd ?? roi.timeEnd)}
              onChange={(e) => handleInputChange('timeEnd', e.target.value)}
              disabled={!isEditing}
              placeholder='MM:SS'
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end space-x-2'>
          {!isEditing ? (
            <>
              <Button size='sm' variant='outline' onClick={handleStartEdit}>
                <Edit className='h-4 w-4' />
              </Button>
              <Button size='sm' variant='outline' onClick={handleDelete}>
                <Trash2 className='h-4 w-4' />
              </Button>
            </>
          ) : (
            <>
              <Button size='sm' variant='outline' onClick={handleSave}>
                <Save className='h-4 w-4' />
              </Button>
              <Button size='sm' variant='outline' onClick={handleCancel}>
                <X className='h-4 w-4' />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoiControlActive;
