/**
 * InterfaceExtractor - Extracts interface information from TypeScript AST
 */

import ts from 'typescript';
import type {
    InterfaceDefinition,
    PropertySignature,
    MethodSignature,
    Parameter,
} from '../../shared/types';

/**
 * Extracts interface information from a TypeScript AST interface declaration node.
 *
 * @param node - TypeScript AST interface declaration node
 * @param fileName - File name (for ID generation, e.g., "Test.ts")
 * @param fileId - File identifier (for fileId property, defaults to fileName if not provided)
 * @returns InterfaceDefinition object
 */
export function extractInterfaceInfo(
    node: ts.InterfaceDeclaration,
    fileName: string,
    fileId?: string
): InterfaceDefinition {
    // Extract interface name
    const interfaceName = node.name.text;

    // Generate unique ID using fileName for consistent format
    const id = `${fileName}::${interfaceName}`;

    // Use provided fileId or fall back to fileName for backward compatibility
    const entityFileId = fileId || fileName;

    // Check if interface is exported
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
    const extendsInterfaces: string[] = [];
    if (node.heritageClauses) {
        for (const clause of node.heritageClauses) {
            if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                for (const type of clause.types) {
                    if (ts.isIdentifier(type.expression)) {
                        extendsInterfaces.push(type.expression.text);
                    } else if (ts.isPropertyAccessExpression(type.expression)) {
                        extendsInterfaces.push(type.expression.getText());
                    }
                }
            }
        }
    }

    // Extract properties and methods
    const properties: PropertySignature[] = [];
    const methods: MethodSignature[] = [];

    for (const member of node.members) {
        if (ts.isPropertySignature(member)) {
            const property = extractPropertySignature(member);
            if (property) {
                properties.push(property);
            }
        } else if (ts.isMethodSignature(member)) {
            const method = extractMethodSignature(member);
            if (method) {
                methods.push(method);
            }
        }
    }

    return {
        id,
        name: interfaceName,
        fileId: entityFileId,
        isExported,
        properties,
        methods,
        typeParameters,
        extendsInterfaces,
    };
}

/**
 * Extracts property signature from interface property node
 */
function extractPropertySignature(
    node: ts.PropertySignature
): PropertySignature | null {
    if (!node.name || !ts.isIdentifier(node.name)) {
        return null;
    }

    const name = node.name.text;
    const type = node.type ? node.type.getText() : 'any';
    const isOptional = node.questionToken !== undefined;
    const isReadonly = node.modifiers?.some(
        (mod) => mod.kind === ts.SyntaxKind.ReadonlyKeyword
    ) ?? false;

    return {
        name,
        type,
        isOptional,
        isReadonly,
    };
}

/**
 * Extracts method signature from interface method node
 */
function extractMethodSignature(
    node: ts.MethodSignature
): MethodSignature | null {
    if (!node.name || !ts.isIdentifier(node.name)) {
        return null;
    }

    const name = node.name.text;
    const returnType = node.type ? node.type.getText() : 'void';

    // Extract parameters
    const parameters: Parameter[] = [];
    for (const param of node.parameters) {
        if (ts.isIdentifier(param.name)) {
            const paramName = param.name.text;
            const paramType = param.type ? param.type.getText() : 'any';
            const isOptional = param.questionToken !== undefined;
            const defaultValue = param.initializer
                ? param.initializer.getText()
                : undefined;

            parameters.push({
                name: paramName,
                type: paramType,
                isOptional,
                defaultValue,
            });
        }
    }

    return {
        name,
        returnType,
        parameters,
    };
}
