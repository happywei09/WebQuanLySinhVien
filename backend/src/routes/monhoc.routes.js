const express = require("express");
const router = express.Router();
const mhController = require("../controllers/monhoc.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS } = require("../middleware/role.middleware");
const { validateRequired } = require("../middleware/validate.middleware");

router.get("/", authenticate, authorize(...PERMISSIONS.MONHOC.VIEW), mhController.getAllMonHoc);
router.get("/:id", authenticate, authorize(...PERMISSIONS.MONHOC.VIEW), mhController.getMonHocById);
router.post("/create", authenticate, authorize(...PERMISSIONS.MONHOC.CREATE), validateRequired(["MAMH", "TENMH"]), mhController.createMonHoc);
router.put("/update/:id", authenticate, authorize(...PERMISSIONS.MONHOC.UPDATE), mhController.updateMonHoc);
router.delete("/delete/:id", authenticate, authorize(...PERMISSIONS.MONHOC.DELETE), mhController.deleteMonHoc);

module.exports = router;
