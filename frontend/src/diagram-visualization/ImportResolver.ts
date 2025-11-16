/**
 * Import Resolver Module
 * 
 * Parses TypeScript import statements and builds dependency graphs
 * for cross-file relationship resolution.
 * 
 * Feature: 004-diagram-scope
 */

import * as ts from 'typescript';
import type {
    ImportInfo,
    DependencyNode,
    ProjectFile,
    ClassDefinition,
    InterfaceDefinition,
} from '../shared/types';

/**
 * Parse import statements from TypeScript source code
 * 
 * @param sourceCode - TypeScript source code
 * @param sourceFilePath - Path of the source file
 * @returns Array of parsed import information
 */
export function parseImports(sourceCode: string, sourceFilePath: string): ImportInfo[] {
    const imports: ImportInfo[] = [];

    // Create a TypeScript source file for AST parsing
    const sourceFile = ts.createSourceFile(
        sourceFilePath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true // setParentNodes
    );

    // Traverse the AST to find import declarations
    function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
            const importInfo = extractImportInfo(node, sourceFile);
            if (importInfo) {
                imports.push(importInfo);
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return imports;
}

/**
 * Extract import information from an ImportDeclaration node
 */
function extractImportInfo(
    node: ts.ImportDeclaration,
    sourceFile: ts.SourceFile
): ImportInfo | null {
    const moduleSpecifier = node.moduleSpecifier;

    // Only process string literal module specifiers
    if (!ts.isStringLiteral(moduleSpecifier)) {
        return null;
    }

    const importPath = moduleSpecifier.text;
    const importedNames: string[] = [];
    let isTypeOnly = false;
    let isNamespaceImport = false;

    // Check if it's a type-only import
    if (node.importClause?.isTypeOnly) {
        isTypeOnly = true;
    }

    // Extract imported names from the import clause
    if (node.importClause) {
        const { name, namedBindings } = node.importClause;

        // Default import (e.g., import React from 'react')
        if (name) {
            importedNames.push('default');
        }

        // Named imports or namespace import
        if (namedBindings) {
            if (ts.isNamespaceImport(namedBindings)) {
                // Namespace import (e.g., import * as models from './models')
                isNamespaceImport = true;
            } else if (ts.isNamedImports(namedBindings)) {
                // Named imports (e.g., import { Person, Employee } from './models')
                for (const element of namedBindings.elements) {
                    // For aliased imports (import { Person as P }), use the original name
                    const name = element.propertyName?.text || element.name.text;
                    importedNames.push(name);
                }
            }
        }
    }

    // Get line number from source file
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

    return {
        importPath,
        resolvedPath: null,
        resolvedFileId: null,
        importedNames,
        isTypeOnly,
        isNamespaceImport,
        lineNumber: line + 1, // Line numbers are 0-indexed, convert to 1-indexed
    };
}

/**
 * Resolve import paths to actual file IDs
 * 
 * @param imports - Array of import information
 * @param currentFilePath - Path of the current file (for relative resolution)
 * @param filePathMap - Map of file paths to file IDs
 * @returns Array of imports with resolved paths and IDs
 */
export function resolveImportPaths(
    imports: ImportInfo[],
    currentFilePath: string,
    filePathMap: Map<string, string>
): ImportInfo[] {
    return imports.map((importInfo) => {
        const { importPath } = importInfo;

        // Ignore external imports (non-relative paths)
        if (!importPath.startsWith('.')) {
            return importInfo;
        }

        // Get the directory of the current file
        const currentDir = currentFilePath.substring(
            0,
            currentFilePath.lastIndexOf('/')
        );

        // Resolve the relative path
        const resolvedPath = resolvePath(currentDir, importPath);

        // Try to find the file with .ts extension
        let resolvedFileId: string | null = null;
        let actualResolvedPath: string | null = null;

        // Try with .ts extension
        const tsPath = resolvedPath.endsWith('.ts') ? resolvedPath : `${resolvedPath}.ts`;
        if (filePathMap.has(tsPath)) {
            resolvedFileId = filePathMap.get(tsPath)!;
            actualResolvedPath = tsPath;
        }

        // Return updated import info
        return {
            ...importInfo,
            resolvedPath: actualResolvedPath,
            resolvedFileId,
        };
    });
}

/**
 * Resolve a relative path from a base directory
 * 
 * @param baseDir - Base directory path
 * @param relativePath - Relative import path
 * @returns Resolved absolute path
 */
function resolvePath(baseDir: string, relativePath: string): string {
    // Preserve leading slash for absolute paths
    const isAbsolute = baseDir.startsWith('/');

    const baseParts = baseDir.split('/').filter(Boolean);
    const relativeParts = relativePath.split('/').filter(Boolean);

    const resolvedParts = [...baseParts];

    for (const part of relativeParts) {
        if (part === '..') {
            // Go up one directory
            resolvedParts.pop();
        } else if (part !== '.') {
            // Add directory or file
            resolvedParts.push(part);
        }
        // Skip '.' (current directory)
    }

    const resolved = resolvedParts.join('/');
    return isAbsolute ? `/${resolved}` : resolved;
}

/**
 * Build dependency graph from all project files
 * 
 * @param files - All project files
 * @param parsedEntities - Map of file IDs to parsed entities
 * @returns Map of file IDs to dependency nodes
 */
export function buildDependencyGraph(
    files: ProjectFile[],
    parsedEntities: Map<string, (ClassDefinition | InterfaceDefinition)[]>
): Map<string, DependencyNode> {
    const graph = new Map<string, DependencyNode>();

    // Build file path to ID lookup table
    const filePathMap = new Map<string, string>();
    for (const file of files) {
        filePathMap.set(file.path, file.id);
    }

    // Process each file
    for (const file of files) {
        const imports = parseImports(file.content, file.path);
        const resolvedImports = resolveImportPaths(imports, file.path, filePathMap);

        // Extract only resolved file IDs
        const importedFileIds = new Set<string>();
        for (const importInfo of resolvedImports) {
            if (importInfo.resolvedFileId) {
                importedFileIds.add(importInfo.resolvedFileId);
            }
        }

        // Get entities for this file
        const entities = parsedEntities.get(file.id) || [];

        // Create dependency node
        graph.set(file.id, {
            fileId: file.id,
            filePath: file.path,
            imports: resolvedImports,
            importedFileIds,
            entities,
        });
    }

    return graph;
}

/**
 * Collect all related entities starting from a file, following imports
 * 
 * Uses BFS with visited tracking to handle circular dependencies
 * 
 * @param startFileId - Starting file ID
 * @param graph - Dependency graph
 * @param maxDepth - Maximum traversal depth (default 5)
 * @returns Array of all related entities
 */
export function collectRelatedEntities(
    startFileId: string,
    graph: Map<string, DependencyNode>,
    maxDepth = 5
): (ClassDefinition | InterfaceDefinition)[] {
    const entities: (ClassDefinition | InterfaceDefinition)[] = [];
    const visited = new Set<string>();
    const queue: Array<{ fileId: string; depth: number }> = [
        { fileId: startFileId, depth: 0 },
    ];

    while (queue.length > 0) {
        const { fileId, depth } = queue.shift()!;

        // Skip if already visited or max depth reached
        if (visited.has(fileId) || depth > maxDepth) {
            continue;
        }

        visited.add(fileId);

        const node = graph.get(fileId);
        if (!node) {
            continue;
        }

        // Add entities from this file
        entities.push(...node.entities);

        // Add imported files to queue
        for (const importedFileId of node.importedFileIds) {
            if (!visited.has(importedFileId)) {
                queue.push({ fileId: importedFileId, depth: depth + 1 });
            }
        }
    }

    return entities;
}
