const express = require("express");
const router = express.Router();
const lopController = require("../controllers/lop.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");
const { validateRequired } = require("../middleware/validate.middleware");

router.get("/", authenticate, authorize(...PERMISSIONS.LOP.VIEW), lopController.getAllLop);
router.get("/:id", authenticate, authorize(...PERMISSIONS.LOP.VIEW), lopController.getLopById);
router.get("/khoa/:maKhoa", authenticate, authorize(...PERMISSIONS.LOP.VIEW), lopController.getLopByKhoa);
router.post("/create", authenticate, authorize(...PERMISSIONS.LOP.CREATE), validateRequired(["MALOP", "TENLOP", "KHOAHOC", "MAKHOA"]), lopController.createLop);
router.put("/update/:id", authenticate, authorize(...PERMISSIONS.LOP.UPDATE), lopController.updateLop);
router.delete("/delete/:id", authenticate, authorize(...PERMISSIONS.LOP.DELETE), lopController.deleteLop);

module.exports = router;
