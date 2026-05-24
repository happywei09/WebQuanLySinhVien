const express = require("express");
const router = express.Router();
const diemController = require("../controllers/diem.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, PERMISSIONS, checkSelfAccess } = require("../middleware/role.middleware");
const { validateDiem, validateRequired } = require("../middleware/validate.middleware");

// Xem điểm theo lớp tín chỉ (PGV, KHOA)
router.get("/loptinchi/:maLTC", authenticate, authorize(...PERMISSIONS.DIEM.VIEW), diemController.getDiemByLopTinChi);

// Xem điểm theo sinh viên – SV chỉ được xem của chính mình
router.get("/sinhvien/:maSV", authenticate, authorize(...PERMISSIONS.DIEM.VIEW), checkSelfAccess, diemController.getDiemBySinhVien);

// Cập nhật điểm (PGV, KHOA)
router.put("/update", authenticate, authorize(...PERMISSIONS.DIEM.UPDATE), validateRequired(["maLTC", "maSV"]), validateDiem, diemController.updateDiem);
router.put("/update-batch", authenticate, authorize(...PERMISSIONS.DIEM.UPDATE), validateRequired(["maLTC", "diemList"]), diemController.updateBatchDiem);

// Báo cáo
router.get("/report/bang-diem-mon-hoc/:maLTC", authenticate, authorize(...PERMISSIONS.REPORT.VIEW), diemController.reportBangDiemMonHoc);

// Phiếu điểm – SV chỉ được xem phiếu điểm của chính mình
router.get("/report/phieu-diem/:maSV", authenticate, authorize(...PERMISSIONS.REPORT.VIEW), checkSelfAccess, diemController.reportPhieuDiem);

router.get("/report/bang-diem-tong-ket/:maLop", authenticate, authorize(...PERMISSIONS.REPORT.VIEW), diemController.reportBangDiemTongKet);
router.get("/report/dssv-dang-ky/:maLTC", authenticate, authorize(...PERMISSIONS.REPORT.VIEW), diemController.reportDSSVDangKy);
router.get("/report/ds-lop-tin-chi", authenticate, authorize(...PERMISSIONS.REPORT.VIEW), diemController.reportDSLopTinChi);

module.exports = router;

