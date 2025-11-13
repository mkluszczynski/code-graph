/**
 * RelationshipAnalyzer - Extract relationships between TypeScript classes and interfaces
 * 
 * Detects:
 * - Inheritance (class extends class, interface extends interface)
 * - Realization (class implements interface)
 * - Association (class property references another class)
 * - Aggregation (class property is array of another class)
 */

import type { ClassDefinition, InterfaceDefinition, Relationship } from "../shared/types";

// Built-in TypeScript types that should not create relationships
const BUILT_IN_TYPES = new Set([
    'string', 'number', 'boolean', 'void', 'null', 'undefined', 'any', 'unknown',
    'never', 'object', 'symbol', 'bigint', 'Date', 'Promise', 'Array', 'Map',
    'Set', 'WeakMap', 'WeakSet', 'Error', 'RegExp', 'Function'
]);

/**
 * Extract all relationships from parsed classes and interfaces
 */
export function extractRelationships(
    classes: ClassDefinition[],
    interfaces: InterfaceDefinition[]
): Relationship[] {
    const relationships: Relationship[] = [];

    // Create maps for quick lookup
    const classMap = new Map(classes.map(c => [c.name, c]));
    const interfaceMap = new Map(interfaces.map(i => [i.name, i]));

    // Detect inheritance relationships (class extends class)
    relationships.push(...detectInheritance(classes, classMap));

    // Detect interface inheritance (interface extends interface)
    relationships.push(...detectInterfaceInheritance(interfaces, interfaceMap));

    // Detect realization relationships (class implements interface)
    relationships.push(...detectImplementation(classes, interfaceMap));

    // Detect association and aggregation relationships from properties
    relationships.push(...detectAssociation(classes, classMap, interfaceMap));

    return relationships;
}

/**
 * Detect class inheritance relationships (extends)
 */
export function detectInheritance(
    classes: ClassDefinition[],
    classMap: Map<string, ClassDefinition>
): Relationship[] {
    const relationships: Relationship[] = [];

    for (const cls of classes) {
        if (cls.extendsClass) {
            const parentClass = classMap.get(cls.extendsClass);
            if (parentClass) {
                relationships.push({
                    id: `rel_${cls.name}_${parentClass.name}_inheritance`,
                    type: 'inheritance',
                    sourceId: cls.id,
                    targetId: parentClass.id,
                });
            }
        }
    }

    return relationships;
}

/**
 * Detect interface inheritance relationships (extends)
 */
function detectInterfaceInheritance(
    interfaces: InterfaceDefinition[],
    interfaceMap: Map<string, InterfaceDefinition>
): Relationship[] {
    const relationships: Relationship[] = [];

    for (const iface of interfaces) {
        for (const parentInterfaceName of iface.extendsInterfaces) {
            const parentInterface = interfaceMap.get(parentInterfaceName);
            if (parentInterface) {
                relationships.push({
                    id: `rel_${iface.name}_${parentInterface.name}_inheritance`,
                    type: 'inheritance',
                    sourceId: iface.id,
                    targetId: parentInterface.id,
                });
            }
        }
    }

    return relationships;
}

/**
 * Detect realization relationships (class implements interface)
 */
export function detectImplementation(
    classes: ClassDefinition[],
    interfaceMap: Map<string, InterfaceDefinition>
): Relationship[] {
    const relationships: Relationship[] = [];

    for (const cls of classes) {
        for (const interfaceName of cls.implementsInterfaces) {
            const iface = interfaceMap.get(interfaceName);
            if (iface) {
                relationships.push({
                    id: `rel_${cls.name}_${iface.name}_realization`,
                    type: 'realization',
                    sourceId: cls.id,
                    targetId: iface.id,
                });
            }
        }
    }

    return relationships;
}

/**
 * Detect association and aggregation relationships from property types
 */
export function detectAssociation(
    classes: ClassDefinition[],
    classMap: Map<string, ClassDefinition>,
    interfaceMap: Map<string, InterfaceDefinition>
): Relationship[] {
    const relationships: Relationship[] = [];

    for (const cls of classes) {
        for (const property of cls.properties) {
            const { type, isArray } = parsePropertyType(property.type);

            // Skip built-in types
            if (BUILT_IN_TYPES.has(type)) {
                continue;
            }

            // Check if type references a known class or interface
            const targetClass = classMap.get(type);
            const targetInterface = interfaceMap.get(type);
            const target = targetClass || targetInterface;

            if (target) {
                const relationshipType = isArray ? 'aggregation' : 'association';
                const relationshipId = `rel_${cls.name}_${target.name}_${relationshipType}`;

                relationships.push({
                    id: relationshipId,
                    type: relationshipType,
                    sourceId: cls.id,
                    targetId: target.id,
                });
            }
        }
    }

    return relationships;
}

/**
 * Parse property type to extract base type and detect arrays
 */
function parsePropertyType(typeString: string): { type: string; isArray: boolean } {
    // Handle array syntax: Type[] or Array<Type>
    const arrayBracketMatch = typeString.match(/^(.+)\[\]$/);
    if (arrayBracketMatch) {
        return { type: arrayBracketMatch[1].trim(), isArray: true };
    }

    const arrayGenericMatch = typeString.match(/^Array<(.+)>$/);
    if (arrayGenericMatch) {
        return { type: arrayGenericMatch[1].trim(), isArray: true };
    }

    // Handle generic types: Container<T> -> Container
    const genericMatch = typeString.match(/^([^<]+)</);
    if (genericMatch) {
        return { type: genericMatch[1].trim(), isArray: false };
    }

    // Simple type
    return { type: typeString.trim(), isArray: false };
}
