/**
 * CodeEditor - Monaco-based TypeScript code editor
 * Implementation for T063, T109
 */

import { Suspense, lazy } from 'react';
import type { EditorProps } from '@monaco-editor/react';
import { useStore, useActiveFile } from '../shared/store';
import { useEditorController } from './useEditorController';
import { useTheme } from '../shared/hooks/useTheme';
import { SaveIndicator } from '../components/SaveIndicator';

// Lazy load Monaco Editor to reduce initial bundle size (T109)
const Editor = lazy(() =>
    import('@monaco-editor/react').then(module => ({ default: module.Editor }))
);

function LoadingEditor() {
    return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Loading editor...</p>
            </div>
        </div>
    );
}

export function CodeEditor() {
    const activeFile = useActiveFile();
    const editorContent = useStore((state) => state.editorContent);
    const { handleEditorChange, handleEditorMount } = useEditorController();
    const { resolvedTheme } = useTheme();

    // Monaco theme based on current app theme - derived from resolvedTheme
    const monacoTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs';

    if (!activeFile) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No file selected. Click "Add" to create a new file or select a file from the tree.</p>
            </div>
        );
    }

    const editorOptions: EditorProps['options'] = {
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        // Performance optimizations (T109)
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
    };

    return (
        <div className="h-full w-full flex flex-col">
            {/* Save status indicator */}
            <div className="px-3 py-1 border-b bg-background/50 flex items-center justify-between min-h-[32px]">
                <span className="text-sm text-muted-foreground">{activeFile.name}</span>
                <SaveIndicator />
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <Suspense fallback={<LoadingEditor />}>
                    <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        value={editorContent}
                        onChange={handleEditorChange}
                        onMount={handleEditorMount}
                        theme={monacoTheme}
                        options={editorOptions}
                    />
                </Suspense>
            </div>
        </div>
    );
}
