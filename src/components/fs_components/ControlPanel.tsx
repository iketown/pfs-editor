'use client';

import { useEditActorRef, useEditSelector } from './FsEditActorContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { useEditState } from '@/hooks/use-editstate';

const editModes = [
  { label: 'Play', value: 'playing' },
  { label: 'Actions', value: 'fsaction_editing' },
  { label: 'Chapters', value: 'chapters_editing' },
  { label: 'Zoom', value: 'zoom_editing' },
  { label: 'ROI', value: 'roi_editing' },
  { label: 'Motion', value: 'motion_editing' }
];

const ControlPanel = () => {
  const { send } = useEditActorRef();

  // Get the current editing substate
  const editMode = useEditState();

  const fsChapters = useEditSelector((state) => state.context.fsChapters);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChapters = async () => {
    setIsSaving(true);
    try {
      send({ type: 'SAVE_PROJECT' });
      console.log('Chapters saved successfully');
    } catch (error) {
      console.error('Failed to save chapters:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'fsaction_editing':
        send({ type: 'SWITCH_TO_FSACTIONS_EDITING' });
        break;
      case 'chapters_editing':
        send({ type: 'SWITCH_TO_CHAPTERS_EDITING' });
        break;
      case 'zoom_editing':
        send({ type: 'SWITCH_TO_ZOOM_EDITING' });
        break;
      case 'roi_editing':
        send({ type: 'SWITCH_TO_ROI_EDITING' });
        break;
      case 'motion_editing':
        send({ type: 'SWITCH_TO_MOTION_EDITING' });
        break;
      case 'playing':
        send({ type: 'SWITCH_TO_PLAYING' });
        break;
    }
  };

  return (
    <Card>
      <CardContent>
        <Tabs
          value={editMode}
          onValueChange={handleTabChange}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-6'>
            {editModes.map((mode) => (
              <TabsTrigger key={mode.value} value={mode.value}>
                {mode.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {editModes.map((mode) => (
            <TabsContent key={mode.value} value={mode.value}>
              <div className='text-muted-foreground text-center text-sm'>
                {mode.label} mode active
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className='flex justify-end'>
        <Button
          onClick={handleSaveChapters}
          disabled={isSaving}
          size='sm'
          variant='outline'
        >
          <Save className='mr-2 h-4 w-4' />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ControlPanel;
