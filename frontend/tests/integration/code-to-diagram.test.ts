/**
 * Integration Test: Code to Diagram Workflow
 *
 * Tests the complete pipeline: edit code → parse → update diagram
 * Task: T069 [US4]
 */

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { generateDiagram } from "../../src/diagram-visualization/DiagramGenerator";
import { ProjectManager } from "../../src/project-management/ProjectManager";
import { useStore } from "../../src/shared/store";
import { parse } from "../../src/parsers/typescript/TypeScriptParser";
import type {
    ClassDefinition,
    InterfaceDefinition,
} from "../../src/shared/types";

describe("Code to Diagram Integration Test (T069)", () => {
    let projectManager: ProjectManager;
    let testDbName: string;

    beforeEach(async () => {
        // Reset store
        useStore.setState({
            files: [],
            activeFileId: null,
            editorContent: "",
            isDirty: false,
            nodes: [],
            edges: [],
            isParsing: false,
            parseErrors: new Map(),
            parsedEntities: new Map(),
        });

        // Create isolated database for each test
        testDbName = `test-db-${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}`;
        projectManager = new ProjectManager(testDbName);
        await projectManager.initialize();
    });

    it("should parse simple class and generate diagram node", async () => {
        // Create a class file
        const file = await projectManager.createFile("Person", "class");
        useStore.getState().addFile(file);
        useStore.getState().setActiveFile(file.id);

        // Simulate user editing code
        const newContent = `
export class Person {
  name: string;
  age: number;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
  
  getName(): string {
    return this.name;
  }
}
    `.trim();

        // Update editor content (simulating typing)
        useStore.getState().setEditorContent(newContent);

        // Parse the code
        const parseResult = parse(newContent, file.name);

        // Verify parsing succeeded
        expect(parseResult.errors).toHaveLength(0);
        expect(parseResult.classes).toHaveLength(1);
        expect(parseResult.classes[0].name).toBe("Person");
        expect(parseResult.classes[0].properties).toHaveLength(2);
        // Parser extracts both constructor and getName method
        expect(parseResult.classes[0].methods.length).toBeGreaterThanOrEqual(1);
        expect(
            parseResult.classes[0].methods.find((m) => m.name === "getName")
        ).toBeDefined();

        // Store parsed entities
        const entities = [...parseResult.classes, ...parseResult.interfaces];
        useStore.getState().setParsedEntities(file.id, entities);

        // Generate diagram
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Verify diagram was generated
        expect(diagram.nodes).toHaveLength(1);
        expect(diagram.nodes[0].data.name).toBe("Person");
        expect(diagram.nodes[0].data.properties).toHaveLength(2);
        // Diagram includes both constructor and regular methods
        expect(diagram.nodes[0].data.methods.length).toBeGreaterThanOrEqual(1);

        // Update diagram in store
        useStore.getState().updateDiagram(diagram.nodes, diagram.edges);

        // Verify store has diagram data
        expect(useStore.getState().nodes).toHaveLength(1);
        expect(useStore.getState().nodes[0].data.name).toBe("Person");
    });

    it("should parse interface and generate diagram node", async () => {
        // Create an interface file
        const file = await projectManager.createFile("IUser", "interface");
        useStore.getState().addFile(file);
        useStore.getState().setActiveFile(file.id);

        // Simulate user editing code
        const newContent = `
export interface IUser {
  id: string;
  email: string;
  isActive: boolean;
  
  login(): void;
  logout(): void;
}
    `.trim();

        useStore.getState().setEditorContent(newContent);

        // Parse the code
        const parseResult = parse(newContent, file.name);

        // Verify parsing
        expect(parseResult.errors).toHaveLength(0);
        expect(parseResult.interfaces).toHaveLength(1);
        expect(parseResult.interfaces[0].name).toBe("IUser");

        // Store and generate diagram
        const entities = [...parseResult.classes, ...parseResult.interfaces];
        useStore.getState().setParsedEntities(file.id, entities);

        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Verify diagram
        expect(diagram.nodes).toHaveLength(1);
        expect(diagram.nodes[0].type).toBe("interface");
        expect(diagram.nodes[0].data.name).toBe("IUser");
    });

    it("should update diagram when code is edited", async () => {
        // Create a class file
        const file = await projectManager.createFile("Product", "class");
        useStore.getState().addFile(file);
        useStore.getState().setActiveFile(file.id);

        // Initial code
        const initialContent = `
export class Product {
  name: string;
}
    `.trim();

        useStore.getState().setEditorContent(initialContent);

        // Parse and generate initial diagram
        let parseResult = parse(initialContent, file.name);
        let entities = [...parseResult.classes, ...parseResult.interfaces];
        useStore.getState().setParsedEntities(file.id, entities);

        let diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );
        useStore.getState().updateDiagram(diagram.nodes, diagram.edges);

        // Verify initial state
        expect(useStore.getState().nodes).toHaveLength(1);
        expect(useStore.getState().nodes[0].data.properties).toHaveLength(1);

        // Simulate user adding a property
        const updatedContent = `
export class Product {
  name: string;
  price: number;
  description: string;
}
    `.trim();

        useStore.getState().setEditorContent(updatedContent);

        // Re-parse and regenerate diagram
        parseResult = parse(updatedContent, file.name);
        entities = [...parseResult.classes, ...parseResult.interfaces];
        useStore.getState().setParsedEntities(file.id, entities);

        diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );
        useStore.getState().updateDiagram(diagram.nodes, diagram.edges);

        // Verify diagram was updated
        expect(useStore.getState().nodes).toHaveLength(1);
        expect(useStore.getState().nodes[0].data.properties).toHaveLength(3);
        expect(useStore.getState().nodes[0].data.properties[0]).toContain("name");
        expect(useStore.getState().nodes[0].data.properties[1]).toContain("price");
        expect(useStore.getState().nodes[0].data.properties[2]).toContain(
            "description"
        );
    });

    it("should handle parse errors gracefully", async () => {
        // Create a file
        const file = await projectManager.createFile("Invalid", "class");
        useStore.getState().addFile(file);
        useStore.getState().setActiveFile(file.id);

        // Invalid TypeScript code
        const invalidContent = `
export class Invalid {
  // Missing semicolons, invalid syntax
  name string
  getValue( number
}
    `.trim();

        useStore.getState().setEditorContent(invalidContent);

        // Parse the code (should return errors)
        const parseResult = parse(invalidContent, file.name);

        // Verify errors were captured
        expect(parseResult.errors.length).toBeGreaterThan(0);
        expect(parseResult.errors[0]).toHaveProperty("message");
        expect(parseResult.errors[0]).toHaveProperty("line");

        // Store errors
        useStore.getState().setParseErrors(file.id, parseResult.errors);

        // Verify errors in store
        expect(useStore.getState().parseErrors.get(file.id)).toBeDefined();
        expect(useStore.getState().parseErrors.get(file.id)!.length).toBeGreaterThan(
            0
        );
    });

    it("should handle multiple files in diagram", async () => {
        // Create two files
        const classFile = await projectManager.createFile("Employee", "class");
        const interfaceFile = await projectManager.createFile(
            "IEmployee",
            "interface"
        );

        useStore.getState().addFile(classFile);
        useStore.getState().addFile(interfaceFile);

        // Parse class
        const classContent = `
export class Employee {
  id: string;
  name: string;
}
    `.trim();

        const classParseResult = parse(classContent, classFile.name);
        useStore
            .getState()
            .setParsedEntities(classFile.id, [
                ...classParseResult.classes,
                ...classParseResult.interfaces,
            ]);

        // Parse interface
        const interfaceContent = `
export interface IEmployee {
  id: string;
  getName(): string;
}
    `.trim();

        const interfaceParseResult = parse(interfaceContent, interfaceFile.name);
        useStore
            .getState()
            .setParsedEntities(interfaceFile.id, [
                ...interfaceParseResult.classes,
                ...interfaceParseResult.interfaces,
            ]);

        // Collect all entities
        const allEntities: (ClassDefinition | InterfaceDefinition)[] = [];
        useStore.getState().parsedEntities.forEach((entities) => {
            allEntities.push(...entities);
        });

        const classes = allEntities.filter(
            (e): e is ClassDefinition =>
                "extendsClass" in e && "implementsInterfaces" in e
        );
        const interfaces = allEntities.filter(
            (e): e is InterfaceDefinition => "extendsInterfaces" in e
        );

        // Generate combined diagram
        const diagram = generateDiagram(classes, interfaces, []);

        useStore.getState().updateDiagram(diagram.nodes, diagram.edges);

        // Verify both entities are in diagram
        expect(useStore.getState().nodes).toHaveLength(2);
        expect(
            useStore.getState().nodes.find((n) => n.data.name === "Employee")
        ).toBeDefined();
        expect(
            useStore.getState().nodes.find((n) => n.data.name === "IEmployee")
        ).toBeDefined();
    });

    it("should persist updated file content to IndexedDB", async () => {
        // Create a file
        const file = await projectManager.createFile("Account", "class");
        useStore.getState().addFile(file);

        // Update content
        const newContent = `
export class Account {
  balance: number;
  
  deposit(amount: number): void {
    this.balance += amount;
  }
}
    `.trim();

        // Update file in store and persist to IndexedDB
        await projectManager.updateFile(file.id, {
            content: newContent,
        });

        // Reload file from IndexedDB
        const reloadedFile = await projectManager.getFile(file.id);

        // Verify content was persisted
        expect(reloadedFile).toBeDefined();
        expect(reloadedFile!.content).toBe(newContent);
        expect(reloadedFile!.content).toContain("deposit");
    });

    it("should handle rapid content changes with debouncing simulation", async () => {
        // Create a file
        const file = await projectManager.createFile("Counter", "class");
        useStore.getState().addFile(file);
        useStore.getState().setActiveFile(file.id);

        // Simulate rapid typing (multiple quick edits)
        const changes = [
            "export class Counter {",
            "export class Counter {\n  count: number;",
            "export class Counter {\n  count: number;\n  increment(): void {",
            "export class Counter {\n  count: number;\n  increment(): void {\n    this.count++;\n  }",
            "export class Counter {\n  count: number;\n  increment(): void {\n    this.count++;\n  }\n}",
        ];

        // In real app, only the last change would be parsed after debounce
        const finalContent = changes[changes.length - 1];

        useStore.getState().setEditorContent(finalContent);

        // Parse final content
        const parseResult = parse(finalContent, file.name);

        // Verify final state
        expect(parseResult.errors).toHaveLength(0);
        expect(parseResult.classes).toHaveLength(1);
        expect(parseResult.classes[0].properties).toHaveLength(1);
        expect(
            parseResult.classes[0].methods.find((m) => m.name === "increment")
        ).toBeDefined();

        // Generate diagram from final state
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        useStore.getState().updateDiagram(diagram.nodes, diagram.edges);

        // Verify diagram reflects final state
        expect(useStore.getState().nodes).toHaveLength(1);
        expect(
            useStore
                .getState()
                .nodes[0].data.methods.find((m) => m.includes("increment"))
        ).toBeDefined();
    });
});
