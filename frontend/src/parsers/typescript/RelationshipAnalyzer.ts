/**
 * RelationshipAnalyzer - Extract relationships between TypeScript classes and interfaces
 * 
 * Detects:
 * - Inheritance (class extends class, interface extends interface)
 * - Realization (class implements interface)
 * - Association (class property references another class)
 * - Aggregation (class property is array of another class)
 */

import type { ClassDefinition, InterfaceDefinition, Relationship } from "../../shared/types";

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

    // Detect dependency relationships from method signatures
    relationships.push(...detectDependencies(classes, interfaces, classMap, interfaceMap));

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
        // Skip types we already have property-based relationships for
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
 * Handles generics like Promise<Array<User>> -> ['User']
 * Also handles union types, intersection types, etc.
 */
function extractTypesFromSignature(typeString: string): string[] {
    const types: string[] = [];
    if (!typeString) return types;

    // Handle union types (A | B)
    if (typeString.includes('|')) {
        const unionParts = typeString.split('|').map(t => t.trim());
        for (const part of unionParts) {
            types.push(...extractTypesFromSignature(part));
        }
        return types;
    }

    // Handle intersection types (A & B)
    if (typeString.includes('&')) {
        const intersectionParts = typeString.split('&').map(t => t.trim());
        for (const part of intersectionParts) {
            types.push(...extractTypesFromSignature(part));
        }
        return types;
    }

    // Handle array syntax Type[]
    const arrayBracketMatch = typeString.match(/^(.+)\[\]$/);
    if (arrayBracketMatch) {
        types.push(...extractTypesFromSignature(arrayBracketMatch[1].trim()));
        return types;
    }

    // Extract types from generic parameters recursively
    const genericMatch = typeString.match(/<(.+)>/);
    if (genericMatch) {
        const innerContent = genericMatch[1];
        // Handle nested generics and comma-separated types (Map<K, V>)
        types.push(...extractTypesFromSignature(innerContent));

        // Also get the outer type if it's not built-in
        const outerType = typeString.split('<')[0].trim();
        if (!BUILT_IN_TYPES.has(outerType)) {
            types.push(outerType);
        }
    } else {
        // Simple type or comma-separated (from Map<K, V> inner)
        const simpleTypes = typeString.split(',').map(t => t.trim());
        for (const t of simpleTypes) {
            if (t && !BUILT_IN_TYPES.has(t)) {
                types.push(t);
            }
        }
    }

    return types;
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
