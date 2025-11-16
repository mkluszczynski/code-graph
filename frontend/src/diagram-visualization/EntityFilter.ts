/**
 * Entity Filter Module
 * 
 * Filters entities based on diagram scope rules (file view vs project view)
 * and relationship detection for cross-file imports.
 * 
 * Feature: 004-diagram-scope
 */

import type {
    DiagramScope,
    DependencyNode,
    ClassDefinition,
    InterfaceDefinition,
    FilteredEntitySet,
    EntityInclusionReason,
} from '../shared/types';

/**
 * Filter entities based on diagram scope
 * 
 * @param allEntities - Map of file IDs to their entities
 * @param scope - Current diagram scope configuration
 * @param dependencyGraph - Optional dependency graph for import resolution
 * @returns Filtered entity set with inclusion reasons
 */
export function filterEntitiesByScope(
    allEntities: Map<string, (ClassDefinition | InterfaceDefinition)[]>,
    scope: DiagramScope,
    dependencyGraph?: Map<string, DependencyNode>
): FilteredEntitySet {
    const startTime = performance.now();

    // Calculate total entities before filtering
    let totalEntitiesBeforeFilter = 0;
    for (const entities of allEntities.values()) {
        totalEntitiesBeforeFilter += entities.length;
    }

    const inclusionReasons = new Map<string, EntityInclusionReason>();
    let filteredEntities: (ClassDefinition | InterfaceDefinition)[] = [];

    if (scope.mode === 'project') {
        // Project view: Include all entities from all files
        filteredEntities = filterProjectView(allEntities, inclusionReasons);
    } else {
        // File view: Include entities from active file + related imports
        // Use dependency graph from parameter or scope.importGraph
        const graphToUse = dependencyGraph || scope.importGraph;
        filteredEntities = filterFileView(
            allEntities,
            scope,
            graphToUse,
            inclusionReasons
        );
    }

    const endTime = performance.now();

    return {
        entities: filteredEntities,
        inclusionReasons,
        totalEntitiesBeforeFilter,
        filterTimeMs: endTime - startTime,
    };
}

/**
 * Filter for project view mode - include all entities
 */
function filterProjectView(
    allEntities: Map<string, (ClassDefinition | InterfaceDefinition)[]>,
    inclusionReasons: Map<string, EntityInclusionReason>
): (ClassDefinition | InterfaceDefinition)[] {
    const entities: (ClassDefinition | InterfaceDefinition)[] = [];

    for (const fileEntities of allEntities.values()) {
        for (const entity of fileEntities) {
            entities.push(entity);
            inclusionReasons.set(entity.name, { type: 'project-view' });
        }
    }

    return entities;
}

/**
 * Filter for file view mode - include active file entities + related imports
 */
function filterFileView(
    allEntities: Map<string, (ClassDefinition | InterfaceDefinition)[]>,
    scope: DiagramScope,
    dependencyGraph: Map<string, DependencyNode> | undefined,
    inclusionReasons: Map<string, EntityInclusionReason>
): (ClassDefinition | InterfaceDefinition)[] {
    const entities: (ClassDefinition | InterfaceDefinition)[] = [];

    if (!scope.activeFileId) {
        return entities; // No active file
    }

    // Get entities from active file
    const localEntities = allEntities.get(scope.activeFileId) || [];

    // Add all local entities
    for (const entity of localEntities) {
        entities.push(entity);
        inclusionReasons.set(entity.name, {
            type: 'local',
            fileId: scope.activeFileId,
        });
    }

    // If no dependency graph, return only local entities
    if (!dependencyGraph) {
        return entities;
    }

    // Get dependency node for active file
    const activeNode = dependencyGraph.get(scope.activeFileId);
    if (!activeNode) {
        return entities;
    }

    // Collect entities from imported files that have relationships
    const importedEntities = collectImportedEntitiesWithRelationships(
        localEntities,
        activeNode,
        allEntities,
        dependencyGraph,
        inclusionReasons
    );

    entities.push(...importedEntities);

    return entities;
}

/**
 * Collect entities from imported files that have relationships with local entities
 * 
 * Uses BFS to traverse import graph and detect relationships
 */
