/**
 * Integration Test: Edit and Re-visualize (User Story 6)
 * Task T093: Test incremental edits → progressive diagram updates
 * 
 * This test validates that users can modify TypeScript code and see
 * the UML diagram update correctly to reflect changes like renamed classes,
 * added/removed methods, changed access modifiers, or modified relationships.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/shared/store';
import { parse } from '../../src/parsers/typescript/TypeScriptParser';
import { generateDiagram } from '../../src/diagram-visualization/DiagramGenerator';

describe('Integration: Edit and Re-visualize (US6/T093)', () => {
  beforeEach(() => {
    // Reset store
    useStore.setState({
      files: [],
      activeFileId: null,
      editorContent: '',
      isDirty: false,
      isParsing: false,
      parseErrors: new Map(),
      parsedEntities: new Map(),
      nodes: [],
      edges: [],
    });
  });

  it('should update diagram when class is renamed', () => {
    // Initial code with class "Person"
    const originalCode = `
export class Person {
  name: string;
  age: number;
}
        `.trim();

    // Parse original code
    const originalResult = parse(originalCode, 'Person.ts');
    expect(originalResult.success).toBe(true);
    expect(originalResult.classes[0].name).toBe('Person');

    // Generate diagram
    let diagram = generateDiagram(originalResult.classes, originalResult.interfaces, originalResult.relationships);
    expect(diagram.nodes).toHaveLength(1);
    expect(diagram.nodes[0].data.name).toBe('Person');

    // Rename class to "Employee"
    const modifiedCode = `
export class Employee {
  name: string;
  age: number;
}
        `.trim();

    // Parse modified code
    const modifiedResult = parse(modifiedCode, 'Person.ts');
    expect(modifiedResult.success).toBe(true);
    expect(modifiedResult.classes[0].name).toBe('Employee');

    // Generate updated diagram
    diagram = generateDiagram(modifiedResult.classes, modifiedResult.interfaces, modifiedResult.relationships);
    expect(diagram.nodes).toHaveLength(1);
    expect(diagram.nodes[0].data.name).toBe('Employee');
  });

  it('should update diagram when property is removed', () => {
    // Initial code with 3 properties
    const originalCode = `
class Person {
  name: string;
  age: number;
  email: string;
}
        `.trim();

    const originalResult = parse(originalCode, 'Person.ts');
    expect(originalResult.classes[0].properties).toHaveLength(3);

    let diagram = generateDiagram(originalResult.classes, originalResult.interfaces, originalResult.relationships);
    expect(diagram.nodes[0].data.properties).toHaveLength(3);

    // Remove email property
    const modifiedCode = `
class Person {
  name: string;
  age: number;
}
        `.trim();

    const modifiedResult = parse(modifiedCode, 'Person.ts');
    expect(modifiedResult.classes[0].properties).toHaveLength(2);

    diagram = generateDiagram(modifiedResult.classes, modifiedResult.interfaces, modifiedResult.relationships);
    expect(diagram.nodes[0].data.properties).toHaveLength(2);
    expect(diagram.nodes[0].data.properties.find((p: string) => p.includes('email'))).toBeUndefined();
  });

  it('should update diagram when method is added', () => {
    // Initial code with no methods
    const originalCode = `
class Calculator {
  value: number = 0;
}
        `.trim();

    const originalResult = parse(originalCode, 'Calculator.ts');
    expect(originalResult.classes[0].methods).toHaveLength(0);

    let diagram = generateDiagram(originalResult.classes, originalResult.interfaces, originalResult.relationships);
    expect(diagram.nodes[0].data.methods).toHaveLength(0);

    // Add methods
    const modifiedCode = `
class Calculator {
  value: number = 0;

  add(x: number): number {
    return this.value + x;
  }

  reset(): void {
    this.value = 0;
  }
}
        `.trim();

    const modifiedResult = parse(modifiedCode, 'Calculator.ts');
    expect(modifiedResult.classes[0].methods).toHaveLength(2);

    diagram = generateDiagram(modifiedResult.classes, modifiedResult.interfaces, modifiedResult.relationships);
    expect(diagram.nodes[0].data.methods).toHaveLength(2);
    // Methods are formatted strings - check they contain the method names
    expect(diagram.nodes[0].data.methods.some((m: string) => m.includes('add'))).toBe(true);
    expect(diagram.nodes[0].data.methods.some((m: string) => m.includes('reset'))).toBe(true);
  });

  it('should update diagram when visibility changes', () => {
    // Initial code with public property
    const originalCode = `
class Account {
  public balance: number;
  
  public deposit(amount: number): void {
    this.balance += amount;
  }
}
        `.trim();

    const originalResult = parse(originalCode, 'Account.ts');
    expect(originalResult.classes[0].properties[0].visibility).toBe('public');
    expect(originalResult.classes[0].methods[0].visibility).toBe('public');

    let diagram = generateDiagram(originalResult.classes, originalResult.interfaces, originalResult.relationships);
    // Properties and methods are formatted as strings - check they contain the property name
    expect(diagram.nodes[0].data.properties).toContain('+ balance: number');
    expect(diagram.nodes[0].data.methods[0]).toContain('+ deposit');

    // Change visibility to private
    const modifiedCode = `
class Account {
  private balance: number;
  
  private deposit(amount: number): void {
    this.balance += amount;
  }
}
        `.trim();

    const modifiedResult = parse(modifiedCode, 'Account.ts');
    expect(modifiedResult.classes[0].properties[0].visibility).toBe('private');
    expect(modifiedResult.classes[0].methods[0].visibility).toBe('private');

    diagram = generateDiagram(modifiedResult.classes, modifiedResult.interfaces, modifiedResult.relationships);
    // Check visibility changed in formatted output (- for private)
    expect(diagram.nodes[0].data.properties).toContain('- balance: number');
    expect(diagram.nodes[0].data.methods[0]).toContain('- deposit');
  });

  it('should update diagram when relationship is added (inheritance)', () => {
    // Initial code with two independent classes
    const originalCode = `
class Animal {
  name: string;
}

class Dog {
  breed: string;
}
        `.trim();

    const originalResult = parse(originalCode, 'Animals.ts');
    expect(originalResult.classes).toHaveLength(2);
    expect(originalResult.relationships).toHaveLength(0);

    let diagram = generateDiagram(originalResult.classes, originalResult.interfaces, originalResult.relationships);
    expect(diagram.nodes).toHaveLength(2);
    expect(diagram.edges).toHaveLength(0);

    // Add inheritance relationship
    const modifiedCode = `
class Animal {
  name: string;
}

class Dog extends Animal {
  breed: string;
}
        `.trim();

    const modifiedResult = parse(modifiedCode, 'Animals.ts');
    expect(modifiedResult.classes).toHaveLength(2);
    expect(modifiedResult.relationships.length).toBeGreaterThan(0);

    diagram = generateDiagram(modifiedResult.classes, modifiedResult.interfaces, modifiedResult.relationships);
    expect(diagram.nodes).toHaveLength(2);
    expect(diagram.edges.length).toBeGreaterThan(0);
    expect(diagram.edges[0].type).toBe('inheritance');
  });

  it('should update diagram when relationship is added (implementation)', () => {
    // Initial code with interface and unrelated class
    const originalCode = `
interface IWorker {
  work(): void;
}

class Person {
  name: string;
}
        `.trim();

    const originalResult = parse(originalCode, 'Worker.ts');
    expect(originalResult.classes).toHaveLength(1);
    expect(originalResult.interfaces).toHaveLength(1);
    expect(originalResult.relationships).toHaveLength(0);

    let diagram = generateDiagram(originalResult.classes, originalResult.interfaces, originalResult.relationships);
    expect(diagram.nodes).toHaveLength(2);
    expect(diagram.edges).toHaveLength(0);

    // Add implementation relationship
    const modifiedCode = `
interface IWorker {
  work(): void;
}

class Person implements IWorker {
  name: string;
  
  work(): void {
    console.log('Working...');
  }
}
        `.trim();

    const modifiedResult = parse(modifiedCode, 'Worker.ts');
    expect(modifiedResult.classes).toHaveLength(1);
    expect(modifiedResult.interfaces).toHaveLength(1);
    expect(modifiedResult.relationships.length).toBeGreaterThan(0);

    diagram = generateDiagram(modifiedResult.classes, modifiedResult.interfaces, modifiedResult.relationships);
    expect(diagram.nodes).toHaveLength(2);
    expect(diagram.edges.length).toBeGreaterThan(0);
    expect(diagram.edges[0].type).toBe('realization');
  });

  it('should handle multiple sequential edits correctly', () => {
    // Step 1: Start with simple class
    let code = `class Test { }`;
    let result = parse(code, 'Test.ts');
    let diagram = generateDiagram(result.classes, result.interfaces, result.relationships);

    expect(diagram.nodes).toHaveLength(1);
    expect(diagram.nodes[0].data.properties).toHaveLength(0);
    expect(diagram.nodes[0].data.methods).toHaveLength(0);

    // Step 2: Add property
    code = `class Test { x: string; }`;
    result = parse(code, 'Test.ts');
    diagram = generateDiagram(result.classes, result.interfaces, result.relationships);

    expect(diagram.nodes[0].data.properties).toHaveLength(1);

    // Step 3: Add method
    code = `class Test { x: string; getX(): string { return this.x; } }`;
    result = parse(code, 'Test.ts');
    diagram = generateDiagram(result.classes, result.interfaces, result.relationships);

    expect(diagram.nodes[0].data.properties).toHaveLength(1);
    expect(diagram.nodes[0].data.methods).toHaveLength(1);

    // Step 4: Change property visibility
    code = `class Test { private x: string; getX(): string { return this.x; } }`;
    result = parse(code, 'Test.ts');
    diagram = generateDiagram(result.classes, result.interfaces, result.relationships);

    expect(diagram.nodes[0].data.properties[0]).toContain('- x: string');

    // Step 5: Remove property
    code = `class Test { getX(): string { return ''; } }`;
    result = parse(code, 'Test.ts');
    diagram = generateDiagram(result.classes, result.interfaces, result.relationships);

    expect(diagram.nodes[0].data.properties).toHaveLength(0);
    expect(diagram.nodes[0].data.methods).toHaveLength(1);
  });

  it('should handle parse errors gracefully and maintain last valid state', () => {
    // Start with valid code
    const validCode = `
class Person {
  name: string;
  age: number;
}
        `.trim();

    const validResult = parse(validCode, 'Person.ts');
    expect(validResult.success).toBe(true);

    const diagram = generateDiagram(validResult.classes, validResult.interfaces, validResult.relationships);
    expect(diagram.nodes).toHaveLength(1);

    // Introduce syntax error
    const invalidCode = `
class Person {
  name: string;
  age: number
        `.trim(); // Missing closing brace

    const invalidResult = parse(invalidCode, 'Person.ts');
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);

    // The diagram should still show the last valid state
    // In a real application, the DiagramRenderer would handle this
    // Here we verify that the parser returns errors correctly
    expect(invalidResult.errors[0]).toHaveProperty('line');
    expect(invalidResult.errors[0]).toHaveProperty('column');
    expect(invalidResult.errors[0]).toHaveProperty('message');
  });
});
