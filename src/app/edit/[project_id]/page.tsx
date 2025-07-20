'use client';

import {
  FsEditActorContext,
  useEditActorRef
} from '@/components/fs_components/FsEditActorContext';
import { FSGraph } from '@/components/fs_components/FSGraph';
import { MotionActorContext } from '@/components/fs_components/MotionActorContext';
import VideoPlayer from '@/components/fs_components/VideoPlayer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { db } from '@/lib/db';
import type { Project } from '@/lib/db/types';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import dragDataPlugin from 'chartjs-plugin-dragdata';
import zoomPlugin from 'chartjs-plugin-zoom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  zoomPlugin,
  dragDataPlugin,
  Title,
  Tooltip,
  Legend
);

export function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { send: editSend } = useEditActorRef();

  const projectId = params.project_id as string;

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

        // Load the video data into the fsEditMachine if available
        if (loadedProject.videoFile) {
          // For now, we'll need to create a blob URL from the stored video data
          // This is a simplified approach - in a real app you might store the actual video file
          // or have a way to retrieve it from storage
          console.log('Video file found:', loadedProject.videoFile.name);
          // Note: We'll need to implement proper video loading based on how video files are stored
          // For now, we'll just log that we found a video file
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
            <p className='text-muted-foreground'>{project.name}</p>
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
              <CardHeader>
                <CardTitle>Video Player</CardTitle>
                <CardDescription>
                  {project.videoFile
                    ? project.videoFile.name
                    : 'No video available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.videoFile ? (
                  <VideoPlayer
                    controls
                    className='h-64 w-full rounded object-cover'
                  />
                ) : (
                  <div className='bg-muted flex h-64 items-center justify-center rounded'>
                    <p className='text-muted-foreground'>
                      No video file available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Controls</CardTitle>
                <CardDescription>
                  Project editing controls and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='bg-muted flex h-64 items-center justify-center rounded'>
                  <p className='text-muted-foreground'>Controls will go here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Width Funscript Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Funscript Editor</CardTitle>
              <CardDescription>
                Edit your funscript data using the interactive graph
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FSGraph />
            </CardContent>
          </Card>
        </div>
      </div>
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
