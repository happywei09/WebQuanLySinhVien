// ====================================
// ROUTES - KHOA
// ====================================

const express = require("express");
const router = express.Router();
const khoaController = require("../controllers/khoa.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");
const { validateRequired } = require("../middleware/validate.middleware");

router.get(
  "/",
  authenticate,
  authorize(...PERMISSIONS.KHOA.VIEW),
  khoaController.getAllKhoa
);

router.get(
  "/search",
  authenticate,
  authorize(...PERMISSIONS.KHOA.VIEW),
  khoaController.searchKhoa
);

router.get(
  "/:id",
  authenticate,
  authorize(...PERMISSIONS.KHOA.VIEW),
  khoaController.getKhoaById
);

router.post(
  "/create",
  authenticate,
  authorize(...PERMISSIONS.KHOA.CREATE),
  validateRequired(["MAKHOA", "TENKHOA"]),
  khoaController.createKhoa
);

router.put(
  "/update/:id",
  authenticate,
  authorize(...PERMISSIONS.KHOA.UPDATE),
  validateRequired(["TENKHOA"]),
  khoaController.updateKhoa
);

router.delete(
  "/delete/:id",
  authenticate,
  authorize(...PERMISSIONS.KHOA.DELETE),
  khoaController.deleteKhoa
);

module.exports = router;
