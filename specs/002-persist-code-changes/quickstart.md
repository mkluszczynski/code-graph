# Quickstart Guide: Code Persistence Feature

**Feature**: 002 - Persist Code Changes Between Sessions  
**Target Audience**: Developers implementing the persistence feature  
**Created**: 2025-11-15

---

## Overview

This guide walks you through implementing automatic code persistence for the TypeScript UML Graph Visualizer. After implementing this feature, users will never lose their code changes when refreshing the browser or closing tabs.

**Key Concepts**:
- **Auto-save**: Changes are automatically saved to IndexedDB 500ms after typing stops
- **Graceful degradation**: If storage is unavailable, the app continues working in-memory
- **Multi-tab awareness**: Warns users when multiple tabs might conflict
- **Quota monitoring**: Alerts users before running out of storage space

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Types                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  CodeEditor (Monaco)                                         │
│  - Captures onChange events                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  useEditorController                                         │
│  - Handles content changes                                   │
│  - Calls debouncedSaveFile()                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PersistenceController                                       │
│  - Debounces saves (500ms)                                   │
│  - Checks storage quota                                      │
│  - Handles multi-tab conflicts                               │
│  - Manages graceful degradation                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  ProjectManager                                              │
│  - updateFile(id, { content })                               │
│  - Persists to IndexedDB                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  IndexedDB (via idb)                                         │
│  - Client-side storage                                       │
│  - Survives browser refresh                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add PersistenceSlice to Zustand Store

**File**: `frontend/src/shared/store/index.ts`

**What to add**:
```typescript
// Add to type definitions
interface PersistenceSlice {
  lastSavedTimestamp: number | null;
  isSaving: boolean;
  saveError: string | null;
  autoSaveEnabled: boolean;
  pendingSaves: Map<string, number>;
  storageMetadata: StorageMetadata | null;
  
  setSaving: (isSaving: boolean) => void;
  setSaveError: (error: string | null) => void;
  setLastSaved: (timestamp: number) => void;
  addPendingSave: (fileId: string, timestamp: number) => void;
  removePendingSave: (fileId: string) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  updateStorageMetadata: (metadata: StorageMetadata) => void;
}

// Create slice
const createPersistenceSlice: StateSliceCreator<PersistenceSlice> = (set) => ({
  lastSavedTimestamp: null,
  isSaving: false,
  saveError: null,
  autoSaveEnabled: true,
  pendingSaves: new Map(),
  storageMetadata: null,
  
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
      ...createPersistenceSlice(...args), // ADD THIS
    }),
    { name: "uml-graph-store" }
  )
);
```

**Why**: Centralized state management for persistence status, pending saves, and storage metadata.

**Tests to write first**:
- `persistence-slice.test.ts`: Unit tests for all state actions

---

### Step 2: Create PersistenceController

**File**: `frontend/src/project-management/PersistenceController.ts` (new file)

