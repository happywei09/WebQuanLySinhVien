// ====================================
// CONTROLLER - DIEM (Nhập điểm + Báo cáo)
// ====================================

const diemService = require("../services/diem.service");

// ====================================
// NHẬP ĐIỂM
// ====================================

const getDiemByLopTinChi = async (req, res, next) => {
  try {
    const data = await diemService.getDiemByLopTinChi(parseInt(req.params.maLTC), req.user);
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
    }, req.user);
    res.json({ success: true, message: "Cập nhật điểm thành công" });
  } catch (error) { next(error); }
};

const updateBatchDiem = async (req, res, next) => {
  try {
    const { maLTC, diemList } = req.body;
    await diemService.updateBatchDiem(parseInt(maLTC), diemList, req.user);
    res.json({ success: true, message: "Cập nhật điểm hàng loạt thành công" });
  } catch (error) { next(error); }
};

// ====================================
// BÁO CÁO
// ====================================

const getLocalKhoaName = async (serverId) => {
  try {
    const { getPool } = require("../database/connection");
    const pool = getPool(serverId);
    const result = await pool.request().execute("SP_GET_LOCAL_KHOA");
    if (result.recordset && result.recordset.length > 0) {
      return result.recordset[0].TENKHOA.trim();
    }
  } catch (e) {
    console.error("Lỗi lấy tên khoa cục bộ:", e.message);
  }
  return null;
};

const reportBangDiemMonHoc = async (req, res, next) => {
  try {
    if (req.user.role === 'SINHVIEN') {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này." });
    }
    const data = await diemService.reportBangDiemMonHoc(parseInt(req.params.maLTC));
    const khoaName = await getLocalKhoaName(req.user.serverId);
    res.json({ success: true, message: "Success", data, khoaName });
  } catch (error) { next(error); }
};

const reportPhieuDiem = async (req, res, next) => {
  try {
    const { maSV } = req.params;
    if (req.user.role === 'SINHVIEN' && req.user.username !== maSV) {
      return res.status(403).json({ success: false, message: "Bạn chỉ được phép xem phiếu điểm của chính mình." });
    }
    const data = await diemService.reportPhieuDiem(maSV);
    const khoaName = await getLocalKhoaName(req.user.serverId);

    // Lấy thông tin sinh viên để hiển thị trên phiếu điểm
    let studentInfo = null;
    try {
      const { getPool, sql } = require("../database/connection");
      const pool = getPool(req.user.serverId);
      const svResult = await pool.request()
        .input("MASV", sql.NChar(10), maSV)
        .execute("SP_GET_SINHVIEN_BY_ID");
      if (svResult.recordset && svResult.recordset.length > 0) {
        const sv = svResult.recordset[0];
        // Lấy tên khoa từ bảng LOP -> KHOA
        let tenKhoa = khoaName || '';
        try {
          const khoaResult = await pool.request()
            .query(`SELECT k.TENKHOA FROM SINHVIEN sv
                    INNER JOIN LOP l ON sv.MALOP = l.MALOP
                    INNER JOIN KHOA k ON l.MAKHOA = k.MAKHOA
                    WHERE sv.MASV = '${maSV.replace(/'/g, "''")}'`);
          if (khoaResult.recordset && khoaResult.recordset.length > 0) {
            tenKhoa = khoaResult.recordset[0].TENKHOA.trim();
          }
        } catch (e) {
          console.error("Lỗi lấy tên khoa cho SV:", e.message);
        }
        studentInfo = {
          HO: (sv.HO || '').trim(),
          TEN: (sv.TEN || '').trim(),
          MASV: (sv.MASV || '').trim(),
          NGAYSINH: sv.NGAYSINH,
          PHAI: sv.PHAI,
          MALOP: (sv.MALOP || '').trim(),
          DIACHI: (sv.DIACHI || '').trim(),
          TENKHOA: tenKhoa,
        };
      }
    } catch (e) {
      console.error("Lỗi lấy thông tin sinh viên:", e.message);
    }

    res.json({ success: true, message: "Success", data, khoaName, studentInfo });
  } catch (error) { next(error); }
};

const reportBangDiemTongKet = async (req, res, next) => {
  try {
    if (req.user.role === 'SINHVIEN') {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này." });
    }
    
    // Lấy thông tin lớp học để lấy KHOAHOC
    const { getPool, sql } = require("../database/connection");
    const pool = getPool(req.user.serverId);
    const lopResult = await pool.request()
      .input("MALOP", sql.NVarChar(50), req.params.maLop)
      .execute("SP_GET_LOP_BY_ID");
      
    let khoaHoc = "";
    if (lopResult.recordset && lopResult.recordset.length > 0) {
      khoaHoc = (lopResult.recordset[0].KHOAHOC || "").trim();
    }

    const data = await diemService.reportBangDiemTongKet(req.params.maLop);
    const khoaName = await getLocalKhoaName(req.user.serverId);
    res.json({ success: true, message: "Success", data, khoaName, khoaHoc });
  } catch (error) { next(error); }
};

const reportDSSVDangKy = async (req, res, next) => {
  try {
    if (req.user.role === 'SINHVIEN') {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này." });
    }
    const data = await diemService.reportDSSVDangKy(parseInt(req.params.maLTC));
    const khoaName = await getLocalKhoaName(req.user.serverId);
    res.json({ success: true, message: "Success", data, khoaName });
  } catch (error) { next(error); }
};

const reportDSLopTinChi = async (req, res, next) => {
  try {
    if (req.user.role === 'SINHVIEN') {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này." });
    }
    const { nienKhoa, hocKy } = req.query;
    const data = await diemService.reportDSLopTinChi(nienKhoa, parseInt(hocKy));
    const khoaName = await getLocalKhoaName(req.user.serverId);
    res.json({ success: true, message: "Success", data, khoaName });
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
