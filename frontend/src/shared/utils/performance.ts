/**
 * Performance Monitoring Utilities
 * 
 * Tracks and logs performance metrics for parsing and diagram generation
 */

export interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private maxMetrics = 100; // Keep last 100 metrics
    private timers: Map<string, number> = new Map();

    /**
     * Start timing an operation
     */
    startTimer(name: string): void {
        this.timers.set(name, performance.now());
    }

    /**
     * End timing an operation and record metric
     */
    endTimer(name: string, metadata?: Record<string, unknown>): number {
        const startTime = this.timers.get(name);

        if (startTime === undefined) {
            console.warn(`No timer found for: ${name}`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.timers.delete(name);

        this.recordMetric({
            name,
            duration,
            timestamp: Date.now(),
            metadata,
        });

        return duration;
    }

    /**
     * Record a performance metric
     */
    private recordMetric(metric: PerformanceMetric): void {
        this.metrics.push(metric);

        // Keep only last N metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift();
        }

        // Log to console (can be disabled in production)
        if (import.meta.env.DEV) {
            console.log(
                `[Performance] ${metric.name}: ${metric.duration.toFixed(2)}ms`,
                metric.metadata
            );
        }
    }

    /**
     * Get all recorded metrics
     */
    getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Get metrics by name
     */
    getMetricsByName(name: string): PerformanceMetric[] {
        return this.metrics.filter((m) => m.name === name);
    }

    /**
     * Get average duration for a named operation
     */
    getAverageDuration(name: string): number {
        const metrics = this.getMetricsByName(name);

        if (metrics.length === 0) return 0;

        const total = metrics.reduce((sum, m) => sum + m.duration, 0);
        return total / metrics.length;
    }

    /**
     * Get statistics for a named operation
     */
    getStatistics(name: string): {
        count: number;
        average: number;
        min: number;
        max: number;
        total: number;
    } {
        const metrics = this.getMetricsByName(name);

        if (metrics.length === 0) {
            return {
                count: 0,
                average: 0,
                min: 0,
                max: 0,
                total: 0,
            };
        }

        const durations = metrics.map((m) => m.duration);
        const total = durations.reduce((sum, d) => sum + d, 0);

        return {
            count: metrics.length,
            average: total / metrics.length,
            min: Math.min(...durations),
            max: Math.max(...durations),
            total,
        };
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics = [];
        this.timers.clear();
    }

    /**
     * Log performance summary
     */
    logSummary(): void {
        const uniqueNames = [...new Set(this.metrics.map((m) => m.name))];

        console.log('=== Performance Summary ===');

        uniqueNames.forEach((name) => {
            const stats = this.getStatistics(name);
            console.log(`\n${name}:`);
            console.log(`  Count: ${stats.count}`);
            console.log(`  Average: ${stats.average.toFixed(2)}ms`);
            console.log(`  Min: ${stats.min.toFixed(2)}ms`);
            console.log(`  Max: ${stats.max.toFixed(2)}ms`);
            console.log(`  Total: ${stats.total.toFixed(2)}ms`);
        });

        console.log('\n===========================');
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator to measure method execution time
 * 
 * Usage: @measurePerformance('Custom Name')
 * 
 * NOTE: Using `any` for target is justified because TypeScript decorators
 * require runtime type information not available at compile time.
 * Constitutional exception: Complexity justified in writing.
 */
export function measurePerformance(name?: string) {
    return function (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        const metricName = name || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = function (...args: unknown[]) {
            performanceMonitor.startTimer(metricName);

            try {
                const result = originalMethod.apply(this, args);

                // Handle async functions
                if (result instanceof Promise) {
                    return result.finally(() => {
                        performanceMonitor.endTimer(metricName);
                    });
                }

                performanceMonitor.endTimer(metricName);
                return result;
            } catch (error) {
                performanceMonitor.endTimer(metricName);
                throw error;
            }
        };

        return descriptor;
    };
}

/**
 * Helper to measure a block of code
 */
export async function measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
): Promise<T> {
    performanceMonitor.startTimer(name);

    try {
        const result = await fn();
        performanceMonitor.endTimer(name, metadata);
        return result;
    } catch (error) {
        performanceMonitor.endTimer(name, metadata);
        throw error;
    }
}

/**
 * Helper to measure synchronous code
 */
export function measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
): T {
    performanceMonitor.startTimer(name);

    try {
        const result = fn();
        performanceMonitor.endTimer(name, metadata);
        return result;
    } catch (error) {
        performanceMonitor.endTimer(name, metadata);
        throw error;
    }
}

/**
 * Export global access for debugging
 * 
 * NOTE: Using `any` to extend window is justified for debugging utilities.
 * Constitutional exception: Complexity justified in writing.
 */
if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__performanceMonitor = performanceMonitor;
}
