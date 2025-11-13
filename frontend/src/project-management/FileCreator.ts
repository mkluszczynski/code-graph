/**
 * File Template Generator
 *
 * Generates TypeScript source code templates for classes and interfaces
 */

/**
 * Generates a TypeScript class template
 *
 * @param className - Name of the class
 * @returns TypeScript source code with empty exported class
 */
export function createClassTemplate(className: string): string {
  return `export class ${className} {\n  \n}\n`;
}

/**
 * Generates a TypeScript interface template
 *
 * @param interfaceName - Name of the interface
 * @returns TypeScript source code with empty exported interface
 */
export function createInterfaceTemplate(interfaceName: string): string {
  return `export interface ${interfaceName} {\n  \n}\n`;
}
