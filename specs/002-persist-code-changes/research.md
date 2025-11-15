# Research Document: Persist Code Changes Between Sessions

**Feature Branch**: `002-persist-code-changes`  
**Created**: 2025-11-15  
**Purpose**: Resolve all technical unknowns and clarifications identified during planning

---

## Research Tasks

### 1. Auto-Save Debouncing Best Practices

**Research Question**: What is the industry-standard debounce delay for auto-save in code editors, and how should it be implemented in React/TypeScript?

**Findings**:

**Decision**: Use 500ms debounce delay for auto-save

**Rationale**:
- Industry standard range is 300ms-1000ms for auto-save in code editors
- VS Code uses ~500ms debounce for file watching and auto-save features
- Google Docs uses ~500ms for collaborative editing
- Monaco Editor (used in this project) recommends 500ms for content change handlers
- 500ms provides good balance: responsive enough to feel automatic, long enough to avoid excessive writes during rapid typing

**Implementation Pattern**:
```typescript
// In useEditorController.ts
const AUTO_SAVE_DEBOUNCE_MS = 500;
const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleEditorChange = useCallback((value: string | undefined) => {
  if (!activeFile) return;
  
  const newContent = value || '';
  setEditorContent(newContent);
  
  // Mark as dirty
  const isDirty = newContent !== activeFile.content;
  setIsDirty(isDirty);
  
  // Clear existing timer
  if (autoSaveTimerRef.current) {
    clearTimeout(autoSaveTimerRef.current);
  }
  
  // Set up new auto-save timer
  if (isDirty) {
    autoSaveTimerRef.current = setTimeout(() => {
      persistenceController.saveFile(activeFile.id, newContent);
    }, AUTO_SAVE_DEBOUNCE_MS);
  }
}, [activeFile, setEditorContent, setIsDirty]);
```

**Alternatives Considered**:
- 300ms: Too aggressive, can cause performance issues with large files
- 1000ms: Too slow, users might lose up to 1 second of typing on crash
- No debounce: Would cause excessive IndexedDB writes, potential performance degradation

