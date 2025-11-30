/**
 * MethodExtractor - Extracts class methods from TypeScript AST
 */

import ts from 'typescript';
import type { Method, Parameter, Visibility } from '../../shared/types';

/**
 * Extracts all methods from a class declaration.
 *
 * @param node - TypeScript AST class declaration node
 * @returns Array of Method objects
 */
export function extractMethods(node: ts.ClassDeclaration): Method[] {
    const methods: Method[] = [];

    for (const member of node.members) {
        if (ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member)) {
            const method = extractMethod(member);
            if (method) {
                methods.push(method);
            }
        }
    }

    return methods;
}

/**
 * Extracts a single method from a method or constructor declaration node.
 *
 * @param node - TypeScript AST method or constructor declaration node
 * @returns Method object or null if extraction fails
 */
function extractMethod(
    node: ts.MethodDeclaration | ts.ConstructorDeclaration
): Method | null {
    // Extract method name
    let name: string;
    if (ts.isConstructorDeclaration(node)) {
        name = 'constructor';
    } else {
        if (!node.name || !ts.isIdentifier(node.name)) {
            return null;
        }
        name = node.name.text;
    }

    // Extract return type (constructor always returns void)
    let returnType: string;
    if (ts.isConstructorDeclaration(node)) {
        returnType = 'void';
    } else {
        returnType = node.type ? node.type.getText() : 'void';
    }

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

    // Check if abstract (only for methods, not constructors)
    const isAbstract = ts.isMethodDeclaration(node)
        ? node.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.AbstractKeyword
        ) ?? false
        : false;

    // Check if async
    const isAsync = node.modifiers?.some(
        (mod) => mod.kind === ts.SyntaxKind.AsyncKeyword
    ) ?? false;

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
