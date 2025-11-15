# Data Model: Persist Code Changes Between Sessions

**Feature Branch**: `002-persist-code-changes`  
**Created**: 2025-11-15  
**Purpose**: Define entities, relationships, validation rules, and state transitions for code persistence

---

## Core Entities

### 1. ProjectFile (Extended)

**Description**: Represents a TypeScript file in the project. This entity already exists in the system (from feature 001) and is being extended to support persistence.

**Source**: `frontend/src/shared/types/index.ts`

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string (UUID) | Yes | Unique file identifier | Must be valid UUIDv4 |
| name | string | Yes | File name with .ts extension | Max 255 chars, no invalid chars (`/\:*?"<>\|`) |
| path | string | Yes | Full file path (e.g., `/src/Person.ts`) | Must start with `/`, max 1024 chars |
| content | string | Yes | TypeScript source code | Max 1MB per file |
| lastModified | number | Yes | Unix timestamp (milliseconds) | Must be positive integer |
| isActive | boolean | No | Whether file is currently open in editor | Defaults to false |

**Persistence**: Stored in IndexedDB (`files` object store) with indexes on `path`, `name`, and `lastModified`

**State Transitions**:
```
[Created] --open--> [Active]
[Active] --edit--> [Modified]
[Modified] --auto-save--> [Persisted]
[Persisted] --edit--> [Modified]
[Active] --close--> [Inactive]
[Inactive] --refresh--> [Restored]
```

**Example**:
```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Person.ts",
  path: "/src/Person.ts",
  content: "export class Person {\n  name: string;\n  age: number;\n}",
  lastModified: 1700000000000,
  isActive: true
}
```

**Changes from Feature 001**: No schema changes required. The entity already has all necessary fields for persistence. This feature adds *behavior* (auto-save) without changing the data model.

---

### 2. StorageMetadata (New)

**Description**: Tracks storage usage and health to inform users of quota issues and storage availability.

**Source**: `frontend/src/shared/types/index.ts` (new type)

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| available | number | Yes | Available storage space (bytes) | Must be >= 0 |
| used | number | Yes | Used storage space (bytes) | Must be >= 0, <= quota |
| quota | number | Yes | Total storage quota (bytes) | Must be > 0 |
| percentUsed | number | Yes | Percentage of quota used | 0-100 |
| isAvailable | boolean | Yes | Whether IndexedDB is available | - |
| lastChecked | number | Yes | Unix timestamp of last quota check | Must be positive integer |
| hasMultipleTabs | boolean | Yes | Whether multiple tabs are detected | - |

**Persistence**: Stored in Zustand store (in-memory) and localStorage for `lastActiveFileId` only. Storage metadata is not persisted; it's recalculated on each page load.

**State Transitions**:
```
[Unknown] --initialize--> [Available] or [Unavailable]
[Available] --quota-check--> [Available] or [Warning] or [Full]
[Warning] --cleanup--> [Available]
[Full] --cleanup--> [Warning] or [Available]
[Available] --multi-tab-detected--> [Multi-Tab Warning]
```

**Example**:
```typescript
{
  available: 50000000000, // 50GB
  used: 512000,          // 512KB
  quota: 50000512000,
  percentUsed: 0.001,
  isAvailable: true,
  lastChecked: 1700000000000,
  hasMultipleTabs: false
}
```

**Validation Rules**:
- `percentUsed` should trigger warning at 90%, error at 95%
- `isAvailable` false should disable auto-save and show banner
- `hasMultipleTabs` true should show warning banner

---

### 3. PersistenceState (New)

**Description**: Tracks the state of the persistence system and individual file save status.

**Source**: `frontend/src/shared/store/index.ts` (new store slice)

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| lastSavedTimestamp | number | No | Unix timestamp of last successful save | Must be positive integer |
| isSaving | boolean | Yes | Whether a save operation is in progress | - |
| saveError | string \| null | No | Error message if last save failed | Max 500 chars |
| autoSaveEnabled | boolean | Yes | Whether auto-save is enabled | Defaults to true |
| pendingSaves | Map<string, number> | Yes | File IDs with pending save operations (value = timestamp queued) | - |

**Persistence**: In-memory only (Zustand store). Not persisted to IndexedDB.

**State Transitions**:
```
[Idle] --edit--> [Pending Save]
[Pending Save] --debounce-complete--> [Saving]
[Saving] --success--> [Saved]
[Saving] --error--> [Save Error]
[Save Error] --retry--> [Saving]
[Saved] --edit--> [Pending Save]
```

**Example**:
```typescript
{
  lastSavedTimestamp: 1700000000000,
  isSaving: false,
  saveError: null,
  autoSaveEnabled: true,
  pendingSaves: new Map([
    ["550e8400-e29b-41d4-a716-446655440000", 1700000001000]
  ])
}
```

