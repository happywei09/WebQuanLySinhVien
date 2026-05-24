const express = require("express");
const router = express.Router();
const dkController = require("../controllers/dangky.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS, checkSelfAccess } = require("../middleware/role.middleware");

// Xem đăng ký theo lớp tín chỉ (PGV, KHOA)
router.get("/loptinchi/:maLTC", authenticate, authorize(...PERMISSIONS.DANGKY.VIEW), dkController.getDangKyByLopTinChi);

// Xem đăng ký theo sinh viên – SV chỉ được xem của chính mình
router.get("/sinhvien/:maSV", authenticate, authorize(...PERMISSIONS.DANGKY.VIEW), checkSelfAccess, dkController.getDangKyBySinhVien);

// Đăng ký / hủy đăng ký (SV tự đăng ký)
router.post("/create", authenticate, authorize(...PERMISSIONS.DANGKY.CREATE), dkController.createDangKy);
router.put("/cancel", authenticate, authorize(...PERMISSIONS.DANGKY.CANCEL), dkController.cancelDangKy);

// Xóa hoàn toàn (chỉ PGV)
router.delete("/delete", authenticate, authorize(...PERMISSIONS.DANGKY.DELETE), dkController.deleteDangKy);

module.exports = router;

