/**
 * TypeScriptParser - Parses TypeScript source code and extracts class/interface definitions
 * Implementation for T055-T060
 */

import ts from 'typescript';
import type {
    ParseResult,
    ParseError,
} from '../shared/types';
import { extractClassInfo } from './ClassExtractor';
import { extractInterfaceInfo } from './InterfaceExtractor';
import { extractRelationships } from './RelationshipAnalyzer';
import { performanceMonitor } from '../shared/utils/performance';

/**
 * Parses TypeScript source code and extracts class and interface definitions.
 *
 * @param sourceCode - TypeScript source code to parse
 * @param fileName - Name of the file (for TypeScript compiler error reporting)
 * @param fileId - Unique file identifier (for entity references and editor navigation)
 * @returns ParseResult containing classes, interfaces, and any errors
 */
export function parse(sourceCode: string, fileName: string, fileId?: string): ParseResult {
    performanceMonitor.startTimer('TypeScript Parsing');

    // Use fileId for entity fileId property if provided, otherwise fall back to fileName
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
        performanceMonitor.endTimer('TypeScript Parsing');
        return result;
    }

    try {
        // Create a source file from the source code
        // Use fileName for TypeScript compiler (for error reporting)
        const sourceFile = ts.createSourceFile(
            fileName,
            sourceCode,
            ts.ScriptTarget.Latest,
            true // setParentNodes
        );

        // Check for syntax errors
        const syntacticDiagnostics = (sourceFile as ts.SourceFile & { parseDiagnostics?: ts.Diagnostic[] }).parseDiagnostics || [];

        if (syntacticDiagnostics.length > 0) {
            result.success = false;
            result.errors = syntacticDiagnostics.map((diagnostic: ts.Diagnostic) => {
                const { line, character } = diagnostic.file
                    ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!)
                    : { line: 0, character: 0 };

                return {
                    line: line + 1, // Convert to 1-based
                    column: character + 1, // Convert to 1-based
                    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
                    severity: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
                } as ParseError;
            });
            return result;
        }

        // Visit all nodes in the AST
        function visit(node: ts.Node) {
            if (ts.isClassDeclaration(node)) {
                try {
                    // Pass fileName for ID generation and entityFileId for fileId property
                    const classInfo = extractClassInfo(node, fileName, entityFileId);
                    result.classes.push(classInfo);
                } catch (error) {
                    // Log error but continue parsing other classes
                    console.error('Error extracting class info:', error);
                }
            } else if (ts.isInterfaceDeclaration(node)) {
                try {
                    // Pass fileName for ID generation and entityFileId for fileId property
                    const interfaceInfo = extractInterfaceInfo(node, fileName, entityFileId);
                    result.interfaces.push(interfaceInfo);
                } catch (error) {
                    // Log error but continue parsing other interfaces
                    console.error('Error extracting interface info:', error);
                }
            }

            // Recursively visit child nodes
            ts.forEachChild(node, visit);
        }

        // Start visiting from the source file root
        visit(sourceFile);

        // Extract relationships from parsed classes and interfaces (Phase 7 - US5)
        result.relationships = extractRelationships(result.classes, result.interfaces);

        performanceMonitor.endTimer('TypeScript Parsing', {
            fileName,
            classCount: result.classes.length,
            interfaceCount: result.interfaces.length,
            relationshipCount: result.relationships.length,
        });
    } catch (error) {
        // Unexpected error during parsing
        result.success = false;
        result.errors.push({
            line: 1,
            column: 1,
            message: error instanceof Error ? error.message : 'Unknown parsing error',
            severity: 'error',
        });
        performanceMonitor.endTimer('TypeScript Parsing');
    }

    return result;
}
