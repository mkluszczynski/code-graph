/**
 * Dart ClassExtractor - Extracts class information from Dart AST nodes
 * 
 * Uses tree-sitter-dart to parse class definitions and extract:
 * - Class name
 * - Properties (fields)
 * - Methods
 * - Type parameters
 * - Extends/implements/with clauses
 */

import type { Node as TreeSitterNode } from 'web-tree-sitter';
import type { ClassDefinition, InterfaceDefinition, PropertySignature, MethodSignature, Parameter } from '../../shared/types';
import { extractProperties } from './PropertyExtractor';
import { extractMethods } from './MethodExtractor';

/**
 * Extracts class information from a Dart class_definition AST node.
 *
 * @param node - Tree-sitter node of type 'class_definition'
 * @param fileName - Source file name
 * @param fileId - File identifier for entity references
 * @returns ClassDefinition with properties, methods, and relationships
 */
export function extractClassInfo(
    node: TreeSitterNode,
    fileName: string,
    fileId: string
): ClassDefinition {
    const className = extractClassName(node);
    const id = `${fileName}::${className}`;

    const typeParameters = extractTypeParameters(node);
    const extendsClass = extractExtendsClass(node);
    const implementsInterfaces = extractImplementsInterfaces(node);
    const mixins = extractMixins(node);

    // Find class body
    const classBody = findChildByType(node, 'class_body');
    const properties = classBody ? extractProperties(classBody) : [];
    const methods = classBody ? extractMethods(classBody, className) : [];

    return {
        id,
        name: className,
        fileId,
        isAbstract: false, // This function is only called for non-abstract classes
        isExported: true, // All Dart public classes are exported
        properties,
        methods,
        typeParameters,
        extendsClass,
        // Combine implements and mixins as interfaces
        implementsInterfaces: [...implementsInterfaces, ...mixins],
    };
}

/**
 * Extracts abstract class information as InterfaceDefinition.
 *
 * @param node - Tree-sitter node of type 'class_definition' with abstract modifier
 * @param fileName - Source file name
 * @param fileId - File identifier for entity references
 * @returns InterfaceDefinition
 */
export function extractAbstractClassAsInterface(
    node: TreeSitterNode,
    fileName: string,
    fileId: string
): InterfaceDefinition {
    const className = extractClassName(node);
    const id = `${fileName}::${className}`;

    const typeParameters = extractTypeParameters(node);
    const extendsClass = extractExtendsClass(node);
    const implementsInterfaces = extractImplementsInterfaces(node);

    // Find class body
    const classBody = findChildByType(node, 'class_body');
    const properties = classBody ? extractPropertiesAsSignatures(classBody) : [];
    const methods = classBody ? extractMethodsAsSignatures(classBody) : [];

    // Combine extends and implements as parent interfaces
    const extendsInterfaces = extendsClass
        ? [extendsClass, ...implementsInterfaces]
        : implementsInterfaces;

    return {
        id,
        name: className,
        fileId,
        isExported: true,
        properties,
        methods,
        typeParameters,
        extendsInterfaces,
    };
}

/**
 * Extracts the class name from a class_definition node.
 */
function extractClassName(node: TreeSitterNode): string {
    const nameNode = findChildByType(node, 'identifier');
    return nameNode?.text || 'UnnamedClass';
}

/**
 * Extracts type parameters from a class definition.
 * Example: class Generic<T, K extends Object> -> ['T', 'K extends Object']
 */
function extractTypeParameters(node: TreeSitterNode): string[] {
    const typeParams: string[] = [];
    const typeParamsNode = findChildByType(node, 'type_parameters');

    if (typeParamsNode) {
        for (let i = 0; i < typeParamsNode.childCount; i++) {
            const child = typeParamsNode.child(i);
            if (child?.type === 'type_parameter') {
                typeParams.push(child.text);
            }
        }
    }

    return typeParams;
}

/**
 * Extracts the extended class name from a class definition.
 * Example: class Child extends Parent -> 'Parent'
 */
function extractExtendsClass(node: TreeSitterNode): string | null {
    const superclass = findChildByType(node, 'superclass');
    if (superclass) {
        // The type_identifier is the actual class name
        const typeId = findChildByType(superclass, 'type_identifier');
        return typeId?.text || null;
    }
    return null;
}

/**
 * Extracts implemented interfaces from a class definition.
 * Example: class Impl implements IService, IRepository -> ['IService', 'IRepository']
 */
function extractImplementsInterfaces(node: TreeSitterNode): string[] {
    const interfaces: string[] = [];
    const interfacesNode = findChildByType(node, 'interfaces');

    if (interfacesNode) {
        for (let i = 0; i < interfacesNode.childCount; i++) {
            const child = interfacesNode.child(i);
            if (child?.type === 'type_identifier') {
                interfaces.push(child.text);
            }
        }
    }

    return interfaces;
}

/**
 * Extracts mixin classes from a 'with' clause.
 * Example: class Mixed with Mixin1, Mixin2 -> ['Mixin1', 'Mixin2']
 */
function extractMixins(node: TreeSitterNode): string[] {
    const mixins: string[] = [];
    const mixinsNode = findChildByType(node, 'mixins');

    if (mixinsNode) {
        for (let i = 0; i < mixinsNode.childCount; i++) {
            const child = mixinsNode.child(i);
            if (child?.type === 'type_identifier') {
                mixins.push(child.text);
            }
        }
    }

    return mixins;
}

/**
 * Converts properties to PropertySignature for interfaces.
 */
function extractPropertiesAsSignatures(classBody: TreeSitterNode): PropertySignature[] {
    const properties = extractProperties(classBody);
    return properties.map((prop: { name: string; type: string; isReadonly: boolean }) => ({
        name: prop.name,
        type: prop.type,
        isOptional: false,
        isReadonly: prop.isReadonly,
    }));
}

/**
 * Converts methods to MethodSignature for interfaces.
 */
function extractMethodsAsSignatures(classBody: TreeSitterNode): MethodSignature[] {
    const methods = extractMethods(classBody, '');
    return methods.map((method: { name: string; returnType: string; parameters: Parameter[] }) => ({
        name: method.name,
        returnType: method.returnType,
        parameters: method.parameters,
    }));
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
