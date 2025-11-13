/**
 * Tests for useEditorController - Debouncing behavior
 * Task T089: Verify EditorController handles rapid changes correctly
 * 
 * These tests verify that the EditorController properly debounces rapid changes
 * and only parses the code after the user stops typing for 500ms.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorController } from '../useEditorController';
import { useStore } from '../../shared/store';
import type { ProjectFile } from '../../shared/types';
import * as TypeScriptParser from '../../typescript-parser/TypeScriptParser';
import * as DiagramGenerator from '../../diagram-visualization/DiagramGenerator';

// Mock the parser and diagram generator
vi.mock('../../typescript-parser/TypeScriptParser');
vi.mock('../../diagram-visualization/DiagramGenerator');

const createTestFile = (id: string, name: string, content: string): ProjectFile => ({
    id,
    name,
    path: `/${name}`,
    content,
    lastModified: Date.now(),
    isActive: false,
});

describe('useEditorController - Debouncing (T089)', () => {
    beforeEach(() => {
        // Reset store
        useStore.setState({
            files: [],
            activeFileId: null,
            editorContent: '',
            isDirty: false,
            isParsing: false,
            parseErrors: new Map(),
            parsedEntities: new Map(),
            nodes: [],
            edges: [],
        });

        // Setup default mocks
        vi.mocked(TypeScriptParser.parse).mockReturnValue({
            success: true,
            errors: [],
            classes: [],
            interfaces: [],
            relationships: [],
        });

        vi.mocked(DiagramGenerator.generateDiagram).mockReturnValue({
            nodes: [],
            edges: [],
            layoutDirection: 'TB' as const,
        });

        // Use fake timers
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('should debounce rapid changes and only parse once after 500ms delay', () => {
        const testFile = createTestFile('test-1', 'Test.ts', 'class Test {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());

        // Clear mocks after initial load
        vi.clearAllMocks();

        // Simulate rapid typing: 5 changes
        act(() => {
            result.current.handleEditorChange('class Test { a');
            result.current.handleEditorChange('class Test { ab');
            result.current.handleEditorChange('class Test { abc');
            result.current.handleEditorChange('class Test { abc:');
            result.current.handleEditorChange('class Test { abc: string }');
        });

        // Parse should not be called yet
        expect(TypeScriptParser.parse).not.toHaveBeenCalled();

        // Advance timers by 400ms (less than 500ms)
        act(() => {
            vi.advanceTimersByTime(400);
        });

        // Still not called
        expect(TypeScriptParser.parse).not.toHaveBeenCalled();

        // Advance to complete debounce (100ms more)
        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Now parse should be called exactly once with final value
        expect(TypeScriptParser.parse).toHaveBeenCalledTimes(1);
        expect(TypeScriptParser.parse).toHaveBeenCalledWith('class Test { abc: string }', 'Test.ts');
    });

    it('should reset debounce timer on each new change', () => {
        const testFile = createTestFile('test-2', 'Test.ts', 'class Test {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());
        vi.clearAllMocks();

        // First change
        act(() => {
            result.current.handleEditorChange('class A {}');
        });

        // Wait 400ms
        act(() => {
            vi.advanceTimersByTime(400);
        });

        // Second change - resets timer
        act(() => {
            result.current.handleEditorChange('class B {}');
        });

        // Wait 400ms more (800ms total, but only 400ms since last change)
        act(() => {
            vi.advanceTimersByTime(400);
        });

        // Should not be called yet
        expect(TypeScriptParser.parse).not.toHaveBeenCalled();

        // Wait final 100ms
        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Now called with second value
        expect(TypeScriptParser.parse).toHaveBeenCalledTimes(1);
        expect(TypeScriptParser.parse).toHaveBeenCalledWith('class B {}', 'Test.ts');
    });

    it('should update isDirty flag immediately without waiting for debounce', () => {
        const testFile = createTestFile('test-3', 'Test.ts', 'class Original {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());

        // Clear mocks after initial load (which triggers a parse)
        vi.clearAllMocks();

        // Initial state not dirty
        expect(useStore.getState().isDirty).toBe(false);

        // Make a change
        act(() => {
            result.current.handleEditorChange('class Modified {}');
        });

        // isDirty should be updated immediately
        expect(useStore.getState().isDirty).toBe(true);

        // Parse should not be called yet (still debouncing)
        expect(TypeScriptParser.parse).not.toHaveBeenCalled();
    });

    it('should mark isDirty as false when content matches original', () => {
        const testFile = createTestFile('test-4', 'Test.ts', 'class Original {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());

        // Make a change
        act(() => {
            result.current.handleEditorChange('class Modified {}');
        });
        expect(useStore.getState().isDirty).toBe(true);

        // Revert to original
        act(() => {
            result.current.handleEditorChange('class Original {}');
        });

        // isDirty should be false
        expect(useStore.getState().isDirty).toBe(false);
    });

    it('should handle parse errors during debounced parsing', () => {
        const testFile = createTestFile('test-5', 'Test.ts', 'class Test {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        // Mock parser to return error
        vi.mocked(TypeScriptParser.parse).mockReturnValue({
            success: false,
            errors: [{
                line: 1,
                column: 10,
                message: 'Syntax error',
                severity: 'error',
            }],
            classes: [],
            interfaces: [],
            relationships: [],
        });

        const { result } = renderHook(() => useEditorController());
        vi.clearAllMocks();

        // Type invalid code
        act(() => {
            result.current.handleEditorChange('class Test {');
        });

        // Complete debounce
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Parse should be called and errors should be set
        expect(TypeScriptParser.parse).toHaveBeenCalledTimes(1);
        const errors = useStore.getState().parseErrors.get(testFile.id);
        expect(errors).toBeDefined();
        expect(errors?.length).toBe(1);
        expect(errors?.[0].message).toBe('Syntax error');
    });

    it('should handle multiple edit sessions with proper debouncing', () => {
        const testFile = createTestFile('test-6', 'Test.ts', 'class Test {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());
        vi.clearAllMocks();

        // First edit session
        act(() => {
            result.current.handleEditorChange('class A { x: string }');
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(TypeScriptParser.parse).toHaveBeenCalledTimes(1);
        expect(TypeScriptParser.parse).toHaveBeenCalledWith('class A { x: string }', 'Test.ts');

        vi.clearAllMocks();

        // Pause (user stops typing)
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // Second edit session
        act(() => {
            result.current.handleEditorChange('class A { x: string; y: number }');
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Parse called again with new value
        expect(TypeScriptParser.parse).toHaveBeenCalledTimes(1);
        expect(TypeScriptParser.parse).toHaveBeenCalledWith('class A { x: string; y: number }', 'Test.ts');
    });
});
