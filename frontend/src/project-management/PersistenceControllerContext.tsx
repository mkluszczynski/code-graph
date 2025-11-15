/**
 * Persistence Controller Context
 *
 * React context for accessing PersistenceController throughout the application
 */

import { createContext } from "react";
import type { PersistenceController } from "./PersistenceController";

/**
 * Context for PersistenceController instance
 */
export const PersistenceControllerContext = createContext<PersistenceController | null>(
    null
);

/**
 * Display name for React DevTools
 */
PersistenceControllerContext.displayName = "PersistenceControllerContext";
