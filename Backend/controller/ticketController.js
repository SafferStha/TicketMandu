const { getUserTickets, createTicket, getUserTicketCount } = require('../model/ticketModel');
const { getEventById } = require('../model/eventModel');

const getMyTickets = async (req, res) => {
  try {
    const tickets = await getUserTickets(req.user.id);
    res.status(200).json({ message: 'success', tickets });
  } catch (e) {
    res.status(500).json({ message: 'Internal server error', error: e.message });
  }
};

const bookTicket = async (req, res) => {
  try {
    const { eventId, seat } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required' });
    }
    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const ticket = await createTicket(req.user.id, eventId, seat || 'General Admission');
    res.status(201).json({ message: 'Ticket booked successfully', ticket });
  } catch (e) {
    res.status(500).json({ message: 'Internal server error', error: e.message });
  }
};

const getStats = async (req, res) => {
  try {
    const ticketCount = await getUserTicketCount(req.user.id);
    res.status(200).json({
      message: 'success',
      stats: {
        ticketsCount: ticketCount,
        eventsCount: ticketCount,
        favoritesCount: 0,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Internal server error', error: e.message });
  }
};

module.exports = { getMyTickets, bookTicket, getStats };
