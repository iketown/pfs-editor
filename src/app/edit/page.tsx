'use client';

import ChooseVideoButton from '@/components/fs_components/ChooseVideoButton';
import FSGraph from '@/components/fs_components/FSGraph';
import FunscriptUploadButton from '@/components/fs_components/FSUploadButton';
import ContextView from '@/components/fs_components/ContextView';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { fsEditMachine } from '@/lib/fs_machines/fsEditMachine';
import type { FunscriptObject } from '@/types/funscript';
import { useMachine } from '@xstate/react';
import { useState } from 'react';

export default function EditPage() {
  const [state, send] = useMachine(fsEditMachine);
  const { videoUrl, funscript } = state.context;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleVideoSelected = (url: string, file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const event = state.matches('editing')
      ? { type: 'REPLACE_VIDEO' as const, url, file }
      : { type: 'LOAD_VIDEO' as const, url, file };
    console.log('Sending video event to XState:', event);
    send(event);
  };
  const handleFunscriptParsed = (funscriptObj: FunscriptObject) => {
    const event = state.matches('editing')
      ? { type: 'REPLACE_FUNSCRIPT' as const, funscript: funscriptObj }
      : { type: 'LOAD_FUNSCRIPT' as const, funscript: funscriptObj };
    console.log('Sending funscript event to XState:', event);
    send(event);
  };

  // Show settings card if not in editing state
  const showSettingsCard = !state.matches('editing');

  // Helper to render button with checkmark
  const renderChooseVideoButton = () => (
    <ChooseVideoButton onVideoSelected={handleVideoSelected} done={!!videoUrl}>
      Choose Video
      {videoUrl && <Icons.check className='ml-2 inline text-green-600' />}
    </ChooseVideoButton>
  );
  const renderFunscriptUploadButton = () => (
    <FunscriptUploadButton
      onFSParsed={handleFunscriptParsed}
      done={!!funscript}
    >
      Upload Funscript
      {funscript && <Icons.check className='ml-2 inline text-green-600' />}
    </FunscriptUploadButton>
  );

  // Add a debug log for state.context
  console.log('Current XState context:', state.context);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center p-8'>
      {showSettingsCard ? (
        <Card className='w-full max-w-xl'>
          <CardHeader>
            <CardTitle>Upload Video & Funscript</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            {renderChooseVideoButton()}
            {renderFunscriptUploadButton()}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Minimized settings gear icon */}
          <div className='fixed top-4 left-4 z-50'>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <button
                  className='bg-background hover:bg-accent rounded-full border p-2 shadow transition-colors'
                  aria-label='Settings'
                >
                  <Icons.settings className='h-6 w-6' />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Replace Video or Funscript</DialogTitle>
                </DialogHeader>
                <div className='flex flex-col gap-4'>
                  {renderChooseVideoButton()}
                  {renderFunscriptUploadButton()}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {/* Video player and FSGraph */}
          <div className='flex w-full flex-col items-center gap-8'>
            {videoUrl && (
              <video
                src={videoUrl}
                controls
                className='mb-4 w-full max-w-2xl rounded shadow-lg'
                style={{ maxHeight: 400 }}
              />
            )}
            {funscript && <FSGraph funscript={funscript} />}
          </div>
        </>
      )}
      {/* Always show context view button in top right */}
      <ContextView context={state.context} state={String(state.value)} />
    </div>
  );
}