function collectImportedEntitiesWithRelationships(
    localEntities: (ClassDefinition | InterfaceDefinition)[],
    activeNode: DependencyNode,
    allEntities: Map<string, (ClassDefinition | InterfaceDefinition)[]>,
    dependencyGraph: Map<string, DependencyNode>,
    inclusionReasons: Map<string, EntityInclusionReason>
): (ClassDefinition | InterfaceDefinition)[] {
    const importedEntities: (ClassDefinition | InterfaceDefinition)[] = [];
    const visited = new Set<string>();
    const queue: Array<{ fileId: string; depth: number }> = [];

    // Add directly imported files to queue
    for (const importedFileId of activeNode.importedFileIds) {
        queue.push({ fileId: importedFileId, depth: 1 });
    }

    while (queue.length > 0) {
        const { fileId, depth } = queue.shift()!;

        if (visited.has(fileId) || depth > 5) {
            continue; // Prevent infinite loops and limit depth
        }

        visited.add(fileId);

        const fileEntities = allEntities.get(fileId) || [];

        // Check each entity in the imported file
        for (const entity of fileEntities) {
            // Skip if already included (prevent duplicates in circular dependencies)
            const entityNames = new Set([
                ...localEntities.map(e => e.name),
                ...importedEntities.map(e => e.name)
            ]);
            if (entityNames.has(entity.name)) {
                continue;
            }

            // Check if this entity has a relationship with local entities OR already-included imported entities
            if (hasRelationshipWithLocalEntities(entity, localEntities, importedEntities)) {
                importedEntities.push(entity);
                inclusionReasons.set(entity.name, {
                    type: 'imported',
                    importedBy: activeNode.fileId,
                    hasRelationship: true,
                });
            }
        }

        // Traverse to next level of imports (for transitive dependencies)
        const importedNode = dependencyGraph.get(fileId);
        if (importedNode) {
            for (const transitiveFileId of importedNode.importedFileIds) {
                if (!visited.has(transitiveFileId)) {
                    queue.push({ fileId: transitiveFileId, depth: depth + 1 });
                }
            }
        }
    }

    return importedEntities;
}

/**
 * Check if an entity has a relationship with local entities
 * 
 * Relationships include:
 * - Inheritance (extends)
 * - Realization (implements)
 * - Association (property type)
 * - Dependency (method parameter/return type)
 */
function hasRelationshipWithLocalEntities(
    entity: ClassDefinition | InterfaceDefinition,
    localEntities: (ClassDefinition | InterfaceDefinition)[],
    importedEntities: (ClassDefinition | InterfaceDefinition)[]
): boolean {
    const localEntityNames = new Set(localEntities.map((e) => e.name));

    // Also check against already-included imported entities for transitive relationships
    const allRelevantEntities = [...localEntities, ...importedEntities];

    // Check if local or imported entities reference this entity
    for (const relevantEntity of allRelevantEntities) {
        // Check inheritance
        if ('extendsClass' in relevantEntity && relevantEntity.extendsClass === entity.name) {
            return true;
        }

        // Check interface realization
        if ('implementsInterfaces' in relevantEntity && relevantEntity.implementsInterfaces.includes(entity.name)) {
            return true;
        }

        // Check properties for associations
        for (const prop of relevantEntity.properties) {
            if (typeReferencesEntity(prop.type, entity.name)) {
                return true;
            }
        }

        // Check method parameters and return types
        for (const method of relevantEntity.methods) {
            if (typeReferencesEntity(method.returnType, entity.name)) {
                return true;
            }
            for (const param of method.parameters) {
                if (typeReferencesEntity(param.type, entity.name)) {
                    return true;
                }
            }
        }
    }

    // Check if this entity references local entities (reverse relationship)
    if ('extendsClass' in entity && entity.extendsClass && localEntityNames.has(entity.extendsClass)) {
        return true;
    }

    if ('implementsInterfaces' in entity) {
        for (const interfaceName of entity.implementsInterfaces) {
            if (localEntityNames.has(interfaceName)) {
                return true;
            }
        }
    }

    if ('extendsInterfaces' in entity) {
        for (const interfaceName of entity.extendsInterfaces) {
            if (localEntityNames.has(interfaceName)) {
                return true;
            }
        }
    }

    // Check properties for references to local entities
    for (const prop of entity.properties) {
        for (const localEntity of localEntities) {
            if (typeReferencesEntity(prop.type, localEntity.name)) {
                return true;
            }
        }
    }

    // Check methods for references to local entities
    if ('methods' in entity) {
        for (const method of entity.methods) {
            for (const localEntity of localEntities) {
                if (typeReferencesEntity(method.returnType, localEntity.name)) {
                    return true;
                }
                for (const param of method.parameters) {
                    if (typeReferencesEntity(param.type, localEntity.name)) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

/**
 * Check if a type string references an entity name
 * 
 * Handles:
 * - Simple types: "Person"
 * - Generic types: "Array<Person>", "Map<string, Person>"
 * - Union types: "Person | null"
 * - Array syntax: "Person[]"
 */
function typeReferencesEntity(type: string, entityName: string): boolean {
    // Remove whitespace for comparison
    const normalizedType = type.replace(/\s/g, '');

    // Check for exact match
    if (normalizedType === entityName) {
        return true;
    }

    // Check if entity name appears as a word boundary
    // This handles generics, arrays, unions, etc.
    const regex = new RegExp(`\\b${entityName}\\b`);
    return regex.test(type);
}
