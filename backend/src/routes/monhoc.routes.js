const express = require("express");
const router = express.Router();
const mhController = require("../controllers/monhoc.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");
const { validateRequired, validateIntegerField, validateMaField, validateTrimmedText } = require("../middleware/validate.middleware");

router.get("/", authenticate, authorize(...PERMISSIONS.MONHOC.VIEW), mhController.getAllMonHoc);
router.get("/:id", authenticate, authorize(...PERMISSIONS.MONHOC.VIEW), mhController.getMonHocById);
router.post("/create", authenticate, authorize(...PERMISSIONS.MONHOC.CREATE), validateRequired(["MAMH", "TENMH", "SOTIET_LT", "SOTIET_TH"]), validateMaField("MAMH", "Mã môn học"), validateTrimmedText("TENMH", "Tên môn học", { maxLength: 50 }), validateIntegerField("SOTIET_LT", { min: 0 }), validateIntegerField("SOTIET_TH", { min: 0 }), mhController.createMonHoc);
router.put("/update/:id", authenticate, authorize(...PERMISSIONS.MONHOC.UPDATE), validateRequired(["TENMH", "SOTIET_LT", "SOTIET_TH"]), validateTrimmedText("TENMH", "Tên môn học", { maxLength: 50 }), validateIntegerField("SOTIET_LT", { min: 0 }), validateIntegerField("SOTIET_TH", { min: 0 }), mhController.updateMonHoc);
router.delete("/delete/:id", authenticate, authorize(...PERMISSIONS.MONHOC.DELETE), mhController.deleteMonHoc);

module.exports = router;
