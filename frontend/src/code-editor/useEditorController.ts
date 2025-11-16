/**
 * useEditorController - Controller hook for code editor with debounced parsing
 * Implementation for T064-T066
 */

import { useEffect, useRef, useCallback } from 'react';
import type { editor } from 'monaco-editor';
import { useStore, useActiveFile } from '../shared/store';
import { parse } from '../typescript-parser/TypeScriptParser';
import { generateDiagram } from '../diagram-visualization/DiagramGenerator';
import type { ClassDefinition, InterfaceDefinition } from '../shared/types';
import { EDITOR_DEBOUNCE_DELAY_MS } from '../shared/constants';
import { usePersistenceController } from '../project-management/usePersistenceController';
import { buildDependencyGraph } from '../diagram-visualization/ImportResolver';
import { filterEntitiesByScope } from '../diagram-visualization/EntityFilter';
import { extractRelationships } from '../typescript-parser/RelationshipAnalyzer';
import { performanceMonitor } from '../shared/utils/performance';

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
    const autoSaveEnabled = useStore((state) => state.autoSaveEnabled);
    const diagramViewMode = useStore((state) => state.diagramViewMode);

    const persistenceController = usePersistenceController();

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const previousFileIdRef = useRef<string | null>(null);

    /**
     * Handles editor mount event
     */
    const handleEditorMount = useCallback(
        (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
            editorRef.current = editor;

            // Configure TypeScript compiler options to suppress module resolution errors
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.Latest,
                allowNonTsExtensions: true,
                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                module: monaco.languages.typescript.ModuleKind.ESNext,
                noEmit: true,
                esModuleInterop: true,
                jsx: monaco.languages.typescript.JsxEmit.React,
                typeRoots: ['node_modules/@types'],
                // Suppress module resolution errors for imports that we can't resolve
                skipLibCheck: true,
                // Don't show errors for unresolved imports
                noResolve: true,
            });

            // Disable semantic diagnostics (type checking) to prevent module resolution errors
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true, // Disable semantic errors (including module resolution)
                noSyntaxValidation: false,  // Keep syntax validation enabled
            });
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

            // Trigger auto-save if content changed and auto-save is enabled
            if (isDirty && autoSaveEnabled && persistenceController) {
                persistenceController.debouncedSaveFile(activeFile.id, newContent);
            }

            // Clear existing debounce timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Set up new debounce timer for parsing
            debounceTimerRef.current = setTimeout(() => {
                parseAndUpdateDiagram(newContent, activeFile.id);
            }, EDITOR_DEBOUNCE_DELAY_MS);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [activeFile, setEditorContent, setIsDirty, autoSaveEnabled, persistenceController]
    );

    /**
     * Parses TypeScript code and updates diagram
     */
    const parseAndUpdateDiagram = useCallback(
        (content: string, fileId: string) => {
            setIsParsing(true);
            performanceMonitor.startTimer('Diagram Update (File View)');

            try {
                // Get the filename from the active file
                const file = useStore.getState().files.find(f => f.id === fileId);
                const fileName = file?.name || 'Untitled.ts';

                // Parse the TypeScript code
                // Pass both fileName (for TS compiler) and fileId (for entity references)
                const parseResult = parse(content, fileName, fileId);

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

                // Get current store state
                const currentState = useStore.getState();
                const currentViewMode = currentState.diagramViewMode;

                // Create updated files array with current in-progress content
                // This ensures import statements are detected even before the file is saved
                const currentFiles = currentState.files.map(f =>
                    f.id === fileId ? { ...f, content } : f
                );

                // Create updated parsed entities map
                // Parse ALL files in the project to ensure dependency graph has complete data
                const currentParsedEntities = new Map(currentState.parsedEntities);

                // Parse any files that haven't been parsed yet
                for (const file of currentFiles) {
                    if (!currentParsedEntities.has(file.id)) {
                        // Parse this file
                        const fileParseResult = parse(file.content, file.name, file.id);
                        const fileEntities: (ClassDefinition | InterfaceDefinition)[] = [
                            ...fileParseResult.classes,
                            ...fileParseResult.interfaces,
                        ];
                        currentParsedEntities.set(file.id, fileEntities);

                        // Also update the store with these parsed entities
                        setParsedEntities(file.id, fileEntities);
                    }
                }

                // Update with current file's entities (may have changed)
                currentParsedEntities.set(fileId, entities);

                // Build dependency graph from all files (now with all entities parsed)
                const dependencyGraph = buildDependencyGraph(currentFiles, currentParsedEntities);

                // Create diagram scope
                const scope = {
                    mode: currentViewMode,
                    activeFileId: fileId,
                    importGraph: dependencyGraph,
                };

                // Filter entities based on scope
                const filteredResult = filterEntitiesByScope(
                    currentParsedEntities,
                    scope,
                    dependencyGraph
                );

                // Separate filtered entities into classes and interfaces
                const classes = filteredResult.entities.filter(
                    (e): e is ClassDefinition => 'extendsClass' in e
                );
                const interfaces = filteredResult.entities.filter(
                    (e): e is InterfaceDefinition => 'extendsInterfaces' in e
                );

                // Extract relationships from filtered entities
                const relationships = extractRelationships(classes, interfaces);

                // Generate diagram with filtered entities (pass viewMode for layout configuration)
                const diagramData = generateDiagram(classes, interfaces, relationships, currentViewMode);

                // Update diagram state
                updateDiagram(diagramData.nodes, diagramData.edges);

                // End performance monitoring
                const updateTime = performanceMonitor.endTimer('Diagram Update (File View)', {
                    fileId,
                    fileName,
                    viewMode: currentViewMode,
                    entityCount: filteredResult.entities.length,
                    nodeCount: diagramData.nodes.length,
                    edgeCount: diagramData.edges.length,
                });

                // Warn if update time exceeds target (SC-003: <200ms for files with 10 entities)
                if (filteredResult.entities.length <= 10 && updateTime > 200) {
                    console.warn(
                        `[Performance] Diagram update took ${updateTime.toFixed(2)}ms for ${filteredResult.entities.length} entities (target: <200ms for ≤10 entities)`
                    );
                }

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
                performanceMonitor.endTimer('Diagram Update (File View)', { error: true });
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

            // Persist last active file ID to localStorage
            localStorage.setItem('lastActiveFileId', activeFile.id);

            // Parse immediately when file is loaded
            parseAndUpdateDiagram(activeFile.content, activeFile.id);
        } else {
            setEditorContent('');
            setIsDirty(false);

            // Clear last active file from localStorage
            localStorage.removeItem('lastActiveFileId');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFile?.id]); // Only re-run when activeFile ID changes

    /**
     * Regenerate diagram when view mode changes
     */
    useEffect(() => {
        if (activeFile) {
            // Debounce diagram updates when view mode changes
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(() => {
                parseAndUpdateDiagram(activeFile.content, activeFile.id);
            }, EDITOR_DEBOUNCE_DELAY_MS);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [diagramViewMode]);

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
