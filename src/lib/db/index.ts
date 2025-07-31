import { LocalStorageProvider } from './localStorage';
import type {
    Project,
    ProjectChapters,
    ProjectROIs,
    ProjectActions,
    ProjectSettings,
    BatchUpdate,
    ActionEvent
} from './types';

// Use localStorage provider initially
const storageProvider = new LocalStorageProvider();

// Database API
export const db = {
    // Project operations
    getProject: (id: string) => storageProvider.getProject(id),
    getAllProjects: () => storageProvider.getAllProjects(),
    saveProject: (project: Project) => storageProvider.saveProject(project),
    deleteProject: (id: string) => storageProvider.deleteProject(id),

    // Granular operations for performance
    getProjectChapters: (projectId: string) => storageProvider.getProjectChapters(projectId),
    saveProjectChapters: (chapters: ProjectChapters) => storageProvider.saveProjectChapters(chapters),

    getProjectROIs: (projectId: string) => storageProvider.getProjectROIs(projectId),
    saveProjectROIs: (rois: ProjectROIs) => storageProvider.saveProjectROIs(rois),

    getProjectActions: (projectId: string) => storageProvider.getProjectActions(projectId),
    saveProjectActions: (actions: ProjectActions) => storageProvider.saveProjectActions(actions),

    getProjectSettings: (projectId: string) => storageProvider.getProjectSettings(projectId),
    saveProjectSettings: (settings: ProjectSettings) => storageProvider.saveProjectSettings(settings),

    // Batch operations
    batchUpdate: (update: BatchUpdate) => storageProvider.batchUpdate(update),

    // Event sourcing for history/undo
    saveActionEvent: (event: ActionEvent) => storageProvider.saveActionEvent(event),
    getActionEvents: (projectId: string, limit?: number) => storageProvider.getActionEvents(projectId, limit),

    // Utility operations
    createProject: (name: string): Project => {
        return {
            id: storageProvider.generateId(),
            name,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    },

    // Helper to generate unique IDs
    generateId: () => storageProvider.generateId(),

    // Clear all data (useful for testing)
    clear: () => storageProvider.clear()
};

// Export types
export type {
    Project,
    ProjectChapters,
    ProjectROIs,
    ProjectActions,
    ProjectSettings,
    BatchUpdate,
    ActionEvent
};
export { LocalStorageProvider }; 