# Persistence Controller API Contract

**Feature**: 002 - Persist Code Changes Between Sessions  
**Module**: `frontend/src/project-management/PersistenceController.ts`  
**Type**: Internal Module Contract  
**Created**: 2025-11-15

---

## Overview

The `PersistenceController` class manages automatic persistence of code changes to IndexedDB, including debounced auto-save, storage quota monitoring, multi-tab detection, and state restoration on page load.

---

## Interface: PersistenceController

### Constructor

```typescript
constructor(projectManager: ProjectManager)
```

**Parameters**:
- `projectManager: ProjectManager` - Instance of ProjectManager for file operations

**Behavior**:
- MUST initialize BroadcastChannel for multi-tab detection
- MUST set up storage event listeners
- MUST announce this tab's existence to other tabs
- SHOULD NOT throw errors (defer to initialize() method)

---

### `initialize(): Promise<void>`

Initializes the persistence system on application startup.

**Parameters**: None

**Returns**: `Promise<void>`

**Behavior**:
- MUST test storage availability using `testStorageAvailability()`
- MUST check storage quota using `checkStorageQuota()`
- MUST restore file tree metadata from IndexedDB
- MUST restore last active file (if any) from localStorage
- MUST update store with storage metadata
- SHOULD complete in <2 seconds for 50 files (SC-003)
- IF storage unavailable → set `storageAvailable = false`, show banner, continue with in-memory mode
- IF quota warning (>90%) → show warning banner but continue

**Error Handling**:
- Storage unavailable → log warning, set state, show banner (non-blocking)
- Quota exceeded → show warning, continue (non-blocking)
- Restore fails → log error, start with empty project (non-blocking)

**Side Effects**:
- Updates Zustand store: `files`, `activeFileId`, `storageMetadata`
- Writes to localStorage: `lastActiveFileId` (if restoring)
- Shows UI banners if warnings/errors detected

**Example**:
```typescript
const persistenceController = new PersistenceController(projectManager);
await persistenceController.initialize();
// Files loaded, active file restored, storage status checked
```

---

### `saveFile(fileId: string, content: string): Promise<void>`

Saves a file's content to IndexedDB with quota checking and error handling.

**Parameters**:
- `fileId: string` - File ID to save (must exist in store)
- `content: string` - File content to persist

**Returns**: `Promise<void>`

**Behavior**:
- MUST validate fileId exists in store
- MUST check `storageMetadata.isAvailable` before attempting save
- MUST call `projectManager.updateFile(fileId, { content })` to persist to IndexedDB
- MUST update `lastSavedTimestamp` on success
- MUST remove fileId from `pendingSaves` on success
- SHOULD complete in <100ms per file
- IF storage unavailable → update in-memory store only, log warning
- IF quota exceeded → catch error, show user message, set `storageAvailable = false`

**Error Handling**:
- `QuotaExceededError` → show actionable error message, disable storage, update in-memory only
- `StorageError` → log error, retry once, show error to user if retry fails
- Invalid fileId → throw `Error('File not found')`

**Side Effects**:
- Writes to IndexedDB (`files` object store)
- Updates Zustand store: `lastSavedTimestamp`, `pendingSaves`, `storageMetadata` (if error)
- Notifies other tabs via BroadcastChannel: `{ type: 'FILE_UPDATED', fileId, timestamp }`

**Example**:
```typescript
await persistenceController.saveFile(
  '550e8400-e29b-41d4-a716-446655440000',
  'export class Person { name: string; }'
);
// File saved to IndexedDB, other tabs notified
```

---

### `debouncedSaveFile(fileId: string, content: string): void`

Queues a file save with debounce delay (500ms). This is the method called by the editor controller.

**Parameters**:
- `fileId: string` - File ID to save
- `content: string` - File content to persist

**Returns**: `void` (fire-and-forget)

**Behavior**:
- MUST add fileId to `pendingSaves` map with current timestamp
- MUST clear any existing debounce timer for this fileId
- MUST set new timer for 500ms (AUTO_SAVE_DEBOUNCE_MS)
- MUST call `saveFile(fileId, content)` when timer fires
- MUST NOT block the UI thread
- SHOULD batch multiple rapid edits into single save operation

**Error Handling**:
- Errors from `saveFile()` are handled by that method
- This method never throws (async errors are caught internally)

