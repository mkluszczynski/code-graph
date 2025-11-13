# Project Manager API Contract

**Module**: `project-management`  
**Purpose**: Manage TypeScript project files (create, read, update, delete, persist)  
**Type**: Internal module contract

---

## Interface: ProjectManager

### `createFile(name: string, type: 'class' | 'interface'): Promise<ProjectFile>`

Creates a new TypeScript file with default template.

**Parameters**:

- `name: string` - File name (without .ts extension)
- `type: 'class' | 'interface'` - Type of file to create

**Returns**: `Promise<ProjectFile>` - Created file

**Behavior**:

- MUST generate unique file ID (UUID)
- MUST append `.ts` extension if not provided
- MUST validate file name (no invalid characters)
- MUST generate appropriate template based on type
- MUST set default path to `/src/{name}.ts`
- MUST persist to IndexedDB
- MUST set `isActive: false` (file created but not yet opened)
- MUST set `lastModified` to current timestamp

**Template Generation**:

- For `class`: Generate empty exported class
- For `interface`: Generate empty exported interface

**Error Handling**:

- File name already exists → throw `FileExistsError`
- Invalid file name → throw `InvalidFileNameError`
- IndexedDB failure → throw `StorageError`

**Examples**:

```typescript
// Create class file
const file = await createFile("Person", "class");
// Result:
{
  id: "uuid-123",
  name: "Person.ts",
  path: "/src/Person.ts",
  content: "export class Person {\n  \n}\n",
  lastModified: 1699889234567,
  isActive: false
}

// Create interface file
const file = await createFile("IUser", "interface");
// Result:
{
  id: "uuid-456",
  name: "IUser.ts",
  path: "/src/IUser.ts",
  content: "export interface IUser {\n  \n}\n",
  lastModified: 1699889234567,
  isActive: false
}
```

---

### `getFile(id: string): Promise<ProjectFile | null>`

Retrieves a file by ID from storage.

**Parameters**:

- `id: string` - File ID

**Returns**: `Promise<ProjectFile | null>` - File if found, null otherwise

**Behavior**:

- MUST query IndexedDB for file by ID
- MUST return null if file not found (not throw error)
- SHOULD cache recently accessed files in memory

**Error Handling**:

- File not found → return null
- IndexedDB failure → throw `StorageError`

---

### `getFileByPath(path: string): Promise<ProjectFile | null>`

Retrieves a file by path from storage.

**Parameters**:

- `path: string` - File path

**Returns**: `Promise<ProjectFile | null>` - File if found, null otherwise

**Behavior**:

- MUST query IndexedDB using path index
- MUST return null if file not found

**Error Handling**:

- File not found → return null
- IndexedDB failure → throw `StorageError`

---

### `getAllFiles(): Promise<ProjectFile[]>`

Retrieves all files in the project.

**Returns**: `Promise<ProjectFile[]>` - Array of all files

**Behavior**:

- MUST return all files from IndexedDB
- MUST sort by path alphabetically
- MAY return empty array if no files exist

**Error Handling**:

- IndexedDB failure → throw `StorageError`

---

### `updateFile(id: string, content: string): Promise<ProjectFile>`

Updates the content of a file.

**Parameters**:

- `id: string` - File ID
- `content: string` - New file content

**Returns**: `Promise<ProjectFile>` - Updated file

**Behavior**:

- MUST validate file exists
- MUST update content field
- MUST update `lastModified` timestamp
- MUST persist to IndexedDB
- MUST return updated file

**Error Handling**:

- File not found → throw `FileNotFoundError`
- IndexedDB failure → throw `StorageError`

---

### `deleteFile(id: string): Promise<void>`

Deletes a file from the project.

**Parameters**:

- `id: string` - File ID

**Returns**: `Promise<void>`

**Behavior**:

- MUST validate file exists
- MUST delete from IndexedDB
- MUST NOT throw if file doesn't exist (idempotent)

**Error Handling**:

- IndexedDB failure → throw `StorageError`

---

### `renameFile(id: string, newName: string): Promise<ProjectFile>`

Renames a file.

**Parameters**:

- `id: string` - File ID
- `newName: string` - New file name (without path)

**Returns**: `Promise<ProjectFile>` - Updated file

**Behavior**:

- MUST validate file exists
- MUST validate new name doesn't conflict with existing files
- MUST update name and path fields
- MUST update `lastModified` timestamp
- MUST persist to IndexedDB

**Error Handling**:

- File not found → throw `FileNotFoundError`
- Name conflict → throw `FileExistsError`
- Invalid name → throw `InvalidFileNameError`
- IndexedDB failure → throw `StorageError`

---

### `setActiveFile(id: string | null): Promise<void>`

Sets which file is currently active in the editor.

**Parameters**:

- `id: string | null` - File ID to activate, or null to close all files

**Returns**: `Promise<void>`

**Behavior**:

- MUST set `isActive: true` for specified file
- MUST set `isActive: false` for all other files
- MUST handle null ID (deactivate all files)

**Error Handling**:

- File not found → throw `FileNotFoundError`
- IndexedDB failure → throw `StorageError`

---

### `exportProject(): Promise<ProjectExport>`

Exports all project files as JSON for backup/sharing.

**Returns**: `Promise<ProjectExport>`

```typescript
interface ProjectExport {
  version: string; // Export format version
  exportedAt: number; // Timestamp
  files: ProjectFile[]; // All project files
}
```

**Behavior**:

- MUST include all files from IndexedDB
- MUST include export metadata (version, timestamp)
- MUST return serializable JSON object

**Error Handling**:

- IndexedDB failure → throw `StorageError`

---

