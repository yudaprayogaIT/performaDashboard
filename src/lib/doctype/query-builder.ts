// src/lib/doctype/query-builder.ts

import prisma from "@/lib/prisma";
import {
  QueryOptions,
  WhereClause,
  OrderByClause,
  AggregateOptions,
} from "./types";

/**
 * Sanitize identifier (table/column name) to prevent SQL injection
 */
function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "");
}

/**
 * QueryBuilder - Dynamic SQL query builder for DocType tables
 */
export class QueryBuilder {
  /**
   * Build WHERE clause from WhereClause object
   */
  private buildWhereClause(
    where: WhereClause
  ): { sql: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    for (const [field, value] of Object.entries(where)) {
      const safeField = sanitizeIdentifier(field);

      if (value === null) {
        conditions.push(`${safeField} IS NULL`);
      } else if (typeof value === "object" && !Array.isArray(value)) {
        // Handle comparison operators
        if ("gte" in value && value.gte !== undefined) {
          conditions.push(`${safeField} >= ?`);
          params.push(value.gte);
        }
        if ("lte" in value && value.lte !== undefined) {
          conditions.push(`${safeField} <= ?`);
          params.push(value.lte);
        }
        if ("gt" in value && value.gt !== undefined) {
          conditions.push(`${safeField} > ?`);
          params.push(value.gt);
        }
        if ("lt" in value && value.lt !== undefined) {
          conditions.push(`${safeField} < ?`);
          params.push(value.lt);
        }
        if ("in" in value && value.in !== undefined) {
          const placeholders = value.in.map(() => "?").join(", ");
          conditions.push(`${safeField} IN (${placeholders})`);
          params.push(...value.in);
        }
        if ("like" in value && value.like !== undefined) {
          conditions.push(`${safeField} LIKE ?`);
          params.push(value.like);
        }
      } else {
        conditions.push(`${safeField} = ?`);
        params.push(value);
      }
    }

    return {
      sql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      params,
    };
  }

  /**
   * Build ORDER BY clause
   */
  private buildOrderByClause(orderBy: OrderByClause): string {
    const parts: string[] = [];

    for (const [field, direction] of Object.entries(orderBy)) {
      const safeField = sanitizeIdentifier(field);
      const safeDirection = direction === "DESC" ? "DESC" : "ASC";
      parts.push(`${safeField} ${safeDirection}`);
    }

    return parts.length > 0 ? `ORDER BY ${parts.join(", ")}` : "";
  }

  /**
   * Find multiple records with filters, sorting, and pagination
   */
  async findMany<T = Record<string, any>>(
    tableName: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const safeTableName = sanitizeIdentifier(tableName);
    const { where, orderBy, limit, offset, select } = options;

    // Build SELECT clause
    const selectClause =
      select && select.length > 0
        ? select.map((f) => sanitizeIdentifier(f)).join(", ")
        : "*";

    // Build WHERE clause
    const whereResult = where
      ? this.buildWhereClause(where)
      : { sql: "", params: [] };

    // Build ORDER BY clause
    const orderByClause = orderBy ? this.buildOrderByClause(orderBy) : "";

    // Build LIMIT/OFFSET clause
    let limitClause = "";
    if (limit !== undefined) {
      limitClause = `LIMIT ${parseInt(String(limit), 10)}`;
      if (offset !== undefined) {
        limitClause += ` OFFSET ${parseInt(String(offset), 10)}`;
      }
    }

    const sql = `SELECT ${selectClause} FROM ${safeTableName}
      ${whereResult.sql}
      ${orderByClause}
      ${limitClause}`.trim();

    const result = await prisma.$queryRawUnsafe<T[]>(sql, ...whereResult.params);

    return result;
  }

  /**
   * Find a single record by ID
   */
  async findById<T = Record<string, any>>(
    tableName: string,
    id: number | bigint
  ): Promise<T | null> {
    const results = await this.findMany<T>(tableName, {
      where: { id },
      limit: 1,
    });

    return results[0] || null;
  }

