import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { isChromium, selectVideoFile } from '@/lib/browser-utils';
import { db } from '@/lib/db';
import { parseFunscript } from '@/lib/funscript';
import type { FunscriptObject } from '@/types/funscript-types';
import { formatDistanceToNow } from 'date-fns';
import { Upload, FileText, Video, Edit } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useLoaderActorRef,
  useLoaderSelector
} from './fs_components/LoaderActorContext';

const ProjectWorkflowXState: React.FC = () => {
  return <ProjectWorkflowContent />;
};

const ProjectWorkflowContent: React.FC = () => {
  const actorRef = useLoaderActorRef();
  const currentState = useLoaderSelector((state) => state.value);
  const context = useLoaderSelector((state) => state.context);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load projects from database on component mount
  React.useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const allProjects = await db.getAllProjects();
        setProjects(allProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
        actorRef.send({
          type: 'SET_ERROR',
          error: `Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadProjects();
  }, [actorRef]);

  // Refresh projects after creating a new one
  const refreshProjects = async () => {
    try {
      const allProjects = await db.getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to refresh projects:', error);
    }
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        // Create a new project using the database
        const newProject = db.createProject(newProjectName.trim());

        // Save it to the database
        const savedProject = await db.saveProject(newProject);

        // Send the project to the state machine
        actorRef.send({ type: 'CREATE_PROJECT', project: savedProject });

        // Refresh the project list
        await refreshProjects();

        setNewProjectName('');
        setIsCreateDialogOpen(false);
      } catch (error) {
        console.error('Failed to create project:', error);
        actorRef.send({
          type: 'SET_ERROR',
          error: `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
  };

  const handleSelectProject = (project: any) => {
    actorRef.send({ type: 'SELECT_PROJECT', project });
  };

  const handleSelectVideo = async () => {
    try {
      const videoFile = await selectVideoFile();
      if (videoFile) {
        const blobUrl = URL.createObjectURL(videoFile);
        actorRef.send({ type: 'SELECT_VIDEO', videoFile, blobUrl });
      }
    } catch (error) {
      console.error('Failed to select video:', error);
    }
  };

  const handleSelectFunscript = () => {
    // Create a more realistic empty funscript with proper structure
    const emptyFunscriptData: FunscriptObject = {
      version: '1.0',
      range: 90,
      inverted: false,
      actions: [
        { id: '00001', at: 0, pos: 50 }, // Start at middle position
        { id: '00002', at: 1000, pos: 50 }, // Stay at middle for 1 second
        { id: '00003', at: 2000, pos: 50 } // End at middle position
      ]
    };
    actorRef.send({
      type: 'SELECT_FUNSCRIPT',
      funscriptData: emptyFunscriptData
    });
  };

  const handleUploadFunscript = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.funscript')) {
      actorRef.send({
        type: 'SET_ERROR',
        error: 'Please select a .funscript file'
      });
      return;
    }

    try {
      // Read the file content
      const text = await file.text();

      // Parse the funscript using our existing parser
      const funscriptData = parseFunscript(text);

      // Send the parsed data to the state machine
      actorRef.send({
        type: 'SELECT_FUNSCRIPT',
        funscriptData
      });

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to parse funscript:', error);
      actorRef.send({
        type: 'SET_ERROR',
        error: `Failed to parse funscript: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProject = async () => {
    // Set loading state
    actorRef.send({ type: 'SAVE_PROJECT' });

    try {
      if (!context.currentProject) {
        throw new Error('No project to save');
      }

      // Save the project to the database
      const savedProject = await db.saveProject(context.currentProject);

      // Update the context with the saved project (which includes updated timestamps)
      actorRef.send({
        type: 'SELECT_PROJECT',
        project: savedProject
      });

      // Refresh the project list to show updated timestamps
      await refreshProjects();

      // Clear loading state
      actorRef.send({ type: 'CLEAR_LOADING' });
    } catch (error) {
      console.error('Failed to save project:', error);
      actorRef.send({
        type: 'SET_ERROR',
        error: `Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      // Also clear loading state on error
      actorRef.send({ type: 'CLEAR_LOADING' });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const success = await db.deleteProject(projectId);
      if (success) {
        // Refresh the project list
        await refreshProjects();

        // If the deleted project was the current one, reset the state
        if (context.currentProject?.id === projectId) {
          // Clean up video blob URL before resetting
          if (context.videoBlobUrl) {
            URL.revokeObjectURL(context.videoBlobUrl);
          }
          actorRef.send({ type: 'RESET' });
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      actorRef.send({
        type: 'SET_ERROR',
        error: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleClearAllProjects = async () => {
    try {
      const success = await db.clear();
      if (success) {
        setProjects([]);
        actorRef.send({ type: 'RESET' });
      }
    } catch (error) {
      console.error('Failed to clear all projects:', error);
      actorRef.send({
        type: 'SET_ERROR',
        error: `Failed to clear all projects: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleClearError = () => {
    actorRef.send({ type: 'CLEAR_ERROR' });
  };

  const handleReset = () => {
    // Clean up video blob URL before resetting
    if (context.videoBlobUrl) {
      URL.revokeObjectURL(context.videoBlobUrl);
    }
    actorRef.send({ type: 'RESET' });
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/edit/${projectId}`);
  };

  const renderStepContent = () => {
    switch (currentState) {
      case 'selectProject':
        return (
          <Card>
            <CardHeader>
              <CardTitle>1. Select or Create Project</CardTitle>
              <CardDescription>
                Choose an existing project or create a new one to get started
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Create New Project */}
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div>
                  <h3 className='font-medium'>Create New Project</h3>
                  <p className='text-muted-foreground text-sm'>
                    Start with a fresh project
                  </p>
                </div>
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>Create New</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>
                        Enter a name for your new project
                      </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                      <div>
                        <Label htmlFor='project-name'>Project Name</Label>
                        <Input
                          id='project-name'
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder='Enter project name...'
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateProject();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateProject}
                        disabled={!newProjectName.trim()}
                      >
                        Create Project
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              {/* Existing Projects */}
              <div>
                <div className='mb-3 flex items-center justify-between'>
                  <h3 className='font-medium'>Existing Projects</h3>
                  {projects.length > 0 && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleClearAllProjects}
                      className='text-red-600 hover:text-red-700'
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                <div className='space-y-2'>
                  {isLoadingProjects ? (
                    <p className='text-muted-foreground text-sm'>
                      Loading projects...
                    </p>
                  ) : projects.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>
                      No projects found. Create a new one!
                    </p>
                  ) : (
                    projects.map((project) => (
                      <div
                        key={project.id}
                        className='hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-3'
                      >
                        <div
                          className='flex-1'
                          onClick={() => handleSelectProject(project)}
                        >
                          <h4 className='font-medium'>{project.name}</h4>
                          <p className='text-muted-foreground text-sm'>
                            Created {formatDistanceToNow(project.createdAt)} ago
                          </p>
                          {project.videoFile && (
                            <p className='text-muted-foreground text-xs'>
                              Video: {project.videoFile.name}
                            </p>
                          )}
                          {project.funscriptData && (
                            <p className='text-muted-foreground text-xs'>
                              Funscript: {project.funscriptData.actions.length}{' '}
                              actions
                            </p>
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge variant='secondary'>
                            {formatDistanceToNow(project.updatedAt)} ago
                          </Badge>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className='text-red-600 hover:bg-red-50 hover:text-red-700'
                          >
                            Delete
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project.id);
                            }}
                            className='text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'selectVideo':
        return (
          <Card>
            <CardHeader>
              <CardTitle>2. Choose Video File</CardTitle>
              <CardDescription>
                Select a video file for your project &quot;
                {context.currentProject?.name}&quot;
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div>
                  <h3 className='font-medium'>Select Video File</h3>
                  <p className='text-muted-foreground text-sm'>
                    {isChromium()
                      ? 'Choose a video file using the File System Access API'
                      : 'Choose a video file (MP4, WebM, OGV formats supported)'}
                  </p>
                  {context.currentProject?.videoFile && (
                    <p className='mt-1 text-xs text-green-600'>
                      ✓ Video file selected:{' '}
                      {context.currentProject.videoFile.name}
                    </p>
                  )}
                </div>
                <Button onClick={handleSelectVideo}>Select Video File</Button>
              </div>

              <div className='flex gap-2'>
                <Button variant='outline' onClick={handleReset}>
                  Back to Projects
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'selectFunscript':
        return (
          <Card>
            <CardHeader>
              <CardTitle>3. Choose or Create Funscript</CardTitle>
              <CardDescription>
                Select an existing funscript file or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div>
                  <h3 className='font-medium'>Funscript Options</h3>
                  <p className='text-muted-foreground text-sm'>
                    Upload an existing .funscript file or create a new one
                  </p>
                  {context.currentProject?.funscriptData && (
                    <p className='mt-1 text-xs text-green-600'>
                      ✓ Funscript data loaded (
                      {context.currentProject.funscriptData.actions.length}{' '}
                      actions)
                    </p>
                  )}
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={triggerFileUpload}>
                    Upload Funscript
                  </Button>
                  <Button onClick={handleSelectFunscript}>Create New</Button>
                </div>
              </div>

              {/* Hidden file input for funscript upload */}
              <input
                ref={fileInputRef}
                type='file'
                accept='.funscript'
                onChange={handleUploadFunscript}
                style={{ display: 'none' }}
              />

              <div className='flex gap-2'>
                <Button variant='outline' onClick={handleReset}>
                  Back to Projects
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'ready':
        return (
          <Card>
            <CardHeader>
              <CardTitle>4. Project Ready!</CardTitle>
              <CardDescription>
                Your project is ready for editing
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {/* Left Column - Video */}
                <div className='rounded-lg border p-4'>
                  <h3 className='mb-3 font-medium'>Video</h3>
                  <div className='space-y-3'>
                    <div className='text-sm'>
                      <p className='text-muted-foreground font-medium'>
                        Selected Video:
                      </p>
                      <p className='break-words'>
                        {context.currentProject?.videoFile?.name ||
                          'No video selected'}
                      </p>
                    </div>
                    <Button
                      variant='outline'
                      onClick={handleSelectVideo}
                      className='w-full'
                    >
                      <Video className='mr-2 h-4 w-4' />
                      Update
                    </Button>
                  </div>
                </div>

                {/* Right Column - Funscript */}
                <div className='rounded-lg border p-4'>
                  <h3 className='mb-3 font-medium'>Funscript</h3>
                  <div className='space-y-3'>
                    <div className='text-sm'>
                      <p className='text-muted-foreground font-medium'>
                        Selected Funscript:
                      </p>
                      <p className='break-words'>
                        {context.currentProject?.funscriptData?.actions &&
                        context.currentProject.funscriptData.actions.length > 0
                          ? `${context.currentProject.funscriptData.actions.length} actions`
                          : 'New funscript file'}
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        onClick={triggerFileUpload}
                        className='flex-1'
                      >
                        <Upload className='mr-2 h-4 w-4' />
                        Upload
                      </Button>
                      <Button
                        variant='outline'
                        onClick={handleSelectFunscript}
                        className='flex-1'
                      >
                        <FileText className='mr-2 h-4 w-4' />
                        Create
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden file input for funscript upload */}
              <input
                ref={fileInputRef}
                type='file'
                accept='.funscript'
                onChange={handleUploadFunscript}
                style={{ display: 'none' }}
              />

              <div className='flex gap-2 pt-4'>
                <Button
                  onClick={() => handleEditProject(context.currentProject!.id)}
                  className='bg-blue-600 hover:bg-blue-700'
                >
                  <Edit className='mr-2 h-4 w-4' />
                  Edit Project
                </Button>
                <Button variant='outline' onClick={handleReset}>
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return <div>Unknown state: {String(currentState)}</div>;
    }
  };

  return (
    <div className='mx-auto max-w-2xl space-y-6 p-6'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold'>PFS Editor</h1>
        <p className='text-muted-foreground'>Project-based Funscript Editor</p>
        <pre className='text-sm text-green-800'>
          {JSON.stringify(currentState, null, 2)}
        </pre>
      </div>

      {/* Progress Indicator */}
      <div className='flex items-center justify-center space-x-4'>
        {['selectProject', 'selectVideo', 'selectFunscript', 'ready'].map(
          (step, index) => (
            <div key={step} className='flex items-center'>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  currentState === step
                    ? 'bg-primary text-primary-foreground'
                    : [
                          'selectProject',
                          'selectVideo',
                          'selectFunscript',
                          'ready'
                        ].indexOf(currentState as string) > index
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`mx-2 h-1 w-16 ${
                    [
                      'selectProject',
                      'selectVideo',
                      'selectFunscript',
                      'ready'
                    ].indexOf(currentState as string) > index
                      ? 'bg-green-500'
                      : 'bg-muted'
                  }`}
                />
              )}
            </div>
          )
        )}
      </div>

      {/* Error Display */}
      {context.error && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='flex items-center justify-between'>
            <p className='text-red-800'>{context.error}</p>
            <Button variant='ghost' size='sm' onClick={handleClearError}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {renderStepContent()}
    </div>
  );
};

export default ProjectWorkflowXState;
