/**
 * TypeScript Parser Module
 * 
 * Exports all TypeScript parser components for use in the unified parsers module.
 */

// Main parser class and function
export { TypeScriptParser, parse } from './TypeScriptParser';

// Extractors
export { extractClassInfo } from './ClassExtractor';
export { extractInterfaceInfo } from './InterfaceExtractor';
export { extractProperties } from './PropertyExtractor';
export { extractMethods } from './MethodExtractor';

// Relationship analysis
export { extractRelationships, detectInheritance, detectImplementation, detectAssociation } from './RelationshipAnalyzer';