**Validation Rules**:
- `pendingSaves` should be cleared after successful save
- `saveError` should be cleared on next successful save
- `autoSaveEnabled` false should disable debounced auto-save but allow manual save

---

## Entity Relationships

```
┌──────────────────┐
│   ProjectFile    │
│  (IndexedDB)     │
│                  │
│ - id             │
│ - name           │
│ - path           │
│ - content        │◄────────────┐
│ - lastModified   │             │
│ - isActive       │             │
└──────────────────┘             │
        │                        │
        │ persisted to           │
        │                        │
        ▼                        │
┌──────────────────┐             │
│  PersistenceState│             │
│   (Zustand)      │             │
│                  │    triggers auto-save
│ - lastSavedTS    │             │
│ - isSaving       │             │
│ - saveError      │             │
│ - autoSaveEnabled│             │
│ - pendingSaves   │─────────────┘
└──────────────────┘
        │
        │ monitors
        │
        ▼
┌──────────────────┐
│ StorageMetadata  │
│   (Zustand)      │
│                  │
│ - available      │
│ - used           │
│ - quota          │
│ - percentUsed    │
│ - isAvailable    │
│ - lastChecked    │
│ - hasMultipleTabs│
└──────────────────┘
```

**Relationship Descriptions**:

1. **ProjectFile ↔ PersistenceState**: 
   - PersistenceState tracks which ProjectFiles have pending saves
   - When auto-save completes, ProjectFile.lastModified is updated in IndexedDB

2. **PersistenceState → StorageMetadata**:
   - Before saving, PersistenceState checks StorageMetadata.isAvailable
   - If quota warning, PersistenceState may defer save or notify user

3. **StorageMetadata** (independent):
   - Checked on app initialization
   - Rechecked periodically or after large save operations
   - Monitors multi-tab status via BroadcastChannel

---

## Validation Rules Summary

### File Content Validation
- Maximum file size: 1MB (prevents quota issues)
- Content encoding: UTF-8
- No binary files (TypeScript only)

### Storage Quota Validation
- Warning threshold: 90% quota used
- Error threshold: 95% quota used (block saves)
- Minimum required space: 10MB

### Auto-Save Debounce Validation
- Debounce delay: 500ms (constant)
- Maximum pending saves: 10 files (prevent queue buildup)
- Save timeout: 5 seconds (detect stuck saves)

### Multi-Tab Validation
- Tab announcement via BroadcastChannel
- Warning shown if multiple tabs detected
- Last write wins (no conflict resolution)

---

## IndexedDB Schema

**Database Name**: `uml-graph-visualizer`  
**Version**: 1 (no schema changes from feature 001)

**Object Store**: `files`

- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-path`: `path` (unique)
  - `by-name`: `name` (non-unique)
  - `by-modified`: `lastModified` (non-unique)

**Schema Definition**:
```typescript
interface UMLGraphDB extends DBSchema {
  files: {
    key: string;
    value: ProjectFile;
    indexes: {
      'by-path': string;
      'by-name': string;
      'by-modified': number;
    };
  };
}
```

**No Migration Required**: The schema remains unchanged from feature 001. This feature only adds new behavior (auto-save) using the existing schema.

---

## State Management (Zustand Store)

**New Store Slice**: `PersistenceSlice`

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

## Error Handling

### QuotaExceededError
**When**: IndexedDB write fails due to quota
**Action**: 
1. Show user-friendly error: "Storage quota exceeded. Try deleting unused files."
2. Set `storageMetadata.isAvailable = false`
3. Fall back to in-memory editing
4. Emphasize export button

### StorageUnavailableError
**When**: IndexedDB is disabled or inaccessible
**Action**:
1. Show banner: "⚠️ Storage unavailable - changes won't persist"
2. Disable auto-save
3. Allow in-memory editing
4. Prompt export on page unload

### SaveTimeoutError
**When**: Save operation takes >5 seconds
**Action**:
1. Log warning
2. Retry save once
3. If retry fails, show error to user

---

## Performance Considerations

### Read Performance
- File tree metadata: <500ms for 50 files
- Active file load: <200ms
- Background preload: Low priority, non-blocking

### Write Performance
- Auto-save: <100ms per file (target)
- Debounced to avoid excessive writes (500ms debounce)
- Single transaction per save (atomic)

### Memory Footprint
- In-memory store: ~100KB for 50 file metadata entries
- Active file content: ~10-50KB typical
- Total memory: <1MB for typical project

---

## Backwards Compatibility

**Feature 001 Data**: Fully compatible. No schema changes required.

**Migration**: None needed. Existing files in IndexedDB will work without modification.

**Forward Compatibility**: If a file is edited without auto-save enabled (e.g., storage unavailable), the file remains editable in-memory and can be exported manually.

---

**Data Model Complete**: 2025-11-15  
**Next**: API Contracts
