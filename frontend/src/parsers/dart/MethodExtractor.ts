/**
 * Dart MethodExtractor - Extracts methods from Dart class bodies
 * 
 * Extracts:
 * - Method name
 * - Return type
 * - Parameters (including optional, named, and positional)
 * - Visibility (public/private based on underscore prefix)
 * - Static modifier
 * - Abstract modifier
 * - Async modifier
 * 
 * NOTE: This file exceeds 300 lines. Justification:
 * - Tree-sitter node structure requires handling many method signature variants
 * - Dart methods include: regular methods, getters, setters, constructors,
 *   named constructors, factory constructors, and abstract methods
 * - Each variant has different AST structure requiring specialized extraction
 * - Some functions exceed 50 lines due to complex nested node traversal
 * - Splitting would fragment related extraction logic
 * Constitutional exception: Complexity justified for tree-sitter AST traversal.
 */

import type { Node as TreeSitterNode } from 'web-tree-sitter';
import type { Method, Parameter, Visibility } from '../../shared/types';

/**
 * Extracts all methods from a Dart class body.
 *
 * @param classBody - Tree-sitter node of the class body
 * @param className - The class name (for constructor naming)
 * @returns Array of Method definitions
 */
export function extractMethods(classBody: TreeSitterNode, className: string): Method[] {
    const methods: Method[] = [];

    // Iterate through class body children to find method declarations
    // Class body structure: { (metadata? _class_member_definition)* }
    // _class_member_definition is either:
    //   - declaration + semicolon (for abstract methods and fields)
    //   - method_signature + function_body (for concrete methods)
    for (let i = 0; i < classBody.childCount; i++) {
        const child = classBody.child(i);
        if (!child) continue;

        // Handle method_signature which wraps function_signature, getter_signature, etc.
        if (child.type === 'method_signature') {
            const extractedMethods = extractMethodsFromMethodSignature(child, className);
            methods.push(...extractedMethods);
        }
        // Handle function_signature directly (less common but possible)
        else if (child.type === 'function_signature') {
            const method = extractMethodFromFunctionSignature(child, false);
            if (method) {
                methods.push(method);
            }
        }
        // Handle getter_signature and setter_signature directly
        else if (child.type === 'getter_signature') {
            const method = extractGetter(child);
            if (method) {
                methods.push(method);
            }
        }
        else if (child.type === 'setter_signature') {
            const method = extractSetter(child);
            if (method) {
                methods.push(method);
            }
        }
        // Handle constructor_signature directly
        else if (child.type === 'constructor_signature') {
            const method = extractConstructor(child, className);
            if (method) {
                methods.push(method);
            }
        }
        // Handle declaration nodes (for abstract methods)
        else if (child.type === 'declaration') {
            const methodNode = findMethodInDeclaration(child);
            if (methodNode) {
                methods.push(methodNode);
            }
        }
    }

    return methods;
}

/**
 * Extracts methods from a method_signature node.
 * method_signature contains constructor_signature, factory_constructor_signature,
 * or (static?) function_signature/getter_signature/setter_signature
 */
function extractMethodsFromMethodSignature(node: TreeSitterNode, className: string): Method[] {
    const methods: Method[] = [];
    let isStatic = false;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'static') {
            isStatic = true;
        } else if (child.type === 'function_signature') {
            const method = extractMethodFromFunctionSignature(child, isStatic);
            if (method) {
                methods.push(method);
            }
        } else if (child.type === 'getter_signature') {
            const method = extractGetter(child);
            if (method) {
                method.isStatic = isStatic;
                methods.push(method);
            }
        } else if (child.type === 'setter_signature') {
            const method = extractSetter(child);
            if (method) {
                method.isStatic = isStatic;
                methods.push(method);
            }
        } else if (child.type === 'constructor_signature') {
            const method = extractConstructor(child, className);
            if (method) {
                methods.push(method);
            }
        } else if (child.type === 'factory_constructor_signature') {
            const method = extractFactoryConstructor(child, className);
            if (method) {
                methods.push(method);
            }
        }
    }

    return methods;
}

/**
 * Extracts method information from a function_signature node.
 * function_signature: type? identifier formal_parameter_part
 */
