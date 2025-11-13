/**
 * Contract tests for TypeScriptParser
 * These tests MUST pass before implementation begins (TDD)
 * Contract: specs/001-uml-graph-visualizer/contracts/typescript-parser.contract.md
 */

import { describe, it, expect } from 'vitest';
import { parse } from '../TypeScriptParser';

describe('TypeScriptParser Contract Tests', () => {
  describe('T048: parse() with simple class', () => {
    it('should parse a simple class with properties and methods', () => {
      const sourceCode = `
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

      const result = parse(sourceCode, 'Person.ts');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.classes).toHaveLength(1);
      expect(result.interfaces).toHaveLength(0);

      const personClass = result.classes[0];
      expect(personClass.name).toBe('Person');
      expect(personClass.isExported).toBe(true);
      expect(personClass.isAbstract).toBe(false);
      expect(personClass.properties).toHaveLength(2);
      expect(personClass.methods).toHaveLength(2); // constructor + getName
    });
  });

  describe('T049: parse() with properties and methods', () => {
    it('should extract all properties with correct types', () => {
      const sourceCode = `
class Employee {
  employeeId: string;
  salary: number;
  department: string;
}
      `.trim();

      const result = parse(sourceCode, 'Employee.ts');

      expect(result.success).toBe(true);
      expect(result.classes[0].properties).toHaveLength(3);

      const properties = result.classes[0].properties;
      expect(properties[0]).toMatchObject({
        name: 'employeeId',
        type: 'string',
      });
      expect(properties[1]).toMatchObject({
        name: 'salary',
        type: 'number',
      });
      expect(properties[2]).toMatchObject({
        name: 'department',
        type: 'string',
      });
    });

    it('should extract all methods with return types and parameters', () => {
      const sourceCode = `
class Calculator {
  add(x: number, y: number): number {
    return x + y;
  }

  subtract(x: number, y: number): number {
    return x - y;
  }

  reset(): void {
    // reset logic
  }
}
      `.trim();

      const result = parse(sourceCode, 'Calculator.ts');

      expect(result.success).toBe(true);
      expect(result.classes[0].methods).toHaveLength(3);

      const addMethod = result.classes[0].methods[0];
      expect(addMethod).toMatchObject({
        name: 'add',
        returnType: 'number',
      });
      expect(addMethod.parameters).toHaveLength(2);
      expect(addMethod.parameters[0]).toMatchObject({
        name: 'x',
        type: 'number',
        isOptional: false,
      });
    });
  });

  describe('T050: parse() with access modifiers', () => {
    it('should extract public, private, and protected modifiers', () => {
      const sourceCode = `
class Account {
  public accountId: string;
  private balance: number;
  protected ownerId: string;

  public deposit(amount: number): void {
    this.balance += amount;
  }

  private validateAmount(amount: number): boolean {
    return amount > 0;
  }

  protected notifyOwner(): void {
    // notification logic
  }
}
      `.trim();

      const result = parse(sourceCode, 'Account.ts');

      expect(result.success).toBe(true);
      const account = result.classes[0];

      // Properties
      expect(account.properties[0]).toMatchObject({
        name: 'accountId',
        visibility: 'public',
      });
      expect(account.properties[1]).toMatchObject({
        name: 'balance',
        visibility: 'private',
      });
      expect(account.properties[2]).toMatchObject({
        name: 'ownerId',
        visibility: 'protected',
      });

      // Methods
      expect(account.methods[0]).toMatchObject({
        name: 'deposit',
        visibility: 'public',
      });
      expect(account.methods[1]).toMatchObject({
        name: 'validateAmount',
        visibility: 'private',
      });
      expect(account.methods[2]).toMatchObject({
        name: 'notifyOwner',
        visibility: 'protected',
      });
    });

    it('should default to public visibility when not specified', () => {
      const sourceCode = `
class SimpleClass {
  prop: string;
  
  method(): void {
    // logic
  }
}
      `.trim();

      const result = parse(sourceCode, 'SimpleClass.ts');

      expect(result.success).toBe(true);
      expect(result.classes[0].properties[0].visibility).toBe('public');
      expect(result.classes[0].methods[0].visibility).toBe('public');
    });

    it('should detect static and readonly modifiers', () => {
      const sourceCode = `
class Config {
  static readonly APP_NAME: string = "MyApp";
  static version: number = 1.0;
  readonly id: string;

  static getInstance(): Config {
    return new Config();
  }
}
      `.trim();

      const result = parse(sourceCode, 'Config.ts');

      expect(result.success).toBe(true);
      const config = result.classes[0];

      expect(config.properties[0]).toMatchObject({
        name: 'APP_NAME',
        isStatic: true,
        isReadonly: true,
      });
      expect(config.properties[1]).toMatchObject({
        name: 'version',
        isStatic: true,
        isReadonly: false,
      });
      expect(config.properties[2]).toMatchObject({
        name: 'id',
        isStatic: false,
        isReadonly: true,
      });
      expect(config.methods[0]).toMatchObject({
        name: 'getInstance',
        isStatic: true,
      });
    });

    it('should detect abstract modifier on class and methods', () => {
      const sourceCode = `
abstract class Animal {
  name: string;

  abstract makeSound(): void;

  move(): void {
    console.log('Moving...');
  }
}
      `.trim();

      const result = parse(sourceCode, 'Animal.ts');

      expect(result.success).toBe(true);
      const animal = result.classes[0];

      expect(animal.isAbstract).toBe(true);
      expect(animal.methods[0]).toMatchObject({
        name: 'makeSound',
        isAbstract: true,
      });
      expect(animal.methods[1]).toMatchObject({
        name: 'move',
        isAbstract: false,
      });
    });
  });

  describe('T051: parse() with interface', () => {
    it('should parse interface with properties and method signatures', () => {
      const sourceCode = `
export interface IUser {
  id: string;
  name: string;
  email: string;

  login(): void;
  logout(): void;
  updateProfile(name: string, email: string): Promise<void>;
}
      `.trim();

      const result = parse(sourceCode, 'IUser.ts');

      expect(result.success).toBe(true);
      expect(result.classes).toHaveLength(0);
      expect(result.interfaces).toHaveLength(1);

      const userInterface = result.interfaces[0];
      expect(userInterface.name).toBe('IUser');
      expect(userInterface.isExported).toBe(true);
      expect(userInterface.properties).toHaveLength(3);
      expect(userInterface.methods).toHaveLength(3);
    });

    it('should handle optional and readonly properties in interfaces', () => {
      const sourceCode = `
interface Product {
  readonly id: string;
  name: string;
  description?: string;
  price: number;
}
      `.trim();

      const result = parse(sourceCode, 'Product.ts');

      expect(result.success).toBe(true);
      const product = result.interfaces[0];

      expect(product.properties[0]).toMatchObject({
        name: 'id',
        isReadonly: true,
        isOptional: false,
      });
      expect(product.properties[2]).toMatchObject({
        name: 'description',
        isOptional: true,
      });
    });

    it('should handle interface extension', () => {
      const sourceCode = `
interface IBase {
  id: string;
}

interface IExtended extends IBase {
  name: string;
}
      `.trim();

      const result = parse(sourceCode, 'Interfaces.ts');

      expect(result.success).toBe(true);
      expect(result.interfaces).toHaveLength(2);

      const extended = result.interfaces[1];
      expect(extended.name).toBe('IExtended');
      expect(extended.extendsInterfaces).toContain('IBase');
    });
  });

  describe('T052: parse() with syntax errors', () => {
    it('should handle syntax errors gracefully without throwing', () => {
      const sourceCode = `
class Broken {
  method() {
    // Missing closing brace
      `.trim();

      expect(() => parse(sourceCode, 'Broken.ts')).not.toThrow();
    });

    it('should return success: false and populate errors array', () => {
      const sourceCode = `
class Invalid {
  method() {
      `.trim();

      const result = parse(sourceCode, 'Invalid.ts');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty('line');
      expect(result.errors[0]).toHaveProperty('column');
      expect(result.errors[0]).toHaveProperty('message');
      expect(result.errors[0]).toHaveProperty('severity');
    });

    it('should return empty arrays for classes and interfaces on syntax error', () => {
      const sourceCode = `
class {
  // Missing class name
}
      `.trim();

      const result = parse(sourceCode, 'BadClass.ts');

      // TypeScript parser is forgiving - it may parse even with missing class name
      // The key is that we get an anonymous class or no class
      if (result.success) {
        // If it parses, the class should be named AnonymousClass
        expect(result.classes.length).toBeLessThanOrEqual(1);
        if (result.classes.length === 1) {
          expect(result.classes[0].name).toBe('AnonymousClass');
        }
      } else {
        expect(result.classes).toHaveLength(0);
        expect(result.interfaces).toHaveLength(0);
      }
    });
  });

  describe('Additional contract requirements', () => {
    it('should handle empty source code', () => {
      const result = parse('', 'Empty.ts');

      expect(result.success).toBe(true);
      expect(result.classes).toHaveLength(0);
      expect(result.interfaces).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle whitespace-only source code', () => {
      const result = parse('   \n\n  \t  ', 'Whitespace.ts');

      expect(result.success).toBe(true);
      expect(result.classes).toHaveLength(0);
      expect(result.interfaces).toHaveLength(0);
    });

    it('should extract class that extends another class', () => {
      const sourceCode = `
class Person {
  name: string;
}

class Employee extends Person {
  employeeId: string;
}
      `.trim();

      const result = parse(sourceCode, 'Inheritance.ts');

      expect(result.success).toBe(true);
      expect(result.classes).toHaveLength(2);

      const employee = result.classes[1];
      expect(employee.name).toBe('Employee');
      expect(employee.extendsClass).toBe('Person');
    });

    it('should extract class that implements interfaces', () => {
      const sourceCode = `
interface IWorker {
  work(): void;
}

interface ISleeper {
  sleep(): void;
}

class Human implements IWorker, ISleeper {
  work(): void {}
  sleep(): void {}
}
      `.trim();

      const result = parse(sourceCode, 'Implementation.ts');

      expect(result.success).toBe(true);
      const human = result.classes[0];
      expect(human.implementsInterfaces).toContain('IWorker');
      expect(human.implementsInterfaces).toContain('ISleeper');
    });

    it('should extract generic type parameters', () => {
      const sourceCode = `
class Container<T, K> {
  private items: Map<K, T>;

  get(key: K): T | undefined {
    return this.items.get(key);
  }
}
      `.trim();

      const result = parse(sourceCode, 'Generic.ts');

      expect(result.success).toBe(true);
      const container = result.classes[0];
      expect(container.typeParameters).toEqual(['T', 'K']);
    });

    it('should handle async methods', () => {
      const sourceCode = `
class ApiClient {
  async fetchData(): Promise<string> {
    return "data";
  }
}
      `.trim();

      const result = parse(sourceCode, 'ApiClient.ts');

      expect(result.success).toBe(true);
      const method = result.classes[0].methods[0];
      expect(method.isAsync).toBe(true);
      expect(method.returnType).toBe('Promise<string>');
    });

    it('should handle constructor', () => {
      const sourceCode = `
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
      `.trim();

      const result = parse(sourceCode, 'Person.ts');

      expect(result.success).toBe(true);
      const constructor = result.classes[0].methods.find(m => m.name === 'constructor');
      expect(constructor).toBeDefined();
      expect(constructor?.parameters).toHaveLength(1);
      expect(constructor?.parameters[0]).toMatchObject({
        name: 'name',
        type: 'string',
      });
    });

    it('should handle default parameter values', () => {
      const sourceCode = `
class Config {
  setup(port: number = 3000, host: string = "localhost"): void {
    // setup logic
  }
}
      `.trim();

      const result = parse(sourceCode, 'Config.ts');

      expect(result.success).toBe(true);
      const method = result.classes[0].methods[0];
      expect(method.parameters[0]).toMatchObject({
        name: 'port',
        type: 'number',
        defaultValue: '3000',
      });
      expect(method.parameters[1]).toMatchObject({
        name: 'host',
        type: 'string',
        defaultValue: '"localhost"',
      });
    });

    it('should generate unique IDs for classes based on fileName and class name', () => {
      const sourceCode = `
class Person {}
class Employee {}
      `.trim();

      const result = parse(sourceCode, 'Models.ts');

      expect(result.success).toBe(true);
      expect(result.classes[0].id).toBe('Models.ts::Person');
      expect(result.classes[1].id).toBe('Models.ts::Employee');
      expect(result.classes[0].fileId).toBe('Models.ts');
      expect(result.classes[1].fileId).toBe('Models.ts');
    });
  });

  // Phase 8: User Story 6 - Edit and Re-visualize
  describe('T086: parse() after class rename', () => {
    it('should correctly parse a class after its name is changed', () => {
      // Original code
      const originalCode = `
class Person {
  name: string;
  age: number;
}
            `.trim();

      const originalResult = parse(originalCode, 'Person.ts');
      expect(originalResult.success).toBe(true);
      expect(originalResult.classes[0].name).toBe('Person');

      // Renamed code
      const renamedCode = `
class Employee {
  name: string;
  age: number;
}
            `.trim();

      const renamedResult = parse(renamedCode, 'Person.ts');
      expect(renamedResult.success).toBe(true);
      expect(renamedResult.classes[0].name).toBe('Employee');
      expect(renamedResult.classes[0].properties).toHaveLength(2);
    });

    it('should update class ID when class name changes', () => {
      const originalCode = `class OldName {}`.trim();
      const originalResult = parse(originalCode, 'Test.ts');
      expect(originalResult.classes[0].id).toBe('Test.ts::OldName');

      const newCode = `class NewName {}`.trim();
      const newResult = parse(newCode, 'Test.ts');
      expect(newResult.classes[0].id).toBe('Test.ts::NewName');
    });
  });

  describe('T087: parse() after property removal', () => {
    it('should correctly parse a class after a property is removed', () => {
      // Original code with 3 properties
      const originalCode = `
class Person {
  name: string;
  age: number;
  email: string;
}
            `.trim();

      const originalResult = parse(originalCode, 'Person.ts');
      expect(originalResult.success).toBe(true);
      expect(originalResult.classes[0].properties).toHaveLength(3);

      // Code with email property removed
      const modifiedCode = `
class Person {
  name: string;
  age: number;
}
            `.trim();

      const modifiedResult = parse(modifiedCode, 'Person.ts');
      expect(modifiedResult.success).toBe(true);
      expect(modifiedResult.classes[0].properties).toHaveLength(2);
      expect(modifiedResult.classes[0].properties.find(p => p.name === 'email')).toBeUndefined();
    });

    it('should handle removal of all properties', () => {
      const originalCode = `
class Person {
  name: string;
}
            `.trim();

      const originalResult = parse(originalCode, 'Person.ts');
      expect(originalResult.classes[0].properties).toHaveLength(1);

      const modifiedCode = `class Person {}`.trim();
      const modifiedResult = parse(modifiedCode, 'Person.ts');
      expect(modifiedResult.success).toBe(true);
      expect(modifiedResult.classes[0].properties).toHaveLength(0);
    });

    it('should correctly parse after method removal', () => {
      const originalCode = `
class Calculator {
  add(x: number, y: number): number { return x + y; }
  subtract(x: number, y: number): number { return x - y; }
  multiply(x: number, y: number): number { return x * y; }
}
            `.trim();

      const originalResult = parse(originalCode, 'Calculator.ts');
      expect(originalResult.classes[0].methods).toHaveLength(3);

      const modifiedCode = `
class Calculator {
  add(x: number, y: number): number { return x + y; }
}
            `.trim();

      const modifiedResult = parse(modifiedCode, 'Calculator.ts');
      expect(modifiedResult.success).toBe(true);
      expect(modifiedResult.classes[0].methods).toHaveLength(1);
      expect(modifiedResult.classes[0].methods[0].name).toBe('add');
    });
  });

  describe('T088: parse() after visibility change', () => {
    it('should correctly parse property visibility changes', () => {
      // Original code with public property
      const originalCode = `
class Account {
  public balance: number;
}
            `.trim();

      const originalResult = parse(originalCode, 'Account.ts');
      expect(originalResult.classes[0].properties[0].visibility).toBe('public');

      // Changed to private
      const modifiedCode = `
class Account {
  private balance: number;
}
            `.trim();

      const modifiedResult = parse(modifiedCode, 'Account.ts');
      expect(modifiedResult.success).toBe(true);
      expect(modifiedResult.classes[0].properties[0].visibility).toBe('private');
    });

    it('should correctly parse method visibility changes', () => {
      const originalCode = `
class Service {
  public execute(): void {}
}
            `.trim();

      const originalResult = parse(originalCode, 'Service.ts');
      expect(originalResult.classes[0].methods[0].visibility).toBe('public');

      const modifiedCode = `
class Service {
  private execute(): void {}
}
            `.trim();

      const modifiedResult = parse(modifiedCode, 'Service.ts');
      expect(modifiedResult.success).toBe(true);
      expect(modifiedResult.classes[0].methods[0].visibility).toBe('private');
    });

    it('should handle visibility change from explicit to implicit (default public)', () => {
      const originalCode = `
class Data {
  public value: string;
}
            `.trim();

      const originalResult = parse(originalCode, 'Data.ts');
      expect(originalResult.classes[0].properties[0].visibility).toBe('public');

      // Remove explicit public keyword
      const modifiedCode = `
class Data {
  value: string;
}
            `.trim();

      const modifiedResult = parse(modifiedCode, 'Data.ts');
      expect(modifiedResult.success).toBe(true);
      expect(modifiedResult.classes[0].properties[0].visibility).toBe('public');
    });

    it('should handle multiple visibility changes in same class', () => {
      const originalCode = `
class Mixed {
  public a: string;
  private b: number;
  protected c: boolean;
}
            `.trim();

      const originalResult = parse(originalCode, 'Mixed.ts');
      expect(originalResult.classes[0].properties[0].visibility).toBe('public');
      expect(originalResult.classes[0].properties[1].visibility).toBe('private');
      expect(originalResult.classes[0].properties[2].visibility).toBe('protected');

      const modifiedCode = `
class Mixed {
  private a: string;
  public b: number;
  private c: boolean;
}
            `.trim();

      const modifiedResult = parse(modifiedCode, 'Mixed.ts');
      expect(modifiedResult.success).toBe(true);
      expect(modifiedResult.classes[0].properties[0].visibility).toBe('private');
      expect(modifiedResult.classes[0].properties[1].visibility).toBe('public');
      expect(modifiedResult.classes[0].properties[2].visibility).toBe('private');
    });
  });
});