**Side Effects**:
- Updates Zustand store: `pendingSaves`
- Schedules async `saveFile()` call after debounce

**Example**:
```typescript
// User types in editor
persistenceController.debouncedSaveFile(fileId, newContent);
persistenceController.debouncedSaveFile(fileId, newerContent); // Cancels previous timer
// After 500ms of no changes → saveFile() is called once
```

---

### `checkStorageQuota(): Promise<StorageMetadata>`

Checks browser storage quota and returns metadata.

**Parameters**: None

**Returns**: `Promise<StorageMetadata>` - Storage quota information

**Behavior**:
- MUST use `navigator.storage.estimate()` if available
- MUST calculate `percentUsed = (usage / quota) * 100`
- MUST set `hasSpace = percentUsed < 90` (warning threshold)
- SHOULD complete in <100ms
- IF API unavailable → return fallback with `hasSpace: true, percentUsed: 0`

**Error Handling**:
- API unavailable → return fallback values (assume space available)
- API error → log warning, return fallback

**Side Effects**:
- Updates Zustand store: `storageMetadata`

**Example**:
```typescript
const metadata = await persistenceController.checkStorageQuota();
console.log(`Storage used: ${metadata.percentUsed.toFixed(1)}%`);
// Storage used: 0.5%
```

---

### `testStorageAvailability(): Promise<boolean>`

Tests whether IndexedDB is available and writable.

**Parameters**: None

**Returns**: `Promise<boolean>` - `true` if storage is available, `false` otherwise

**Behavior**:
- MUST attempt to open a test database (`storage-test`)
- MUST attempt to write a test entry
- MUST clean up test database after check
- SHOULD complete in <200ms
- IF successful → return `true`
- IF any error → return `false` (no throw)

**Error Handling**:
- All errors caught and return `false` (graceful degradation)

**Example**:
```typescript
const isAvailable = await persistenceController.testStorageAvailability();
if (!isAvailable) {
  showWarning('Storage unavailable - changes won\'t persist');
}
```

---

### `restorePersistedState(): Promise<void>`

Restores file tree and active file from IndexedDB on page load.

**Parameters**: None

**Returns**: `Promise<void>`

**Behavior**:
- MUST load all file metadata (id, name, path, lastModified) from IndexedDB
- MUST restore `lastActiveFileId` from localStorage
- MUST load active file content if lastActiveFileId exists
- MUST update store with loaded files
- SHOULD complete in <2 seconds for 50 files
- IF no files found → start with empty project (not an error)
- IF lastActiveFileId not found → no active file (not an error)

**Error Handling**:
- IndexedDB error → log error, start with empty project
- Active file not found → no active file (user will create new)

**Side Effects**:
- Updates Zustand store: `files`, `activeFileId`, `editorContent`
- Reads from localStorage: `lastActiveFileId`

**Example**:
```typescript
await persistenceController.restorePersistedState();
// Files loaded from IndexedDB, last active file restored
```

---

### `handleMultiTab(message: BroadcastMessage): void`

Handles messages from other browser tabs via BroadcastChannel.

**Parameters**:
- `message: BroadcastMessage` - Message from another tab

**Returns**: `void`

**Behavior**:
- MUST handle `TAB_ANNOUNCE` message → set `hasMultipleTabs = true`, show warning
- MUST handle `FILE_UPDATED` message → reload file if not currently editing
- MUST NOT reload file if user is actively editing (show warning instead)
- MUST update store with multi-tab status

**Error Handling**:
- Invalid message → log warning, ignore
- Reload error → log error, notify user

**Side Effects**:
- Updates Zustand store: `storageMetadata.hasMultipleTabs`, `files`
- Shows UI warning banner if multiple tabs detected
- May reload file content from IndexedDB

**Example**:
```typescript
// In another tab: file is saved
broadcastChannel.postMessage({ 
  type: 'FILE_UPDATED', 
  fileId: '123', 
  timestamp: Date.now() 
});

// In this tab: handleMultiTab is called
persistenceController.handleMultiTab(message);
// File reloaded if not currently editing
```

---

### `cleanup(): void`

Cleans up resources when component unmounts.

**Parameters**: None

**Returns**: `void`

