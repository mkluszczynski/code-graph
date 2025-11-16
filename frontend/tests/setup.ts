import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { vi } from 'vitest';

// Mock navigator.clipboard for clipboard copy tests
Object.defineProperty(navigator, 'clipboard', {
    value: {
        write: vi.fn().mockResolvedValue(undefined),
        writeText: vi.fn().mockResolvedValue(undefined),
        read: vi.fn().mockResolvedValue([]),
        readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
    configurable: true,
});

// Mock window.ClipboardItem for clipboard tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ClipboardItem = class ClipboardItem {
    constructor(public data: Record<string, Blob>) { }
};
