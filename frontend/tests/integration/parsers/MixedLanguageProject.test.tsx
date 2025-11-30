/**
 * Integration Tests: Mixed TypeScript/Dart Project
 * 
 * Tests the ParserRegistry's ability to handle projects containing
 * both TypeScript and Dart files, ensuring correct parser routing
 * and diagram generation.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { parserRegistry } from '../../../src/parsers';
import { generateDiagram } from '../../../src/diagram-visualization/DiagramGenerator';
import type { ParseResult } from '../../../src/shared/types';

describe('Mixed TypeScript/Dart Project Integration Tests', () => {
    beforeAll(async () => {
        // Initialize all parsers that require it
        for (const parser of parserRegistry.getAllParsers()) {
            if (parser.requiresInitialization) {
                await parser.initialize();
            }
        }
    });

    describe('Parser routing', () => {
        it('should route .ts files to TypeScript parser', async () => {
            const tsCode = `
class Person {
    name: string;
    age: number;
}
            `;
            const result = await parserRegistry.parse(tsCode, 'Person.ts', 'ts-file');

            expect(result).not.toBeNull();
            expect(result!.success).toBe(true);
            expect(result!.classes).toHaveLength(1);
            expect(result!.classes[0].name).toBe('Person');
        });

        it('should route .dart files to Dart parser', async () => {
            const dartCode = `
class Person {
    String name;
    int age;
}
            `;
            const result = await parserRegistry.parse(dartCode, 'Person.dart', 'dart-file');

            expect(result).not.toBeNull();
            expect(result!.success).toBe(true);
            expect(result!.classes).toHaveLength(1);
            expect(result!.classes[0].name).toBe('Person');
        });

        it('should return null for unsupported file types', async () => {
            const pyCode = `
class Person:
    def __init__(self, name):
        self.name = name
            `;
            const result = await parserRegistry.parse(pyCode, 'Person.py', 'py-file');

            expect(result).toBeNull();
        });
    });

    describe('Mixed project diagram generation', () => {
        it('should generate diagrams for both TypeScript and Dart files', async () => {
            const tsCode = `
export class TypeScriptClass {
    id: string;
    name: string;
}
            `;
            const dartCode = `
class DartClass {
    String id;
    String name;
}
            `;

            const tsResult = await parserRegistry.parse(tsCode, 'TsClass.ts', 'ts-file');
            const dartResult = await parserRegistry.parse(dartCode, 'DartClass.dart', 'dart-file');

            expect(tsResult).not.toBeNull();
            expect(dartResult).not.toBeNull();

            // Generate diagrams separately
            const tsDiagram = generateDiagram(
                tsResult!.classes,
                tsResult!.interfaces,
                tsResult!.relationships
            );
            const dartDiagram = generateDiagram(
                dartResult!.classes,
                dartResult!.interfaces,
                dartResult!.relationships
            );

            expect(tsDiagram.nodes).toHaveLength(1);
            expect(dartDiagram.nodes).toHaveLength(1);
        });
    });

    describe('canParse checks', () => {
        it('should return true for .ts files', () => {
            expect(parserRegistry.canParse('Component.ts')).toBe(true);
        });

        it('should return true for .tsx files', () => {
            expect(parserRegistry.canParse('Component.tsx')).toBe(true);
        });

        it('should return true for .dart files', () => {
            expect(parserRegistry.canParse('Widget.dart')).toBe(true);
        });

        it('should return false for .py files', () => {
            expect(parserRegistry.canParse('script.py')).toBe(false);
        });

        it('should return false for .js files', () => {
            expect(parserRegistry.canParse('script.js')).toBe(false);
        });

        it('should be case insensitive for extensions', () => {
            expect(parserRegistry.canParse('File.TS')).toBe(true);
            expect(parserRegistry.canParse('File.DART')).toBe(true);
        });
    });

    describe('getSupportedExtensions', () => {
        it('should return all supported extensions', () => {
            const extensions = parserRegistry.getSupportedExtensions();

            expect(extensions).toContain('ts');
            expect(extensions).toContain('tsx');
            expect(extensions).toContain('dart');
        });
    });

    describe('getParser methods', () => {
        it('should return TypeScript parser for typescript language', () => {
            const parser = parserRegistry.getParser('typescript');
            expect(parser).toBeDefined();
            expect(parser?.language).toBe('typescript');
        });

        it('should return Dart parser for dart language', () => {
            const parser = parserRegistry.getParser('dart');
            expect(parser).toBeDefined();
            expect(parser?.language).toBe('dart');
        });

        it('should return undefined for unsupported language', () => {
            const parser = parserRegistry.getParser('unsupported');
            expect(parser).toBeUndefined();
        });

        it('should return correct parser for file', () => {
            const tsParser = parserRegistry.getParserForFile('Component.ts');
            const dartParser = parserRegistry.getParserForFile('Widget.dart');
            const noParser = parserRegistry.getParserForFile('script.py');

            expect(tsParser?.language).toBe('typescript');
            expect(dartParser?.language).toBe('dart');
            expect(noParser).toBeUndefined();
        });
    });

    describe('Syntax differences between languages', () => {
        it('should handle TypeScript syntax correctly', async () => {
            const code = `
interface IRepository<T> {
    find(id: string): Promise<T>;
}

class UserRepository implements IRepository<User> {
    async find(id: string): Promise<User> {
        return {} as User;
    }
}

class User {
    id: string;
    name: string;
}
            `;
            const result = await parserRegistry.parse(code, 'UserRepo.ts', 'ts-file');

            expect(result).not.toBeNull();
            expect(result!.success).toBe(true);
            expect(result!.classes).toHaveLength(2); // UserRepository, User
            expect(result!.interfaces).toHaveLength(1); // IRepository
        });

        it('should handle Dart syntax correctly', async () => {
            const code = `
abstract class Repository<T> {
    Future<T> find(String id);
}

class UserRepository implements Repository<User> {
    @override
    Future<User> find(String id) async {
        return User();
    }
}

class User {
    String id;
    String name;
}
            `;
            const result = await parserRegistry.parse(code, 'UserRepo.dart', 'dart-file');

            expect(result).not.toBeNull();
            expect(result!.success).toBe(true);
            expect(result!.classes).toHaveLength(2); // UserRepository, User
            expect(result!.interfaces).toHaveLength(1); // Repository (abstract)
        });
    });
});
