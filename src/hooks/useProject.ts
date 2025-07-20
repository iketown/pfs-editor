import { useState, useEffect, useCallback } from 'react';
import { db, type Project } from '@/lib/db';
import { selectVideoFile, validateVideoFile, createVideoBlobUrl, revokeVideoBlobUrl } from '@/lib/browser-utils';

interface UseProjectReturn {
    // Current project state
    currentProject: Project | null;
    projects: Project[];
    isLoading: boolean;
    error: string | null;

    // Project operations
    createProject: (name: string) => Promise<Project>;
    loadProject: (id: string) => Promise<void>;
    saveProject: () => Promise<void>;
    deleteProject: (id: string) => Promise<void>;

    // Video operations
    selectVideo: () => Promise<void>;
    videoBlobUrl: string | null;

    // Funscript operations
    setFunscriptData: (data: Project['funscriptData']) => void;

    // Settings operations
    updateSettings: (settings: Partial<Project['settings']>) => void;

    // Utility
    clearError: () => void;
}

export const useProject = (): UseProjectReturn => {
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);

    // Load all projects on mount
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const allProjects = await db.getAllProjects();
                setProjects(allProjects);
            } catch (err) {
                setError('Failed to load projects');
                console.error('Failed to load projects:', err);
            }
        };

        loadProjects();
    }, []);

    // Clean up blob URL when project changes
    useEffect(() => {
        return () => {
            if (videoBlobUrl) {
                revokeVideoBlobUrl(videoBlobUrl);
            }
        };
    }, [videoBlobUrl]);

    const createProject = useCallback(async (name: string): Promise<Project> => {
        setIsLoading(true);
        setError(null);

        try {
            const newProject = db.createProject(name);
            const savedProject = await db.saveProject(newProject);

            setProjects(prev => [...prev, savedProject]);
            setCurrentProject(savedProject);

            return savedProject;
        } catch (err) {
            const errorMessage = 'Failed to create project';
            setError(errorMessage);
            console.error(errorMessage, err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadProject = useCallback(async (id: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const project = await db.getProject(id);
            if (!project) {
                throw new Error('Project not found');
            }

            setCurrentProject(project);

            // Load video file if it exists
            if (project.videoFile?.handle) {
                try {
                    const file = await project.videoFile.handle.getFile();
                    const blobUrl = createVideoBlobUrl(file);
                    setVideoBlobUrl(blobUrl);
                } catch (err) {
                    console.warn('Failed to load video file handle:', err);
                    // Clear the handle if it's no longer valid
                    project.videoFile = undefined;
                    await db.saveProject(project);
                }
            }
        } catch (err) {
            const errorMessage = 'Failed to load project';
            setError(errorMessage);
            console.error(errorMessage, err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveProject = useCallback(async (): Promise<void> => {
        if (!currentProject) {
            throw new Error('No project to save');
        }

        try {
            const savedProject = await db.saveProject(currentProject);
            setCurrentProject(savedProject);

            // Update projects list
            setProjects(prev =>
                prev.map(p => p.id === savedProject.id ? savedProject : p)
            );
        } catch (err) {
            const errorMessage = 'Failed to save project';
            setError(errorMessage);
            console.error(errorMessage, err);
            throw err;
        }
    }, [currentProject]);

    const deleteProject = useCallback(async (id: string): Promise<void> => {
        try {
            const success = await db.deleteProject(id);
            if (!success) {
                throw new Error('Project not found');
            }

            setProjects(prev => prev.filter(p => p.id !== id));

            // Clear current project if it was deleted
            if (currentProject?.id === id) {
                setCurrentProject(null);
                if (videoBlobUrl) {
                    revokeVideoBlobUrl(videoBlobUrl);
                    setVideoBlobUrl(null);
                }
            }
        } catch (err) {
            const errorMessage = 'Failed to delete project';
            setError(errorMessage);
            console.error(errorMessage, err);
            throw err;
        }
    }, [currentProject, videoBlobUrl]);

    const selectVideo = useCallback(async (): Promise<void> => {
        if (!currentProject) {
            throw new Error('No project selected');
        }

        try {
            const file = await selectVideoFile();
            if (!file) {
                return; // User cancelled
            }

            // Validate file
            const validation = validateVideoFile(file);
            if (!validation.valid) {
                setError(validation.error!);
                return;
            }

            // Create blob URL for playback
            const blobUrl = createVideoBlobUrl(file);
            setVideoBlobUrl(blobUrl);

            // Update project with video file info
            const updatedProject = {
                ...currentProject,
                videoFile: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    // Store file handle for Chromium browsers
                    ...(file instanceof File && 'showOpenFilePicker' in window && {
                        handle: await (file as any).handle?.()
                    })
                }
            };

            setCurrentProject(updatedProject);
            await db.saveProject(updatedProject);

        } catch (err) {
            const errorMessage = 'Failed to select video file';
            setError(errorMessage);
            console.error(errorMessage, err);
        }
    }, [currentProject]);

    const setFunscriptData = useCallback((data: Project['funscriptData']): void => {
        if (!currentProject) {
            throw new Error('No project selected');
        }

        const updatedProject = {
            ...currentProject,
            funscriptData: data
        };

        setCurrentProject(updatedProject);
    }, [currentProject]);

    const updateSettings = useCallback((settings: Partial<Project['settings']>): void => {
        if (!currentProject) {
            throw new Error('No project selected');
        }

        const updatedProject = {
            ...currentProject,
            settings: {
                ...currentProject.settings,
                ...settings
            }
        };

        setCurrentProject(updatedProject);
    }, [currentProject]);

    const clearError = useCallback((): void => {
        setError(null);
    }, []);

    return {
        currentProject,
        projects,
        isLoading,
        error,
        createProject,
        loadProject,
        saveProject,
        deleteProject,
        selectVideo,
        videoBlobUrl,
        setFunscriptData,
        updateSettings,
        clearError
    };
}; 