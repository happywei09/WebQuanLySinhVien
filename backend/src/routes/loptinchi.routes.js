const express = require("express");
const router = express.Router();
const ltcController = require("../controllers/loptinchi.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");
const { validateRequired } = require("../middleware/validate.middleware");

router.get("/", authenticate, authorize(...PERMISSIONS.LOPTINCHI.VIEW), ltcController.getAllLopTinChi);
router.get("/filter", authenticate, authorize(...PERMISSIONS.LOPTINCHI.VIEW), ltcController.getLopTinChiByNienKhoaHocKy);
router.get("/khoa/:maKhoa", authenticate, authorize(...PERMISSIONS.LOPTINCHI.VIEW), ltcController.getLopTinChiByKhoa);
router.get("/:id", authenticate, authorize(...PERMISSIONS.LOPTINCHI.VIEW), ltcController.getLopTinChiById);
router.post("/create", authenticate, authorize(...PERMISSIONS.LOPTINCHI.CREATE), validateRequired(["NIENKHOA", "HOCKY", "MAMH", "NHOM", "MAGV", "MAKHOA"]), ltcController.createLopTinChi);
router.put("/update/:id", authenticate, authorize(...PERMISSIONS.LOPTINCHI.UPDATE), ltcController.updateLopTinChi);
router.put("/cancel/:id", authenticate, authorize(...PERMISSIONS.LOPTINCHI.CANCEL), ltcController.cancelLopTinChi);
router.delete("/delete/:id", authenticate, authorize(...PERMISSIONS.LOPTINCHI.DELETE), ltcController.deleteLopTinChi);

module.exports = router;
