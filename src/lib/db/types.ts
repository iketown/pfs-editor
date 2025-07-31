import type { FunscriptObject, FunscriptAction } from '@/types/funscript-types';
import type { ROI } from '@/types/roi-types';
import { nanoid } from 'nanoid';

// Core project data model
export interface Project {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    videoFile?: {
        name: string;
        size: number;
        type: string;
        handle?: FileSystemFileHandle; // For Chromium browsers
        lastModified?: number;
    };
    funscriptData?: FunscriptObject;
    settings?: {
        playbackRate?: number;
        volume?: number;
        graphZoom?: number;
        hideVideo?: boolean;
        [key: string]: any;
    };
    fsChapters?: {
        [chapter_id: string]: {
            startTime: number;
            endTime: number;
            title: string;
            color: string;
            id: string;
        };
    };
}

// Granular data models for efficient updates
export interface ProjectChapters {
    projectId: string;
    chapters: {
        [chapter_id: string]: {
            startTime: number;
            endTime: number;
            title: string;
            color: string;
            id: string;
        };
    };
    updatedAt: number;
}

export interface ProjectROIs {
    projectId: string;
    rois: { [roi_id: string]: ROI };
    updatedAt: number;
}

export interface ProjectActions {
    projectId: string;
    actions: FunscriptAction[];
    updatedAt: number;
}

export interface ProjectSettings {
    projectId: string;
    settings: Record<string, any>;
    updatedAt: number;
}

// Batch operation types
export interface BatchUpdate {
    projectId: string;
    updates: {
        chapters?: Partial<ProjectChapters>;
        rois?: Partial<ProjectROIs>;
        actions?: Partial<ProjectActions>;
        settings?: Partial<ProjectSettings>;
    };
    timestamp: number;
}

// Event sourcing for action history
export interface ActionEvent {
    id: string;
    projectId: string;
    type: 'ACTION_UPDATE' | 'ACTION_INSERT' | 'ACTION_DELETE' | 'BATCH_UPDATE';
    data: any;
    timestamp: number;
    userId?: string; // For future multi-user support
}

// Storage provider interface with granular operations
export interface StorageProvider {
    // Project CRUD operations
    getProject(id: string): Promise<Project | null>;
    getAllProjects(): Promise<Project[]>;
    saveProject(project: Project): Promise<Project>;
    deleteProject(id: string): Promise<boolean>;

    // Granular operations for performance
    getProjectChapters(projectId: string): Promise<ProjectChapters | null>;
    saveProjectChapters(chapters: ProjectChapters): Promise<ProjectChapters>;

    getProjectROIs(projectId: string): Promise<ProjectROIs | null>;
    saveProjectROIs(rois: ProjectROIs): Promise<ProjectROIs>;

    getProjectActions(projectId: string): Promise<ProjectActions | null>;
    saveProjectActions(actions: ProjectActions): Promise<ProjectActions>;

    getProjectSettings(projectId: string): Promise<ProjectSettings | null>;
    saveProjectSettings(settings: ProjectSettings): Promise<ProjectSettings>;

    // Batch operations for multiple updates
    batchUpdate(update: BatchUpdate): Promise<void>;

    // Event sourcing for history/undo
    saveActionEvent(event: ActionEvent): Promise<ActionEvent>;
    getActionEvents(projectId: string, limit?: number): Promise<ActionEvent[]>;

    // Utility operations
    clear(): Promise<boolean>;
}

// Base storage provider class
export abstract class BaseStorageProvider implements StorageProvider {
    abstract getProject(id: string): Promise<Project | null>;
    abstract getAllProjects(): Promise<Project[]>;
    abstract saveProject(project: Project): Promise<Project>;
    abstract deleteProject(id: string): Promise<boolean>;

    // Granular operations - default implementations that fall back to full project save
    async getProjectChapters(projectId: string): Promise<ProjectChapters | null> {
        const project = await this.getProject(projectId);
        if (!project) return null;

        return {
            projectId,
            chapters: project.fsChapters || {},
            updatedAt: project.updatedAt
        };
    }

