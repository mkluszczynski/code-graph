import { describe, it, expect } from "vitest";
import type { ClassDefinition, InterfaceDefinition } from "../../../shared/types";
import { extractRelationships } from "../RelationshipAnalyzer";

describe("RelationshipAnalyzer Contract Tests", () => {
    describe("extractRelationships() with inheritance", () => {
        it("should detect simple class inheritance (extends)", () => {
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

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "inheritance",
                sourceId: "file1::Employee",
                targetId: "file1::Person",
            });
            expect(relationships[0].id).toBeDefined();
        });

        it("should detect multi-level inheritance chain", () => {
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

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(2);
            expect(relationships.filter((r) => r.type === "inheritance")).toHaveLength(2);

            const managerToEmployee = relationships.find(
                (r) => r.sourceId === "file1::Manager" && r.targetId === "file1::Employee"
            );
            expect(managerToEmployee).toBeDefined();

            const employeeToPerson = relationships.find(
                (r) => r.sourceId === "file1::Employee" && r.targetId === "file1::Person"
            );
            expect(employeeToPerson).toBeDefined();
        });

        it("should handle interface inheritance (extends)", () => {
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

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(1);
            expect(relationships[0].type).toBe("inheritance");
            expect(relationships[0].sourceId).toBe("file1::IEmployee");
            expect(relationships[0].targetId).toBe("file1::IPerson");
        });
    });

    describe("extractRelationships() with interface implementation", () => {
        it("should detect class implementing single interface", () => {
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

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "realization",
                sourceId: "file1::Employee",
                targetId: "file1::IWorker",
            });
        });

        it("should detect class implementing multiple interfaces", () => {
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

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(2);
            expect(relationships.every((r) => r.type === "realization")).toBe(true);
        });

        it("should handle empty arrays", () => {
            const classes: ClassDefinition[] = [];
            const interfaces: InterfaceDefinition[] = [];

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(0);
        });
    });

    describe("extractRelationships() with composition/association", () => {
        it("should detect association from property type", () => {
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

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "association",
                sourceId: "file1::Department",
                targetId: "file1::Employee",
            });
        });

        it("should detect aggregation from array property type", () => {
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

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "aggregation",
                sourceId: "file1::Team",
                targetId: "file1::Employee",
            });
        });

        it("should ignore built-in types (string, number, boolean)", () => {
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
                    ],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [];

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(0);
        });
    });

    describe("extractRelationships() with dependency (method signatures)", () => {
        it("should detect dependency from method return type", () => {
            const classes: ClassDefinition[] = [
                {
                    id: "file1::QuestRepository",
                    name: "QuestRepository",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [
                        {
                            name: "getQuests",
                            returnType: "Promise<Quest[]>",
                            visibility: "public",
                            isStatic: false,
                            isAbstract: false,
                            isAsync: true,
                            parameters: [],
                        },
                    ],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Quest",
                    name: "Quest",
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

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "dependency",
                sourceId: "file1::QuestRepository",
                targetId: "file1::Quest",
            });
        });

        it("should detect dependency from method parameter type", () => {
            const classes: ClassDefinition[] = [
                {
                    id: "file1::QuestService",
                    name: "QuestService",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [
                        {
                            name: "saveQuest",
                            returnType: "void",
                            visibility: "public",
                            isStatic: false,
                            isAbstract: false,
                            isAsync: false,
                            parameters: [
                                { name: "quest", type: "Quest", isOptional: false },
                            ],
                        },
                    ],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Quest",
                    name: "Quest",
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

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "dependency",
                sourceId: "file1::QuestService",
                targetId: "file1::Quest",
            });
        });

        it("should NOT create dependency if property relationship already exists", () => {
            const classes: ClassDefinition[] = [
                {
                    id: "file1::QuestManager",
                    name: "QuestManager",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [
                        {
                            name: "activeQuest",
                            type: "Quest",
                            visibility: "private",
                            isStatic: false,
                            isReadonly: false,
                        },
                    ],
                    methods: [
                        {
                            name: "getActiveQuest",
                            returnType: "Quest",
                            visibility: "public",
                            isStatic: false,
                            isAbstract: false,
                            isAsync: false,
                            parameters: [],
                        },
                    ],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Quest",
                    name: "Quest",
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

            const relationships = extractRelationships(classes, interfaces);

            // Should only have association from property, NOT dependency from method
            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "association",
                sourceId: "file1::QuestManager",
                targetId: "file1::Quest",
            });
        });

        it("should detect dependency from Future<List<Type>> in Dart-style generics", () => {
            const classes: ClassDefinition[] = [
                {
                    id: "file1::QuestRepository",
                    name: "QuestRepository",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [
                        {
                            name: "getQuests",
                            returnType: "Future<List<Quest>>",
                            visibility: "public",
                            isStatic: false,
                            isAbstract: false,
                            isAsync: true,
                            parameters: [],
                        },
                    ],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: "file1::Quest",
                    name: "Quest",
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

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: "dependency",
                sourceId: "file1::QuestRepository",
                targetId: "file1::Quest",
            });
        });

        it("should ignore built-in types in method signatures", () => {
            const classes: ClassDefinition[] = [
                {
                    id: "file1::Calculator",
                    name: "Calculator",
                    fileId: "file1",
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [
                        {
                            name: "add",
                            returnType: "number",
                            visibility: "public",
                            isStatic: false,
                            isAbstract: false,
                            isAsync: false,
                            parameters: [
                                { name: "a", type: "number", isOptional: false },
                                { name: "b", type: "number", isOptional: false },
                            ],
                        },
                    ],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];
            const interfaces: InterfaceDefinition[] = [];

            const relationships = extractRelationships(classes, interfaces);

            expect(relationships).toHaveLength(0);
        });
    });
});
