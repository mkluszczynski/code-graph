# Store Slice Contract: PersistenceSlice

**Feature**: 002 - Persist Code Changes Between Sessions  
**Module**: `frontend/src/shared/store/index.ts` (new slice)  
**Type**: Internal Module Contract (Zustand Store Slice)  
**Created**: 2025-11-15

---

## Overview

The `PersistenceSlice` extends the Zustand store with state and actions for managing auto-save operations, storage metadata, and persistence status.

---

## State Interface

```typescript
interface PersistenceSlice {
  // State
  lastSavedTimestamp: number | null;
  isSaving: boolean;
  saveError: string | null;
  autoSaveEnabled: boolean;
  pendingSaves: Map<string, number>;
  storageMetadata: StorageMetadata | null;
  
  // Actions
  setSaving: (isSaving: boolean) => void;
  setSaveError: (error: string | null) => void;
  setLastSaved: (timestamp: number) => void;
  addPendingSave: (fileId: string, timestamp: number) => void;
  removePendingSave: (fileId: string) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  updateStorageMetadata: (metadata: StorageMetadata) => void;
}
```

---

## State Properties

### `lastSavedTimestamp: number | null`

**Description**: Unix timestamp (milliseconds) of the last successful auto-save operation across all files.

**Initial Value**: `null`

**Usage**:
- Updated after successful save operation
- Used to display "Saved X seconds ago" indicator in UI
- `null` means no saves have occurred yet this session

**Example**:
```typescript
const lastSaved = useStore((state) => state.lastSavedTimestamp);
const secondsAgo = lastSaved ? (Date.now() - lastSaved) / 1000 : null;
console.log(`Last saved ${secondsAgo} seconds ago`);
```

---

### `isSaving: boolean`

**Description**: Whether a save operation is currently in progress.

**Initial Value**: `false`

**Usage**:
- Set to `true` when save starts
- Set to `false` when save completes (success or error)
- Used to show loading spinner in UI
- Prevents concurrent save operations

**Example**:
```typescript
const isSaving = useStore((state) => state.isSaving);
return <SaveIndicator spinning={isSaving} />;
```

---

### `saveError: string | null`

**Description**: Error message from the last failed save operation.

**Initial Value**: `null`

**Usage**:
- Set when save fails (quota exceeded, storage unavailable, etc.)
- Cleared on next successful save
- Used to display error banner in UI
- `null` means no errors

**Example**:
```typescript
const saveError = useStore((state) => state.saveError);
if (saveError) {
  return <ErrorBanner message={saveError} />;
}
```

---

### `autoSaveEnabled: boolean`

**Description**: Whether automatic saving is enabled.

**Initial Value**: `true`

**Usage**:
- Can be toggled by user (future feature) or disabled programmatically
- When `false`, debounced auto-save is disabled but manual save still works
- Disabled automatically when storage is unavailable

**Example**:
```typescript
const autoSaveEnabled = useStore((state) => state.autoSaveEnabled);
if (!autoSaveEnabled) {
  console.log('Auto-save disabled - manual save required');
}
```

---

### `pendingSaves: Map<string, number>`

**Description**: Map of file IDs to timestamps for files with pending (debounced) save operations.

**Initial Value**: `new Map()`

**Usage**:
- Key: file ID (string)
- Value: timestamp when save was queued (number)
- File added to map when editor changes
- File removed from map when save completes
- Used to show "saving..." indicator for specific files

**Example**:
```typescript
const pendingSaves = useStore((state) => state.pendingSaves);
const isPending = pendingSaves.has(fileId);
return <FileListItem name={file.name} isPending={isPending} />;
```

---

### `storageMetadata: StorageMetadata | null`

**Description**: Metadata about browser storage quota and availability.

**Initial Value**: `null`

**Usage**:
- Updated on app initialization and periodically
- `null` means not yet checked
- Used to show storage warnings/errors in UI

**Type**:
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

**Example**:
```typescript
const metadata = useStore((state) => state.storageMetadata);
if (metadata && metadata.percentUsed > 90) {
  return <WarningBanner>Storage quota at {metadata.percentUsed.toFixed(1)}%</WarningBanner>;
}
```

---

## Actions

### `setSaving(isSaving: boolean): void`

**Description**: Sets the saving status.

**Parameters**:
- `isSaving: boolean` - Whether save is in progress

**Behavior**:
- Updates `isSaving` state
- SHOULD be called at start and end of save operation

**Example**:
```typescript
setSaving(true);
try {
  await saveToIndexedDB();
  setSaving(false);
} catch (error) {
  setSaving(false);
}
```

---

### `setSaveError(error: string | null): void`

**Description**: Sets or clears the save error message.

**Parameters**:
- `error: string | null` - Error message (null to clear)

**Behavior**:
- Updates `saveError` state
- Pass `null` to clear error
- SHOULD be called when save fails or succeeds

**Example**:
```typescript
try {
  await saveToIndexedDB();
  setSaveError(null); // Clear previous errors
} catch (error) {
  setSaveError('Failed to save: ' + error.message);
}
```

---

### `setLastSaved(timestamp: number): void`

**Description**: Updates the last saved timestamp.

**Parameters**:
- `timestamp: number` - Unix timestamp in milliseconds

**Behavior**:
- Updates `lastSavedTimestamp` state
- SHOULD be called after successful save
- Typically called with `Date.now()`

**Example**:
```typescript
await saveToIndexedDB();
setLastSaved(Date.now());
```

---

### `addPendingSave(fileId: string, timestamp: number): void`

**Description**: Adds a file to the pending saves queue.

**Parameters**:
- `fileId: string` - File ID
- `timestamp: number` - When save was queued (Unix timestamp)