    async saveProjectChapters(chapters: ProjectChapters): Promise<ProjectChapters> {
        const project = await this.getProject(chapters.projectId);
        if (!project) throw new Error(`Project ${chapters.projectId} not found`);

        const updatedProject = {
            ...project,
            fsChapters: chapters.chapters,
            updatedAt: Date.now()
        };

        await this.saveProject(updatedProject);
        return { ...chapters, updatedAt: Date.now() };
    }

    async getProjectROIs(projectId: string): Promise<ProjectROIs | null> {
        // ROIs are not yet in the main project structure, so return empty for now
        return {
            projectId,
            rois: {},
            updatedAt: Date.now()
        };
    }

    async saveProjectROIs(rois: ProjectROIs): Promise<ProjectROIs> {
        // For now, this will be implemented when ROIs are added to the project structure
        return { ...rois, updatedAt: Date.now() };
    }

    async getProjectActions(projectId: string): Promise<ProjectActions | null> {
        const project = await this.getProject(projectId);
        if (!project || !project.funscriptData) return null;

        return {
            projectId,
            actions: project.funscriptData.actions || [],
            updatedAt: project.updatedAt
        };
    }

    async saveProjectActions(actions: ProjectActions): Promise<ProjectActions> {
        const project = await this.getProject(actions.projectId);
        if (!project) throw new Error(`Project ${actions.projectId} not found`);

        const updatedProject = {
            ...project,
            funscriptData: {
                ...project.funscriptData,
                actions: actions.actions || []
            },
            updatedAt: Date.now()
        };

        await this.saveProject(updatedProject);
        return { ...actions, updatedAt: Date.now() };
    }

    async getProjectSettings(projectId: string): Promise<ProjectSettings | null> {
        const project = await this.getProject(projectId);
        if (!project) return null;

        return {
            projectId,
            settings: project.settings || {},
            updatedAt: project.updatedAt
        };
    }

    async saveProjectSettings(settings: ProjectSettings): Promise<ProjectSettings> {
        const project = await this.getProject(settings.projectId);
        if (!project) throw new Error(`Project ${settings.projectId} not found`);

        const updatedProject = {
            ...project,
            settings: settings.settings,
            updatedAt: Date.now()
        };

        await this.saveProject(updatedProject);
        return { ...settings, updatedAt: Date.now() };
    }

    // Batch operations - default implementation
    async batchUpdate(update: BatchUpdate): Promise<void> {
        const project = await this.getProject(update.projectId);
        if (!project) throw new Error(`Project ${update.projectId} not found`);

        const updatedProject = { ...project, updatedAt: Date.now() };

        if (update.updates.chapters) {
            updatedProject.fsChapters = update.updates.chapters.chapters;
        }
        if (update.updates.actions && project.funscriptData) {
            updatedProject.funscriptData = {
                ...project.funscriptData,
                actions: update.updates.actions.actions || []
            };
        }
        if (update.updates.settings) {
            updatedProject.settings = update.updates.settings.settings;
        }

        await this.saveProject(updatedProject);
    }

    // Event sourcing - default implementations for localStorage
    async saveActionEvent(event: ActionEvent): Promise<ActionEvent> {
        // For localStorage, we'll store events in a separate key
        const events = this.getStoredEvents();
        events.push(event);
        this.saveStoredEvents(events);
        return event;
    }

    async getActionEvents(projectId: string, limit: number = 100): Promise<ActionEvent[]> {
        const events = this.getStoredEvents();
        return events
            .filter(e => e.projectId === projectId)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // Helper methods for localStorage event storage
    protected getStoredEvents(): ActionEvent[] {
        try {
            const data = localStorage.getItem('pfs-editor-events');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to parse stored events:', error);
            return [];
        }
    }

    protected saveStoredEvents(events: ActionEvent[]): void {
        try {
            localStorage.setItem('pfs-editor-events', JSON.stringify(events));
        } catch (error) {
            console.error('Failed to save events:', error);
        }
    }

    abstract clear(): Promise<boolean>;

    // Helper to generate unique IDs
    generateId(): string {
        return nanoid(5);
    }
} 