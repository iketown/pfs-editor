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

const editModes = [
  { label: 'Play', value: 'playing' },
  { label: 'Funscript', value: 'funscript_editing' },
  { label: 'Chapters', value: 'chapters_editing' },
  { label: 'Zoom', value: 'zoom_editing' },
  { label: 'ROI', value: 'roi_editing' },
  { label: 'Motion', value: 'motion_editing' }
];

export default function ControlPanel() {
  const { send } = useEditActorRef();

  // Get the current editing substate
  const currentEditingState = useEditSelector((state) => {
    if (state.matches('editing')) {
      if (state.matches('editing.funscript_editing'))
        return 'funscript_editing';
      if (state.matches('editing.chapters_editing')) return 'chapters_editing';
      if (state.matches('editing.zoom_editing')) return 'zoom_editing';
      if (state.matches('editing.roi_editing')) return 'roi_editing';
      if (state.matches('editing.motion_editing')) return 'motion_editing';
      return 'playing';
    }
    return 'playing';
  });

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'funscript_editing':
        send({ type: 'SWITCH_TO_FUNSCRIPT_EDITING' });
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
      <CardHeader>
        <CardTitle>Controls</CardTitle>
        <CardDescription>Project editing controls and settings</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={currentEditingState}
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

          <TabsContent value='playing' className='mt-4'>
            <div className='bg-muted flex h-48 items-center justify-center rounded'>
              <p className='text-muted-foreground'>Video playback mode</p>
            </div>
          </TabsContent>

          <TabsContent value='funscript_editing' className='mt-4'>
            <div className='bg-muted flex h-48 items-center justify-center rounded'>
              <p className='text-muted-foreground'>
                Funscript editing controls
              </p>
            </div>
          </TabsContent>

          <TabsContent value='chapters_editing' className='mt-4'>
            <div className='bg-muted flex h-48 items-center justify-center rounded'>
              <p className='text-muted-foreground'>Chapter editing controls</p>
            </div>
          </TabsContent>

          <TabsContent value='zoom_editing' className='mt-4'>
            <div className='bg-muted flex h-48 items-center justify-center rounded'>
              <p className='text-muted-foreground'>Zoom editing controls</p>
            </div>
          </TabsContent>

          <TabsContent value='roi_editing' className='mt-4'>
            <div className='bg-muted flex h-48 items-center justify-center rounded'>
              <p className='text-muted-foreground'>ROI editing controls</p>
            </div>
          </TabsContent>

          <TabsContent value='motion_editing' className='mt-4'>
            <div className='bg-muted flex h-48 items-center justify-center rounded'>
              <p className='text-muted-foreground'>Motion editing controls</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
