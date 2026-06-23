// ====================================
// STORED PROCEDURE NAMES - KHOA
// ====================================
// File: database/procedures/khoa.procedure.js
//
// ⚠️ PLACEHOLDER - Nhóm tự map tên SP thật vào đây
// Tên SP phải khớp với SP đã tạo trong SQL Server
// ====================================

const KHOA_PROCEDURES = {
  // Lấy danh sách tất cả khoa
  GET_ALL: "SP_GET_ALL_KHOA",

  // Lấy thông tin khoa theo mã khoa
  GET_BY_ID: "SP_GET_KHOA_BY_ID",

  // Thêm khoa mới
  CREATE: "SP_CREATE_KHOA",

  // Cập nhật thông tin khoa
  UPDATE: "SP_UPDATE_KHOA",

  // Xoá khoa (soft delete hoặc hard delete)
  DELETE: "SP_DELETE_KHOA",


  // Tìm kiếm khoa theo tên
  SEARCH: "SP_SEARCH_KHOA",
};

module.exports = KHOA_PROCEDURES;
