import type { FunscriptObject } from '@/types/funscript-types';
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
        return nanoid(5);
    }
} 