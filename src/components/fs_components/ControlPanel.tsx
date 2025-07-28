'use client';

import { useEditActorRef, useEditSelector } from './FsEditActorContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

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
  const editMode = useEditSelector((state) => {
    if (state.matches('editing')) {
      if (state.matches('editing.fsaction_editing')) return 'fsaction_editing';
      if (state.matches('editing.chapters_editing')) return 'chapters_editing';
      if (state.matches('editing.zoom_editing')) return 'zoom_editing';
      if (state.matches('editing.roi_editing')) return 'roi_editing';
      if (state.matches('editing.motion_editing')) return 'motion_editing';
      return 'playing';
    }
    return 'playing';
  });

  const fsChapters = useEditSelector((state) => state.context.fsChapters);
  const params = useParams();
  const projectId = params.project_id as string;
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChapters = async () => {
    if (!projectId) {
      console.error('No project ID available');
      return;
    }

    setIsSaving(true);
    try {
      send({ type: 'SAVE_PROJECT', projectId });
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
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div>
          <CardTitle className='text-sm font-medium'>Controls</CardTitle>
          <CardDescription>
            Switch between different editing modes
          </CardDescription>
        </div>
        <Button
          onClick={handleSaveChapters}
          disabled={isSaving}
          size='sm'
          variant='outline'
        >
          <Save className='mr-2 h-4 w-4' />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </CardHeader>
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
    </Card>
  );
};

export default ControlPanel;
