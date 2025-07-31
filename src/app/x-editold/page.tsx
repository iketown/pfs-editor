'use client';

import { useState, useEffect } from 'react';
import ChooseVideoButton from '@/components/fs_components/ChooseVideoButton';
import dynamic from 'next/dynamic';
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
import type { FunscriptObject } from '@/types/funscript-types';
import VideoPlayer from '@/components/fs_components/VideoPlayer';
import {
  FsEditActorContext,
  useEditActorRef
} from '@/components/fs_components/FsEditActorContext';
import { MotionActorContext } from '@/components/fs_components/RoiActorContext';

const FSGraph = dynamic(
  () => import('@/components/fs_components/FSGraph.client'),
  { ssr: false }
);

function EditPage() {
  const videoUrl = FsEditActorContext.useSelector(
    (state) => state.context.videoUrl
  );
  const funscript = FsEditActorContext.useSelector(
    (state) => state.context.funscript
  );
  const isEditing = FsEditActorContext.useSelector((state) =>
    state.matches('editing')
  );
  const editActorRef = useEditActorRef();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // On mount, check localStorage for a saved videoUrl and try to fetch it
  useEffect(() => {
    const savedUrl = localStorage.getItem('videoUrl');
    const savedFileName = localStorage.getItem('videoFileName');
    if (savedUrl && !videoUrl) {
      fetch(savedUrl)
        .then((res) => {
          if (res.ok) {
            editActorRef.send({
              type: 'LOAD_VIDEO',
              url: savedUrl,
              file: null as any // TODO: Fix this type issue
            });
          } else {
            console.log(`video file not found at ${savedUrl}`);
            localStorage.removeItem('videoUrl');
            localStorage.removeItem('videoFileName');
          }
        })
        .catch(() => {
          console.log(`video file not found at ${savedUrl}`);
          localStorage.removeItem('videoUrl');
          localStorage.removeItem('videoFileName');
        });
    }
  }, [editActorRef, videoUrl]);

  const handleVideoSelected = (url: string, file: File) => {
    // Save to localStorage
    localStorage.setItem('videoUrl', url);
    localStorage.setItem('videoFileName', file.name);

    editActorRef.send({ type: 'LOAD_VIDEO' as const, url, file });
  };
  const handleFunscriptParsed = (funscriptObj: FunscriptObject) => {
    editActorRef.send({
      type: 'LOAD_FUNSCRIPT' as const,
      funscript: funscriptObj
    });
  };

  const showSettingsCard = !isEditing;

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
              <VideoPlayer
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
      <ContextView />
    </div>
  );
}

export default function WrappedEditPage() {
  return (
    <MotionActorContext.Provider>
      <FsEditActorContext.Provider>
        <EditPage />
      </FsEditActorContext.Provider>
    </MotionActorContext.Provider>
  );
}
