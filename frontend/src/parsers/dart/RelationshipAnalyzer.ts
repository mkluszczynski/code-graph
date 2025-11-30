/**
 * Dart RelationshipAnalyzer - Extracts relationships between Dart classes and interfaces
 * 
 * Detects:
 * - Inheritance (class extends class, interface extends interface)
 * - Realization (class implements interface)
 * - Association (class property references another class)
 * - Aggregation (class property is List/array of another class)
 */

import type { ClassDefinition, InterfaceDefinition, Relationship } from '../../shared/types';

// Built-in Dart types that should not create relationships
const BUILT_IN_TYPES = new Set([
    'String', 'string', 'int', 'double', 'num', 'bool', 'void', 'null',
    'dynamic', 'Object', 'object', 'Never', 'Null', 'Function',
    'List', 'Map', 'Set', 'Iterable', 'Iterator', 'Future', 'Stream',
    'DateTime', 'Duration', 'Uri', 'RegExp', 'Symbol', 'Type',
    'Comparable', 'Pattern', 'Match', 'Error', 'Exception', 'StackTrace',
    // Common Flutter types
    'Widget', 'BuildContext', 'State', 'Key',
]);

/**
 * Extracts all relationships from parsed classes and interfaces.
 *
 * @param classes - Array of ClassDefinitions
 * @param interfaces - Array of InterfaceDefinitions
 * @returns Array of Relationship objects
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
    relationships.push(...detectRealization(classes, interfaceMap));

    // Detect association and aggregation relationships from properties
    relationships.push(...detectAssociations(classes, classMap, interfaceMap));

    return relationships;
}

/**
 * Detects class inheritance relationships (extends).
 */
function detectInheritance(
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
 * Detects interface inheritance relationships (extends).
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
 * Detects realization relationships (class implements interface).
 */
function detectRealization(
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
 * Detects association and aggregation relationships from property types.
 */
function detectAssociations(
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

                // Avoid duplicate relationships
                if (!relationships.some(r => r.id === relationshipId)) {
                    relationships.push({
                        id: relationshipId,
                        type: relationshipType,
                        sourceId: cls.id,
                        targetId: target.id,
                    });
                }
            }
        }
    }

    return relationships;
}

/**
 * Parses property type to extract base type and detect arrays/lists.
 */
function parsePropertyType(typeString: string): { type: string; isArray: boolean } {
    // Remove nullable marker for type detection
    const cleanType = typeString.replace(/\?$/, '');

    // Handle List<Type> or Iterable<Type>
    const listMatch = cleanType.match(/^(?:List|Iterable|Set)<(.+)>$/);
    if (listMatch) {
        return { type: listMatch[1].replace(/\?$/, ''), isArray: true };
    }

    // Handle Map<K, V> - extract the value type
    const mapMatch = cleanType.match(/^Map<.+,\s*(.+)>$/);
    if (mapMatch) {
        return { type: mapMatch[1].replace(/\?$/, ''), isArray: true };
    }

    // Handle generic types: Container<T> -> Container
    const genericMatch = cleanType.match(/^([^<]+)</);
    if (genericMatch) {
        return { type: genericMatch[1], isArray: false };
    }

    // Simple type
    return { type: cleanType, isArray: false };
}
