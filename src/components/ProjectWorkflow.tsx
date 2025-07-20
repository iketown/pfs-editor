import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProjectManager } from './ProjectManager';
import { useProject } from '@/hooks/useProject';
import { isChromium } from '@/lib/browser-utils';

type WorkflowStep =
  | 'select-project'
  | 'select-video'
  | 'select-funscript'
  | 'ready';

export const ProjectWorkflow: React.FC = () => {
  const {
    currentProject,
    videoBlobUrl,
    selectVideo,
    setFunscriptData,
    saveProject,
    error,
    clearError
  } = useProject();

  const [currentStep, setCurrentStep] =
    useState<WorkflowStep>('select-project');
  const [isSelectingVideo, setIsSelectingVideo] = useState(false);

  const handleProjectSelect = (projectId: string) => {
    setCurrentStep('select-video');
  };

  const handleSelectVideo = async () => {
    if (!currentProject) return;

    setIsSelectingVideo(true);
    try {
      await selectVideo();
      setCurrentStep('select-funscript');
    } catch (err) {
      console.error('Failed to select video:', err);
    } finally {
      setIsSelectingVideo(false);
    }
  };

  const handleCreateFunscript = () => {
    if (!currentProject) return;

    // Create a sample funscript for demonstration
    const sampleFunscript = {
      version: '1.0',
      range: 90,
      inverted: false,
      actions: [
        { at: 0, pos: 0 },
        { at: 1000, pos: 50 },
        { at: 2000, pos: 100 },
        { at: 3000, pos: 0 }
      ]
    };

    setFunscriptData(sampleFunscript);
    setCurrentStep('ready');
  };

  const handleSaveProject = async () => {
    if (!currentProject) return;

    try {
      await saveProject();
      alert('Project saved successfully!');
    } catch (err) {
      console.error('Failed to save project:', err);
      alert('Failed to save project');
    }
  };

  const getStepStatus = (step: WorkflowStep) => {
    if (step === currentStep) return 'current';
    if (step === 'select-project' && currentProject) return 'completed';
    if (step === 'select-video' && currentProject?.videoFile)
      return 'completed';
    if (step === 'select-funscript' && currentProject?.funscriptData)
      return 'completed';
    if (
      step === 'ready' &&
      currentProject?.videoFile &&
      currentProject?.funscriptData
    )
      return 'completed';
    return 'pending';
  };

  const renderStepIndicator = (step: WorkflowStep, label: string) => {
    const status = getStepStatus(step);

    return (
      <div
        className={`flex items-center space-x-2 ${
          status === 'completed'
            ? 'text-green-600'
            : status === 'current'
              ? 'text-blue-600'
              : 'text-gray-400'
        }`}
      >
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
            status === 'completed'
              ? 'bg-green-100 text-green-600'
              : status === 'current'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-400'
          }`}
        >
          {status === 'completed' ? '✓' : status === 'current' ? '●' : '○'}
        </div>
        <span className={status === 'current' ? 'font-medium' : ''}>
          {label}
        </span>
      </div>
    );
  };

  if (error) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='text-destructive'>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground mb-4 text-sm'>{error}</p>
          <Button onClick={clearError} variant='outline'>
            Dismiss
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Project Workflow</CardTitle>
          <CardDescription>
            Follow these steps to set up your video editing project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-4'>
            {renderStepIndicator('select-project', '1. Select Project')}
            <Separator orientation='vertical' className='h-4' />
            {renderStepIndicator('select-video', '2. Choose Video')}
            <Separator orientation='vertical' className='h-4' />
            {renderStepIndicator('select-funscript', '3. Add Funscript')}
            <Separator orientation='vertical' className='h-4' />
            {renderStepIndicator('ready', '4. Ready to Edit')}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {currentStep === 'select-project' && (
        <ProjectManager onProjectSelect={handleProjectSelect} />
      )}

      {currentStep === 'select-video' && currentProject && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Choose Video File</CardTitle>
            <CardDescription>
              Select a video file for your project &quot;{currentProject.name}
              &quot;
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Badge variant={isChromium() ? 'default' : 'secondary'}>
                {isChromium() ? 'Chromium Browser' : 'Standard Browser'}
              </Badge>
              <span className='text-muted-foreground text-sm'>
                {isChromium()
                  ? 'File will be remembered across sessions'
                  : 'File will need to be re-selected on page reload'}
              </span>
            </div>

            <Button
              onClick={handleSelectVideo}
              disabled={isSelectingVideo}
              className='w-full'
            >
              {isSelectingVideo ? 'Selecting...' : 'Choose Video File'}
            </Button>

            <p className='text-muted-foreground text-xs'>
              Supported formats: MP4, WebM, OGV (max 500MB)
            </p>
          </CardContent>
        </Card>
      )}

      {currentStep === 'select-funscript' && currentProject && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Add Funscript</CardTitle>
            <CardDescription>
              Create or upload a funscript file for your video
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <Button
                onClick={handleCreateFunscript}
                variant='outline'
                className='flex h-24 flex-col items-center justify-center'
              >
                <FileIcon className='mb-2 h-8 w-8' />
                Create New Funscript
              </Button>

              <Button
                variant='outline'
                className='flex h-24 flex-col items-center justify-center'
                disabled
              >
                <UploadIcon className='mb-2 h-8 w-8' />
                Upload Funscript
                <span className='text-muted-foreground mt-1 text-xs'>
                  (Coming Soon)
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'ready' && currentProject && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Ready to Edit!</CardTitle>
            <CardDescription>
              Your project is set up and ready for video editing
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <h4 className='font-medium'>Project Details</h4>
                <div className='space-y-1 text-sm'>
                  <div>
                    <strong>Name:</strong> {currentProject.name}
                  </div>
                  <div>
                    <strong>Video:</strong> {currentProject.videoFile?.name}
                  </div>
                  <div>
                    <strong>Funscript:</strong>{' '}
                    {currentProject.funscriptData ? 'Loaded' : 'None'}
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <h4 className='font-medium'>Actions</h4>
                <div className='space-y-2'>
                  <Button onClick={handleSaveProject} className='w-full'>
                    Save Project
                  </Button>
                  <Button variant='outline' className='w-full' disabled>
                    Open Editor
                    <span className='text-muted-foreground ml-2 text-xs'>
                      (Coming Soon)
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {videoBlobUrl && (
              <div className='mt-4'>
                <h4 className='mb-2 font-medium'>Video Preview</h4>
                <video
                  src={videoBlobUrl}
                  controls
                  className='w-full max-w-md rounded'
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Icons
const FileIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    />
  </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
    />
  </svg>
);
