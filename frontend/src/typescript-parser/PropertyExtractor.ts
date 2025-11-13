/**
 * PropertyExtractor - Extracts class properties from TypeScript AST
 * Implementation for T058
 */

import ts from 'typescript';
import type { Property, Visibility } from '../shared/types';

/**
 * Extracts all properties from a class declaration.
 *
 * @param node - TypeScript AST class declaration node
 * @returns Array of Property objects
 */
export function extractProperties(node: ts.ClassDeclaration): Property[] {
    const properties: Property[] = [];

    for (const member of node.members) {
        if (ts.isPropertyDeclaration(member)) {
            const property = extractProperty(member);
            if (property) {
                properties.push(property);
            }
        }
    }

    return properties;
}

/**
 * Extracts a single property from a property declaration node.
 *
 * @param node - TypeScript AST property declaration node
 * @returns Property object or null if extraction fails
 */
function extractProperty(node: ts.PropertyDeclaration): Property | null {
    // Extract property name
    if (!node.name || !ts.isIdentifier(node.name)) {
        return null;
    }

    const name = node.name.text;

    // Extract type
    const type = node.type ? node.type.getText() : 'any';

    // Extract visibility (default to public)
    let visibility: Visibility = 'public';
    if (node.modifiers) {
        for (const modifier of node.modifiers) {
            if (modifier.kind === ts.SyntaxKind.PrivateKeyword) {
                visibility = 'private';
            } else if (modifier.kind === ts.SyntaxKind.ProtectedKeyword) {
                visibility = 'protected';
            } else if (modifier.kind === ts.SyntaxKind.PublicKeyword) {
                visibility = 'public';
            }
        }
    }

    // Check if static
    const isStatic = node.modifiers?.some(
        (mod) => mod.kind === ts.SyntaxKind.StaticKeyword
    ) ?? false;

    // Check if readonly
    const isReadonly = node.modifiers?.some(
        (mod) => mod.kind === ts.SyntaxKind.ReadonlyKeyword
    ) ?? false;

    // Extract default value if present
    const defaultValue = node.initializer
        ? node.initializer.getText()
        : undefined;

    return {
        name,
        type,
        visibility,
        isStatic,
        isReadonly,
        defaultValue,
    };
}
