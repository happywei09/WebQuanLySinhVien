const express = require("express");
const router = express.Router();
const lopController = require("../controllers/lop.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");
const { validateRequired, validateMaField, validateTrimmedText, validateStringPattern } = require("../middleware/validate.middleware");

router.get("/", authenticate, authorize(...PERMISSIONS.LOP.VIEW), lopController.getAllLop);
router.get("/khoa/:maKhoa", authenticate, authorize(...PERMISSIONS.LOP.VIEW), lopController.getLopByKhoa);
router.get("/:id", authenticate, authorize(...PERMISSIONS.LOP.VIEW), lopController.getLopById);
router.post("/create", authenticate, authorize(...PERMISSIONS.LOP.CREATE), validateRequired(["MALOP", "TENLOP", "KHOAHOC", "MAKHOA"]), validateMaField("MALOP", "Mã lớp"), validateMaField("MAKHOA", "Mã khoa"), validateTrimmedText("TENLOP", "Tên lớp", { maxLength: 50 }), validateStringPattern("KHOAHOC", /^\d{4}-\d{4}$/, "KHOAHOC phải có định dạng YYYY-YYYY"), lopController.createLop);
router.put("/update/:id", authenticate, authorize(...PERMISSIONS.LOP.UPDATE), validateRequired(["TENLOP", "KHOAHOC", "MAKHOA"]), validateMaField("MAKHOA", "Mã khoa"), validateTrimmedText("TENLOP", "Tên lớp", { maxLength: 50 }), validateStringPattern("KHOAHOC", /^\d{4}-\d{4}$/, "KHOAHOC phải có định dạng YYYY-YYYY"), lopController.updateLop);
router.delete("/delete/:id", authenticate, authorize(...PERMISSIONS.LOP.DELETE), lopController.deleteLop);

module.exports = router;
