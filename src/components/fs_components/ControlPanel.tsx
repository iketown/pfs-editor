'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  useCurrentMode,
  useFsEditActorRef,
  useFsEditSelector,
  useSwitchMode
} from './ProjectParentMachineCtx';
import RoiControls from './RoiControls';
import { Download, RefreshCw } from 'lucide-react';
import type { Project } from '@/lib/db/types';

interface ControlPanelProps {
  project: Project;
  chaptersExist: boolean;
  showImportButton: boolean;
  showReimportButton: boolean;
  onImportChapters: () => void;
  onReimportChapters: () => void;
}

const editModes = [
  { label: 'Play', value: 'playing' },
  { label: 'Actions', value: 'fsaction_editing' },
  { label: 'Chapters', value: 'chapters_editing' },
  { label: 'Zoom', value: 'zoom_editing' },
  { label: 'ROI', value: 'roi_editing' },
  { label: 'Motion', value: 'motion_editing' }
];

const ControlPanel = ({
  project,
  chaptersExist,
  showImportButton,
  showReimportButton,
  onImportChapters,
  onReimportChapters
}: ControlPanelProps) => {
  const { send } = useFsEditActorRef();
  const switchMode = useSwitchMode();

  // Get the current editing substate
  const editMode = useCurrentMode();

  const fsChapters = useFsEditSelector((state) => state.context.fsChapters);
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
        switchMode.switchToFsActionEditing();
        break;
      case 'chapters_editing':
        switchMode.switchToChaptersEditing();
        break;
      case 'zoom_editing':
        switchMode.switchToZoomEditing();
        break;
      case 'roi_editing':
        switchMode.switchToRoiEditing();
        break;
      case 'motion_editing':
        switchMode.switchToMotionEditing();
        break;
      case 'playing':
        switchMode.switchToPlaying();
        break;
    }
  };

  const getChapterControls = () => {
    return (
      <div className='space-y-4'>
        <div className='text-muted-foreground text-sm'>
          {chaptersExist ? (
            <p>✓ Chapters loaded and ready for editing</p>
          ) : (
            <p>
              No chapters loaded. Import from funscript file to get started.
            </p>
          )}
        </div>

        {showImportButton && (
          <div className='space-y-2'>
            <Button onClick={onImportChapters} className='w-full' size='sm'>
              <Download className='mr-2 h-4 w-4' />
              Import Chapters from Funscript
            </Button>
            <p className='text-muted-foreground text-xs'>
              Import chapters from the funscript file for editing
            </p>
          </div>
        )}

        {showReimportButton && (
          <div className='space-y-2'>
            <Button
              onClick={onReimportChapters}
              variant='outline'
              className='w-full'
              size='sm'
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              Re-import Chapters
            </Button>
            <p className='text-muted-foreground text-xs'>
              Overwrite existing chapters with fresh data from funscript
            </p>
          </div>
        )}
      </div>
    );
  };

  console.log('edit mode', editMode);
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
              {mode.value === 'roi_editing' ? (
                <RoiControls />
              ) : mode.value === 'chapters_editing' ? (
                getChapterControls()
              ) : (
                <div className='text-muted-foreground text-center text-sm'>
                  {mode.label} mode active
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      {/* <CardFooter className='flex justify-end'>
        <Button
          onClick={handleSaveChapters}
          disabled={isSaving}
          size='sm'
          variant='outline'
        >
          <Save className='mr-2 h-4 w-4' />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </CardFooter> */}
    </Card>
  );
};

export default ControlPanel;
