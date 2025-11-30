/**
 * Dart PropertyExtractor - Extracts properties/fields from Dart class bodies
 * 
 * Extracts:
 * - Field name
 * - Field type (including nullable types like String?)
 * - Visibility (public/private based on underscore prefix)
 * - Static modifier
 * - Final/const modifier (mapped to isReadonly)
 * - Default values
 */

import type { Node as TreeSitterNode } from 'web-tree-sitter';
import type { Property, Visibility } from '../../shared/types';

/**
 * Extracts all properties from a Dart class body.
 *
 * @param classBody - Tree-sitter node of the class body
 * @returns Array of Property definitions
 */
export function extractProperties(classBody: TreeSitterNode): Property[] {
    const properties: Property[] = [];

    // Iterate through class body children to find field declarations
    for (let i = 0; i < classBody.childCount; i++) {
        const child = classBody.child(i);
        if (!child) continue;

        // Look for declaration nodes that contain fields
        if (child.type === 'declaration') {
            const fieldDecl = findFieldDeclaration(child);
            if (fieldDecl) {
                properties.push(fieldDecl);
            }
        }
    }

    return properties;
}

/**
 * Extracts a single property from a declaration node.
 */
function findFieldDeclaration(node: TreeSitterNode): Property | null {
    // Check for various field declaration patterns
    let name = '';
    let type = 'dynamic';
    let isStatic = false;
    let isReadonly = false;
    let defaultValue: string | undefined;

    // Look through all children to find modifiers, type, name, and value
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'static':
                isStatic = true;
                break;
            case 'final_builtin':
            case 'final':
            case 'const_builtin':
            case 'const':
                isReadonly = true;
                break;
            case 'late':
                // late is just a modifier, doesn't change the type
                break;
            case 'type_identifier':
            case 'built_in_identifier':
                type = child.text;
                break;
            case 'nullable_type':
                type = child.text;
                break;
            case 'identifier':
                name = child.text;
                break;
            case 'initialized_identifier':
                // Handle "String name = 'value'" pattern
                name = extractIdentifierName(child);
                const initValue = extractInitialValue(child);
                if (initValue) {
                    defaultValue = initValue;
                }
                break;
            case 'initialized_identifier_list':
                // Handle multiple declarations on one line
                // For now, take the first one
                const firstId = findChildByType(child, 'initialized_identifier');
                if (firstId) {
                    name = extractIdentifierName(firstId);
                    const val = extractInitialValue(firstId);
                    if (val) {
                        defaultValue = val;
                    }
                }
                break;
        }
    }

    // Skip if we couldn't find a name
    if (!name) {
        return null;
    }

    // Determine visibility based on underscore prefix
    const visibility: Visibility = name.startsWith('_') ? 'private' : 'public';

    return {
        name,
        type,
        visibility,
        isStatic,
        isReadonly,
        defaultValue,
    };
}

/**
 * Extracts the identifier name from an initialized_identifier node.
 */
function extractIdentifierName(node: TreeSitterNode): string {
    const id = findChildByType(node, 'identifier');
    return id?.text || '';
}

/**
 * Extracts the initial value from an initialized_identifier node.
 */
function extractInitialValue(node: TreeSitterNode): string | undefined {
    // Look for '=' followed by an expression
    let foundEquals = false;
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === '=') {
            foundEquals = true;
            continue;
        }

        if (foundEquals && child.type !== 'comment') {
            return child.text;
        }
    }
    return undefined;
}

/**
 * Finds the first child node of a specific type.
 */
function findChildByType(node: TreeSitterNode, type: string): TreeSitterNode | null {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child?.type === type) {
            return child;
        }
    }
    return null;
}
