/**
 * Use Persistence Controller Hook
 *
 * React hook for accessing PersistenceController from context
 */

import { useContext } from "react";
import { PersistenceControllerContext } from "./PersistenceControllerContext";

/**
 * Hook to access PersistenceController from context
 *
 * @returns PersistenceController instance or null if not initialized
 */
export function usePersistenceController() {
    return useContext(PersistenceControllerContext);
}