**References**:
- [VS Code auto-save documentation](https://code.visualstudio.com/docs/editor/codebasics#_save-auto-save)
- [Monaco Editor API - onDidChangeModelContent](https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneCodeEditor.html)
- [React useDebounce patterns](https://usehooks.com/useDebounce/)

---

### 2. IndexedDB Storage Quota Management

**Research Question**: How to detect and handle IndexedDB quota exceeded errors, and what limits can we expect across browsers?

**Findings**:

**Decision**: Implement quota checking before save operations with graceful degradation and user warnings

**Rationale**:
- Modern browsers provide ~50MB minimum quota (10MB in older browsers)
- Actual quota is typically 50% of available disk space (can be GBs on modern systems)
- Quota exceeded errors (`QuotaExceededError`) are catchable but should be prevented proactively
- Users need clear, actionable guidance when approaching quota limits
- The application should remain functional even when storage is unavailable (in-memory editing only)

**Browser Quota Limits**:
| Browser | Minimum Quota | Typical Quota | API for Checking |
|---------|---------------|---------------|------------------|
| Chrome  | 10MB          | 50% available disk | navigator.storage.estimate() |
| Firefox | 10MB          | 50% available disk | navigator.storage.estimate() |
| Safari  | 50MB          | 50% available disk | navigator.storage.estimate() |
| Edge    | 10MB          | 50% available disk | navigator.storage.estimate() |

**Implementation Pattern**:
```typescript
// In PersistenceController.ts
async checkStorageQuota(): Promise<{
  available: number;
  used: number;
  percentUsed: number;
  hasSpace: boolean;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
    
    return {
      available: quota - usage,
      used: usage,
      percentUsed,
      hasSpace: percentUsed < 90, // Warning threshold
    };
  }
  
  // Fallback for older browsers - assume we have space
  return {
    available: Infinity,
    used: 0,
    percentUsed: 0,
    hasSpace: true,
  };
}

async saveWithQuotaCheck(fileId: string, content: string): Promise<void> {
  try {
    await projectManager.updateFile(fileId, { content });
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // Notify user with actionable message
      showError('Storage quota exceeded. Try deleting unused files or exporting your project.');
      
      // Fall back to in-memory only
      updateStore(fileId, content);
      setStorageAvailable(false);
    } else {
      throw error;
    }
  }
}
```

**Alternatives Considered**:
- Always check quota before every save: Too slow (async operation adds latency)
- Only catch quota errors: Reactive approach, better to warn users proactively
- Implement automatic cleanup: Too risky, users might lose files they didn't mean to delete

**References**:
- [MDN: StorageManager.estimate()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate)
- [IndexedDB quota limits across browsers](https://web.dev/articles/storage-for-the-web)
- [Handling QuotaExceededError](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/error_event)

---

### 3. Multi-Tab Conflict Resolution

**Research Question**: How to handle users editing the same project in multiple browser tabs simultaneously?

**Findings**:

**Decision**: Implement "last write wins" with visual warning when multiple tabs detected

**Rationale**:
- This is a single-user development tool, not a collaborative editor (no CRDT or OT required)
- Multi-tab usage is expected to be rare (primarily for reference, not simultaneous editing)
- "Last write wins" is acceptable for single-user scenarios (VS Code, Sublime use this)
- Visual warning prevents user confusion when tabs conflict
- Alternative approaches (CRDTs, locks) are too complex for single-user use case

**Detection Strategy**:
- Use `BroadcastChannel API` to detect multiple tabs
- Each tab announces itself on page load
- Listen for announcements from other tabs
- Show warning banner when multiple tabs detected

**Implementation Pattern**:
```typescript
// In PersistenceController.ts
class PersistenceController {
  private broadcastChannel: BroadcastChannel;
  private hasMultipleTabs = false;
  
  constructor() {
    // Create broadcast channel for tab detection
    this.broadcastChannel = new BroadcastChannel('code-graph-tabs');
    
    // Listen for other tabs
    this.broadcastChannel.addEventListener('message', (event) => {
      if (event.data.type === 'TAB_ANNOUNCE') {
        this.hasMultipleTabs = true;
        this.showMultiTabWarning();
      }
    });
    
    // Announce this tab
    this.broadcastChannel.postMessage({ type: 'TAB_ANNOUNCE' });
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', this.handleStorageChange);
  }
  
  private handleStorageChange = (event: StorageEvent) => {
    // Reload files if another tab modified IndexedDB
    // Note: IndexedDB doesn't fire storage events, but we can use
    // BroadcastChannel to notify other tabs of changes
  };
  
  private showMultiTabWarning() {
    // Show banner: "Multiple tabs detected. Changes in this tab may be overwritten."
    setWarning('MULTIPLE_TABS');
  }
}
```

**Storage Change Synchronization**:
```typescript
// When a file is saved in one tab, notify other tabs
async saveFile(fileId: string, content: string): Promise<void> {
  await projectManager.updateFile(fileId, { content });
  
  // Notify other tabs
  this.broadcastChannel.postMessage({
    type: 'FILE_UPDATED',
    fileId,
    timestamp: Date.now(),
  });
}

// In other tabs, handle the notification
this.broadcastChannel.addEventListener('message', (event) => {
  if (event.data.type === 'FILE_UPDATED') {
    const { fileId, timestamp } = event.data;
    
    // Reload the file from IndexedDB if not currently editing
    if (activeFileId !== fileId) {
      reloadFile(fileId);
    } else {
      // Show warning if user is editing the same file
      showWarning('File was modified in another tab');
    }
  }
});
```

**Alternatives Considered**:
- File locking: Too complex, requires server or coordination mechanism
- CRDT (Conflict-free Replicated Data Types): Overkill for single-user tool
- Operational Transform: Same as CRDT, unnecessary complexity
- Disable multi-tab entirely: Too restrictive, users may want reference tabs

**Browser Support**:
- BroadcastChannel API: Chrome 54+, Firefox 38+, Safari 15.4+, Edge 79+
- Falls back gracefully: If BroadcastChannel unavailable, no warning shown (acceptable)

**References**:
- [MDN: BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- [VS Code multi-window architecture](https://github.com/microsoft/vscode/wiki/Multi-Window-Architecture)
- [Google Docs conflict resolution (academic reference)](https://blog.google/technology/google-apps/50-billion-things/)

---

### 4. Storage Unavailability Handling

**Research Question**: How to handle cases where IndexedDB is disabled or unavailable (incognito mode, corporate restrictions)?

**Findings**:

**Decision**: Graceful degradation to in-memory editing with clear user notification

**Rationale**:
- IndexedDB can be unavailable in: private/incognito mode with strict settings, corporate-managed browsers, user explicitly disabled storage
- Application should remain functional even without persistence
- Users need clear warning that changes won't persist
- Offer export option as alternative persistence mechanism

**Detection Strategy**:
```typescript
// In PersistenceController.ts
async testStorageAvailability(): Promise<boolean> {
  try {
    // Try to open a test database
    const testDb = await openDB('storage-test', 1);
    testDb.close();
    return true;
  } catch (error) {
    console.warn('IndexedDB unavailable:', error);
    return false;
  }
}

async initialize(): Promise<void> {
  const isAvailable = await this.testStorageAvailability();
  
  if (!isAvailable) {
    setStorageAvailable(false);
    showWarning(
      'Browser storage is unavailable. Changes will not persist after refresh. ' +
      'Consider exporting your project.'
    );
    // Continue with in-memory-only mode
    return;
  }
  
  // Normal initialization with IndexedDB
  await this.restorePersistedState();
}
```

**User Notification**:
- Show persistent banner at top of editor: "⚠️ Storage unavailable - changes won't persist"
- Emphasize export button in UI
- Auto-prompt to export on page unload if changes exist

**Alternatives Considered**:
- Block application entirely: Too restrictive, users might still want to use it temporarily
- Use localStorage as fallback: Limited to 5-10MB, not suitable for code files
- Force page reload until storage available: Poor UX, doesn't solve the problem

**References**:
- [MDN: IndexedDB in private browsing](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API#storage_limits)
- [Storage access in different browser modes](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)

---

### 5. Restore State on Page Load

**Research Question**: How to efficiently restore all persisted files when the application loads, ensuring fast startup time?

**Findings**:

**Decision**: Lazy load files on demand, with parallel loading of visible files in file tree

**Rationale**:
- Loading all files upfront can slow down startup for large projects
- Users typically work on a few files at a time
- File tree needs metadata (name, path, lastModified) but not full content
- Active file from last session should load immediately
- Background files can load on-demand when opened

**Implementation Strategy**:
```typescript
// Phase 1: Load file metadata only (fast)
async restoreFileTree(): Promise<void> {
  const files = await projectManager.getAllFiles();
  
  // Load metadata into store (names, paths, timestamps)
  setFiles(files.map(file => ({
    id: file.id,
    name: file.name,
    path: file.path,
    lastModified: file.lastModified,
    content: '', // Empty initially, loaded on demand
  })));
}

// Phase 2: Restore last active file (if any)
async restoreActiveFile(): Promise<void> {
  const lastActiveId = localStorage.getItem('lastActiveFileId');
  
  if (lastActiveId) {
    const file = await projectManager.getFile(lastActiveId);
    if (file) {
      setActiveFile(lastActiveId);
      setEditorContent(file.content);
    }
  }
}

// Phase 3: Background preload (optional, low priority)
async preloadRecentFiles(): Promise<void> {
  const recentFiles = await projectManager.getFilesByModified();
  const topFive = recentFiles.slice(0, 5);
  
  // Preload in background
  await Promise.all(
    topFive.map(file => 
      // Load content into memory cache
      cacheFileContent(file.id, file.content)
    )
  );
}
```

**Performance Target**:
- File tree metadata load: <500ms for 50 files
- Active file restore: <200ms
- Total startup: <2 seconds (meets SC-003)

**Alternatives Considered**:
- Load all files upfront: Slow for large projects (>50 files)
- Load only metadata forever: Confusing when file content doesn't appear instantly on open
- Use service worker for caching: Adds complexity, browser support varies

**References**:
- [IndexedDB performance patterns](https://nolanlawson.com/2015/09/29/indexeddb-websql-localstorage-what-blocks-the-dom/)
- [React Suspense for data fetching](https://react.dev/reference/react/Suspense)
- [VS Code startup performance](https://code.visualstudio.com/blogs/2021/11/08/custom-profiles)

---

## Summary of Decisions

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| Auto-save debounce | 500ms | Industry standard, balances responsiveness and performance |
| Storage quota | Check on startup, catch errors on save | Proactive warnings, graceful degradation |
| Multi-tab handling | Last write wins + warning | Acceptable for single-user tool, simple to implement |
| Storage unavailability | Graceful degradation to in-memory | Keeps app functional, clear user communication |
| State restoration | Lazy load with active file priority | Fast startup, efficient for large projects |

---

## Open Questions / Future Enhancements

1. **Export format**: Should we support JSON export for backup? (Deferred to future feature)
2. **File history**: Should we keep previous versions? (Out of scope for MVP)
3. **Cloud sync**: Should we support Google Drive/Dropbox sync? (Future enhancement)
4. **Conflict UI**: Should we show a diff viewer for multi-tab conflicts? (P3 enhancement)

---

**Research Complete**: 2025-11-15  
**Next Phase**: Design (data model, contracts, quickstart)
