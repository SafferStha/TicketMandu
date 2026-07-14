"use strict";

const db = require("../config/db");

const EVENT_SELECT_FIELDS = `
  e.id AS id,
  e.name AS name,
  e.date AS date,
  e.time AS time,
  e.venue AS venue,
  e.slug AS slug,
  e.price AS price,
  e.category AS category,
  e.icon AS icon,
  e.featured AS featured,
  e.featured_bg AS featured_bg,
  e.description AS description,
  e.cover_image_url AS cover_image_url,
  e.starts_at AS starts_at,
  e.ends_at AS ends_at,
  e.status AS status,
  e.organizer_id AS organizer_id,
  e.venue_id AS venue_id,
  o.organization_name AS organizer_name,
  e.total_capacity AS total_capacity,
  e.tickets_sold AS tickets_sold,
  e.created_at AS created_at,
  e.updated_at AS updated_at
`;

const mapEvent = (row) => ({
  id: row.id,
  name: row.name,
  date: row.date,
  time: row.time,
  venue: row.venue,
  slug: row.slug,
  price: parseFloat(row.price),
  category: row.category,
  icon: row.icon,
  featured: row.featured,
  featuredBg: row.featured_bg,
  description: row.description,
  coverImageUrl: row.cover_image_url,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  status: row.status,
  organizerId: row.organizer_id,
  venueId: row.venue_id,
  organizerName: row.organizer_name,
  totalCapacity: row.total_capacity,
  ticketsSold: row.tickets_sold,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const findAll = async ({
  limit = 20,
  offset = 0,
  sort = "created_at",
  order = "desc",
  q = "",
  category = "",
  status = "published",
  featured,
  minPrice,
  maxPrice,
  dateFrom,
  dateTo,
  scope = "public",
} = {}) => {
  const allowedSorts = {
    date: "e.date",
    price: "e.price",
    name: "e.name",
    created_at: "e.created_at",
  };
  const col = allowedSorts[sort] || "e.created_at";
  const dir = order === "asc" ? "ASC" : "DESC";
  const conditions = ["e.deleted_at IS NULL"];
  const params = [];
  let idx = 1;

  if (scope !== "all") {
    conditions.push(`e.status = $${idx}`);
    params.push(status || "published");
    idx += 1;
  }

  if (q) {
    conditions.push(
      `(LOWER(e.name) LIKE $${idx} OR LOWER(e.venue) LIKE $${idx} OR LOWER(e.category) LIKE $${idx})`,
    );
    params.push(`%${String(q).toLowerCase()}%`);
    idx += 1;
  }

  if (category && category !== "all") {
    conditions.push(`LOWER(e.category) = $${idx}`);
    params.push(String(category).toLowerCase());
    idx += 1;
  }

  if (featured !== undefined && featured !== "") {
    conditions.push(`e.featured = $${idx}`);
    params.push(featured === true || featured === "true");
    idx += 1;
  }

  if (minPrice !== undefined && minPrice !== "") {
    conditions.push(`e.price >= $${idx}`);
    params.push(minPrice);
    idx += 1;
  }

  if (maxPrice !== undefined && maxPrice !== "") {
    conditions.push(`e.price <= $${idx}`);
    params.push(maxPrice);
    idx += 1;
  }

  if (dateFrom) {
    conditions.push(
      `(e.starts_at::date >= $${idx}::date OR e.date >= $${idx})`,
    );
    params.push(dateFrom);
    idx += 1;
  }

  if (dateTo) {
    conditions.push(
      `(e.starts_at::date <= $${idx}::date OR e.date <= $${idx})`,
    );
    params.push(dateTo);
    idx += 1;
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const { rows } = await db.query(
    `SELECT ${EVENT_SELECT_FIELDS} FROM events e LEFT JOIN organizers o ON o.id = e.organizer_id ${where} ORDER BY ${col} ${dir} LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset],
  );
  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) FROM events e LEFT JOIN organizers o ON o.id = e.organizer_id ${where}`,
    params,
  );

  return {
    events: rows.map(mapEvent),
    total: parseInt(countRows[0].count, 10),
  };
};

const findFeatured = async (limit = 10) => {
  const { rows } = await db.query(
    `SELECT ${EVENT_SELECT_FIELDS} FROM events e LEFT JOIN organizers o ON o.id = e.organizer_id WHERE e.deleted_at IS NULL AND e.status = 'published' AND e.featured = true ORDER BY e.created_at DESC LIMIT $1`,
    [limit],
  );
  return rows.map(mapEvent);
};

const findById = async (id) => {
  const { rows } = await db.query(
    `SELECT ${EVENT_SELECT_FIELDS} FROM events e LEFT JOIN organizers o ON o.id = e.organizer_id WHERE e.id = $1 AND e.deleted_at IS NULL LIMIT 1`,
    [id],
  );
  return rows[0] ? mapEvent(rows[0]) : null;
};

const findTicketTypesByEventId = async (eventId) => {
  const { rows } = await db.query(
    `SELECT tt.* FROM ticket_types tt WHERE tt.event_id = $1 AND tt.is_active = true ORDER BY tt.sort_order ASC, tt.id ASC`,
    [eventId],
  );
  return rows;
};

const search = async (filters = {}) => findAll({ ...filters, scope: "all" });

const create = async ({
  name,
  date,
  time,
  venue,
  price,
  category,
  icon,
  featured,
  featured_bg,
  description,
  cover_image_url,
  starts_at,
  ends_at,
  status = "draft",
  organizer_id = null,
  venue_id = null,
}) => {
  const { rows } = await db.query(
    `INSERT INTO events (name, date, time, venue, price, category, icon, featured, featured_bg, description, cover_image_url, starts_at, ends_at, status, organizer_id, venue_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      name,
      date,
      time,
      venue,
      price,
      category,
      icon || "🎫",
      featured || false,
      featured_bg || null,
      description || null,
      cover_image_url || null,
      starts_at || null,
      ends_at || null,
      status,
      organizer_id,
      venue_id,
    ],
  );
  return mapEvent(rows[0]);
};

const updateById = async (id, fields) => {
  const allowed = [
    "name",
    "date",
    "time",
    "venue",
    "price",
    "category",
    "icon",
    "featured",
    "featured_bg",
    "description",
    "cover_image_url",
    "starts_at",
    "ends_at",
    "status",
    "organizer_id",
    "venue_id",
    "total_capacity",
  ];
  const entries = Object.entries(fields).filter(
    ([k, v]) => allowed.includes(k) && v !== undefined,
  );
  if (entries.length === 0) return findById(id);

  const setClauses = entries.map(([col], i) => `${col} = $${i + 2}`).join(", ");
  const values = entries.map(([, v]) => v);

  const { rows } = await db.query(
    `UPDATE events SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return rows[0] ? mapEvent(rows[0]) : null;
};

const deleteById = async (id) => {
  await db.query(
    "UPDATE events SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1",
    [id],
  );
};

module.exports = {
  findAll,
  findFeatured,
  findById,
  findTicketTypesByEventId,
  search,
  create,
  updateById,
  deleteById,
};
