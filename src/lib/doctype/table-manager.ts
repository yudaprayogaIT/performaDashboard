// src/lib/doctype/table-manager.ts

import prisma from "@/lib/prisma";
import { DocTypeFieldInfo, fieldTypeToSQL, TableOperationResult } from "./types";
import { FieldType } from "@prisma/client";

/**
 * Sanitize identifier (table/column name) to prevent SQL injection
 * Only allows alphanumeric and underscore
 */
function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "");
}

/**
 * TableManager - Manages dynamic table creation, modification, and deletion
 */
export class TableManager {
  /**
   * Create a new table based on DocType configuration
   */
  async createTable(
    tableName: string,
    fields: DocTypeFieldInfo[]
  ): Promise<TableOperationResult> {
    try {
      const safeTableName = sanitizeIdentifier(tableName);

      // Build column definitions
      const columnDefs: string[] = [
        "id BIGINT AUTO_INCREMENT PRIMARY KEY",
      ];

      // Add user-defined columns
      for (const field of fields) {
        const columnDef = this.buildColumnDefinition(field);
        columnDefs.push(columnDef);
      }

      // Add system columns
      columnDefs.push("created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
      columnDefs.push("created_by INT");
      columnDefs.push(
        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      );
      columnDefs.push("updated_by INT");

      // Build foreign key constraints for REFERENCE fields
      const foreignKeys: string[] = [];
      for (const field of fields) {
        if (field.fieldType === "REFERENCE" && field.referenceTable) {
          const safeFieldName = sanitizeIdentifier(field.fieldName);
          const safeRefTable = sanitizeIdentifier(field.referenceTable);
          const safeRefField = sanitizeIdentifier(
            field.referenceField || "id"
          );
          foreignKeys.push(
            `FOREIGN KEY (${safeFieldName}) REFERENCES ${safeRefTable}(${safeRefField})`
          );
        }
      }

      // Build indexes
      const indexes: string[] = [];
      for (const field of fields) {
        if (field.isUnique) {
          const safeFieldName = sanitizeIdentifier(field.fieldName);
          indexes.push(`UNIQUE INDEX idx_${safeFieldName} (${safeFieldName})`);
        } else if (field.fieldType === "DATE" || field.fieldType === "DATETIME") {
          const safeFieldName = sanitizeIdentifier(field.fieldName);
          indexes.push(`INDEX idx_${safeFieldName} (${safeFieldName})`);
        } else if (field.fieldType === "REFERENCE") {
          const safeFieldName = sanitizeIdentifier(field.fieldName);
          indexes.push(`INDEX idx_${safeFieldName} (${safeFieldName})`);
        }
      }

      // Combine all parts
      const allDefs = [...columnDefs, ...foreignKeys, ...indexes];

      const sql = `CREATE TABLE IF NOT EXISTS ${safeTableName} (
        ${allDefs.join(",\n        ")}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

      await prisma.$executeRawUnsafe(sql);

      return { success: true, message: `Table ${safeTableName} created successfully` };
    } catch (error) {
      console.error("Error creating table:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Build column definition SQL
   */
  private buildColumnDefinition(field: DocTypeFieldInfo): string {
    const safeFieldName = sanitizeIdentifier(field.fieldName);
    const sqlType = fieldTypeToSQL(field.fieldType, {
      precision: 20,
      scale: 2,
      length: 255,
    });

    let def = `${safeFieldName} ${sqlType}`;

    if (field.isRequired) {
      def += " NOT NULL";
    }

    if (field.defaultValue !== null && field.defaultValue !== undefined) {
      // Handle different types of default values
      if (field.fieldType === "BOOLEAN") {
        def += ` DEFAULT ${field.defaultValue === "true" ? 1 : 0}`;
      } else if (
        field.fieldType === "NUMBER" ||
        field.fieldType === "CURRENCY"
      ) {
        def += ` DEFAULT ${parseFloat(field.defaultValue) || 0}`;
      } else {
        def += ` DEFAULT '${field.defaultValue.replace(/'/g, "''")}'`;
      }
    }

    return def;
  }

  /**
   * Add a new column to an existing table
   */
  async addColumn(
    tableName: string,
    field: DocTypeFieldInfo
  ): Promise<TableOperationResult> {
    try {
      const safeTableName = sanitizeIdentifier(tableName);
      const columnDef = this.buildColumnDefinition(field);

      const sql = `ALTER TABLE ${safeTableName} ADD COLUMN ${columnDef}`;
      await prisma.$executeRawUnsafe(sql);

      // Add foreign key if REFERENCE type
      if (field.fieldType === "REFERENCE" && field.referenceTable) {
        const safeFieldName = sanitizeIdentifier(field.fieldName);
        const safeRefTable = sanitizeIdentifier(field.referenceTable);
        const safeRefField = sanitizeIdentifier(field.referenceField || "id");
        const fkName = `fk_${safeTableName}_${safeFieldName}`;

        const fkSql = `ALTER TABLE ${safeTableName}
          ADD CONSTRAINT ${fkName}
          FOREIGN KEY (${safeFieldName})
          REFERENCES ${safeRefTable}(${safeRefField})`;

        await prisma.$executeRawUnsafe(fkSql);
      }

      // Add index for searchable fields
      if (
        field.fieldType === "DATE" ||
        field.fieldType === "DATETIME" ||
        field.fieldType === "REFERENCE"
      ) {
        const safeFieldName = sanitizeIdentifier(field.fieldName);
        const indexSql = `ALTER TABLE ${safeTableName}
          ADD INDEX idx_${safeFieldName} (${safeFieldName})`;
        await prisma.$executeRawUnsafe(indexSql);
      }

      return {
        success: true,
        message: `Column ${field.fieldName} added successfully`,
      };
    } catch (error) {
      console.error("Error adding column:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Modify an existing column
   * Note: This is a destructive operation - data might be lost if types are incompatible
   */
  async alterColumn(
    tableName: string,
    field: DocTypeFieldInfo
  ): Promise<TableOperationResult> {
    try {
      const safeTableName = sanitizeIdentifier(tableName);
      const columnDef = this.buildColumnDefinition(field);

      const sql = `ALTER TABLE ${safeTableName} MODIFY COLUMN ${columnDef}`;
      await prisma.$executeRawUnsafe(sql);

      return {
        success: true,
        message: `Column ${field.fieldName} modified successfully`,
      };
    } catch (error) {
      console.error("Error modifying column:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Drop a column from the table
   */
  async dropColumn(
    tableName: string,
    fieldName: string
  ): Promise<TableOperationResult> {
    try {
      const safeTableName = sanitizeIdentifier(tableName);
      const safeFieldName = sanitizeIdentifier(fieldName);

      // First drop any foreign key constraints
      const fkName = `fk_${safeTableName}_${safeFieldName}`;
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE ${safeTableName} DROP FOREIGN KEY ${fkName}`
        );
      } catch {
        // Foreign key might not exist, ignore
      }

      // Drop indexes
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE ${safeTableName} DROP INDEX idx_${safeFieldName}`
        );
      } catch {
        // Index might not exist, ignore
      }

      // Drop the column
      const sql = `ALTER TABLE ${safeTableName} DROP COLUMN ${safeFieldName}`;
      await prisma.$executeRawUnsafe(sql);

      return {
        success: true,
        message: `Column ${fieldName} dropped successfully`,
      };
    } catch (error) {
      console.error("Error dropping column:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Rename a column
   */
  async renameColumn(
    tableName: string,
    oldName: string,
    newName: string,
    fieldType: FieldType
  ): Promise<TableOperationResult> {
    try {
      const safeTableName = sanitizeIdentifier(tableName);
      const safeOldName = sanitizeIdentifier(oldName);
      const safeNewName = sanitizeIdentifier(newName);
      const sqlType = fieldTypeToSQL(fieldType);

      const sql = `ALTER TABLE ${safeTableName}
        CHANGE COLUMN ${safeOldName} ${safeNewName} ${sqlType}`;
      await prisma.$executeRawUnsafe(sql);

      return {
        success: true,
        message: `Column renamed from ${oldName} to ${newName}`,
      };
    } catch (error) {
      console.error("Error renaming column:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Drop entire table
   */
  async dropTable(tableName: string): Promise<TableOperationResult> {
    try {
      const safeTableName = sanitizeIdentifier(tableName);

      const sql = `DROP TABLE IF EXISTS ${safeTableName}`;
      await prisma.$executeRawUnsafe(sql);

      return { success: true, message: `Table ${safeTableName} dropped successfully` };
    } catch (error) {
      console.error("Error dropping table:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const safeTableName = sanitizeIdentifier(tableName);

      const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        safeTableName
      );

      return Number(result[0]?.count) > 0;
    } catch (error) {
      console.error("Error checking table existence:", error);
      return false;
    }
  }

  /**
   * Get column info from existing table
   */
  async getTableColumns(
    tableName: string
  ): Promise<{ name: string; type: string; nullable: boolean }[]> {
    try {
      const safeTableName = sanitizeIdentifier(tableName);

      const columns = await prisma.$queryRawUnsafe<
        { COLUMN_NAME: string; DATA_TYPE: string; IS_NULLABLE: string }[]
      >(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        safeTableName
      );

      return columns.map((col) => ({
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE,
        nullable: col.IS_NULLABLE === "YES",
      }));
    } catch (error) {
      console.error("Error getting table columns:", error);
      return [];
    }
  }

  /**
   * Rename table (used for migration)
   */
  async renameTable(
    oldName: string,
    newName: string
  ): Promise<TableOperationResult> {
    try {
      const safeOldName = sanitizeIdentifier(oldName);
      const safeNewName = sanitizeIdentifier(newName);

      const sql = `RENAME TABLE ${safeOldName} TO ${safeNewName}`;
      await prisma.$executeRawUnsafe(sql);

      return {
        success: true,
        message: `Table renamed from ${oldName} to ${newName}`,
      };
    } catch (error) {
      console.error("Error renaming table:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const tableManager = new TableManager();