### `importProject(projectData: ProjectExport): Promise<void>`

Imports project files from exported JSON.

**Parameters**:

- `projectData: ProjectExport` - Exported project data

**Returns**: `Promise<void>`

**Behavior**:

- MUST validate export format version
- MUST clear existing project files (with confirmation in UI layer)
- MUST import all files to IndexedDB
- MUST generate new IDs to avoid conflicts

**Error Handling**:

- Invalid format → throw `InvalidImportError`
- Version mismatch → throw `UnsupportedVersionError`
- IndexedDB failure → throw `StorageError`

---

## Interface: FileCreator

Internal utility for generating file templates.

### `generateClassTemplate(className: string): string`

Generates default TypeScript class template.

**Parameters**:

- `className: string` - Name of the class

**Returns**: `string` - TypeScript source code

**Behavior**:

- MUST generate exported class
- MUST use proper formatting (2-space indentation)
- MUST include empty class body

**Example**:

```typescript
generateClassTemplate("Person")// Returns:
`export class Person {
  
}
`;
```

---

### `generateInterfaceTemplate(interfaceName: string): string`

Generates default TypeScript interface template.

**Parameters**:

- `interfaceName: string` - Name of the interface

**Returns**: `string` - TypeScript source code

**Behavior**:

- MUST generate exported interface
- MUST use proper formatting
- MUST include empty interface body

**Example**:

```typescript
generateInterfaceTemplate("IUser")// Returns:
`export interface IUser {
  
}
`;
```

---

## Error Classes

### `FileExistsError`

- **When**: Attempting to create file with name that already exists
- **Properties**: `{ fileName: string, existingPath: string }`

### `FileNotFoundError`

- **When**: Attempting to access file that doesn't exist
- **Properties**: `{ fileId: string }`

### `InvalidFileNameError`

- **When**: File name contains invalid characters or is empty
- **Properties**: `{ fileName: string, reason: string }`

### `StorageError`

- **When**: IndexedDB operation fails
- **Properties**: `{ operation: string, originalError: Error }`

### `InvalidImportError`

- **When**: Import data is malformed or invalid
- **Properties**: `{ reason: string }`

### `UnsupportedVersionError`

- **When**: Import data version is not supported
- **Properties**: `{ version: string, supportedVersion: string }`

---

## Test Requirements

### Contract Tests (MUST implement before project manager code)

1. **Create class file**

   - Given: Name "Person" and type "class"
   - When: `createFile()` called
   - Then: File created with class template, persisted to IndexedDB

2. **Create interface file**

   - Given: Name "IUser" and type "interface"
   - When: `createFile()` called
   - Then: File created with interface template, persisted to IndexedDB

3. **Prevent duplicate file names**

   - Given: File "Person.ts" already exists
   - When: `createFile("Person", "class")` called
   - Then: Throws `FileExistsError`

4. **Invalid file name**

   - Given: Name with invalid characters "My<>Class"
   - When: `createFile()` called
   - Then: Throws `InvalidFileNameError`

5. **Get file by ID**

   - Given: File exists with ID "uuid-123"
   - When: `getFile("uuid-123")` called
   - Then: Returns the file

6. **Get file by ID - not found**

   - Given: No file with ID "nonexistent"
   - When: `getFile("nonexistent")` called
   - Then: Returns null

7. **Get all files**

   - Given: 3 files exist in project
   - When: `getAllFiles()` called
   - Then: Returns array of 3 files, sorted by path

8. **Update file content**

   - Given: File exists with ID "uuid-123"
   - When: `updateFile("uuid-123", "new content")` called
   - Then: Content updated, lastModified updated, persisted

9. **Update file - not found**

   - Given: No file with ID "nonexistent"
   - When: `updateFile("nonexistent", "content")` called
   - Then: Throws `FileNotFoundError`

10. **Delete file**

    - Given: File exists with ID "uuid-123"
    - When: `deleteFile("uuid-123")` called
    - Then: File removed from IndexedDB

11. **Delete file - idempotent**

    - Given: No file with ID "nonexistent"
    - When: `deleteFile("nonexistent")` called
    - Then: Completes without error (idempotent)

12. **Rename file**

    - Given: File exists with name "OldName.ts"
    - When: `renameFile(id, "NewName")` called
    - Then: File name updated to "NewName.ts", path updated

13. **Rename file - name conflict**

    - Given: Files "A.ts" and "B.ts" exist
    - When: `renameFile(idOfA, "B")` called
    - Then: Throws `FileExistsError`

14. **Set active file**

    - Given: 3 files exist, file 1 is active
    - When: `setActiveFile(id2)` called
    - Then: File 2 becomes active, file 1 becomes inactive

15. **Set active file to null**

    - Given: File 1 is active
    - When: `setActiveFile(null)` called
    - Then: All files become inactive

16. **Export project**

    - Given: 3 files exist
    - When: `exportProject()` called
    - Then: Returns ProjectExport with all 3 files and metadata

17. **Import project**

    - Given: Valid ProjectExport data
    - When: `importProject(data)` called
    - Then: All files imported to IndexedDB

18. **Import project - invalid format**
    - Given: Malformed export data
    - When: `importProject(data)` called
    - Then: Throws `InvalidImportError`

---

## Dependencies

- `idb` package (IndexedDB wrapper)
- `uuid` package (for generating file IDs)

---

## Notes

- This is an **internal module contract**, not a REST/HTTP API
- All file operations are **asynchronous** (IndexedDB is async)
- File content is stored as plain string (UTF-8)
- All types reference the `data-model.md` definitions
- For MVP, all files go to `/src/` directory; nested folders are Phase 2+
