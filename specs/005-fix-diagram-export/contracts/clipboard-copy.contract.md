# Contract: Clipboard Copy

**Feature**: 005-fix-diagram-export  
**Module**: DiagramExporter  
**Function**: `copyImageToClipboard()`

## Contract Signature

```typescript
/**
 * Copy a diagram image to the system clipboard
 * 
 * @param dataUrl - Data URL of the image (from html-to-image)
 * @returns ClipboardResult indicating success or failure with error details
 */
async function copyImageToClipboard(
  dataUrl: string
): Promise<ClipboardResult>
```

## Preconditions

1. `dataUrl` must be a valid data URL string starting with "data:image/png;base64,"
2. Browser must support `navigator.clipboard` API (all modern browsers)
3. Page must be served over HTTPS or localhost (Clipboard API security requirement)
4. Function must be called in response to user gesture (browser security requirement)

## Postconditions

### Success Case
1. Returns `{ success: true }` (no error or errorCode fields)
2. Image is written to system clipboard as PNG
3. User can paste image into external applications (e.g., email, Slack, Google Docs)

### Failure Cases
1. Returns `{ success: false, error: string, errorCode: ClipboardErrorCode }`
2. System clipboard remains unchanged
3. Error message is user-friendly and actionable

## Test Cases

### TC-001: Valid PNG data URL

**Input**:
```typescript
dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."; // Valid PNG
```

**Expected Output**:
```typescript
{
  success: true
}
```

**Verification**: 
- `navigator.clipboard.write()` called with valid ClipboardItem
- Blob type is "image/png"
- No exceptions thrown

**Rationale**: Standard success case for valid image data

---

### TC-002: Empty data URL

**Input**:
```typescript
dataUrl = "";
```

**Expected Output**:
```typescript
{
  success: false,
  error: "Invalid image data. Please try exporting again.",
  errorCode: ClipboardErrorCode.BLOB_CONVERSION_FAILED
}
```

**Rationale**: Empty data URL should fail gracefully with clear error message

---

### TC-003: Invalid data URL format

**Input**:
```typescript
dataUrl = "not-a-valid-data-url";
```

**Expected Output**:
```typescript
{
  success: false,
  error: "Invalid image data. Please try exporting again.",
  errorCode: ClipboardErrorCode.BLOB_CONVERSION_FAILED
}
```

**Rationale**: Malformed data URL should be caught during blob conversion

---

### TC-004: Clipboard permission denied

**Input**:
```typescript
dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...";
// Mock: navigator.clipboard.write() throws NotAllowedError
```

**Expected Output**:
```typescript
{
  success: false,
  error: "Clipboard access denied. Please enable clipboard permissions in your browser settings.",
  errorCode: ClipboardErrorCode.PERMISSION_DENIED
}
```

**Rationale**: User should understand how to resolve permission errors

---

### TC-005: Clipboard API not supported

**Input**:
```typescript
dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...";
// Mock: navigator.clipboard is undefined
```

**Expected Output**:
```typescript
{
  success: false,
  error: "Clipboard copy is not supported in this browser. Please try the PNG export option instead.",
  errorCode: ClipboardErrorCode.NOT_SUPPORTED
}
```

**Rationale**: Graceful degradation for older browsers

---

### TC-006: Clipboard write fails (generic error)

**Input**:
```typescript
dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...";
// Mock: navigator.clipboard.write() throws generic Error
```

**Expected Output**:
```typescript
{
  success: false,
  error: "Failed to copy diagram to clipboard. Please try again.",
  errorCode: ClipboardErrorCode.WRITE_FAILED
}
```

**Rationale**: Generic fallback error for unexpected failures

---

### TC-007: Large image (10MB)

**Input**:
```typescript
dataUrl = "data:image/png;base64,[10MB base64 encoded PNG]";
```

**Expected Output**:
```typescript
{
  success: true
}
// OR (if browser clipboard size limit exceeded):
{
  success: false,
  error: "Diagram too large to copy to clipboard. Try exporting as PNG file instead.",
  errorCode: ClipboardErrorCode.WRITE_FAILED
}
```

**Rationale**: Large images may succeed or fail depending on browser limits; error message guides user to alternative

---

## Error Cases

### EC-001: Null data URL

**Input**:
```typescript
dataUrl = null; // TypeScript would prevent this, but runtime check needed
```

**Expected Behavior**: Returns `ClipboardResult` with error:
```typescript
{
  success: false,
  error: "Invalid image data. Please try exporting again.",
  errorCode: ClipboardErrorCode.BLOB_CONVERSION_FAILED
}
```

---

### EC-002: Blob conversion timeout

**Input**:
```typescript
dataUrl = "data:image/png;base64,[extremely large image]";
// Mock: fetch(dataUrl) hangs indefinitely
```

**Expected Behavior**: After 10 second timeout, returns:
```typescript
{
  success: false,
  error: "Clipboard copy timed out. Try exporting as PNG file instead.",
  errorCode: ClipboardErrorCode.BLOB_CONVERSION_FAILED
}
```

---

### EC-003: SecurityError during clipboard access

**Input**:
```typescript
dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...";
// Mock: navigator.clipboard.write() throws SecurityError
```

**Expected Behavior**: Returns:
```typescript
{
  success: false,
  error: "Clipboard access denied. Please enable clipboard permissions in your browser settings.",
  errorCode: ClipboardErrorCode.PERMISSION_DENIED
}
```

---

## Implementation Notes

### Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 76+ | Full support |
| Firefox | 87+ | Requires HTTPS |
| Safari | 13.1+ | Requires user gesture |
| Edge | 79+ | Full support |

### Error Mapping

Map native errors to user-friendly messages:

```typescript
function mapErrorToResult(error: unknown): ClipboardResult {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return {
        success: false,
        error: "Clipboard access denied. Please enable clipboard permissions in your browser settings.",
        errorCode: ClipboardErrorCode.PERMISSION_DENIED
      };
    }
  }
  
  // ... other mappings
}
```

### Blob Conversion

```typescript
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('Failed to convert data URL to blob');
  }
  return await response.blob();
}
```

## Performance Requirements

- **Time Complexity**: O(n) where n is the image size in bytes
- **Target**: Complete in <2 seconds for typical images (1-2MB)
- **Memory**: O(n) temporary memory for blob conversion
- **Timeout**: Fail after 10 seconds to prevent hanging

## Dependencies

- Native Clipboard API (`navigator.clipboard`)
- Fetch API (for data URL to blob conversion)
- `ClipboardItem` constructor
- Blob API

## Security Considerations

1. **HTTPS Requirement**: Clipboard API only works on secure contexts (HTTPS or localhost)
2. **User Gesture**: Some browsers require the function to be called in direct response to user action
3. **Permission Prompt**: Browser may show permission prompt on first use
4. **Same-Origin Policy**: Data URL conversion doesn't have CORS issues

## Testing Strategy

### Unit Tests
- Mock `navigator.clipboard` API
- Mock `fetch()` for data URL conversion
- Test all error code paths
- Test error message formatting

### Integration Tests
- Test with ExportButton component
- Verify user feedback display
- Test success and error states

### E2E Tests (Playwright)
- Use Playwright's clipboard API mocking
- Verify clipboard content after copy
- Test across different browsers
- Simulate permission denied scenarios

## Notes

- Function does not throw exceptions; all errors returned in `ClipboardResult`
- Function is idempotent (calling multiple times with same input produces same output)
- Clipboard API is async by design (browser may show permission UI)
- Some browsers may rate-limit clipboard operations