  /**
   * Find first record matching criteria
   */
  async findFirst<T = Record<string, any>>(
    tableName: string,
    options: QueryOptions = {}
  ): Promise<T | null> {
    const results = await this.findMany<T>(tableName, {
      ...options,
      limit: 1,
    });

    return results[0] || null;
  }

  /**
   * Count records
   */
  async count(tableName: string, where?: WhereClause): Promise<number> {
    const safeTableName = sanitizeIdentifier(tableName);

    const whereResult = where
      ? this.buildWhereClause(where)
      : { sql: "", params: [] };

    const sql = `SELECT COUNT(*) as count FROM ${safeTableName} ${whereResult.sql}`;

    const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      sql,
      ...whereResult.params
    );

    return Number(result[0]?.count || 0);
  }

  /**
   * Insert a single record
   */
  async insert(
    tableName: string,
    data: Record<string, any>
  ): Promise<{ insertId: number }> {
    const safeTableName = sanitizeIdentifier(tableName);

    const fields: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];

    for (const [field, value] of Object.entries(data)) {
      fields.push(sanitizeIdentifier(field));
      placeholders.push("?");
      values.push(value);
    }

    const sql = `INSERT INTO ${safeTableName} (${fields.join(", ")})
      VALUES (${placeholders.join(", ")})`;

    await prisma.$executeRawUnsafe(sql, ...values);

    // Get last insert ID
    const result = await prisma.$queryRawUnsafe<{ id: bigint }[]>(
      "SELECT LAST_INSERT_ID() as id"
    );

    return { insertId: Number(result[0]?.id || 0) };
  }

  /**
   * Insert multiple records (batch)
   */
  async insertMany(
    tableName: string,
    data: Record<string, any>[]
  ): Promise<number> {
    if (data.length === 0) return 0;

    const safeTableName = sanitizeIdentifier(tableName);

    // Get fields from first record
    const fields = Object.keys(data[0]).map((f) => sanitizeIdentifier(f));

    // Build value rows
    const valuePlaceholders: string[] = [];
    const allValues: any[] = [];

    for (const row of data) {
      const rowPlaceholders: string[] = [];
      for (const field of Object.keys(data[0])) {
        rowPlaceholders.push("?");
        allValues.push(row[field] ?? null);
      }
      valuePlaceholders.push(`(${rowPlaceholders.join(", ")})`);
    }

    const sql = `INSERT INTO ${safeTableName} (${fields.join(", ")})
      VALUES ${valuePlaceholders.join(", ")}`;

    const result = await prisma.$executeRawUnsafe(sql, ...allValues);

    return result;
  }

  /**
   * Update a single record by ID
   */
  async update(
    tableName: string,
    id: number | bigint,
    data: Record<string, any>
  ): Promise<number> {
    const safeTableName = sanitizeIdentifier(tableName);

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const [field, value] of Object.entries(data)) {
      setClauses.push(`${sanitizeIdentifier(field)} = ?`);
      values.push(value);
    }

    values.push(id);

    const sql = `UPDATE ${safeTableName}
      SET ${setClauses.join(", ")}
      WHERE id = ?`;

    const result = await prisma.$executeRawUnsafe(sql, ...values);

    return result;
  }

  /**
   * Update multiple records matching where clause
   */
  async updateMany(
    tableName: string,
    where: WhereClause,
    data: Record<string, any>
  ): Promise<number> {
    const safeTableName = sanitizeIdentifier(tableName);

    const setClauses: string[] = [];
    const setValues: any[] = [];

    for (const [field, value] of Object.entries(data)) {
      setClauses.push(`${sanitizeIdentifier(field)} = ?`);
      setValues.push(value);
    }

    const whereResult = this.buildWhereClause(where);

    const sql = `UPDATE ${safeTableName}
      SET ${setClauses.join(", ")}
      ${whereResult.sql}`;

    const result = await prisma.$executeRawUnsafe(
      sql,
      ...setValues,
      ...whereResult.params
    );

    return result;
  }

  /**
   * Delete a single record by ID
   */
  async delete(tableName: string, id: number | bigint): Promise<number> {
    const safeTableName = sanitizeIdentifier(tableName);

    const sql = `DELETE FROM ${safeTableName} WHERE id = ?`;

    const result = await prisma.$executeRawUnsafe(sql, id);

    return result;
  }

  /**
   * Delete multiple records matching where clause
   */
  async deleteMany(tableName: string, where: WhereClause): Promise<number> {
    const safeTableName = sanitizeIdentifier(tableName);

    const whereResult = this.buildWhereClause(where);

    if (!whereResult.sql) {
      throw new Error("WHERE clause is required for deleteMany");
    }

    const sql = `DELETE FROM ${safeTableName} ${whereResult.sql}`;

    const result = await prisma.$executeRawUnsafe(sql, ...whereResult.params);

    return result;
  }

  /**
   * Aggregate functions (SUM, AVG, COUNT, MIN, MAX)
   */
  async aggregate(
    tableName: string,
    options: AggregateOptions
  ): Promise<Record<string, any>[]> {
    const safeTableName = sanitizeIdentifier(tableName);
    const { where, groupBy, sum, avg, count, min, max } = options;

    const selectParts: string[] = [];

    // Group by columns
    if (groupBy && groupBy.length > 0) {
      for (const field of groupBy) {
        selectParts.push(sanitizeIdentifier(field));
      }
    }

    // SUM
    if (sum && sum.length > 0) {
      for (const field of sum) {
        const safeField = sanitizeIdentifier(field);
        selectParts.push(`SUM(${safeField}) as sum_${safeField}`);
      }
    }

    // AVG
    if (avg && avg.length > 0) {
      for (const field of avg) {
        const safeField = sanitizeIdentifier(field);
        selectParts.push(`AVG(${safeField}) as avg_${safeField}`);
      }
    }

    // COUNT
    if (count) {
      if (typeof count === "string") {
        const safeField = sanitizeIdentifier(count);
        selectParts.push(`COUNT(${safeField}) as count_${safeField}`);
      } else {
        selectParts.push("COUNT(*) as count");
      }
    }

    // MIN
    if (min && min.length > 0) {
      for (const field of min) {
        const safeField = sanitizeIdentifier(field);
        selectParts.push(`MIN(${safeField}) as min_${safeField}`);
      }
    }

    // MAX
    if (max && max.length > 0) {
      for (const field of max) {
        const safeField = sanitizeIdentifier(field);
        selectParts.push(`MAX(${safeField}) as max_${safeField}`);
      }
    }

    if (selectParts.length === 0) {
      selectParts.push("COUNT(*) as count");
    }

    // Build WHERE clause
    const whereResult = where
      ? this.buildWhereClause(where)
      : { sql: "", params: [] };

    // Build GROUP BY clause
    const groupByClause =
      groupBy && groupBy.length > 0
        ? `GROUP BY ${groupBy.map((f) => sanitizeIdentifier(f)).join(", ")}`
        : "";

    const sql = `SELECT ${selectParts.join(", ")}
      FROM ${safeTableName}
      ${whereResult.sql}
      ${groupByClause}`;

    const result = await prisma.$queryRawUnsafe<Record<string, any>[]>(
      sql,
      ...whereResult.params
    );

    // Convert BigInt to Number in results
    return result.map((row) => {
      const converted: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        converted[key] = typeof value === "bigint" ? Number(value) : value;
      }
      return converted;
    });
  }

  /**
   * Execute raw SQL query
   */
  async raw<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    return prisma.$queryRawUnsafe<T[]>(sql, ...params);
  }

  /**
   * Execute raw SQL command (INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, ...params: any[]): Promise<number> {
    return prisma.$executeRawUnsafe(sql, ...params);
  }
}

// Export singleton instance
export const queryBuilder = new QueryBuilder();
