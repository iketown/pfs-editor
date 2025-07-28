'use client';

import ContextView from '@/components/fs_components/ContextView';
import ControlPanel from '@/components/fs_components/ControlPanel';
import {
  FsEditActorContext,
  useEditActorRef
} from '@/components/fs_components/FsEditActorContext';
import { FSGraph } from '@/components/fs_components/FSGraph';
import { MotionActorContext } from '@/components/fs_components/MotionActorContext';
import VideoControls from '@/components/fs_components/VideoControls';
import VideoPlayer from '@/components/fs_components/VideoPlayer';
import VideoTimeSliders from '@/components/fs_components/VideoTimeSliders';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useVideoFileManager } from '@/hooks/useVideoFileManager';
import { db } from '@/lib/db';
import type { Project } from '@/lib/db/types';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { send: editSend } = useEditActorRef();

  // Use the video file manager hook
  const { videoUrl, videoPrompt, handleSelectVideo } =
    useVideoFileManager(projectId);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const loadedProject = await db.getProject(projectId);

        if (!loadedProject) {
          setError('Project not found');
          return;
        }

        setProject(loadedProject);

        // Load the funscript data into the fsEditMachine
        if (loadedProject.funscriptData) {
          editSend({
            type: 'LOAD_FUNSCRIPT',
            funscript: loadedProject.funscriptData
          });
        }

        // Load saved fsChapters if they exist, otherwise they will be generated from funscript metadata
        if (
          loadedProject.fsChapters &&
          Object.keys(loadedProject.fsChapters).length > 0
        ) {
          editSend({
            type: 'LOAD_FS_CHAPTERS',
            fsChapters: loadedProject.fsChapters
          });
        }
      } catch (err) {
        console.error('Failed to load project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId, editSend]);

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin' />
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-red-600'>Error</CardTitle>
            <CardDescription>{error || 'Project not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className='w-full'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='bg-background min-h-screen'>
      <div className='container mx-auto p-6'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Edit Project</h1>
            <p className='text-muted-foreground'>{project?.name}</p>
          </div>
          <Button variant='outline' onClick={() => router.push('/')}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Projects
          </Button>
        </div>

        <div className='space-y-6'>
          {/* Top Row - Video and Controls */}
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Video Player */}
            <Card>
              <CardContent className='p-0'>
                {videoUrl ? (
                  <div>
                    <VideoControls />
                    <VideoPlayer className='h-64 w-full object-cover' />
                  </div>
                ) : (
                  <div className='bg-muted flex h-64 flex-col items-center justify-center rounded'>
                    <p className='text-muted-foreground'>
                      {videoPrompt || 'No video file available'}
                    </p>
                    <Button className='mt-4' onClick={handleSelectVideo}>
                      Select Video File
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Controls */}
            <ControlPanel />
          </div>
          <div className='p-4'>
            <VideoTimeSliders />
          </div>
          {/* Full Width Funscript Editor */}
          <Card>
            <CardContent>
              <FSGraph />
            </CardContent>
          </Card>
        </div>
      </div>
      <ContextView />
    </div>
  );
}

export default function WrappedEditProjectPage() {
  return (
    <MotionActorContext.Provider>
      <FsEditActorContext.Provider>
        <EditProjectPage />
      </FsEditActorContext.Provider>
    </MotionActorContext.Provider>
  );
}
