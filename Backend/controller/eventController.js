const {
  getAllEvents,
  getFeaturedEvents,
  getEventById,
  searchEvents,
} = require('../model/eventModel');

const getAll = async (req, res) => {
  try {
    const events = await getAllEvents();
    res.status(200).json({ message: 'success', events });
  } catch (e) {
    res.status(500).json({ message: 'Internal server error', error: e.message });
  }
};

const getFeatured = async (req, res) => {
  try {
    const events = await getFeaturedEvents();
    res.status(200).json({ message: 'success', events });
  } catch (e) {
    res.status(500).json({ message: 'Internal server error', error: e.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await getEventById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: 'success', event });
  } catch (e) {
    res.status(500).json({ message: 'Internal server error', error: e.message });
  }
};

const search = async (req, res) => {
  try {
    const { q, category } = req.query;
    const events = await searchEvents(q, category);
    res.status(200).json({ message: 'success', events });
  } catch (e) {
    res.status(500).json({ message: 'Internal server error', error: e.message });
  }
};

module.exports = { getAll, getFeatured, getById, search };
