const express = require("express");
const router = express.Router();
const dkController = require("../controllers/dangky.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");

router.get("/loptinchi/:maLTC", authenticate, authorize(...PERMISSIONS.DANGKY.VIEW), dkController.getDangKyByLopTinChi);
router.get("/sinhvien/:maSV", authenticate, authorize(...PERMISSIONS.DANGKY.VIEW), dkController.getDangKyBySinhVien);
router.post("/create", authenticate, authorize(...PERMISSIONS.DANGKY.CREATE), dkController.createDangKy);
router.put("/cancel", authenticate, authorize(...PERMISSIONS.DANGKY.CANCEL), dkController.cancelDangKy);
router.delete("/delete", authenticate, authorize(...PERMISSIONS.DANGKY.DELETE), dkController.deleteDangKy);

module.exports = router;
