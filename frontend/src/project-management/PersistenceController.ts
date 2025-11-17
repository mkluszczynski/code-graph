/**
 * Persistence Controller
 *
 * Manages automatic code persistence with debouncing, quota monitoring,
 * and multi-tab awareness
 *
 * Based on: specs/002-persist-code-changes/contracts/persistence-controller.contract.md
 */

import { ProjectManager } from "./ProjectManager";
import { useStore } from "../shared/store";
import type { StorageMetadata } from "../shared/types";
import {
    AUTO_SAVE_DEBOUNCE_MS,
    STORAGE_ERROR_THRESHOLD,
} from "../shared/constants";
import { QuotaExceededError, StorageUnavailableError } from "../shared/types/errors";

/**
 * PersistenceController class
 *
 * Orchestrates auto-save, storage quota monitoring, and multi-tab coordination
 */
export class PersistenceController {
    private projectManager: ProjectManager;
    private broadcastChannel: BroadcastChannel | null = null;
    private debounceTimers: Map<string, ReturnType<typeof setTimeout>>;

    constructor(projectManager: ProjectManager) {
        this.projectManager = projectManager;
        this.debounceTimers = new Map();
    }

    /**
     * Initialize persistence controller
     * Tests storage availability, checks quota, restores state, sets up multi-tab detection
     */
    async initialize(): Promise<void> {
        console.log("[PERSISTENCE] Initializing persistence controller...");
        // Test storage availability
        const isAvailable = await this.testStorageAvailability();

        console.log("[PERSISTENCE] Storage availability:", isAvailable);

        if (!isAvailable) {
            useStore.getState().setAutoSaveEnabled(false);
            useStore.getState().updateStorageMetadata({
                available: 0,
                used: 0,
                quota: 0,
                percentUsed: 0,
                isAvailable: false,
                lastChecked: Date.now(),
                hasMultipleTabs: false,
            });
            throw new StorageUnavailableError();
        }

        // Check storage quota
        const metadata = await this.checkStorageQuota();
        useStore.getState().updateStorageMetadata(metadata);

        // Set up multi-tab detection
        this.setupBroadcastChannel();

        // Restore persisted state
        await this.restorePersistedState();
    }

    /**
     * Queues a file save with debouncing
     * Clears existing timer and sets new one
     *
     * @param fileId - File ID to save
     * @param content - File content to save
     */
    debouncedSaveFile(fileId: string, content: string): void {
        const { addPendingSave } = useStore.getState();

        // Add to pending saves
        addPendingSave(fileId, Date.now());

        // Clear existing timer
        const existingTimer = this.debounceTimers.get(fileId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(() => {
            console.log('[AUTO-SAVE] Triggering save for file:', fileId);
            this.saveFile(fileId, content);
        }, AUTO_SAVE_DEBOUNCE_MS);

        this.debounceTimers.set(fileId, timer);
    }

    /**
     * Saves a file to IndexedDB
     * Checks storage availability, updates store state, notifies other tabs
     *
     * @param fileId - File ID to save
     * @param content - File content to save
     */
    async saveFile(fileId: string, content: string): Promise<void> {
        const { setSaving, setLastSaved, removePendingSave, setSaveError, storageMetadata } =
            useStore.getState();

        try {
            setSaving(true);
            console.log('[AUTO-SAVE] Starting save for file:', fileId, 'Storage available:', storageMetadata?.isAvailable);

            // Check if storage available
            if (!storageMetadata?.isAvailable) {
                console.warn('[AUTO-SAVE] Storage unavailable, skipping save');
                // Fall back to in-memory only
                return;
            }

            // Check storage quota before save
            if (storageMetadata.percentUsed >= STORAGE_ERROR_THRESHOLD) {
                throw new QuotaExceededError(
                    "Storage quota exceeded. Try deleting unused files or exporting your project."
                );
            }

            // Save to IndexedDB
            console.log('[AUTO-SAVE] Saving to IndexedDB...');
            const updatedFile = await this.projectManager.updateFile(fileId, { content });

            // Update Zustand store with the saved file
            useStore.getState().updateFile(fileId, {
                content: updatedFile.content,
                lastModified: updatedFile.lastModified,
            });

            // Update persistence state
            const savedTimestamp = Date.now();
            setLastSaved(savedTimestamp);
            removePendingSave(fileId);
            setSaveError(null);

            console.log('[AUTO-SAVE] Save completed successfully at:', new Date(savedTimestamp).toISOString());

            // Notify other tabs
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage({
                    type: "FILE_UPDATED",
                    fileId,
                    timestamp: savedTimestamp,
                });
            }
        } catch (error) {
            if (
                error instanceof QuotaExceededError ||
                (error instanceof Error && error.name === "QuotaExceededError")
            ) {
                setSaveError("Storage quota exceeded. Try deleting unused files.");
                useStore.getState().setAutoSaveEnabled(false);
            } else if (error instanceof Error) {
                setSaveError(error.message);
            } else {
                setSaveError("Unknown error occurred during save");
            }
        } finally {
            setSaving(false);
        }
    }