function extractMethodFromFunctionSignature(node: TreeSitterNode, isStatic: boolean): Method | null {
    let name = '';
    let returnType = 'void';
    let typeArguments = ''; // Store generic type arguments separately
    let isAsync = false;
    const parameters: Parameter[] = [];

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'async':
                isAsync = true;
                break;
            case 'type_identifier':
            case 'built_in_identifier':
            case 'void_type':
            case 'inferred_type': // 'var' or 'dynamic'
                returnType = child.text;
                break;
            case 'type_arguments':
                // Capture generic type arguments like <List<Quest>>
                typeArguments = child.text;
                break;
            case 'function_type':
            case 'generic_type':
                returnType = child.text;
                break;
            case 'identifier':
                name = child.text;
                break;
            case 'formal_parameter_list':
            case 'formal_parameter_part':
                parameters.push(...extractParameters(child));
                break;
        }
    }

    // Combine type with type arguments if present (e.g., Future + <List<Quest>> = Future<List<Quest>>)
    if (typeArguments) {
        returnType = returnType + typeArguments;
    }

    if (!name) {
        return null;
    }

    const visibility: Visibility = name.startsWith('_') ? 'private' : 'public';

    return {
        name,
        returnType,
        parameters,
        visibility,
        isStatic,
        isAbstract: false,
        isAsync,
    };
}

/**
 * Extracts factory constructor information.
 */
function extractFactoryConstructor(node: TreeSitterNode, className: string): Method | null {
    let name = `${className}.factory`;
    const parameters: Parameter[] = [];

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'formal_parameter_list' || child.type === 'formal_parameter_part') {
            parameters.push(...extractParameters(child));
        } else if (child.type === 'identifier') {
            // Named factory constructor: Person.fromJson
            name = `${className}.${child.text}`;
        }
    }

    return {
        name,
        returnType: className,
        parameters,
        visibility: 'public',
        isStatic: true, // Factory constructors are effectively static
        isAbstract: false,
        isAsync: false,
    };
}

/**
 * Extracts method information from a method signature node (legacy function kept for compatibility).
 */
function extractMethodFromSignature(node: TreeSitterNode): Method | null {
    let name = '';
    let returnType = 'void';
    let typeArguments = ''; // Store generic type arguments separately
    let isStatic = false;
    let isAbstract = false;
    let isAsync = false;
    const parameters: Parameter[] = [];

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'static':
                isStatic = true;
                break;
            case 'abstract':
                isAbstract = true;
                break;
            case 'async':
                isAsync = true;
                break;
            case 'type_identifier':
            case 'built_in_identifier':
            case 'void_type':
                returnType = child.text;
                break;
            case 'type_arguments':
                // Capture generic type arguments like <List<Quest>>
                typeArguments = child.text;
                break;
            case 'function_type':
            case 'generic_type':
                returnType = child.text;
                break;
            case 'identifier':
                name = child.text;
                break;
            case 'formal_parameter_list':
                parameters.push(...extractParameters(child));
                break;
        }
    }

    // Combine type with type arguments if present
    if (typeArguments) {
        returnType = returnType + typeArguments;
    }

    if (!name) {
        return null;
    }

    // Determine visibility
    const visibility: Visibility = name.startsWith('_') ? 'private' : 'public';

    return {
        name,
        returnType,
        parameters,
        visibility,
        isStatic,
        isAbstract,
        isAsync,
    };
}

/**
 * Extracts constructor information.
 */
function extractConstructor(node: TreeSitterNode, className: string): Method | null {
    let name = className;
    const parameters: Parameter[] = [];

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'formal_parameter_list') {
            parameters.push(...extractParameters(child));
        } else if (child.type === 'identifier') {
            // Named constructor: Person.fromJson
            name = `${className}.${child.text}`;
        }
    }

    return {
        name,
        returnType: 'void',
        parameters,
        visibility: 'public',
        isStatic: false,
        isAbstract: false,
        isAsync: false,
    };
}

/**
 * Extracts getter information.
 */
