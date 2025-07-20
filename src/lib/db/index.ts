import { LocalStorageProvider } from './localStorage';
import type { Project } from './types';

// Use localStorage provider initially
const storageProvider = new LocalStorageProvider();

// Database API
export const db = {
    // Project operations
    getProject: (id: string) => storageProvider.getProject(id),
    getAllProjects: () => storageProvider.getAllProjects(),
    saveProject: (project: Project) => storageProvider.saveProject(project),
    deleteProject: (id: string) => storageProvider.deleteProject(id),

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
export type { Project };
export { LocalStorageProvider }; 