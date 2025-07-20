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
    funscriptData?: {
        version: string;
        range: number;
        inverted: boolean;
        actions: Array<{
            at: number;
            pos: number;
        }>;
    };
    settings?: {
        playbackRate?: number;
        volume?: number;
        graphZoom?: number;
        [key: string]: any;
    };
}

// Storage provider interface
export interface StorageProvider {
    // Project CRUD operations
    getProject(id: string): Promise<Project | null>;
    getAllProjects(): Promise<Project[]>;
    saveProject(project: Project): Promise<Project>;
    deleteProject(id: string): Promise<boolean>;

    // Utility operations
    clear(): Promise<boolean>;
}

// Base storage provider class
export abstract class BaseStorageProvider implements StorageProvider {
    abstract getProject(id: string): Promise<Project | null>;
    abstract getAllProjects(): Promise<Project[]>;
    abstract saveProject(project: Project): Promise<Project>;
    abstract deleteProject(id: string): Promise<boolean>;
    abstract clear(): Promise<boolean>;

    // Helper to generate unique IDs
    generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
} 