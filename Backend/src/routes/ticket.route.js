"use strict";

const express = require("express");
const router = express.Router();

const ticketController = require("../controllers/ticket.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { checkInSchema } = require("../validators/ticket-admin.validator");

// All ticket routes require authentication
router.use(authenticate);

// Specific routes must be declared before /:id routes.
router.get("/stats", ticketController.getStats);
router.get("/my", ticketController.getMyTickets);
router.patch("/check-in", validate(checkInSchema), ticketController.checkIn);

router.get("/", ticketController.listTickets);
router.get("/:id", ticketController.getTicket);
router.patch("/:id/cancel", ticketController.cancelTicket);
router.patch(
  "/:id/check-in",
  validate(checkInSchema),
  ticketController.checkIn,
);

module.exports = router;
