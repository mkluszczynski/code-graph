import { describe, it, expect } from "vitest";
import type { ClassDefinition, InterfaceDefinition } from "../../shared/types";
import { extractRelationships } from "../RelationshipAnalyzer";

describe("RelationshipAnalyzer Contract Tests", () => {
    describe("extractRelationships() with inheritance", () => {
        it("should detect simple class inheritance (extends)", () => {
            // Given: Two classes where one extends the other
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Employee",
                    name: "Employee",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: "Person",
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Person",
                    name: "Person",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);
            // const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect inheritance relationship
            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "inheritance",
                sourceId: "file1::Employee",
                targetId: "file1::Person",
            });
            expect(relationships[0].id).toBeDefined();
        });

        it("should detect multi-level inheritance chain", () => {
            // Given: Three classes with inheritance chain: Manager -> Employee -> Person
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Manager",
                    name: "Manager",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: "Employee",
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Employee",
                    name: "Employee",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: "Person",
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Person",
                    name: "Person",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect two inheritance relationships
            expect(relationships).toHaveLength(2);
            expect(relationships.filter((r) => r.type === "inheritance")).toHaveLength(2);

            const managerToEmployee = relationships.find(
                (r) => r.sourceId === "file1::Manager" && r.targetId === "file1::Employee"
            );
            expect(managerToEmployee).toBeDefined();
            expect(managerToEmployee?.type).toBe("inheritance");

            const employeeToPerson = relationships.find(
                (r) => r.sourceId === "file1::Employee" && r.targetId === "file1::Person"
            );
            expect(employeeToPerson).toBeDefined();
            expect(employeeToPerson?.type).toBe("inheritance");
        });

        it("should handle abstract class inheritance", () => {
            // Given: Concrete class extending abstract class
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Circle",
                    name: "Circle",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: "Shape",
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Shape",
                    name: "Shape",
                    fileId: "file1",
                    isAbstract: true,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect inheritance relationship
            expect(relationships).toHaveLength(1);
            expect(relationships[0].type).toBe("inheritance");
            expect(relationships[0].sourceId).toBe("file1::Circle");
            expect(relationships[0].targetId).toBe("file1::Shape");
        });

        it("should handle interface inheritance (extends)", () => {
            // Given: Interface extending another interface
            const classes: ClassDefinition[] = [];
            const interfaces: InterfaceDefinition[] = [
                {
                    id: "file1::IEmployee",
                    name: "IEmployee",
                    fileId: "file1",
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsInterfaces: ["IPerson"],
                },
                {
                    id: "file1::IPerson",
                    name: "IPerson",
                    fileId: "file1",
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsInterfaces: [],
                },
            ];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect interface inheritance
            expect(relationships).toHaveLength(1);
            expect(relationships[0].type).toBe("inheritance");
            expect(relationships[0].sourceId).toBe("file1::IEmployee");
            expect(relationships[0].targetId).toBe("file1::IPerson");
        });

        it("should handle interface extending multiple interfaces", () => {
            // Given: Interface extending multiple interfaces
            const classes: ClassDefinition[] = [];
            const interfaces: InterfaceDefinition[] = [
                {
                    id: "file1::IWorker",
                    name: "IWorker",
                    fileId: "file1",
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsInterfaces: ["IPerson", "IIdentifiable"],
                },
                {
                    id: "file1::IPerson",
                    name: "IPerson",
                    fileId: "file1",
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsInterfaces: [],
                },
                {
                    id: "file1::IIdentifiable",
                    name: "IIdentifiable",
                    fileId: "file1",
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsInterfaces: [],
                },
            ];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect two inheritance relationships
            expect(relationships).toHaveLength(2);
            expect(relationships.every((r) => r.type === "inheritance")).toBe(true);
            expect(relationships.every((r) => r.sourceId === "file1::IWorker")).toBe(true);
        });
    });

    describe("extractRelationships() with interface implementation", () => {
        it("should detect class implementing single interface", () => {
            // Given: Class implementing interface
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Employee",
                    name: "Employee",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: ["IWorker"],
                },
            ];
            const interfaces: InterfaceDefinition[] = [
                {
                    id: "file1::IWorker",
                    name: "IWorker",
                    fileId: "file1",
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsInterfaces: [],
                },
            ];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect realization relationship
            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "realization",
                sourceId: "file1::Employee",
                targetId: "file1::IWorker",
            });
            expect(relationships[0].id).toBeDefined();
        });

        it("should detect class implementing multiple interfaces", () => {
            // Given: Class implementing multiple interfaces
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Employee",
                    name: "Employee",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: ["IWorker", "IIdentifiable"],
                },
            ];
            const interfaces: InterfaceDefinition[] = [
                {
                    id: "file1::IWorker",
                    name: "IWorker",
                    fileId: "file1",
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsInterfaces: [],
                },
                {
                    id: "file1::IIdentifiable",
                    name: "IIdentifiable",
                    fileId: "file1",
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsInterfaces: [],
                },
            ];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect two realization relationships
            expect(relationships).toHaveLength(2);
            expect(relationships.every((r) => r.type === "realization")).toBe(true);
            expect(relationships.every((r) => r.sourceId === "file1::Employee")).toBe(true);

            const targetIds = relationships.map((r) => r.targetId);
            expect(targetIds).toContain("file1::IWorker");
            expect(targetIds).toContain("file1::IIdentifiable");
        });

        it("should detect both inheritance and implementation", () => {
            // Given: Class extending another class and implementing interface
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Manager",
                    name: "Manager",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: "Employee",
                    implementsInterfaces: ["IManager"],
                },
                {
                    id: "file1::Employee",
                    name: "Employee",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [
                {
                    id: "file1::IManager",
                    name: "IManager",
                    fileId: "file1",
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsInterfaces: [],
                },
            ];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect both inheritance and realization
            expect(relationships).toHaveLength(2);

            const inheritanceRel = relationships.find((r) => r.type === "inheritance");
            expect(inheritanceRel).toBeDefined();
            expect(inheritanceRel?.sourceId).toBe("file1::Manager");
            expect(inheritanceRel?.targetId).toBe("file1::Employee");

            const realizationRel = relationships.find((r) => r.type === "realization");
            expect(realizationRel).toBeDefined();
            expect(realizationRel?.sourceId).toBe("file1::Manager");
            expect(realizationRel?.targetId).toBe("file1::IManager");
        });

        it("should handle empty arrays", () => {
            // Given: No classes or interfaces
            const classes: ClassDefinition[] = [];
            const interfaces: InterfaceDefinition[] = [];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should return empty array
            expect(relationships).toHaveLength(0);
        });

        it("should handle classes with no relationships", () => {
            // Given: Standalone classes with no inheritance or implementation
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Person",
                    name: "Person",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Product",
                    name: "Product",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should return empty array
            expect(relationships).toHaveLength(0);
        });
    });

    describe("extractRelationships() with composition/association", () => {
        it("should detect association from property type", () => {
            // Given: Class with property of another class type
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Department",
                    name: "Department",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [
                        {
                            name: "manager",
                            type: "Employee",
                            visibility: "private",
                            isStatic: false,
                            isReadonly: false,
                        },
                    ],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Employee",
                    name: "Employee",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect association relationship
            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "association",
                sourceId: "file1::Department",
                targetId: "file1::Employee",
            });
        });

        it("should detect aggregation from array property type", () => {
            // Given: Class with array property of another class type
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Team",
                    name: "Team",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [
                        {
                            name: "members",
                            type: "Employee[]",
                            visibility: "private",
                            isStatic: false,
                            isReadonly: false,
                        },
                    ],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Employee",
                    name: "Employee",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect aggregation relationship
            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "aggregation",
                sourceId: "file1::Team",
                targetId: "file1::Employee",
            });
        });

        it("should detect multiple associations from different properties", () => {
            // Given: Class with multiple properties referencing other classes
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Project",
                    name: "Project",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [
                        {
                            name: "manager",
                            type: "Employee",
                            visibility: "private",
                            isStatic: false,
                            isReadonly: false,
                        },
                        {
                            name: "client",
                            type: "Customer",
                            visibility: "private",
                            isStatic: false,
                            isReadonly: false,
                        },
                    ],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Employee",
                    name: "Employee",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Customer",
                    name: "Customer",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect two association relationships
            expect(relationships).toHaveLength(2);
            expect(relationships.every((r) => r.type === "association")).toBe(true);
            expect(relationships.every((r) => r.sourceId === "file1::Project")).toBe(true);

            const targetIds = relationships.map((r) => r.targetId);
            expect(targetIds).toContain("file1::Employee");
            expect(targetIds).toContain("file1::Customer");
        });

        it("should ignore built-in types (string, number, boolean)", () => {
            // Given: Class with properties of built-in types
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Person",
                    name: "Person",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [
                        {
                            name: "name",
                            type: "string",
                            visibility: "public",
                            isStatic: false,
                            isReadonly: false,
                        },
                        {
                            name: "age",
                            type: "number",
                            visibility: "public",
                            isStatic: false,
                            isReadonly: false,
                        },
                        {
                            name: "active",
                            type: "boolean",
                            visibility: "public",
                            isStatic: false,
                            isReadonly: false,
                        },
                    ],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should not detect any relationships
            expect(relationships).toHaveLength(0);
        });

        it("should combine inheritance, realization, and association", () => {
            // Given: Complex class structure with multiple relationship types
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Manager",
                    name: "Manager",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [
                        {
                            name: "department",
                            type: "Department",
                            visibility: "private",
                            isStatic: false,
                            isReadonly: false,
                        },
                    ],
                    methods: [],
                    typeParameters: [],
                    extendsClass: "Employee",
                    implementsInterfaces: ["IManager"],
                },
                {
                    id: "file1::Employee",
                    name: "Employee",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Department",
                    name: "Department",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [
                {
                    id: "file1::IManager",
                    name: "IManager",
                    fileId: "file1",
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsInterfaces: [],
                },
            ];

            // When: Extract relationships
            const relationships = extractRelationships(classes, interfaces);

            // Then: Should detect all three relationship types
            expect(relationships).toHaveLength(3);

            const inheritanceRel = relationships.find((r) => r.type === "inheritance");
            expect(inheritanceRel).toBeDefined();
            expect(inheritanceRel?.sourceId).toBe("file1::Manager");
            expect(inheritanceRel?.targetId).toBe("file1::Employee");

            const realizationRel = relationships.find((r) => r.type === "realization");
            expect(realizationRel).toBeDefined();
            expect(realizationRel?.sourceId).toBe("file1::Manager");
            expect(realizationRel?.targetId).toBe("file1::IManager");

            const associationRel = relationships.find((r) => r.type === "association");
            expect(associationRel).toBeDefined();
            expect(associationRel?.sourceId).toBe("file1::Manager");
            expect(associationRel?.targetId).toBe("file1::Department");
        });
    });
});
