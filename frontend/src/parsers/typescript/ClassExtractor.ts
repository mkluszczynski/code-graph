/**
 * ClassExtractor - Extracts class information from TypeScript AST
 */

import ts from 'typescript';
import type { ClassDefinition, Property, Method } from '../../shared/types';
import { extractProperties } from './PropertyExtractor';
import { extractMethods } from './MethodExtractor';

/**
 * Extracts class information from a TypeScript AST class declaration node.
 *
 * @param node - TypeScript AST class declaration node
 * @param fileName - File name (for ID generation, e.g., "Test.ts")
 * @param fileId - File identifier (for fileId property, defaults to fileName if not provided)
 * @returns ClassDefinition object
 */
export function extractClassInfo(
    node: ts.ClassDeclaration,
    fileName: string,
    fileId?: string
): ClassDefinition {
    // Extract class name
    const className = node.name?.text || 'AnonymousClass';

    // Generate unique ID using fileName for consistent format
    const id = `${fileName}::${className}`;

    // Use provided fileId or fall back to fileName for backward compatibility
    const entityFileId = fileId || fileName;

    // Check if class is abstract
    const isAbstract = node.modifiers?.some(
        (mod) => mod.kind === ts.SyntaxKind.AbstractKeyword
    ) ?? false;

    // Check if class is exported
    const isExported = node.modifiers?.some(
        (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
    ) ?? false;

    // Extract generic type parameters
    const typeParameters: string[] = [];
    if (node.typeParameters) {
        for (const typeParam of node.typeParameters) {
            typeParameters.push(typeParam.name.text);
        }
    }

    // Extract extends clause
    let extendsClass: string | null = null;
    if (node.heritageClauses) {
        for (const clause of node.heritageClauses) {
            if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                const extendsType = clause.types[0];
                if (ts.isIdentifier(extendsType.expression)) {
                    extendsClass = extendsType.expression.text;
                } else if (ts.isPropertyAccessExpression(extendsType.expression)) {
                    extendsClass = extendsType.expression.getText();
                }
                break;
            }
        }
    }

    // Extract implements clause
    const implementsInterfaces: string[] = [];
    if (node.heritageClauses) {
        for (const clause of node.heritageClauses) {
            if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
                for (const type of clause.types) {
                    if (ts.isIdentifier(type.expression)) {
                        implementsInterfaces.push(type.expression.text);
                    } else if (ts.isPropertyAccessExpression(type.expression)) {
                        implementsInterfaces.push(type.expression.getText());
                    }
                }
            }
        }
    }

    // Extract properties and methods
    const properties: Property[] = extractProperties(node);
    const methods: Method[] = extractMethods(node);

    return {
        id,
        name: className,
        fileId: entityFileId,
        isAbstract,
        isExported,
        properties,
        methods,
        typeParameters,
        extendsClass,
        implementsInterfaces,
    };
}
