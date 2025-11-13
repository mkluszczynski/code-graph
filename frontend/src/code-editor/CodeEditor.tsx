/**
 * CodeEditor - Monaco-based TypeScript code editor
 * Implementation for T063
 */

import { Editor } from '@monaco-editor/react';
import { useStore, useActiveFile } from '../shared/store';
import { useEditorController } from './useEditorController';

export function CodeEditor() {
    const activeFile = useActiveFile();
    const editorContent = useStore((state) => state.editorContent);
    const { handleEditorChange, handleEditorMount } = useEditorController();

    if (!activeFile) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No file selected. Click "Add" to create a new file or select a file from the tree.</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                defaultLanguage="typescript"
                value={editorContent}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    tabSize: 2,
                }}
            />
        </div>
    );
}
