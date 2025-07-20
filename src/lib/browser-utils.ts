// Type declarations for File System Access API
declare global {
    interface Window {
        showOpenFilePicker?: (options?: {
            types?: Array<{
                description: string;
                accept: Record<string, string[]>;
            }>;
            multiple?: boolean;
        }) => Promise<FileSystemFileHandle[]>;
    }
}

// Browser detection utilities
export const isChromium = (): boolean => {
    return 'showOpenFilePicker' in window;
};

export const isFirefox = (): boolean => {
    return navigator.userAgent.includes('Firefox');
};

export const isSafari = (): boolean => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// File handling utilities
export const selectVideoFile = async (): Promise<File | null> => {
    if (isChromium()) {
        try {
            const [fileHandle] = await window.showOpenFilePicker!({
                types: [
                    {
                        description: 'Video Files',
                        accept: {
                            'video/*': ['.mp4', '.webm', '.ogv']
                        }
                    }
                ],
                multiple: false
            });

            return await fileHandle.getFile();
        } catch (error) {
            console.error('File picker cancelled or failed:', error);
            return null;
        }
    } else {
        // Fallback for non-Chromium browsers
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*';
            input.multiple = false;

            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0] || null;
                resolve(file);
            };

            input.click();
        });
    }
};

// Video file validation
export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'Unsupported video format. Please use MP4, WebM, or OGV.' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'File too large. Maximum size is 500MB.' };
    }

    return { valid: true };
};

// Create blob URL for video playback
export const createVideoBlobUrl = (file: File): string => {
    return URL.createObjectURL(file);
};

// Clean up blob URL
export const revokeVideoBlobUrl = (blobUrl: string): void => {
    URL.revokeObjectURL(blobUrl);
}; 