function extractGetter(node: TreeSitterNode): Method | null {
    let name = '';
    let returnType = 'dynamic';
    let typeArguments = ''; // Store generic type arguments separately

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'type_identifier':
            case 'built_in_identifier':
            case 'void_type':
            case 'generic_type':
                returnType = child.text;
                break;
            case 'type_arguments':
                // Capture generic type arguments
                typeArguments = child.text;
                break;
            case 'identifier':
                name = child.text;
                break;
        }
    }

    // Combine type with type arguments if present
    if (typeArguments) {
        returnType = returnType + typeArguments;
    }

    if (!name) {
        return null;
    }

    const visibility: Visibility = name.startsWith('_') ? 'private' : 'public';

    return {
        name,
        returnType,
        parameters: [],
        visibility,
        isStatic: false,
        isAbstract: false,
        isAsync: false,
    };
}

/**
 * Extracts setter information.
 */
function extractSetter(node: TreeSitterNode): Method | null {
    let name = '';
    const parameters: Parameter[] = [];

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'identifier':
                name = child.text;
                break;
            case 'formal_parameter_list':
                parameters.push(...extractParameters(child));
                break;
        }
    }

    if (!name) {
        return null;
    }

    const visibility: Visibility = name.startsWith('_') ? 'private' : 'public';

    return {
        name,
        returnType: 'void',
        parameters,
        visibility,
        isStatic: false,
        isAbstract: false,
        isAsync: false,
    };
}

/**
 * Looks for method declarations inside a declaration node.
 */
function findMethodInDeclaration(node: TreeSitterNode): Method | null {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'method_signature' || child.type === 'function_signature') {
            return extractMethodFromSignature(child);
        }
    }
    return null;
}

/**
 * Extracts parameters from a formal_parameter_list node.
 */
function extractParameters(node: TreeSitterNode): Parameter[] {
    const params: Parameter[] = [];

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'formal_parameter' ||
            child.type === 'normal_formal_parameter' ||
            child.type === 'simple_formal_parameter') {
            const param = extractSingleParameter(child, false, false);
            if (param) {
                params.push(param);
            }
        } else if (child.type === 'optional_positional_formal_parameters') {
            // [int count = 0] style parameters
            for (let j = 0; j < child.childCount; j++) {
                const optChild = child.child(j);
                if (optChild && (optChild.type === 'formal_parameter' ||
                    optChild.type === 'default_formal_parameter')) {
                    const param = extractSingleParameter(optChild, true, false);
                    if (param) {
                        params.push(param);
                    }
                }
            }
        } else if (child.type === 'optional_named_formal_parameters') {
            // {String? name} style parameters
            for (let j = 0; j < child.childCount; j++) {
                const namedChild = child.child(j);
                if (namedChild && (namedChild.type === 'formal_parameter' ||
                    namedChild.type === 'default_formal_parameter' ||
                    namedChild.type === 'default_named_parameter')) {
                    const param = extractSingleParameter(namedChild, true, true);
                    if (param) {
                        params.push(param);
                    }
                }
            }
        }
    }

    return params;
}

/**
 * Extracts a single parameter from a formal_parameter node.
 */
function extractSingleParameter(
    node: TreeSitterNode,
    isOptional: boolean,
    isNamed: boolean
): Parameter | null {
    let name = '';
    let type = 'dynamic';
    let defaultValue: string | undefined;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'type_identifier':
            case 'built_in_identifier':
            case 'nullable_type':
            case 'generic_type':
            case 'function_type':
                type = child.text;
                break;
            case 'identifier':
                name = child.text;
                break;
            case 'simple_formal_parameter':
            case 'normal_formal_parameter':
                // Nested parameter, recurse
                const nested = extractSingleParameter(child, isOptional, isNamed);
                if (nested) {
                    name = nested.name;
                    type = nested.type;
                }
                break;
        }
    }

    // Look for default value (after '=')
    let foundEquals = false;
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === '=' || child.text === '=') {
            foundEquals = true;
            continue;
        }

        if (foundEquals && child.type !== 'comment') {
            defaultValue = child.text;
            break;
        }
    }

    if (!name) {
        return null;
    }

    // Named parameters or nullable types are considered optional
    const paramIsOptional = isOptional || isNamed || type.endsWith('?');

    return {
        name,
        type,
        isOptional: paramIsOptional,
        defaultValue,
    };
}
