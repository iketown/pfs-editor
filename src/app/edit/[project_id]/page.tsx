'use client';

import ContextView from '@/components/fs_components/ContextView';
import ControlPanel from '@/components/fs_components/ControlPanel';
import VideoControls from '@/components/fs_components/VideoControls';
import VideoCustomControls from '@/components/fs_components/VideoCustomControls';
import VideoPlayer from '@/components/fs_components/VideoPlayer';
import VideoPlayhead from '@/components/fs_components/VideoPlayhead';
import VideoTimeSliders from '@/components/fs_components/VideoTimeSliders';
import {
  ProjectParentMachineCtx,
  useProjectParentActorRef
} from '@/components/fs_components/ProjectParentMachineCtx';
import { Button } from '@/components/ui/button';
import { useVideoFileManager } from '@/hooks/useVideoFileManager';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
  const [chaptersExist, setChaptersExist] = useState(false);
  const [showImportButton, setShowImportButton] = useState(false);
  const [showReimportButton, setShowReimportButton] = useState(false);
  const { send: parentSend } = useProjectParentActorRef();

  // Use the video file manager hook
  const { videoUrl, videoPrompt, handleSelectVideo } =
    useVideoFileManager(projectId);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      try {
        console.log('Loading project:', projectId);
        const loadedProject = await db.getProject(projectId);
        if (!loadedProject) {
          setError('Project not found');
          return;
        }

        setProject(loadedProject);
        console.log('Project loaded:', loadedProject);

        // Set the project ID in the parent machine context
        if (parentSend) {
          parentSend({
            type: 'SET_PROJECT_ID',
            projectId: projectId
          });

          // Load ROIs for this project
          try {
            const projectROIs = await db.getProjectROIs(projectId);
            if (projectROIs && projectROIs.rois) {
              // Send ROIs to the ROI machine via the parent machine
              parentSend({
                type: 'FORWARD_TO_ROI',
                event: {
                  type: 'LOAD_ROIS',
                  rois: projectROIs.rois
                }
              });
            }
          } catch (error) {
            console.error('Failed to load ROIs:', error);
          }

          // Load chapters for this project
          try {
            const projectChapters = await db.getProjectChapters(projectId);
            if (
              projectChapters &&
              Object.keys(projectChapters.chapters).length > 0
            ) {
              // Chapters exist in our DB, load them into the chapter machine
              parentSend({
                type: 'FORWARD_TO_CHAPTER',
                event: {
                  type: 'LOAD_FS_CHAPTERS',
                  fsChapters: projectChapters.chapters
                }
              });
              setChaptersExist(true);

              // Check if funscript has chapters for re-import option
              if (
                loadedProject.funscriptData?.metadata?.chapters &&
                loadedProject.funscriptData.metadata.chapters.length > 0
              ) {
                setShowReimportButton(true);
              }
            } else {
              // No chapters in our DB, check if funscript has chapters to import
              if (
                loadedProject.funscriptData?.metadata?.chapters &&
                loadedProject.funscriptData.metadata.chapters.length > 0
              ) {
                setShowImportButton(true);
              }
            }
          } catch (error) {
            console.error('Failed to load chapters:', error);
          }
        }

        // Note: Video file loading is handled by useVideoFileManager hook
        // which will restore from IndexedDB if available
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
  }, [projectId]);

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
      <div className='container mx-auto flex flex-col p-6'>
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
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card>
              <CardContent className='p-0'>
                {videoUrl ? (
                  <div>
                    <VideoControls />
                    <VideoPlayer className='h-64 w-full object-cover' />
                    <VideoPlayhead />
                    <VideoCustomControls />
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

                <div className='p-6'>
                  <p>Project loaded successfully!</p>
                  <p>Project ID: {projectId}</p>
                  <p>Project Name: {project.name}</p>
                  {chaptersExist && (
                    <p className='text-green-600'>✓ Chapters loaded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <ControlPanel
              project={project}
              chaptersExist={chaptersExist}
              showImportButton={showImportButton}
              showReimportButton={showReimportButton}
              onImportChapters={() => {
                if (project?.funscriptData && parentSend) {
                  parentSend({
                    type: 'FORWARD_TO_CHAPTER',
                    event: {
                      type: 'IMPORT_FS_CHAPTERS',
                      funscriptData: project.funscriptData
                    }
                  });
                  setShowImportButton(false);
                  setChaptersExist(true);
                  setShowReimportButton(true);
                }
              }}
              onReimportChapters={() => {
                if (project?.funscriptData && parentSend) {
                  if (
                    confirm(
                      'This will overwrite all existing chapters with fresh data from the funscript file. Are you sure?'
                    )
                  ) {
                    parentSend({
                      type: 'FORWARD_TO_CHAPTER',
                      event: {
                        type: 'IMPORT_FS_CHAPTERS',
                        funscriptData: project.funscriptData
                      }
                    });
                    console.log('Chapters re-imported from funscript file');
                  }
                }
              }}
            />
          </div>
          <div className='p-4'>
            <VideoTimeSliders />
          </div>
        </div>
      </div>
      <ContextView />
    </div>
  );
}

export default function WrappedEditProjectPage() {
  return (
    <ProjectParentMachineCtx.Provider>
      <EditProjectPage />
    </ProjectParentMachineCtx.Provider>
  );
}
