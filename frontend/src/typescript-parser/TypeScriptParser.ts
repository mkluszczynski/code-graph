/**
 * TypeScriptParser - Parses TypeScript source code and extracts class/interface definitions
 * Implementation for T055-T060
 */

import ts from 'typescript';
import type {
    ParseResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ClassDefinition,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    InterfaceDefinition,
    ParseError,
} from '../shared/types';
import { extractClassInfo } from './ClassExtractor';
import { extractInterfaceInfo } from './InterfaceExtractor';

/**
 * Parses TypeScript source code and extracts class and interface definitions.
 *
 * @param sourceCode - TypeScript source code to parse
 * @param fileName - Name of the file (for error reporting and ID generation)
 * @returns ParseResult containing classes, interfaces, and any errors
 */
export function parse(sourceCode: string, fileName: string): ParseResult {
    const result: ParseResult = {
        classes: [],
        interfaces: [],
        relationships: [], // Phase 7 (US5) - not implemented in Phase 6
        errors: [],
        success: true,
    };

    // Handle empty source
    if (!sourceCode.trim()) {
        return result;
    }

    try {
        // Create a source file from the source code
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
                    const classInfo = extractClassInfo(node, fileName);
                    result.classes.push(classInfo);
                } catch (error) {
                    // Log error but continue parsing other classes
                    console.error('Error extracting class info:', error);
                }
            } else if (ts.isInterfaceDeclaration(node)) {
                try {
                    const interfaceInfo = extractInterfaceInfo(node, fileName);
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
    } catch (error) {
        // Unexpected error during parsing
        result.success = false;
        result.errors.push({
            line: 1,
            column: 1,
            message: error instanceof Error ? error.message : 'Unknown parsing error',
            severity: 'error',
        });
    }

    return result;
}
