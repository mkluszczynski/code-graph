/**
 * UMLFormatter - Formats class/interface members for UML display
 * Implementation for T062
 */

import type {
    Property,
    Method,
    PropertySignature,
    MethodSignature,
    Parameter,
} from '../shared/types';

/**
 * Formats a property for UML display.
 *
 * @param property - Property or PropertySignature to format
 * @param isInterface - Whether this is an interface property
 * @returns UML-formatted property string
 */
export function formatProperty(
    property: Property | PropertySignature,
    isInterface: boolean
): string {
    let formatted = '';

    // Add visibility symbol for class properties
    if (!isInterface && 'visibility' in property) {
        const visibilitySymbol = getVisibilitySymbol(property.visibility);
        formatted += visibilitySymbol + ' ';
    }

    // Add property name and type
    formatted += `${property.name}: ${property.type}`;

    // Add modifiers
    const modifiers: string[] = [];

    if ('isReadonly' in property && property.isReadonly) {
        modifiers.push('readOnly');
    }

    if (!isInterface && 'isStatic' in property && property.isStatic) {
        modifiers.push('static');
    }

    if (modifiers.length > 0) {
        formatted += ` {${modifiers.join(', ')}}`;
    }

    return formatted;
}

/**
 * Formats a method for UML display.
 *
 * @param method - Method or MethodSignature to format
 * @param isInterface - Whether this is an interface method
 * @returns UML-formatted method string
 */
export function formatMethod(
    method: Method | MethodSignature,
    isInterface: boolean
): string {
    let formatted = '';

    // Add visibility symbol for class methods
    if (!isInterface && 'visibility' in method) {
        const visibilitySymbol = getVisibilitySymbol(method.visibility);
        formatted += visibilitySymbol + ' ';
    }

    // Add method name
    formatted += method.name;

    // Add parameters
    formatted += '(';
    const formattedParams = method.parameters.map(formatParameter);
    formatted += formattedParams.join(', ');
    formatted += ')';

    // Add return type
    formatted += `: ${method.returnType}`;

    // Add modifiers
    const modifiers: string[] = [];

    if (!isInterface && 'isStatic' in method && method.isStatic) {
        modifiers.push('static');
    }

    if (!isInterface && 'isAbstract' in method && method.isAbstract) {
        modifiers.push('abstract');
    }

    if (modifiers.length > 0) {
        formatted += ` {${modifiers.join(', ')}}`;
    }

    return formatted;
}

/**
 * Formats a parameter for display in a method signature.
 *
 * @param parameter - Parameter to format
 * @returns Formatted parameter string
 */
function formatParameter(parameter: Parameter): string {
    let formatted = parameter.name;

    if (parameter.isOptional) {
        formatted += '?';
    }

    formatted += `: ${parameter.type}`;

    return formatted;
}

/**
 * Gets the UML visibility symbol for a visibility modifier.
 *
 * @param visibility - Visibility modifier
 * @returns UML symbol (+ for public, - for private, # for protected)
 */
function getVisibilitySymbol(visibility: 'public' | 'private' | 'protected'): string {
    switch (visibility) {
        case 'public':
            return '+';
        case 'private':
            return '-';
        case 'protected':
            return '#';
    }
}
