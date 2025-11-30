/**
 * DartParser - Parses Dart source code using tree-sitter-dart WASM
 * 
 * Extends LanguageParser abstract base class for integration with ParserRegistry.
 * Uses web-tree-sitter to parse Dart source code and extract class/interface definitions.
 */

import type { Parser as TreeSitterParser, Node as TreeSitterNode, Language } from 'web-tree-sitter';
import type { ParseResult, ParseError, SupportedLanguage } from '../../shared/types';
import { LanguageParser } from '../LanguageParser';
import { extractClassInfo, extractAbstractClassAsInterface } from './ClassExtractor';
import { extractRelationships } from './RelationshipAnalyzer';
import { performanceMonitor } from '../../shared/utils/performance';

// Re-export the Node type for use in other modules
export type DartNode = TreeSitterNode;

// Singleton parser instance
let parserInstance: TreeSitterParser | null = null;
let dartLanguage: Language | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Dart parser implementation using tree-sitter-dart WASM.
 * Requires async initialization to load WASM modules.
 */
export class DartParser extends LanguageParser {
    readonly language: SupportedLanguage = 'dart';
    readonly extensions = ['dart'] as const;
    readonly displayName = 'Dart';

    /**
     * Indicates that this parser requires async initialization (WASM loading).
     */
    get requiresInitialization(): boolean {
        return true;
    }

    /**
     * Initialize the tree-sitter parser with Dart language.
     * This loads the WASM modules and is called automatically by ParserRegistry.
     */
    async initialize(): Promise<void> {
        // Use singleton pattern to avoid multiple initializations
        if (parserInstance && dartLanguage) {
            return;
        }

        // If initialization is already in progress, wait for it
        if (initPromise) {
            return initPromise;
        }

        initPromise = this.doInitialize();
        await initPromise;
    }

    private async doInitialize(): Promise<void> {
        try {
            // Dynamic import to avoid bundling issues
            const TreeSitterModule = await import('web-tree-sitter');
            // web-tree-sitter exports Parser as a named export, not default
            // The module structure is: { Parser, Language, Node, ... }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Parser = (TreeSitterModule as any).Parser || (TreeSitterModule as any).default?.Parser || TreeSitterModule;

            // Initialize tree-sitter WASM runtime
            await Parser.init({
                locateFile: (file: string) => `/wasm/${file}`,
            });

            // Create parser instance  
            parserInstance = new Parser() as TreeSitterParser;

            // Load Dart language - Language is also a named export or available on Parser
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Language = (TreeSitterModule as any).Language || Parser.Language;
            dartLanguage = await Language.load('/wasm/tree-sitter-dart.wasm');
            parserInstance!.setLanguage(dartLanguage);
        } catch (error) {
            console.error('Failed to initialize Dart parser:', error);
            throw error;
        }
    }

    /**
     * Parses Dart source code and extracts class and interface definitions.
     *
     * @param sourceCode - Dart source code to parse
     * @param fileName - Name of the file (for error reporting)
     * @param fileId - Unique file identifier (for entity references)
     * @returns ParseResult containing classes, interfaces, and any errors
     */
    parse(sourceCode: string, fileName: string, fileId?: string): ParseResult {
        performanceMonitor.startTimer('Dart Parsing');

        const entityFileId = fileId || fileName;

        const result: ParseResult = {
            classes: [],
            interfaces: [],
            relationships: [],
            errors: [],
            success: true,
        };

        // Handle empty source
        if (!sourceCode.trim()) {
            performanceMonitor.endTimer('Dart Parsing');
            return result;
        }

        // Ensure parser is initialized
        if (!parserInstance || !dartLanguage) {
            result.success = false;
            result.errors.push({
                line: 1,
                column: 1,
                message: 'Dart parser not initialized. Call initialize() first.',
                severity: 'error',
            });
            performanceMonitor.endTimer('Dart Parsing');
            return result;
        }

        try {
            // Parse the source code
            const tree = parserInstance.parse(sourceCode);
            if (!tree) {
                throw new Error('Failed to parse source code');
            }
            const rootNode = tree.rootNode;

            // Check for syntax errors (hasError is a getter, not a method)
            if (rootNode.hasError) {
                const errors = this.extractErrors(rootNode);
                if (errors.length > 0) {
                    result.success = false;
                    result.errors = errors;
                    return result;
                }
            }

            // Visit all nodes in the AST
            this.visitNode(rootNode, result, fileName, entityFileId);

            // Extract relationships between classes and interfaces
            result.relationships = extractRelationships(result.classes, result.interfaces);

            performanceMonitor.endTimer('Dart Parsing', {
                fileName,
                classCount: result.classes.length,
                interfaceCount: result.interfaces.length,
                relationshipCount: result.relationships.length,
            });
        } catch (error) {
            result.success = false;
            result.errors.push({
                line: 1,
                column: 1,
                message: error instanceof Error ? error.message : 'Unknown parsing error',
                severity: 'error',
            });
            performanceMonitor.endTimer('Dart Parsing');
        }

        return result;
    }

    /**
     * Recursively visits AST nodes to extract class and interface definitions.
     */
    private visitNode(
        node: TreeSitterNode,
        result: ParseResult,
        fileName: string,
        fileId: string
    ): void {
        // Check for class declarations
        if (node.type === 'class_definition') {
            const isAbstract = this.isAbstractClass(node);

            if (isAbstract) {
                // Abstract classes are treated as interfaces
                const interfaceInfo = extractAbstractClassAsInterface(node, fileName, fileId);
                result.interfaces.push(interfaceInfo);
            } else {
                // Regular classes
                const classInfo = extractClassInfo(node, fileName, fileId);
                result.classes.push(classInfo);
            }
        }

        // Recursively visit children
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child) {
                this.visitNode(child, result, fileName, fileId);
            }
        }
    }

    /**
     * Checks if a class declaration is abstract.
     */
    private isAbstractClass(node: TreeSitterNode): boolean {
        // Look for 'abstract' keyword in children
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child?.type === 'abstract') {
                return true;
            }
        }
        return false;
    }

    /**
     * Extracts syntax errors from the AST.
     */
    private extractErrors(rootNode: TreeSitterNode): ParseError[] {
        const errors: ParseError[] = [];

        const findErrors = (node: TreeSitterNode) => {
            // isMissing is a getter, not a method
            if (node.type === 'ERROR' || node.isMissing) {
                const start = node.startPosition;
                errors.push({
                    line: start.row + 1, // Convert to 1-based
                    column: start.column + 1,
                    message: node.isMissing
                        ? `Missing ${node.type}`
                        : 'Syntax error',
                    severity: 'error',
                });
            }

            for (let i = 0; i < node.childCount; i++) {
                const child = node.child(i);
                if (child) {
                    findErrors(child);
                }
            }
        };

        findErrors(rootNode);
        return errors;
    }
}

/**
 * Standalone parse function for convenience.
 */
export function parse(sourceCode: string, fileName: string, fileId?: string): ParseResult {
    const parser = new DartParser();
    // Note: Caller must ensure initialize() was called before using parse()
    return parser.parse(sourceCode, fileName, fileId);
}
