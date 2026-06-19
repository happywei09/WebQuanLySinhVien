// ====================================
// ROUTES - AUTH
// ====================================

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.get("/profile", authenticate, authController.getProfile);
router.post("/change-password", authenticate, authController.changePassword);

module.exports = router;
