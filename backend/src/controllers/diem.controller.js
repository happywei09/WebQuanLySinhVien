// ====================================
// CONTROLLER - DIEM (Nhập điểm + Báo cáo)
// ====================================

const diemService = require("../services/diem.service");

// ====================================
// NHẬP ĐIỂM
// ====================================

const getDiemByLopTinChi = async (req, res, next) => {
  try {
    const data = await diemService.getDiemByLopTinChi(parseInt(req.params.maLTC));
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getDiemBySinhVien = async (req, res, next) => {
  try {
    const data = await diemService.getDiemBySinhVien(req.params.maSV);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const updateDiem = async (req, res, next) => {
  try {
    const { maLTC, maSV, DIEM_CC, DIEM_GK, DIEM_CK } = req.body;
    await diemService.updateDiem(parseInt(maLTC), maSV, {
      DIEM_CC, DIEM_GK, DIEM_CK,
    });
    res.json({ success: true, message: "Cập nhật điểm thành công" });
  } catch (error) { next(error); }
};

const updateBatchDiem = async (req, res, next) => {
  try {
    const { maLTC, diemList } = req.body;
    await diemService.updateBatchDiem(parseInt(maLTC), diemList);
    res.json({ success: true, message: "Cập nhật điểm hàng loạt thành công" });
  } catch (error) { next(error); }
};

// ====================================
// BÁO CÁO
// ====================================

const reportBangDiemMonHoc = async (req, res, next) => {
  try {
    if (req.user.role === 'SINHVIEN') {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này." });
    }
    const data = await diemService.reportBangDiemMonHoc(parseInt(req.params.maLTC));
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const reportPhieuDiem = async (req, res, next) => {
  try {
    const { maSV } = req.params;
    if (req.user.role === 'SINHVIEN' && req.user.username !== maSV) {
      return res.status(403).json({ success: false, message: "Bạn chỉ được phép xem phiếu điểm của chính mình." });
    }
    const data = await diemService.reportPhieuDiem(maSV);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const reportBangDiemTongKet = async (req, res, next) => {
  try {
    if (req.user.role === 'SINHVIEN') {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này." });
    }
    const data = await diemService.reportBangDiemTongKet(req.params.maLop);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const reportDSSVDangKy = async (req, res, next) => {
  try {
    if (req.user.role === 'SINHVIEN') {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này." });
    }
    const data = await diemService.reportDSSVDangKy(parseInt(req.params.maLTC));
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const reportDSLopTinChi = async (req, res, next) => {
  try {
    if (req.user.role === 'SINHVIEN') {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này." });
    }
    const { nienKhoa, hocKy } = req.query;
    const data = await diemService.reportDSLopTinChi(nienKhoa, parseInt(hocKy));
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

module.exports = {
  getDiemByLopTinChi,
  getDiemBySinhVien,
  updateDiem,
  updateBatchDiem,
  reportBangDiemMonHoc,
  reportPhieuDiem,
  reportBangDiemTongKet,
  reportDSSVDangKy,
  reportDSLopTinChi,
};