**What to create**:
```typescript
import { ProjectManager } from './ProjectManager';
import { useStore } from '../shared/store';
import type { StorageMetadata } from '../shared/types';

const AUTO_SAVE_DEBOUNCE_MS = 500;

export class PersistenceController {
  private projectManager: ProjectManager;
  private broadcastChannel: BroadcastChannel;
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>>;
  
  constructor(projectManager: ProjectManager) {
    this.projectManager = projectManager;
    this.debounceTimers = new Map();
    
    // Multi-tab detection
    this.broadcastChannel = new BroadcastChannel('code-graph-tabs');
    this.setupBroadcastChannel();
  }
  
  async initialize(): Promise<void> {
    // 1. Test storage availability
    const isAvailable = await this.testStorageAvailability();
    
    if (!isAvailable) {
      useStore.getState().setAutoSaveEnabled(false);
      // Show warning banner
      return;
    }
    
    // 2. Check storage quota
    const metadata = await this.checkStorageQuota();
    useStore.getState().updateStorageMetadata(metadata);
    
    // 3. Restore persisted state
    await this.restorePersistedState();
  }
  
  debouncedSaveFile(fileId: string, content: string): void {
    // Add to pending saves
    useStore.getState().addPendingSave(fileId, Date.now());
    
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(fileId);
    if (existingTimer) clearTimeout(existingTimer);
    
    // Set new timer
    const timer = setTimeout(() => {
      this.saveFile(fileId, content);
    }, AUTO_SAVE_DEBOUNCE_MS);
    
    this.debounceTimers.set(fileId, timer);
  }
  
  async saveFile(fileId: string, content: string): Promise<void> {
    const { setSaving, setLastSaved, removePendingSave, setSaveError } = useStore.getState();
    
    try {
      setSaving(true);
      
      // Check if storage available
      const metadata = useStore.getState().storageMetadata;
      if (!metadata?.isAvailable) {
        // Fall back to in-memory only
        return;
      }
      
      // Save to IndexedDB
      await this.projectManager.updateFile(fileId, { content });
      
      // Update state
      setLastSaved(Date.now());
      removePendingSave(fileId);
      setSaveError(null);
      
      // Notify other tabs
      this.broadcastChannel.postMessage({
        type: 'FILE_UPDATED',
        fileId,
        timestamp: Date.now(),
      });
      
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        setSaveError('Storage quota exceeded. Try deleting unused files.');
        useStore.getState().setAutoSaveEnabled(false);
      } else {
        setSaveError(error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setSaving(false);
    }
  }
  
  async checkStorageQuota(): Promise<StorageMetadata> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      
      return {
        available: quota - usage,
        used: usage,
        quota,
        percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
        isAvailable: true,
        lastChecked: Date.now(),
        hasMultipleTabs: false,
      };
    }
    
    // Fallback
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
  
  async testStorageAvailability(): Promise<boolean> {
    try {
      const testDb = await this.projectManager.db.open('storage-test', 1);
      testDb.close();
      return true;
    } catch {
      return false;
    }
  }
  
  async restorePersistedState(): Promise<void> {
    // Load file tree
    const files = await this.projectManager.getAllFiles();
    useStore.getState().setFiles(files);
    
    // Restore last active file
    const lastActiveId = localStorage.getItem('lastActiveFileId');
    if (lastActiveId && files.find(f => f.id === lastActiveId)) {
      useStore.getState().setActiveFile(lastActiveId);
    }
  }
  
  private setupBroadcastChannel(): void {
    // Announce this tab
    this.broadcastChannel.postMessage({ type: 'TAB_ANNOUNCE', timestamp: Date.now() });
    
    // Listen for other tabs
    this.broadcastChannel.addEventListener('message', (event) => {
      if (event.data.type === 'TAB_ANNOUNCE') {
        // Show multi-tab warning
        const metadata = useStore.getState().storageMetadata;
        if (metadata) {
          useStore.getState().updateStorageMetadata({
            ...metadata,
            hasMultipleTabs: true,
          });
        }
      }
      
      if (event.data.type === 'FILE_UPDATED') {
        // Reload file if not currently editing
        const activeFileId = useStore.getState().activeFileId;
        if (activeFileId !== event.data.fileId) {
          // Reload file
          this.projectManager.getFile(event.data.fileId).then(file => {
            if (file) {
              useStore.getState().updateFile(file.id, file);
            }
          });
        }
      }
    });
  }
  
  cleanup(): void {
    this.broadcastChannel.close();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}
```

**Why**: Centralized persistence logic with debouncing, quota management, and multi-tab awareness.

**Tests to write first**:
- `persistence-controller.contract.test.ts`: Contract tests for all public methods
- `debounce.test.ts`: Unit tests for debounce logic
- `quota-check.test.ts`: Unit tests for storage quota validation

---

### Step 3: Integrate with Editor Controller

**File**: `frontend/src/code-editor/useEditorController.ts`