**Behavior**:
- MUST close BroadcastChannel
- MUST clear all debounce timers
- MUST remove storage event listeners
- MUST NOT throw errors

**Example**:
```typescript
persistenceController.cleanup();
// Resources cleaned up
```

---

## Type Definitions

### StorageMetadata

```typescript
interface StorageMetadata {
  available: number;        // Available storage (bytes)
  used: number;             // Used storage (bytes)
  quota: number;            // Total quota (bytes)
  percentUsed: number;      // Percentage (0-100)
  isAvailable: boolean;     // Whether storage is accessible
  lastChecked: number;      // Unix timestamp
  hasMultipleTabs: boolean; // Whether multiple tabs detected
}
```

### BroadcastMessage

```typescript
type BroadcastMessage = 
  | { type: 'TAB_ANNOUNCE'; tabId: string; timestamp: number }
  | { type: 'FILE_UPDATED'; fileId: string; timestamp: number };
```

---

## Dependencies

- `ProjectManager` (from feature 001) - for file CRUD operations
- `idb` package - for IndexedDB access (via ProjectManager)
- `Zustand` store - for state management
- `BroadcastChannel` API - for multi-tab communication
- `navigator.storage.estimate()` API - for quota checking

---

## Integration Points

### Editor Controller Integration

```typescript
// In useEditorController.ts
const handleEditorChange = useCallback((value: string | undefined) => {
  if (!activeFile) return;
  
  const newContent = value || '';
  setEditorContent(newContent);
  
  // Trigger debounced auto-save
  persistenceController.debouncedSaveFile(activeFile.id, newContent);
}, [activeFile]);
```

### App Initialization Integration

```typescript
// In App.tsx
useEffect(() => {
  const init = async () => {
    const projectManager = new ProjectManager();
    await projectManager.initialize();
    
    const persistenceController = new PersistenceController(projectManager);
    await persistenceController.initialize();
    
    setPersistenceController(persistenceController);
  };
  
  init();
  
  return () => {
    persistenceController?.cleanup();
  };
}, []);
```

---

## Constants

```typescript
export const AUTO_SAVE_DEBOUNCE_MS = 500;
export const STORAGE_WARNING_THRESHOLD = 90; // percent
export const STORAGE_ERROR_THRESHOLD = 95;   // percent
export const SAVE_TIMEOUT_MS = 5000;
```

---

## Error Messages

### User-Facing Error Messages

| Scenario | Message |
|----------|---------|
| Quota exceeded | "Storage quota exceeded. Try deleting unused files or exporting your project." |
| Storage unavailable | "⚠️ Browser storage is unavailable. Changes will not persist after refresh. Consider exporting your project." |
| Multi-tab detected | "⚠️ Multiple tabs detected. Changes in this tab may be overwritten by edits in other tabs." |
| Save failed | "Failed to save file. Your changes are preserved in memory. Try exporting your project." |

---

## Performance Requirements

- Initialize: <2 seconds for 50 files (SC-003)
- Save file: <100ms per save operation
- Check quota: <100ms
- Test availability: <200ms
- Auto-save debounce: 500ms (constant)

---

## Testing Requirements

### Contract Tests
- Initialize with storage available → loads files correctly
- Initialize with storage unavailable → graceful degradation
- Save file with quota → succeeds, notifies other tabs
- Save file without quota → falls back to in-memory
- Debounced save → batches rapid edits into single save
- Multi-tab detection → shows warning, handles FILE_UPDATED
- Quota check → returns correct metadata

### Integration Tests
- Editor typing → debounced auto-save → IndexedDB persistence
- Page refresh → restored state from IndexedDB
- Browser crash simulation → last saved state recoverable

### E2E Tests
- Full user workflow: create file, edit, refresh, verify persistence
- Multi-tab scenario: edit in Tab A, verify warning in Tab B
- Storage quota scenario: fill storage, verify graceful degradation

---

## Notes

- This is an **internal module contract**, not a REST/HTTP API
- All operations are **asynchronous** (IndexedDB is async)
- Auto-save is **debounced** to prevent excessive writes
- Storage errors are **non-blocking** (graceful degradation)
- Multi-tab conflicts use **last write wins** strategy
- User experience is prioritized over data consistency (acceptable for single-user tool)

---

**Contract Complete**: 2025-11-15  
**Implementation**: Phase 2 (tasks)
