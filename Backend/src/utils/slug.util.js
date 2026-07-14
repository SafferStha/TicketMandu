'use strict';

const slugify = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 180) || `item-${Date.now()}`;

module.exports = { slugify };
