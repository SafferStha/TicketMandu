'use strict';

/**
 * @fileoverview Pagination utility for TicketMandu.
 *
 * Converts raw query-string page/limit values into safe SQL LIMIT/OFFSET values
 * and provides a `buildMeta` factory for constructing consistent pagination
 * metadata objects to attach to API responses.
 */

/**
 * Build pagination parameters and a metadata builder function.
 *
 * @param {number|string} [page=1]  - 1-based page number (from query string).
 * @param {number|string} [limit=20] - Items per page (from query string).
 * @returns {{
 *   limit: number,
 *   offset: number,
 *   buildMeta: (total: number) => {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number,
 *     hasNext: boolean,
 *     hasPrev: boolean
 *   }
 * }}
 *
 * @example
 * const { limit, offset, buildMeta } = paginate(req.query.page, req.query.limit);
 * const { rows, rowCount } = await db.query(
 *   'SELECT * FROM events ORDER BY id LIMIT $1 OFFSET $2',
 *   [limit, offset]
 * );
 * const { rows: countRows } = await db.query('SELECT COUNT(*) FROM events');
 * const pagination = buildMeta(parseInt(countRows[0].count, 10));
 * return response.paginated(res, rows, pagination);
 */
const paginate = (page = 1, limit = 20) => {
  // Clamp page to [1, ∞).
  const safePage = Math.max(1, parseInt(page, 10) || 1);

  // Clamp limit to [1, 100] to prevent accidentally returning the entire table.
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const offset = (safePage - 1) * safeLimit;

  /**
   * Build the pagination metadata object once you know the total record count.
   *
   * @param {number} total - Total number of records matching the query (before pagination).
   * @returns {{
   *   page: number,
   *   limit: number,
   *   total: number,
   *   totalPages: number,
   *   hasNext: boolean,
   *   hasPrev: boolean
   * }}
   */
  const buildMeta = (total) => {
    const safeTotal = Math.max(0, parseInt(total, 10) || 0);
    const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / safeLimit);
    return {
      page: safePage,
      limit: safeLimit,
      total: safeTotal,
      totalPages,
      hasNext: safePage * safeLimit < safeTotal,
      hasPrev: safePage > 1,
    };
  };

  return { limit: safeLimit, offset, buildMeta };
};

module.exports = { paginate };