**Behavior**:
- Adds entry to `pendingSaves` map
- Overwrites if fileId already exists (debounce behavior)
- SHOULD be called when debounced save is queued

**Example**:
```typescript
addPendingSave(fileId, Date.now());
// Later, when debounce timer fires...
await saveFile(fileId);
removePendingSave(fileId);
```

---

### `removePendingSave(fileId: string): void`

**Description**: Removes a file from the pending saves queue.

**Parameters**:
- `fileId: string` - File ID

**Behavior**:
- Removes entry from `pendingSaves` map
- No-op if fileId not in map
- SHOULD be called when save completes (success or error)

**Example**:
```typescript
try {
  await saveFile(fileId);
  removePendingSave(fileId);
} catch (error) {
  removePendingSave(fileId); // Remove even on error
  setSaveError(error.message);
}
```

---

### `setAutoSaveEnabled(enabled: boolean): void`

**Description**: Enables or disables automatic saving.

**Parameters**:
- `enabled: boolean` - Whether auto-save should be enabled

**Behavior**:
- Updates `autoSaveEnabled` state
- SHOULD be called when storage becomes unavailable
- MAY be called by user preference toggle (future)

**Example**:
```typescript
if (!storageAvailable) {
  setAutoSaveEnabled(false);
  showWarning('Auto-save disabled - storage unavailable');
}
```

---

### `updateStorageMetadata(metadata: StorageMetadata): void`

**Description**: Updates storage metadata with new values.

**Parameters**:
- `metadata: StorageMetadata` - New storage metadata

**Behavior**:
- Replaces `storageMetadata` state entirely
- SHOULD be called after quota check
- SHOULD be called on app initialization

**Example**:
```typescript
const quota = await navigator.storage.estimate();
updateStorageMetadata({
  available: quota.quota - quota.usage,
  used: quota.usage,
  quota: quota.quota,
  percentUsed: (quota.usage / quota.quota) * 100,
  isAvailable: true,
  lastChecked: Date.now(),
  hasMultipleTabs: false,
});
```

---

## Selector Hooks

These are recommended selector hooks to optimize re-renders.

### `useSaveStatus()`

```typescript
export const useSaveStatus = () =>
  useStore((state) => ({
    isSaving: state.isSaving,
    lastSaved: state.lastSavedTimestamp,
    error: state.saveError,
  }));
```

**Usage**: Display save indicator in UI

---

### `useStorageStatus()`

```typescript
export const useStorageStatus = () =>
  useStore((state) => state.storageMetadata);
```

**Usage**: Display storage warnings/errors

---

### `useFilePendingStatus(fileId: string)`

```typescript
export const useFilePendingStatus = (fileId: string) =>
  useStore((state) => state.pendingSaves.has(fileId));
```

**Usage**: Show "saving..." indicator for specific file in file tree

---

## Integration with Existing Slices

The `PersistenceSlice` integrates with existing store slices:

### FileSlice Integration
- When `updateFile()` is called, trigger debounced auto-save
- When `removeFile()` is called, remove from `pendingSaves`

### EditorSlice Integration
- When `setEditorContent()` is called with dirty flag, trigger debounced auto-save
- When `setIsDirty(false)`, remove from `pendingSaves`

---

## Store Implementation

```typescript
const createPersistenceSlice: StateSliceCreator<PersistenceSlice> = (set, get) => ({
  // Initial state
  lastSavedTimestamp: null,
  isSaving: false,
  saveError: null,
  autoSaveEnabled: true,
  pendingSaves: new Map(),
  storageMetadata: null,
  
  // Actions
  setSaving: (isSaving: boolean) => set({ isSaving }),
  
  setSaveError: (error: string | null) => set({ saveError: error }),
  
  setLastSaved: (timestamp: number) => set({ lastSavedTimestamp: timestamp }),
  
  addPendingSave: (fileId: string, timestamp: number) =>
    set((state) => {
      const newPending = new Map(state.pendingSaves);
      newPending.set(fileId, timestamp);
      return { pendingSaves: newPending };
    }),
  
  removePendingSave: (fileId: string) =>
    set((state) => {
      const newPending = new Map(state.pendingSaves);
      newPending.delete(fileId);
      return { pendingSaves: newPending };
    }),
  
  setAutoSaveEnabled: (enabled: boolean) => set({ autoSaveEnabled: enabled }),
  
  updateStorageMetadata: (metadata: StorageMetadata) =>
    set({ storageMetadata: metadata }),
});

// Add to combined store
export const useStore = create<StoreState>()(
  devtools(
    (...args) => ({
      ...createFileSlice(...args),
      ...createEditorSlice(...args),
      ...createDiagramSlice(...args),
      ...createParserSlice(...args),
      ...createFileTreeSlice(...args),
      ...createPersistenceSlice(...args), // NEW
    }),
    {
      name: "uml-graph-store",
    }
  )
);
```

---

## Testing Requirements

### Unit Tests
- State updates work correctly (setSaving, setSaveError, etc.)
- Map operations work (addPendingSave, removePendingSave)
- Selector hooks return correct values

### Integration Tests
- PersistenceSlice integrates with FileSlice and EditorSlice
- Store updates trigger correct UI changes

---

## Notes

- This is a **Zustand store slice**, not a standalone module
- All state is **in-memory** (not persisted to IndexedDB)
- `pendingSaves` is a Map for O(1) lookup performance
- Selector hooks prevent unnecessary re-renders
- The slice follows Zustand best practices (immutable updates, slice pattern)

---

**Contract Complete**: 2025-11-15  
**Implementation**: Phase 2 (tasks)
