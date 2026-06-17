const express = require("express");
const router = express.Router();
const svController = require("../controllers/sinhvien.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");
const { validateRequired } = require("../middleware/validate.middleware");

router.get("/", authenticate, authorize(...PERMISSIONS.SINHVIEN.VIEW), svController.getAllSinhVien);
router.get("/lop/:maLop", authenticate, authorize(...PERMISSIONS.SINHVIEN.VIEW), svController.getSinhVienByLop);
router.get("/khoa/:maKhoa", authenticate, authorize(...PERMISSIONS.SINHVIEN.VIEW), svController.getSinhVienByKhoa);
router.get("/:id", authenticate, authorize(...PERMISSIONS.SINHVIEN.VIEW), svController.getSinhVienById);
router.post("/create", authenticate, authorize(...PERMISSIONS.SINHVIEN.CREATE), validateRequired(["MASV", "HO", "TEN", "MALOP"]), svController.createSinhVien);
router.put("/update/:id", authenticate, authorize(...PERMISSIONS.SINHVIEN.UPDATE), svController.updateSinhVien);
router.delete("/delete/:id", authenticate, authorize(...PERMISSIONS.SINHVIEN.DELETE), svController.deleteSinhVien);

module.exports = router;
