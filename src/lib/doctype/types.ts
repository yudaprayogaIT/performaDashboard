// src/lib/doctype/types.ts

import { FieldType } from "@prisma/client";

/**
 * DocType with its fields and permissions
 */
export interface DocTypeWithRelations {
  id: number;
  name: string;
  slug: string;
  tableName: string;
  description: string | null;
  icon: string | null;
  uploadDeadlineHour: number | null;
  uploadDeadlineMinute: number;
  isUploadActive: boolean;
  showInDashboard: boolean;
  dashboardOrder: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  fields: DocTypeFieldInfo[];
  permissions?: DocTypePermissionInfo[];
}

/**
 * DocType field information
 */
export interface DocTypeFieldInfo {
  id: number;
  docTypeId: number;
  name: string;
  fieldName: string;
  fieldType: FieldType;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue: string | null;
  options: string[] | null;
  minValue: number | null;
  maxValue: number | null;
  referenceTable: string | null;
  referenceField: string | null;
  excelColumn: string | null;
  sortOrder: number;
  showInList: boolean;
  showInForm: boolean;
}

/**
 * DocType permission information
 */
export interface DocTypePermissionInfo {
  id: number;
  docTypeId: number;
  roleId: number;
  roleName?: string;
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  bypassDeadline: boolean;
}

/**
 * Input for creating a new DocType
 */
export interface CreateDocTypeInput {
  name: string;
  slug?: string; // Auto-generated if not provided
  description?: string;
  icon?: string;
  uploadDeadlineHour?: number | null;
  uploadDeadlineMinute?: number;
  isUploadActive?: boolean;
  showInDashboard?: boolean;
  dashboardOrder?: number;
  fields: CreateDocTypeFieldInput[];
}

/**
 * Input for creating a DocType field
 */
export interface CreateDocTypeFieldInput {
  name: string;
  fieldName: string;
  fieldType: FieldType;
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  referenceTable?: string;
  referenceField?: string;
  excelColumn?: string;
  sortOrder?: number;
  showInList?: boolean;
  showInForm?: boolean;
}

/**
 * Input for updating a DocType
 */
export interface UpdateDocTypeInput {
  name?: string;
  description?: string;
  icon?: string;
  uploadDeadlineHour?: number | null;
  uploadDeadlineMinute?: number;
  isUploadActive?: boolean;
  showInDashboard?: boolean;
  dashboardOrder?: number;
  isActive?: boolean;
}

/**
 * Input for updating a DocType field
 */
export interface UpdateDocTypeFieldInput {
  name?: string;
  fieldType?: FieldType;
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: string | null;
  options?: string[] | null;
  minValue?: number | null;
  maxValue?: number | null;
  referenceTable?: string | null;
  referenceField?: string | null;
  excelColumn?: string | null;
  sortOrder?: number;
  showInList?: boolean;
  showInForm?: boolean;
}

/**
 * Input for setting DocType permissions
 */
export interface SetDocTypePermissionInput {
  roleId: number;
  canView?: boolean;
  canUpload?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  bypassDeadline?: boolean;
}

/**
 * SQL column type mapping
 */
export type SQLColumnType =
  | "INT"
  | "BIGINT"
  | "VARCHAR"
  | "TEXT"
  | "DECIMAL"
  | "DATE"
  | "DATETIME"
  | "BOOLEAN"
  | "TINYINT";

/**
 * Map FieldType to SQL column type
 */
export function fieldTypeToSQL(
  fieldType: FieldType,
  options?: { precision?: number; scale?: number; length?: number }
): string {
  switch (fieldType) {
    case "TEXT":
      return options?.length ? `VARCHAR(${options.length})` : "VARCHAR(255)";
    case "NUMBER":
      return "INT";
    case "CURRENCY":
      return `DECIMAL(${options?.precision || 20}, ${options?.scale || 2})`;
    case "DATE":
      return "DATE";
    case "DATETIME":
      return "DATETIME";
    case "SELECT":
      return options?.length ? `VARCHAR(${options.length})` : "VARCHAR(100)";
    case "BOOLEAN":
      return "TINYINT(1)";
    case "REFERENCE":
      return "INT";
    default:
      return "VARCHAR(255)";
  }
}

/**
 * Query options for dynamic queries
 */
export interface QueryOptions {
  where?: WhereClause;
  orderBy?: OrderByClause;
  limit?: number;
  offset?: number;
  select?: string[];
}

/**
 * Where clause for dynamic queries
 */
export interface WhereClause {
  [field: string]:
    | string
    | number
    | bigint
    | boolean
    | null
    | { gte?: any; lte?: any; gt?: any; lt?: any; in?: any[]; like?: string };
}

/**
 * Order by clause
 */
export interface OrderByClause {
  [field: string]: "ASC" | "DESC";
}

/**
 * Aggregate options
 */
export interface AggregateOptions {
  where?: WhereClause;
  groupBy?: string[];
  sum?: string[];
  avg?: string[];
  count?: string | boolean;
  min?: string[];
  max?: string[];
}

/**
 * Parse result from Excel
 */
export interface ParseResult {
  success: boolean;
  data?: Record<string, any>[];
  errors?: string[];
  rowCount?: number;
}

/**
 * Upload validation result
 */
export interface UploadValidationResult {
  allowed: boolean;
  message?: string;
  deadline?: string;
}

/**
 * Result of table operation
 */
export interface TableOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}
