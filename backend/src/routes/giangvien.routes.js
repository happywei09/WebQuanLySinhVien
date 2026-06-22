const express = require("express");
const router = express.Router();
const gvController = require("../controllers/giangvien.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");
const { validateRequired, validateMaField, validateTrimmedText } = require("../middleware/validate.middleware");

router.get("/", authenticate, authorize(...PERMISSIONS.GIANGVIEN.VIEW), gvController.getAllGiangVien);
router.get("/khoa/:maKhoa", authenticate, authorize(...PERMISSIONS.GIANGVIEN.VIEW), gvController.getGiangVienByKhoa);
router.get("/:id", authenticate, authorize(...PERMISSIONS.GIANGVIEN.VIEW), gvController.getGiangVienById);
router.post("/create", authenticate, authorize(...PERMISSIONS.GIANGVIEN.CREATE), validateRequired(["MAGV", "HO", "TEN", "MAKHOA"]), validateMaField("MAGV", "Mã giảng viên"), validateMaField("MAKHOA", "Mã khoa"), validateTrimmedText("HO", "Họ", { maxLength: 50 }), validateTrimmedText("TEN", "Tên", { maxLength: 10 }), validateTrimmedText("HOCVI", "Học vị", { maxLength: 50 }), validateTrimmedText("HOCHAM", "Học hàm", { maxLength: 50 }), validateTrimmedText("CHUYENMON", "Chuyên môn", { maxLength: 100 }), gvController.createGiangVien);
router.put("/update/:id", authenticate, authorize(...PERMISSIONS.GIANGVIEN.UPDATE), validateRequired(["HO", "TEN", "MAKHOA"]), validateMaField("MAKHOA", "Mã khoa"), validateTrimmedText("HO", "Họ", { maxLength: 50 }), validateTrimmedText("TEN", "Tên", { maxLength: 10 }), validateTrimmedText("HOCVI", "Học vị", { maxLength: 50 }), validateTrimmedText("HOCHAM", "Học hàm", { maxLength: 50 }), validateTrimmedText("CHUYENMON", "Chuyên môn", { maxLength: 100 }), gvController.updateGiangVien);
router.delete("/delete/:id", authenticate, authorize(...PERMISSIONS.GIANGVIEN.DELETE), gvController.deleteGiangVien);

module.exports = router;