**What to modify**:
```typescript
// Add import
import { usePersistenceController } from '../project-management/usePersistenceController';

export function useEditorController() {
  // ... existing code ...
  const persistenceController = usePersistenceController();
  
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!activeFile) return;

      const newContent = value || '';
      setEditorContent(newContent);

      // Mark as dirty
      const isDirty = newContent !== activeFile.content;
      setIsDirty(isDirty);

      // Trigger debounced auto-save (NEW)
      if (isDirty && persistenceController) {
        persistenceController.debouncedSaveFile(activeFile.id, newContent);
      }

      // Clear existing debounce timer (for parsing)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set up new debounce timer for parsing
      debounceTimerRef.current = setTimeout(() => {
        parseAndUpdateDiagram(newContent, activeFile.id);
      }, EDITOR_DEBOUNCE_DELAY_MS);
    },
    [activeFile, setEditorContent, setIsDirty, persistenceController]
  );
  
  // ... rest of existing code ...
}
```

**Why**: Triggers auto-save when user types in the editor.

**Tests to write first**:
- `auto-save-integration.test.ts`: Integration test for editor typing → auto-save flow

---

### Step 4: Initialize in App Component

**File**: `frontend/src/App.tsx`

**What to add**:
```typescript
import { PersistenceController } from './project-management/PersistenceController';

function App() {
  const [persistenceController, setPersistenceController] = useState<PersistenceController | null>(null);
  
  useEffect(() => {
    const init = async () => {
      // Initialize ProjectManager
      const projectManager = new ProjectManager();
      await projectManager.initialize();
      
      // Initialize PersistenceController
      const controller = new PersistenceController(projectManager);
      await controller.initialize();
      
      setPersistenceController(controller);
    };
    
    init();
    
    return () => {
      persistenceController?.cleanup();
    };
  }, []);
  
  // Provide controller via context
  return (
    <PersistenceControllerContext.Provider value={persistenceController}>
      {/* ... rest of app ... */}
    </PersistenceControllerContext.Provider>
  );
}
```

**Why**: Initializes persistence on app startup and restores saved state.

**Tests to write first**:
- `restore-state.test.ts`: Integration test for page refresh → restored files

---

### Step 5: Add UI Indicators (Optional but Recommended)

**File**: `frontend/src/components/SaveIndicator.tsx` (new file)

**What to create**:
```typescript
import { useStore } from '../shared/store';

export function SaveIndicator() {
  const isSaving = useStore((state) => state.isSaving);
  const lastSaved = useStore((state) => state.lastSavedTimestamp);
  const saveError = useStore((state) => state.saveError);
  
  if (saveError) {
    return (
      <div className="text-red-500 text-sm">
        ⚠️ {saveError}
      </div>
    );
  }
  
  if (isSaving) {
    return <div className="text-muted-foreground text-sm">Saving...</div>;
  }
  
  if (lastSaved) {
    const secondsAgo = Math.floor((Date.now() - lastSaved) / 1000);
    return (
      <div className="text-muted-foreground text-sm">
        Saved {secondsAgo < 60 ? `${secondsAgo}s ago` : 'recently'}
      </div>
    );
  }
  
  return null;
}
```

**Why**: Provides visual feedback to users about save status.

---

## Testing Strategy

### 1. Unit Tests

**File**: `frontend/tests/unit/persistence-controller.test.ts`

```typescript
describe('PersistenceController', () => {
  it('should debounce rapid saves', async () => {
    const controller = new PersistenceController(mockProjectManager);
    
    controller.debouncedSaveFile('file1', 'content1');
    controller.debouncedSaveFile('file1', 'content2');
    controller.debouncedSaveFile('file1', 'content3');
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Should only save once with final content
    expect(mockProjectManager.updateFile).toHaveBeenCalledTimes(1);
    expect(mockProjectManager.updateFile).toHaveBeenCalledWith('file1', { content: 'content3' });
  });
  
  it('should handle quota exceeded error', async () => {
    mockProjectManager.updateFile.mockRejectedValue(new DOMException('QuotaExceededError'));
    
    await controller.saveFile('file1', 'content');
    
    const saveError = useStore.getState().saveError;
    expect(saveError).toContain('quota exceeded');
    expect(useStore.getState().autoSaveEnabled).toBe(false);
  });
});
```

### 2. Integration Tests

**File**: `frontend/tests/integration/auto-save.test.ts`

