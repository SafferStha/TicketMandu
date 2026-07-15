"use strict";

const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const dashboardController = require("../controllers/dashboard.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/rbac.middleware");
const { validate } = require("../middleware/validate.middleware");
const { upload } = require("../middleware/upload.middleware");
const {
  updateProfileSchema,
  passwordSchema,
  preferencesSchema,
  locationSchema,
  paymentMethodSchema,
  adminUserSchema,
} = require("../validators/user.validator");

router.get("/dashboard", authenticate, dashboardController.user);
router.get("/me", authenticate, userController.getMe);
router.get("/me/stats", authenticate, userController.getStats);
router.put(
  "/me",
  authenticate,
  upload.single("image"),
  validate(updateProfileSchema),
  userController.updateMe,
);
router.patch(
  "/me/password",
  authenticate,
  validate(passwordSchema),
  userController.changePassword,
);

router.get("/me/preferences", authenticate, userController.getPreferences);
router.patch(
  "/me/preferences",
  authenticate,
  validate(preferencesSchema),
  userController.updatePreferences,
);

router.get("/me/locations", authenticate, userController.listLocations);
router.post(
  "/me/locations",
  authenticate,
  validate(locationSchema),
  userController.createLocation,
);
router.patch(
  "/me/locations/:id",
  authenticate,
  validate(locationSchema.partial()),
  userController.updateLocation,
);
router.delete("/me/locations/:id", authenticate, userController.deleteLocation);
router.patch(
  "/me/locations/:id/default",
  authenticate,
  userController.setDefaultLocation,
);

router.get(
  "/me/payment-methods",
  authenticate,
  userController.listPaymentMethods,
);
router.post(
  "/me/payment-methods",
  authenticate,
  validate(paymentMethodSchema),
  userController.createPaymentMethod,
);
router.patch(
  "/me/payment-methods/:id",
  authenticate,
  validate(paymentMethodSchema.partial()),
  userController.updatePaymentMethod,
);
router.delete(
  "/me/payment-methods/:id",
  authenticate,
  userController.deletePaymentMethod,
);
router.patch(
  "/me/payment-methods/:id/default",
  authenticate,
  userController.setDefaultPaymentMethod,
);

router.get("/", authenticate, requireAdmin, userController.listUsers);
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(adminUserSchema),
  userController.createUser,
);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  validate(adminUserSchema.partial()),
  userController.updateUser,
);
router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(adminUserSchema.partial()),
  userController.updateUser,
);
router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  userController.setUserStatus,
);
router.delete("/:id", authenticate, requireAdmin, userController.deleteUser);

module.exports = router;
