/**
 * Dart Parser Module - Public API
 * 
 * Exports the DartParser class and related utilities for parsing
 * Dart source code and extracting UML entities.
 */

export { DartParser, parse } from './DartParser';
export type { DartNode } from './DartParser';
export { extractClassInfo, extractAbstractClassAsInterface } from './ClassExtractor';
export { extractProperties } from './PropertyExtractor';
export { extractMethods } from './MethodExtractor';
export { extractRelationships } from './RelationshipAnalyzer';
