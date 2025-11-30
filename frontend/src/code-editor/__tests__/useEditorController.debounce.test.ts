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
import type { ProjectFile, ParseResult } from '../../shared/types';
import { parserRegistry } from '../../parsers';
import * as DiagramGenerator from '../../diagram-visualization/DiagramGenerator';

// Mock the diagram generator
vi.mock('../../diagram-visualization/DiagramGenerator');

const createTestFile = (id: string, name: string, content: string): ProjectFile => ({
    id,
    name,
    path: `/${name}`,
    parentPath: "/",
    content,
    lastModified: Date.now(),
    isActive: false,
});

const mockParseResult: ParseResult = {
    success: true,
    errors: [],
    classes: [],
    interfaces: [],
    relationships: [],
};

describe('useEditorController - Debouncing (T089)', () => {
    let parseSpy: ReturnType<typeof vi.spyOn>;

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

        // Spy on parserRegistry.parse
        parseSpy = vi.spyOn(parserRegistry, 'parse').mockResolvedValue(mockParseResult);

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
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should debounce rapid changes and only parse once after 500ms delay', async () => {
        const testFile = createTestFile('test-1', 'Test.ts', 'class Test {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());

        // Wait for initial parse to complete
        await vi.runAllTimersAsync();

        // Clear mocks after initial load
        parseSpy.mockClear();

        // Simulate rapid typing: 5 changes
        act(() => {
            result.current.handleEditorChange('class Test { a');
            result.current.handleEditorChange('class Test { ab');
            result.current.handleEditorChange('class Test { abc');
            result.current.handleEditorChange('class Test { abc:');
            result.current.handleEditorChange('class Test { abc: string }');
        });

        // Parse should not be called yet
        expect(parseSpy).not.toHaveBeenCalled();

        // Advance timers by 400ms (less than 500ms)
        await act(async () => {
            vi.advanceTimersByTime(400);
        });

        // Still not called
        expect(parseSpy).not.toHaveBeenCalled();

        // Advance to complete debounce (100ms more)
        await act(async () => {
            vi.advanceTimersByTime(100);
            await vi.runAllTimersAsync();
        });

        // Now parse should be called exactly once with final value
        expect(parseSpy).toHaveBeenCalledTimes(1);
        expect(parseSpy).toHaveBeenCalledWith('class Test { abc: string }', 'Test.ts', 'test-1');
    });

    it('should reset debounce timer on each new change', async () => {
        const testFile = createTestFile('test-2', 'Test.ts', 'class Test {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());
        await vi.runAllTimersAsync();
        parseSpy.mockClear();

        // First change
        act(() => {
            result.current.handleEditorChange('class A {}');
        });

        // Wait 400ms
        await act(async () => {
            vi.advanceTimersByTime(400);
        });

        // Second change - resets timer
        act(() => {
            result.current.handleEditorChange('class B {}');
        });

        // Wait 400ms more (800ms total, but only 400ms since last change)
        await act(async () => {
            vi.advanceTimersByTime(400);
        });

        // Should not be called yet
        expect(parseSpy).not.toHaveBeenCalled();

        // Wait final 100ms to trigger debounce
        await act(async () => {
            vi.advanceTimersByTime(100);
            await vi.runAllTimersAsync();
        });

        // Now called with second value
        expect(parseSpy).toHaveBeenCalledTimes(1);
        expect(parseSpy).toHaveBeenCalledWith('class B {}', 'Test.ts', 'test-2');
    });

    it('should update isDirty flag immediately without waiting for debounce', async () => {
        const testFile = createTestFile('test-3', 'Test.ts', 'class Original {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());

        // Wait for initial load
        await vi.runAllTimersAsync();
        parseSpy.mockClear();

        // Initial state not dirty
        expect(useStore.getState().isDirty).toBe(false);

        // Make a change
        act(() => {
            result.current.handleEditorChange('class Modified {}');
        });

        // isDirty should be updated immediately
        expect(useStore.getState().isDirty).toBe(true);

        // Parse should not be called yet (still debouncing)
        expect(parseSpy).not.toHaveBeenCalled();
    });

    it('should mark isDirty as false when content matches original', async () => {
        const testFile = createTestFile('test-4', 'Test.ts', 'class Original {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());
        await vi.runAllTimersAsync();

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

    it('should handle parse errors during debounced parsing', async () => {
        const testFile = createTestFile('test-5', 'Test.ts', 'class Test {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());
        await vi.runAllTimersAsync();

        // Mock parser to return error
        parseSpy.mockResolvedValue({
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
        parseSpy.mockClear();

        // Type invalid code
        act(() => {
            result.current.handleEditorChange('class Test {');
        });

        // Complete debounce
        await act(async () => {
            vi.advanceTimersByTime(500);
            await vi.runAllTimersAsync();
        });

        // Parse should be called and errors should be set
        expect(parseSpy).toHaveBeenCalledTimes(1);
        const errors = useStore.getState().parseErrors.get(testFile.id);
        expect(errors).toBeDefined();
        expect(errors?.length).toBe(1);
        expect(errors?.[0].message).toBe('Syntax error');
    });

    it('should handle multiple edit sessions with proper debouncing', async () => {
        const testFile = createTestFile('test-6', 'Test.ts', 'class Test {}');
        useStore.setState({
            files: [testFile],
            activeFileId: testFile.id,
        });

        const { result } = renderHook(() => useEditorController());
        await vi.runAllTimersAsync();
        parseSpy.mockClear();

        // First edit session
        act(() => {
            result.current.handleEditorChange('class A { x: string }');
        });

        await act(async () => {
            vi.advanceTimersByTime(500);
            await vi.runAllTimersAsync();
        });

        expect(parseSpy).toHaveBeenCalledTimes(1);
        expect(parseSpy).toHaveBeenCalledWith('class A { x: string }', 'Test.ts', 'test-6');

        parseSpy.mockClear();

        // Pause (user stops typing)
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        // Second edit session
        act(() => {
            result.current.handleEditorChange('class A { x: string; y: number }');
        });

        await act(async () => {
            vi.advanceTimersByTime(500);
            await vi.runAllTimersAsync();
        });

        // Parse called again with new value
        expect(parseSpy).toHaveBeenCalledTimes(1);
        expect(parseSpy).toHaveBeenCalledWith('class A { x: string; y: number }', 'Test.ts', 'test-6');
    });
});
