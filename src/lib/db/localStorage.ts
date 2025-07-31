import { BaseStorageProvider } from './types';
import type { Project, ProjectROIs, ProjectChapters, ProjectActions, ProjectSettings, BatchUpdate, ActionEvent } from './types';

export class LocalStorageProvider extends BaseStorageProvider {
    private readonly STORAGE_KEY = 'pfs-editor-projects';
    private readonly ROIS_STORAGE_KEY = 'pfs-editor-rois';
    private readonly CHAPTERS_STORAGE_KEY = 'pfs-editor-chapters';
    private readonly ACTIONS_STORAGE_KEY = 'pfs-editor-actions';
    private readonly SETTINGS_STORAGE_KEY = 'pfs-editor-settings';
    private readonly EVENTS_STORAGE_KEY = 'pfs-editor-events';

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

    // ROIs storage methods
    private getStoredROIs(): { [projectId: string]: ProjectROIs } {
        try {
            const data = localStorage.getItem(this.ROIS_STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to parse stored ROIs:', error);
            return {};
        }
    }

    private saveStoredROIs(rois: { [projectId: string]: ProjectROIs }): void {
        try {
            localStorage.setItem(this.ROIS_STORAGE_KEY, JSON.stringify(rois));
        } catch (error) {
            console.error('Failed to save ROIs:', error);
            throw new Error('Storage quota exceeded or localStorage unavailable');
        }
    }

    // Chapters storage methods
    private getStoredChapters(): { [projectId: string]: ProjectChapters } {
        try {
            const data = localStorage.getItem(this.CHAPTERS_STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to parse stored chapters:', error);
            return {};
        }
    }

    private saveStoredChapters(chapters: { [projectId: string]: ProjectChapters }): void {
        try {
            localStorage.setItem(this.CHAPTERS_STORAGE_KEY, JSON.stringify(chapters));
        } catch (error) {
            console.error('Failed to save chapters:', error);
            throw new Error('Storage quota exceeded or localStorage unavailable');
        }
    }

    // Actions storage methods
    private getStoredActions(): { [projectId: string]: ProjectActions } {
        try {
            const data = localStorage.getItem(this.ACTIONS_STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to parse stored actions:', error);
            return {};
        }
    }

    private saveStoredActions(actions: { [projectId: string]: ProjectActions }): void {
        try {
            localStorage.setItem(this.ACTIONS_STORAGE_KEY, JSON.stringify(actions));
        } catch (error) {
            console.error('Failed to save actions:', error);
            throw new Error('Storage quota exceeded or localStorage unavailable');
        }
    }

    // Settings storage methods
    private getStoredSettings(): { [projectId: string]: ProjectSettings } {
        try {
            const data = localStorage.getItem(this.SETTINGS_STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to parse stored settings:', error);
            return {};
        }
    }

    private saveStoredSettings(settings: { [projectId: string]: ProjectSettings }): void {
        try {
            localStorage.setItem(this.SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw new Error('Storage quota exceeded or localStorage unavailable');
        }
    }

    // Events storage methods
    protected getStoredEvents(): ActionEvent[] {
        try {
            const data = localStorage.getItem(this.EVENTS_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to parse stored events:', error);
            return [];
        }
    }

    protected saveStoredEvents(events: ActionEvent[]): void {
        try {
            localStorage.setItem(this.EVENTS_STORAGE_KEY, JSON.stringify(events));
        } catch (error) {
            console.error('Failed to save events:', error);
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

    // Granular operations implementation
    async getProjectROIs(projectId: string): Promise<ProjectROIs | null> {
        const storedROIs = this.getStoredROIs();
        return storedROIs[projectId] || null;
    }

    async saveProjectROIs(rois: ProjectROIs): Promise<ProjectROIs> {
        const storedROIs = this.getStoredROIs();
        const updatedROIs = {
            ...rois,
            updatedAt: Date.now()
        };

        storedROIs[rois.projectId] = updatedROIs;
        this.saveStoredROIs(storedROIs);
        return updatedROIs;
    }

    async getProjectChapters(projectId: string): Promise<ProjectChapters | null> {
        const storedChapters = this.getStoredChapters();
        return storedChapters[projectId] || null;
    }

    async saveProjectChapters(chapters: ProjectChapters): Promise<ProjectChapters> {
        const storedChapters = this.getStoredChapters();
        const updatedChapters = {
            ...chapters,
            updatedAt: Date.now()
        };

        storedChapters[chapters.projectId] = updatedChapters;
        this.saveStoredChapters(storedChapters);
        return updatedChapters;
    }

    async getProjectActions(projectId: string): Promise<ProjectActions | null> {
        const storedActions = this.getStoredActions();
        return storedActions[projectId] || null;
    }

    async saveProjectActions(actions: ProjectActions): Promise<ProjectActions> {
        const storedActions = this.getStoredActions();
        const updatedActions = {
            ...actions,
            updatedAt: Date.now()
        };

        storedActions[actions.projectId] = updatedActions;
        this.saveStoredActions(storedActions);
        return updatedActions;
    }

    async getProjectSettings(projectId: string): Promise<ProjectSettings | null> {
        const storedSettings = this.getStoredSettings();
        return storedSettings[projectId] || null;
    }

    async saveProjectSettings(settings: ProjectSettings): Promise<ProjectSettings> {
        const storedSettings = this.getStoredSettings();
        const updatedSettings = {
            ...settings,
            updatedAt: Date.now()
        };

        storedSettings[settings.projectId] = updatedSettings;
        this.saveStoredSettings(storedSettings);
        return updatedSettings;
    }

    async batchUpdate(update: BatchUpdate): Promise<void> {
        // Apply all updates in the batch
        if (update.updates.chapters && update.updates.chapters.projectId) {
            await this.saveProjectChapters(update.updates.chapters as ProjectChapters);
        }
        if (update.updates.rois && update.updates.rois.projectId) {
            await this.saveProjectROIs(update.updates.rois as ProjectROIs);
        }
        if (update.updates.actions && update.updates.actions.projectId) {
            await this.saveProjectActions(update.updates.actions as ProjectActions);
        }
        if (update.updates.settings && update.updates.settings.projectId) {
            await this.saveProjectSettings(update.updates.settings as ProjectSettings);
        }
    }

    async saveActionEvent(event: ActionEvent): Promise<ActionEvent> {
        const events = this.getStoredEvents();
        const newEvent = {
            ...event,
            id: event.id || this.generateId(),
            timestamp: event.timestamp || Date.now()
        };
        events.push(newEvent);
        this.saveStoredEvents(events);
        return newEvent;
    }

    async getActionEvents(projectId: string, limit: number = 100): Promise<ActionEvent[]> {
        const events = this.getStoredEvents();
        return events
            .filter(e => e.projectId === projectId)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    async clear(): Promise<boolean> {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.ROIS_STORAGE_KEY);
            localStorage.removeItem(this.CHAPTERS_STORAGE_KEY);
            localStorage.removeItem(this.ACTIONS_STORAGE_KEY);
            localStorage.removeItem(this.SETTINGS_STORAGE_KEY);
            localStorage.removeItem(this.EVENTS_STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }
} 