```typescript
describe('Auto-Save Integration', () => {
  it('should auto-save when user types', async () => {
    render(<CodeEditor />);
    
    const editor = screen.getByRole('textbox');
    
    // Simulate typing
    await user.type(editor, 'export class Person {}');
    
    // Wait for debounce
    await waitFor(() => {
      expect(mockProjectManager.updateFile).toHaveBeenCalled();
    }, { timeout: 1000 });
  });
});
```

### 3. E2E Tests

**File**: `frontend/tests/e2e/persistence.spec.ts`

```typescript
test('should persist code changes across refresh', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Create file
  await page.click('button:has-text("Add")');
  await page.click('text=New Class');
  
  // Edit code
  await page.fill('.monaco-editor', 'export class MyClass { name: string; }');
  
  // Wait for auto-save
  await page.waitForTimeout(1000);
  
  // Refresh page
  await page.reload();
  
  // Verify code persisted
  const content = await page.textContent('.monaco-editor');
  expect(content).toContain('export class MyClass');
});
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Debounce Timers Not Cleaned Up
**Problem**: Memory leaks from timers not cleared on unmount  
**Solution**: Store timers in a Map and clear in `cleanup()`

### Pitfall 2: Race Conditions in Multi-Tab
**Problem**: Two tabs save simultaneously, data corruption  
**Solution**: Use "last write wins" (acceptable for single-user tool) + warning banner

### Pitfall 3: Blocking UI During Save
**Problem**: Large files cause UI freezes during save  
**Solution**: Save operations are already async (IndexedDB is non-blocking)

### Pitfall 4: Quota Exceeded Not Caught
**Problem**: App crashes when storage full  
**Solution**: Wrap all save operations in try-catch, handle `QuotaExceededError` specifically

---

## Performance Checklist

- [ ] Debounce delay set to 500ms (industry standard)
- [ ] Save operations are async (don't block UI)
- [ ] File tree restoration completes in <2 seconds
- [ ] Storage quota check completes in <100ms
- [ ] No memory leaks from uncleaned timers

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| IndexedDB | ✅ 24+ | ✅ 16+ | ✅ 10+ | ✅ 12+ |
| navigator.storage.estimate() | ✅ 52+ | ✅ 51+ | ✅ 15.4+ | ✅ 79+ |
| BroadcastChannel | ✅ 54+ | ✅ 38+ | ✅ 15.4+ | ✅ 79+ |

**Graceful Degradation**:
- If BroadcastChannel unavailable: No multi-tab warning (acceptable)
- If storage.estimate() unavailable: Assume space available (acceptable)
- If IndexedDB unavailable: In-memory mode with export option

---

## Debugging Tips

### Check IndexedDB Contents
```javascript
// In browser console
const db = await indexedDB.open('uml-graph-visualizer', 1);
const files = await db.transaction('files').objectStore('files').getAll();
console.log(files);
```

### Monitor Auto-Save Events
```javascript
// Add to PersistenceController
console.log('[AUTO-SAVE] Queued:', fileId, 'at', Date.now());
console.log('[AUTO-SAVE] Saving:', fileId, 'at', Date.now());
console.log('[AUTO-SAVE] Completed:', fileId, 'at', Date.now());
```

### Test Storage Unavailability
```javascript
// Disable IndexedDB in browser DevTools
// Chrome: Settings → Privacy → Site settings → IndexedDB → Block
```

---

## Next Steps

After implementing this feature:

1. **Run tests**: `pnpm test` (unit + integration)
2. **Run E2E tests**: `pnpm test:e2e`
3. **Manual testing**: Try all user scenarios from spec.md
4. **Code review**: Verify constitution compliance (functions <50 lines, no duplication, etc.)
5. **Documentation**: Update user-facing docs with auto-save feature

---

## Related Documentation

- [Feature Spec](./spec.md) - User stories and requirements
- [Data Model](./data-model.md) - Entity definitions
- [Persistence Controller Contract](./contracts/persistence-controller.contract.md) - API contract
- [Store Slice Contract](./contracts/persistence-slice.contract.md) - Zustand store contract
- [Research](./research.md) - Technical decisions and alternatives

---

**Quickstart Complete**: 2025-11-15  
**Implementation**: Ready for Phase 2 (tasks)
