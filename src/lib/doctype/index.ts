// src/lib/doctype/index.ts

// Export types
export * from "./types";

// Export table manager
export { TableManager, tableManager } from "./table-manager";

// Export query builder
export { QueryBuilder, queryBuilder } from "./query-builder";

// Export validator
export { DocTypeValidator, canUploadNow, getDocTypeBySlug } from "./validator";
