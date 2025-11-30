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

    // Detect dependency relationships from method signatures
    relationships.push(...detectDependencies(classes, interfaces, classMap, interfaceMap));

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
 * Detects dependency relationships from method return types and parameters.
 * Creates dependency arrows for types used in method signatures but not as properties.
 */
function detectDependencies(
    classes: ClassDefinition[],
    interfaces: InterfaceDefinition[],
    classMap: Map<string, ClassDefinition>,
    interfaceMap: Map<string, InterfaceDefinition>
): Relationship[] {
    const relationships: Relationship[] = [];
    const existingRelationships = new Set<string>();

    // Helper to add dependency if target exists and no relationship already exists
    const addDependency = (sourceId: string, sourceName: string, typeName: string) => {
        if (BUILT_IN_TYPES.has(typeName)) return;

        const targetClass = classMap.get(typeName);
        const targetInterface = interfaceMap.get(typeName);
        const target = targetClass || targetInterface;

        if (target && target.id !== sourceId) {
            const relationshipId = `rel_${sourceName}_${target.name}_dependency`;
            // Avoid duplicates
            if (!existingRelationships.has(relationshipId)) {
                existingRelationships.add(relationshipId);
                relationships.push({
                    id: relationshipId,
                    type: 'dependency',
                    sourceId: sourceId,
                    targetId: target.id,
                });
            }
        }
    };

    // Process classes
    for (const cls of classes) {
        // Skip if we already have a property-based relationship
        const propertyTypes = new Set(cls.properties.map(p => parsePropertyType(p.type).type));

        for (const method of cls.methods) {
            // Check return type
            const returnTypes = extractTypesFromSignature(method.returnType);
            for (const typeName of returnTypes) {
                if (!propertyTypes.has(typeName)) {
                    addDependency(cls.id, cls.name, typeName);
                }
            }

            // Check parameter types
            for (const param of method.parameters) {
                const paramTypes = extractTypesFromSignature(param.type);
                for (const typeName of paramTypes) {
                    if (!propertyTypes.has(typeName)) {
                        addDependency(cls.id, cls.name, typeName);
                    }
                }
            }
        }
    }

    // Process interfaces
    for (const iface of interfaces) {
        const propertyTypes = new Set(iface.properties.map(p => parsePropertyType(p.type).type));

        for (const method of iface.methods) {
            // Check return type
            const returnTypes = extractTypesFromSignature(method.returnType);
            for (const typeName of returnTypes) {
                if (!propertyTypes.has(typeName)) {
                    addDependency(iface.id, iface.name, typeName);
                }
            }

            // Check parameter types
            for (const param of method.parameters) {
                const paramTypes = extractTypesFromSignature(param.type);
                for (const typeName of paramTypes) {
                    if (!propertyTypes.has(typeName)) {
                        addDependency(iface.id, iface.name, typeName);
                    }
                }
            }
        }
    }

    return relationships;
}

/**
 * Extracts all type names from a type signature.
 * Handles generics like Future<List<Quest>> -> ['Quest']
 * Also handles union types, nullable types, etc.
 */
function extractTypesFromSignature(typeString: string): string[] {
    const types: string[] = [];
    if (!typeString) return types;

    // Remove nullable markers
    let cleanType = typeString.replace(/\?/g, '');

    // Extract types from generic parameters recursively
    // Match: Future<List<Quest>> -> extract Quest
    const genericMatch = cleanType.match(/<(.+)>/);
    if (genericMatch) {
        const innerContent = genericMatch[1];
        // Handle nested generics and comma-separated types (Map<K, V>)
        types.push(...extractTypesFromSignature(innerContent));

        // Also get the outer type if it's not built-in
        const outerType = cleanType.split('<')[0].trim();
        if (!BUILT_IN_TYPES.has(outerType)) {
            types.push(outerType);
        }
    } else {
        // Simple type or comma-separated (from Map<K, V> inner)
        const simpleTypes = cleanType.split(',').map(t => t.trim());
        for (const t of simpleTypes) {
            if (t && !BUILT_IN_TYPES.has(t)) {
                types.push(t);
            }
        }
    }

    return types;
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
