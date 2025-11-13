/**
 * useEditorController - Controller hook for code editor with debounced parsing
 * Implementation for T064-T066
 */

import { useEffect, useRef, useCallback } from 'react';
import type { editor } from 'monaco-editor';
import { useStore, useActiveFile } from '../shared/store';
import { parse } from '../typescript-parser/TypeScriptParser';
import { generateDiagram } from '../diagram-visualization/DiagramGenerator';
import type { ClassDefinition, InterfaceDefinition, Relationship } from '../shared/types';

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 500;

export function useEditorController() {
    const activeFile = useActiveFile();
    const setEditorContent = useStore((state) => state.setEditorContent);
    const setIsDirty = useStore((state) => state.setIsDirty);
    const updateFile = useStore((state) => state.updateFile);
    const setIsParsing = useStore((state) => state.setIsParsing);
    const setParseErrors = useStore((state) => state.setParseErrors);
    const clearParseErrors = useStore((state) => state.clearParseErrors);
    const setParsedEntities = useStore((state) => state.setParsedEntities);
    const updateDiagram = useStore((state) => state.updateDiagram);
    const allParsedEntities = useStore((state) => state.parsedEntities);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const previousFileIdRef = useRef<string | null>(null);

    /**
     * Handles editor mount event
     */
    const handleEditorMount = useCallback(
        (editor: editor.IStandaloneCodeEditor) => {
            editorRef.current = editor;
        },
        []
    );

    /**
     * Handles content changes in the editor with debouncing
     */
    const handleEditorChange = useCallback(
        (value: string | undefined) => {
            if (!activeFile) return;

            const newContent = value || '';

            setEditorContent(newContent);

            // Mark as dirty if content changed from saved version
            const isDirty = newContent !== activeFile.content;
            setIsDirty(isDirty);

            // Clear existing debounce timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Set up new debounce timer for parsing
            debounceTimerRef.current = setTimeout(() => {
                parseAndUpdateDiagram(newContent, activeFile.id, activeFile.name);
            }, DEBOUNCE_DELAY);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [activeFile, setEditorContent, setIsDirty]
    );

    /**
     * Parses TypeScript code and updates diagram
     */
    const parseAndUpdateDiagram = useCallback(
        (content: string, fileId: string, fileName: string) => {
            setIsParsing(true);

            try {
                // Parse the TypeScript code
                const parseResult = parse(content, fileName);

                // Update parse errors
                if (parseResult.errors.length > 0) {
                    setParseErrors(fileId, parseResult.errors);
                } else {
                    clearParseErrors(fileId);
                }

                // Store parsed entities for this file
                const entities: (ClassDefinition | InterfaceDefinition)[] = [
                    ...parseResult.classes,
                    ...parseResult.interfaces,
                ];
                setParsedEntities(fileId, entities);

                // Collect all entities from all files
                const allEntities: (ClassDefinition | InterfaceDefinition)[] = [];
                const allRelationships: Relationship[] = [];

                // Add entities from current file
                allEntities.push(...entities);

                // Add entities from other files
                allParsedEntities.forEach((fileEntities, id) => {
                    if (id !== fileId) {
                        allEntities.push(...fileEntities);
                    }
                });

                // Extract classes and interfaces
                const classes = allEntities.filter(
                    (e): e is ClassDefinition => 'properties' in e && 'methods' in e && 'extendsClass' in e
                );
                const interfaces = allEntities.filter(
                    (e): e is InterfaceDefinition => 'properties' in e && 'methods' in e && 'extendsInterfaces' in e
                );

                // Add relationships from parse result
                allRelationships.push(...parseResult.relationships);

                // Generate diagram
                const diagramData = generateDiagram(classes, interfaces, allRelationships);

                // Update diagram state
                updateDiagram(diagramData.nodes, diagramData.edges);

                // Note: Auto-save is disabled during typing to prevent editor issues
                // File will be saved when switching files or manually saving
                // This prevents the updateFile from triggering store updates that interfere with typing
            } catch (error) {
                console.error('Error parsing TypeScript code:', error);
                setParseErrors(fileId, [
                    {
                        line: 1,
                        column: 1,
                        message: error instanceof Error ? error.message : 'Unknown error',
                        severity: 'error',
                    },
                ]);
            } finally {
                setIsParsing(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            setIsParsing,
            setParseErrors,
            clearParseErrors,
            setParsedEntities,
            allParsedEntities,
            updateDiagram,
            updateFile,
        ]
    );

    /**
     * Load active file content into editor when file changes
     */
    useEffect(() => {
        // Save previous file before switching
        if (previousFileIdRef.current && previousFileIdRef.current !== activeFile?.id) {
            const currentContent = useStore.getState().editorContent;
            const isDirty = useStore.getState().isDirty;

            if (isDirty) {
                // Save the previous file's content to IndexedDB
                updateFile(previousFileIdRef.current, {
                    content: currentContent,
                    lastModified: Date.now(),
                });
            }
        }

        // Update previous file ID
        previousFileIdRef.current = activeFile?.id || null;

        if (activeFile) {
            setEditorContent(activeFile.content);
            setIsDirty(false);

            // Parse immediately when file is loaded
            parseAndUpdateDiagram(activeFile.content, activeFile.id, activeFile.name);
        } else {
            setEditorContent('');
            setIsDirty(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFile?.id]); // Only re-run when activeFile ID changes

    /**
     * Cleanup debounce timer on unmount
     */
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        handleEditorChange,
        handleEditorMount,
    };
}
