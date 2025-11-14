/**
 * Application-Wide Constants
 * 
 * Centralized configuration values used across the application.
 * These constants provide a single source of truth for magic numbers
 * and configuration settings.
 */

// ============================================================================
// Editor Configuration
// ============================================================================

/**
 * Debounce delay for code parsing (milliseconds)
 * 
 * How long to wait after the user stops typing before parsing the code.
 * This prevents excessive parsing during active typing.
 */
export const EDITOR_DEBOUNCE_DELAY_MS = 500;

/**
 * Editor font size (pixels)
 */
export const EDITOR_FONT_SIZE = 14;

/**
 * Tab size for editor (spaces)
 */
export const EDITOR_TAB_SIZE = 2;

// ============================================================================
// Diagram Layout Configuration
// ============================================================================

/**
 * Minimum node width for UML class boxes (pixels)
 */
export const DIAGRAM_MIN_NODE_WIDTH = 150;

/**
 * Minimum node height for UML class boxes (pixels)
 */
export const DIAGRAM_MIN_NODE_HEIGHT = 80;

/**
 * Approximate character width for calculating node dimensions (pixels)
 */
export const DIAGRAM_CHAR_WIDTH = 8;

/**
 * Header height for UML class boxes (includes name and stereotype) (pixels)
 */
export const DIAGRAM_HEADER_HEIGHT = 60;

/**
 * Height per member (property or method) in UML class boxes (pixels)
 */
export const DIAGRAM_MEMBER_HEIGHT = 20;

/**
 * Horizontal spacing between nodes in grid layout (pixels)
 */
export const DIAGRAM_NODE_SPACING = 300;

/**
 * Horizontal spacing between nodes in dagre layout (pixels)
 */
export const DIAGRAM_DAGRE_NODESEP = 50;

/**
 * Vertical spacing between ranks in dagre layout (pixels)
 */
export const DIAGRAM_DAGRE_RANKSEP = 100;

/**
 * Padding for fit-view operation (ratio)
 */
export const DIAGRAM_FIT_VIEW_PADDING = 0.2;

/**
 * Animation duration for fit-view operation (milliseconds)
 */
export const DIAGRAM_FIT_VIEW_DURATION_MS = 300;

/**
 * Delay before auto-fitting view after layout (milliseconds)
 */
export const DIAGRAM_AUTO_FIT_DELAY_MS = 50;

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Maximum number of performance metrics to keep in memory
 */
export const PERFORMANCE_MAX_METRICS = 100;

/**
 * Threshold for slow operation warning (milliseconds)
 */
export const PERFORMANCE_SLOW_THRESHOLD_MS = 1000;

// ============================================================================
// UI Animation & Interaction
// ============================================================================

/**
 * Default animation duration for UI transitions (milliseconds)
 */
export const UI_ANIMATION_DURATION_MS = 200;

/**
 * Debounce delay for search/filter inputs (milliseconds)
 */
export const UI_SEARCH_DEBOUNCE_MS = 300;

// ============================================================================
// File System
// ============================================================================

/**
 * Default file extension for new TypeScript files
 */
export const FILE_DEFAULT_EXTENSION = '.ts';

/**
 * Maximum file name length (characters)
 */
export const FILE_MAX_NAME_LENGTH = 255;

/**
 * Invalid file name characters (regex pattern)
 */
export const FILE_INVALID_CHARS_PATTERN = /[/\\:*?"<>|]/;

// ============================================================================
// Application Limits
// ============================================================================

/**
 * Maximum number of files in a project (soft limit)
 */
export const APP_MAX_FILES = 50;

/**
 * Maximum number of classes/interfaces per file (soft limit)
 */
export const APP_MAX_ENTITIES_PER_FILE = 30;

/**
 * Maximum number of nodes to render in diagram (performance limit)
 */
export const APP_MAX_DIAGRAM_NODES = 100;
