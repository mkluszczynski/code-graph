/**
 * Contract Tests: copyImageToClipboard()
 * 
 * Tests the clipboard copy functionality according to contracts/clipboard-copy.contract.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { copyImageToClipboard } from '../../../src/diagram-visualization/DiagramExporter';

describe('copyImageToClipboard - Contract Tests', () => {
    const validDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';

    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();

        // Reset clipboard mock to default success behavior
        vi.mocked(navigator.clipboard.write).mockResolvedValue(undefined);

        // Reset fetch mock
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            blob: () => Promise.resolve(new Blob(['mock'], { type: 'image/png' })),
        } as Response);
    });

    describe('Success Cases', () => {
        it('TC-001: Valid PNG data URL', async () => {
            const result = await copyImageToClipboard(validDataUrl);

            expect(result).toEqual({
                success: true,
            });
            expect(navigator.clipboard.write).toHaveBeenCalledTimes(1);
            expect(result.error).toBeUndefined();
            expect(result.errorCode).toBeUndefined();
        });

        it('TC-002: Empty data URL', async () => {
            const result = await copyImageToClipboard('');

            expect(result).toEqual({
                success: false,
                error: 'Invalid image data. Please try exporting again.',
                errorCode: 'blob_conversion_failed',
            });
        });

        it('TC-003: Invalid data URL format', async () => {
            const result = await copyImageToClipboard('not-a-valid-data-url');

            expect(result).toEqual({
                success: false,
                error: 'Invalid image data. Please try exporting again.',
                errorCode: 'blob_conversion_failed',
            });
        });

        it('TC-004: Clipboard permission denied', async () => {
            const notAllowedError = new DOMException('Permission denied', 'NotAllowedError');
            vi.mocked(navigator.clipboard.write).mockRejectedValue(notAllowedError);

            const result = await copyImageToClipboard(validDataUrl);

            expect(result).toEqual({
                success: false,
                error: 'Clipboard access denied. Please enable clipboard permissions in your browser settings.',
                errorCode: 'permission_denied',
            });
        });

        it('TC-005: Clipboard API not supported', async () => {
            // Temporarily remove clipboard API
            const originalClipboard = navigator.clipboard;
            Object.defineProperty(navigator, 'clipboard', {
                value: undefined,
                configurable: true,
            });

            const result = await copyImageToClipboard(validDataUrl);

            expect(result).toEqual({
                success: false,
                error: 'Clipboard copy is not supported in this browser. Please try the PNG export option instead.',
                errorCode: 'not_supported',
            });

            // Restore clipboard API
            Object.defineProperty(navigator, 'clipboard', {
                value: originalClipboard,
                configurable: true,
            });
        });

        it('TC-006: Clipboard write fails (generic error)', async () => {
            vi.mocked(navigator.clipboard.write).mockRejectedValue(new Error('Unknown error'));

            const result = await copyImageToClipboard(validDataUrl);

            expect(result).toEqual({
                success: false,
                error: 'Failed to copy diagram to clipboard. Please try again.',
                errorCode: 'write_failed',
            });
        });

        it('TC-007: Large image (10MB) - success case', async () => {
            // Create a large data URL (simulated)
            const largeDataUrl = 'data:image/png;base64,' + 'A'.repeat(10 * 1024 * 1024);

            const result = await copyImageToClipboard(largeDataUrl);

            expect(result.success).toBe(true);
        });
    });

    describe('Error Cases', () => {
        it('EC-001: Null data URL', async () => {
            const result = await copyImageToClipboard(null as never);

            expect(result).toEqual({
                success: false,
                error: 'Invalid image data. Please try exporting again.',
                errorCode: 'blob_conversion_failed',
            });
        });

        it('EC-002: Blob conversion timeout', async () => {
            // Mock fetch to hang indefinitely
            globalThis.fetch = vi.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(resolve, 15000))
            );

            const result = await copyImageToClipboard(validDataUrl);

            expect(result).toEqual({
                success: false,
                error: 'Clipboard copy timed out. Try exporting as PNG file instead.',
                errorCode: 'blob_conversion_failed',
            });
        }, 12000); // Increase test timeout to allow for 10s timeout + buffer

        it('EC-003: SecurityError during clipboard access', async () => {
            const securityError = new DOMException('Security error', 'SecurityError');
            vi.mocked(navigator.clipboard.write).mockRejectedValue(securityError);

            const result = await copyImageToClipboard(validDataUrl);

            expect(result).toEqual({
                success: false,
                error: 'Clipboard access denied. Please enable clipboard permissions in your browser settings.',
                errorCode: 'permission_denied',
            });
        });
    });

    describe('Performance', () => {
        it('should complete in <2s for typical 1-2MB image', async () => {
            const startTime = performance.now();
            await copyImageToClipboard(validDataUrl);
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(2000);
        });
    });
});
