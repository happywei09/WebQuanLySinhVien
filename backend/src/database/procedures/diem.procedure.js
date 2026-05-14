// ====================================
// STORED PROCEDURE NAMES - DIEM
// ====================================
// ⚠️ PLACEHOLDER - Nhóm tự map tên SP thật vào đây
// ====================================

const DIEM_PROCEDURES = {
  // Lấy bảng điểm theo lớp tín chỉ
  GET_BY_LTC: "SP_GET_DIEM_BY_LOPTINCHI",

  // Lấy bảng điểm theo sinh viên
  GET_BY_SV: "SP_GET_DIEM_BY_SINHVIEN",

  // Cập nhật điểm (DIEM_CC, DIEM_GK, DIEM_CK)
  UPDATE: "SP_UPDATE_DIEM",

  // Cập nhật hàng loạt điểm cho 1 lớp tín chỉ
  UPDATE_BATCH: "SP_UPDATE_DIEM_BATCH",

  // ====================================
  // REPORTS - Báo cáo
  // ====================================

  // Bảng điểm môn học theo lớp tín chỉ
  REPORT_BANGDIEM_MONHOC: "SP_REPORT_BANGDIEM_MONHOC",

  // Phiếu điểm cá nhân sinh viên
  REPORT_PHIEUDIEM: "SP_REPORT_PHIEUDIEM",

  // Bảng điểm tổng kết theo lớp
  REPORT_BANGDIEM_TONGKET: "SP_REPORT_BANGDIEM_TONGKET",

  // Danh sách sinh viên đăng ký theo lớp tín chỉ
  REPORT_DSSV_DANGKY: "SP_REPORT_DSSV_DANGKY",

  // Danh sách lớp tín chỉ
  REPORT_DS_LOPTINCHI: "SP_REPORT_DS_LOPTINCHI",
};

module.exports = DIEM_PROCEDURES;
