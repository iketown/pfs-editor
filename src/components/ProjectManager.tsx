'use client';

import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useProject } from '@/hooks/useProject';
import { formatDistanceToNow } from 'date-fns';

interface ProjectManagerProps {
  onProjectSelect?: (projectId: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  onProjectSelect
}) => {
  const {
    projects,
    currentProject,
    isLoading,
    error,
    createProject,
    loadProject,
    deleteProject,
    clearError
  } = useProject();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const project = await createProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreateDialogOpen(false);
      onProjectSelect?.(project.id);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    try {
      await loadProject(projectId);
      onProjectSelect?.(projectId);
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (
      confirm(
        'Are you sure you want to delete this project? This action cannot be undone.'
      )
    ) {
      try {
        await deleteProject(projectId);
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
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
    <div className='w-full space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Projects</h2>
          <p className='text-muted-foreground text-sm'>
            Manage your video editing projects
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className='mr-2 h-4 w-4' />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Enter a name for your new project. You can add video and
                funscript files later.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='project-name'>Project Name</Label>
                <Input
                  id='project-name'
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder='My Video Project'
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
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project List */}
      {isLoading ? (
        <div className='flex items-center justify-center py-8'>
          <div className='text-muted-foreground text-sm'>
            Loading projects...
          </div>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <div className='space-y-2 text-center'>
              <h3 className='text-lg font-medium'>No projects yet</h3>
              <p className='text-muted-foreground text-sm'>
                Create your first project to get started
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className='mt-4'
              >
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {projects.map((project) => (
            <Card
              key={project.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                currentProject?.id === project.id ? 'ring-primary ring-2' : ''
              }`}
              onClick={() => handleProjectSelect(project.id)}
            >
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <CardTitle className='truncate text-lg'>
                    {project.name}
                  </CardTitle>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className='text-destructive hover:text-destructive'
                  >
                    <TrashIcon className='h-4 w-4' />
                  </Button>
                </div>
                <CardDescription>
                  Created{' '}
                  {formatDistanceToNow(project.createdAt, { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    {project.videoFile ? (
                      <Badge variant='secondary' className='text-xs'>
                        <VideoIcon className='mr-1 h-3 w-3' />
                        Video
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='text-xs'>
                        No Video
                      </Badge>
                    )}

                    {project.funscriptData ? (
                      <Badge variant='secondary' className='text-xs'>
                        <FileIcon className='mr-1 h-3 w-3' />
                        Funscript
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='text-xs'>
                        No Funscript
                      </Badge>
                    )}
                  </div>

                  {project.videoFile && (
                    <p className='text-muted-foreground truncate text-xs'>
                      {project.videoFile.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Icons
const PlusIcon = ({ className }: { className?: string }) => (
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
      d='M12 4v16m8-8H4'
    />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
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
      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    />
  </svg>
);

const VideoIcon = ({ className }: { className?: string }) => (
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
      d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
    />
  </svg>
);

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
