// ====================================
// STORED PROCEDURE NAMES - SINHVIEN
// ====================================
// ⚠️ PLACEHOLDER - Nhóm tự map tên SP thật vào đây
// ====================================

const SINHVIEN_PROCEDURES = {
  GET_ALL: "SP_GET_ALL_SINHVIEN",
  GET_BY_ID: "SP_GET_SINHVIEN_BY_ID",
  GET_BY_LOP: "SP_GET_SINHVIEN_BY_LOP",
  GET_BY_KHOA: "SP_GET_SINHVIEN_BY_KHOA",
  CREATE: "SP_CREATE_SINHVIEN",
  UPDATE: "SP_UPDATE_SINHVIEN",
  DELETE: "SP_DELETE_SINHVIEN",

  SEARCH: "SP_SEARCH_SINHVIEN",
  UPDATE_STATUS: "SP_UPDATE_SINHVIEN_STATUS", // Đánh dấu nghỉ học
};

module.exports = SINHVIEN_PROCEDURES;