    /**
     * Tests if IndexedDB storage is available
     *
     * @returns true if storage is available, false otherwise
     */
    async testStorageAvailability(): Promise<boolean> {
        try {
            // Try to use IndexedDB with a promise wrapper
            const testDbName = "storage-availability-test";
            const request = window.indexedDB.open(testDbName, 1);

            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                request.onblocked = () => reject(new Error("Database blocked"));
            });

            // IMPORTANT: Close the database immediately after opening
            db.close();

            // If we got here, storage is available
            // Note: We skip cleanup of the test database to avoid potential blocking issues
            // The tiny test database won't cause any problems if left in place

            return true;
        } catch (error) {
            // Storage is unavailable (incognito mode, disabled, etc.)
            console.warn("IndexedDB unavailable:", error);
            return false;
        }
    }

    /**
     * Checks storage quota and usage
     *
     * @returns Storage metadata
     */
    async checkStorageQuota(): Promise<StorageMetadata> {
        // Check if StorageManager API is available
        if ("storage" in navigator && "estimate" in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const quota = estimate.quota || 0;
                const usage = estimate.usage || 0;
                const available = quota - usage;
                const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

                return {
                    available,
                    used: usage,
                    quota,
                    percentUsed,
                    isAvailable: true,
                    lastChecked: Date.now(),
                    hasMultipleTabs: false,
                };
            } catch (error) {
                console.warn("Failed to check storage quota:", error);
            }
        }

        // Fallback for browsers without StorageManager API
        return {
            available: Infinity,
            used: 0,
            quota: Infinity,
            percentUsed: 0,
            isAvailable: true,
            lastChecked: Date.now(),
            hasMultipleTabs: false,
        };
    }

    /**
     * Restores persisted state from IndexedDB
     * Loads file tree and restores last active file
     */
    async restorePersistedState(): Promise<void> {
        const { setFiles, setActiveFile } = useStore.getState();

        try {
            // Load all files from IndexedDB
            const files = await this.projectManager.getAllFiles();
            setFiles(files);

            // Restore last active file from localStorage
            const lastActiveId = localStorage.getItem("lastActiveFileId");
            if (lastActiveId) {
                // Verify the file still exists
                const fileExists = files.some((f) => f.id === lastActiveId);
                if (fileExists) {
                    setActiveFile(lastActiveId);
                }
            }
        } catch (error) {
            console.error("Failed to restore persisted state:", error);
            // Don't throw - allow app to start with empty state
        }
    }

    /**
     * Sets up BroadcastChannel for multi-tab detection
     */
    private setupBroadcastChannel(): void {
        try {
            // Create broadcast channel
            this.broadcastChannel = new BroadcastChannel("code-graph-tabs");

            // Listen for messages from other tabs
            this.broadcastChannel.addEventListener("message", (event) => {
                const { type, fileId } = event.data;

                if (type === "TAB_ANNOUNCE") {
                    // Another tab has announced itself - mark multi-tab mode
                    const metadata = useStore.getState().storageMetadata;
                    if (metadata) {
                        useStore.getState().updateStorageMetadata({
                            ...metadata,
                            hasMultipleTabs: true,
                        });
                    }
                } else if (type === "FILE_UPDATED") {
                    // Another tab has saved a file
                    const activeFileId = useStore.getState().activeFileId;

                    // If this is not the currently active file, we could reload it
                    // For now, we just track that another tab made changes
                    if (activeFileId !== fileId) {
                        // File was updated in another tab
                        // In a full implementation, we might reload the file from IndexedDB
                        console.log(`File ${fileId} was updated in another tab`);
                    } else {
                        // User is editing the same file in another tab - show warning
                        console.warn(`File ${fileId} is being edited in multiple tabs`);
                    }
                }
            });

            // Announce this tab
            this.broadcastChannel.postMessage({
                type: "TAB_ANNOUNCE",
                timestamp: Date.now(),
            });
        } catch (error) {
            // BroadcastChannel not supported (older browsers)
            console.warn("BroadcastChannel not supported:", error);
            this.broadcastChannel = null;
        }
    }

    /**
     * Cleans up resources
     * Closes BroadcastChannel and clears all debounce timers
     */
    cleanup(): void {
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
            this.broadcastChannel = null;
        }

        this.debounceTimers.forEach((timer) => clearTimeout(timer));
        this.debounceTimers.clear();
    }
}
