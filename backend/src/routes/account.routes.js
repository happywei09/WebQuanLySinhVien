// ====================================
// ROUTES - ACCOUNT
// ====================================

const express = require("express");
const router = express.Router();
const accountController = require("../controllers/account.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.get("/", authenticate, authorize("PGV", "KHOA"), accountController.getAllAccounts);
router.get("/nhanvien", authenticate, authorize("PGV", "KHOA"), accountController.getNhanVien);
router.post("/", authenticate, authorize("PGV", "KHOA"), accountController.createAccount);
router.delete("/:username", authenticate, authorize("PGV", "KHOA"), accountController.deleteAccount);

module.exports = router;
