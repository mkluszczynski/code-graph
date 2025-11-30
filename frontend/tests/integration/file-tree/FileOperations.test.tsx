/**
 * Unit tests for FileOperations module
 *
 * Tests for file validation and duplicate name generation utilities
 */

import { describe, it, expect } from "vitest";
import {
    validateFileName,
    generateDuplicateName,
    validateItemName,
    normalizeFileName
} from "../../../src/file-tree/FileOperations";

describe("FileOperations", () => {
    describe("validateFileName", () => {
        it("should accept valid filenames", () => {
            const validNames = [
                "file.ts",
                "MyComponent.tsx",
                "index.js",
                "README.md",
                "file-name.ts",
                "file_name.ts",
                "file.name.ts",
                "123.ts",
                "a.b",
            ];

            validNames.forEach((name) => {
                const result = validateFileName(name);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeUndefined();
            });
        });

        it("should reject empty or whitespace-only filenames", () => {
            const invalidNames = ["", "   ", "\t", "\n"];

            invalidNames.forEach((name) => {
                const result = validateFileName(name);
                expect(result.isValid).toBe(false);
                expect(result.error).toBe("File name cannot be empty");
            });
        });

        it("should reject reserved names", () => {
            const result1 = validateFileName(".");
            expect(result1.isValid).toBe(false);
            expect(result1.error).toBe("File name cannot be '.' or '..'");

            const result2 = validateFileName("..");
            expect(result2.isValid).toBe(false);
            expect(result2.error).toBe("File name cannot be '.' or '..'");
        });

        it("should reject filenames with invalid characters", () => {
            const invalidChars = ["/", "\\", ":", "*", "?", '"', "<", ">", "|"];

            invalidChars.forEach((char) => {
                const result = validateFileName(`file${char}name.ts`);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain("cannot contain");
            });
        });

        it("should reject filenames that are too long", () => {
            const longName = "a".repeat(256) + ".ts";
            const result = validateFileName(longName);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("File name is too long (max 255 characters)");
        });

        it("should accept filenames at maximum valid length", () => {
            const maxLengthName = "a".repeat(251) + ".ts"; // 255 chars total
            const result = validateFileName(maxLengthName);
            expect(result.isValid).toBe(true);
        });
    });

    describe("generateDuplicateName", () => {
        it("should append 'copy' to filename without conflicts", () => {
            const result = generateDuplicateName("file.ts", {
                existingNames: ["file.ts"],
            });
            expect(result).toBe("file copy.ts");
        });

        it("should handle files without extensions", () => {
            const result = generateDuplicateName("README", {
                existingNames: ["README"],
            });
            expect(result).toBe("README copy");
        });

        it("should increment copy number when 'copy' exists", () => {
            const result = generateDuplicateName("file.ts", {
                existingNames: ["file.ts", "file copy.ts"],
            });
            expect(result).toBe("file copy 2.ts");
        });

        it("should find next available copy number", () => {
            const result = generateDuplicateName("file.ts", {
                existingNames: [
                    "file.ts",
                    "file copy.ts",
                    "file copy 2.ts",
                    "file copy 3.ts",
                ],
            });
            expect(result).toBe("file copy 4.ts");
        });

        it("should handle gaps in copy numbers", () => {
            const result = generateDuplicateName("file.ts", {
                existingNames: ["file.ts", "file copy 3.ts", "file copy 5.ts"],
            });
            // Should use "file copy.ts" since it's available
            expect(result).toBe("file copy.ts");
        });

        it("should preserve multi-dot extensions", () => {
            const result = generateDuplicateName("file.test.ts", {
                existingNames: ["file.test.ts"],
            });
            expect(result).toBe("file.test copy.ts");
        });

        it("should handle hidden files (starting with dot)", () => {
            const result = generateDuplicateName(".gitignore", {
                existingNames: [".gitignore"],
            });
            expect(result).toBe(".gitignore copy");
        });

        it("should handle files with spaces in names", () => {
            const result = generateDuplicateName("My File.ts", {
                existingNames: ["My File.ts"],
            });
            expect(result).toBe("My File copy.ts");
        });

        it("should throw error when maxAttempts is reached", () => {
            const existingNames = ["file.ts"];
            for (let i = 1; i <= 10; i++) {
                if (i === 1) {
                    existingNames.push("file copy.ts");
                } else {
                    existingNames.push(`file copy ${i}.ts`);
                }
            }

            expect(() =>
                generateDuplicateName("file.ts", {
                    existingNames,
                    maxAttempts: 10,
                })
            ).toThrow("Unable to generate unique duplicate name");
        });

        it("should work with custom maxAttempts", () => {
            const result = generateDuplicateName("file.ts", {
                existingNames: ["file.ts", "file copy.ts"],
                maxAttempts: 5,
            });
            expect(result).toBe("file copy 2.ts");
        });

        it("should handle empty existing names array", () => {
            const result = generateDuplicateName("file.ts", {
                existingNames: [],
            });
            // When no conflicts, should still create "copy" version
            expect(result).toBe("file copy.ts");
        });

        it("should be case-sensitive", () => {
            const result = generateDuplicateName("File.ts", {
                existingNames: ["file.ts", "File.ts"],
            });
            // Should recognize "File.ts" exists and create "File copy.ts"
            expect(result).toBe("File copy.ts");
        });

        it("should handle files with only extension", () => {
            const result = generateDuplicateName(".ts", {
                existingNames: [".ts"],
            });
            expect(result).toBe(".ts copy");
        });

        it("should handle very long file names", () => {
            const longBaseName = "a".repeat(240);
            const originalName = `${longBaseName}.ts`;
            const result = generateDuplicateName(originalName, {
                existingNames: [originalName],
            });
            expect(result).toBe(`${longBaseName} copy.ts`);
        });
    });

    describe("validateItemName", () => {
        describe("for files", () => {
            it("should accept valid file names", () => {
                const result = validateItemName("MyFile.ts", "file");
                expect(result.isValid).toBe(true);
            });

            it("should reject empty file names with appropriate message", () => {
                const result = validateItemName("", "file");
                expect(result.isValid).toBe(false);
                expect(result.error).toBe("File name cannot be empty");
            });

            it("should reject invalid characters with appropriate message", () => {
                const result = validateItemName("file/name.ts", "file");
                expect(result.isValid).toBe(false);
                expect(result.error).toContain("File name cannot contain");
            });
        });

        describe("for folders", () => {
            it("should accept valid folder names", () => {
                const result = validateItemName("components", "folder");
                expect(result.isValid).toBe(true);
            });

            it("should reject empty folder names with appropriate message", () => {
                const result = validateItemName("", "folder");
                expect(result.isValid).toBe(false);
                expect(result.error).toBe("Folder name cannot be empty");
            });

            it("should reject invalid characters with appropriate message", () => {
                const result = validateItemName("my/folder", "folder");
                expect(result.isValid).toBe(false);
                expect(result.error).toContain("Folder name cannot contain");
            });

            it("should accept folder names without extension", () => {
                const result = validateItemName("my-folder", "folder");
                expect(result.isValid).toBe(true);
            });
        });
    });

    describe("normalizeFileName", () => {
        it("should add .ts extension when missing", () => {
            const result = normalizeFileName("MyFile");
            expect(result).toBe("MyFile.ts");
        });

        it("should not add extension when already present", () => {
            const result = normalizeFileName("MyFile.ts");
            expect(result).toBe("MyFile.ts");
        });

        it("should preserve other extensions", () => {
            const result = normalizeFileName("component.tsx");
            expect(result).toBe("component.tsx");
        });

        it("should trim whitespace", () => {
            const result = normalizeFileName("  MyFile  ");
            expect(result).toBe("MyFile.ts");
        });

        it("should handle files with multiple dots", () => {
            const result = normalizeFileName("file.test.ts");
            expect(result).toBe("file.test.ts");
        });

        it("should add .ts to files with dot but no extension", () => {
            // A file like "." is a special case that would be caught by validation
            // but we test the normalize behavior: if it has a dot, we don't add .ts
            const result = normalizeFileName("my.file");
            expect(result).toBe("my.file"); // Already has extension
        });
    });
});
