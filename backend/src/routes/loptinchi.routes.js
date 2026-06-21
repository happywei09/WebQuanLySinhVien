const express = require("express");
const router = express.Router();
const ltcController = require("../controllers/loptinchi.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");
const { validateRequired, validateIntegerField, validateMaField, validateStringPattern } = require("../middleware/validate.middleware");

router.get("/", authenticate, authorize(...PERMISSIONS.LOPTINCHI.VIEW), ltcController.getAllLopTinChi);
router.get("/filter", authenticate, authorize(...PERMISSIONS.LOPTINCHI.VIEW), ltcController.getLopTinChiByNienKhoaHocKy);
router.get("/khoa/:maKhoa", authenticate, authorize(...PERMISSIONS.LOPTINCHI.VIEW), ltcController.getLopTinChiByKhoa);
router.get("/:id", authenticate, authorize(...PERMISSIONS.LOPTINCHI.VIEW), ltcController.getLopTinChiById);
router.post("/create", authenticate, authorize(...PERMISSIONS.LOPTINCHI.CREATE), validateRequired(["NIENKHOA", "HOCKY", "MAMH", "NHOM", "MAGV", "MAKHOA", "SOSVTOITHIEU"]), validateStringPattern("NIENKHOA", /^\d{4}-\d{4}$/, "NIENKHOA phải có định dạng YYYY-YYYY"), validateIntegerField("HOCKY", { min: 1, max: 3 }), validateIntegerField("NHOM", { min: 1 }), validateIntegerField("SOSVTOITHIEU", { min: 1 }), validateMaField("MAMH", "Mã môn học"), validateMaField("MAGV", "Mã giảng viên"), validateMaField("MAKHOA", "Mã khoa"), ltcController.createLopTinChi);
router.put("/update/:id", authenticate, authorize(...PERMISSIONS.LOPTINCHI.UPDATE), validateRequired(["NIENKHOA", "HOCKY", "MAMH", "NHOM", "MAGV", "MAKHOA", "SOSVTOITHIEU"]), validateStringPattern("NIENKHOA", /^\d{4}-\d{4}$/, "NIENKHOA phải có định dạng YYYY-YYYY"), validateIntegerField("HOCKY", { min: 1, max: 3 }), validateIntegerField("NHOM", { min: 1 }), validateIntegerField("SOSVTOITHIEU", { min: 1 }), validateMaField("MAMH", "Mã môn học"), validateMaField("MAGV", "Mã giảng viên"), validateMaField("MAKHOA", "Mã khoa"), ltcController.updateLopTinChi);
router.put("/cancel/:id", authenticate, authorize(...PERMISSIONS.LOPTINCHI.CANCEL), ltcController.cancelLopTinChi);
router.delete("/delete/:id", authenticate, authorize(...PERMISSIONS.LOPTINCHI.DELETE), ltcController.deleteLopTinChi);

module.exports = router;
