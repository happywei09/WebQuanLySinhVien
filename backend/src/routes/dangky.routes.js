const express = require("express");
const router = express.Router();
const dkController = require("../controllers/dangky.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");
const { validateRequired } = require("../middleware/validate.middleware");

router.get("/loptinchi/:maLTC", authenticate, authorize(...PERMISSIONS.DANGKY.VIEW), dkController.getDangKyByLopTinChi);
router.get("/sinhvien/:maSV", authenticate, authorize(...PERMISSIONS.DANGKY.VIEW), dkController.getDangKyBySinhVien);
router.post("/create", authenticate, authorize(...PERMISSIONS.DANGKY.CREATE), validateRequired(["MALTC", "MASV"]), dkController.createDangKy);
router.put("/cancel", authenticate, authorize(...PERMISSIONS.DANGKY.CANCEL), validateRequired(["maLTC", "maSV"]), dkController.cancelDangKy);
router.delete("/delete", authenticate, authorize(...PERMISSIONS.DANGKY.DELETE), validateRequired(["maLTC", "maSV"]), dkController.deleteDangKy);

module.exports = router;
