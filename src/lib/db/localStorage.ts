import { BaseStorageProvider } from './types';
import type { Project } from './types';

export class LocalStorageProvider extends BaseStorageProvider {
    private readonly STORAGE_KEY = 'pfs-editor-projects';

    private getStoredProjects(): Project[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to parse stored projects:', error);
            return [];
        }
    }

    private saveStoredProjects(projects: Project[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
        } catch (error) {
            console.error('Failed to save projects:', error);
            throw new Error('Storage quota exceeded or localStorage unavailable');
        }
    }

    async getProject(id: string): Promise<Project | null> {
        const projects = this.getStoredProjects();
        return projects.find(p => p.id === id) || null;
    }

    async getAllProjects(): Promise<Project[]> {
        return this.getStoredProjects();
    }

    async saveProject(project: Project): Promise<Project> {
        const projects = this.getStoredProjects();
        const existingIndex = projects.findIndex(p => p.id === project.id);

        const updatedProject = {
            ...project,
            updatedAt: Date.now()
        };

        if (existingIndex >= 0) {
            projects[existingIndex] = updatedProject;
        } else {
            projects.push(updatedProject);
        }

        this.saveStoredProjects(projects);
        return updatedProject;
    }

    async deleteProject(id: string): Promise<boolean> {
        const projects = this.getStoredProjects();
        const filteredProjects = projects.filter(p => p.id !== id);

        if (filteredProjects.length === projects.length) {
            return false; // Project not found
        }

        this.saveStoredProjects(filteredProjects);
        return true;
    }

    async clear(): Promise<boolean> {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Failed to clear projects:', error);
            return false;
        }
    }
} 