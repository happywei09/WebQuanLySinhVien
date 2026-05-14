// ====================================
// REPOSITORY - KHOA
// ====================================
// File: repositories/khoa.repository.js
// Mục đích: Data access layer cho bảng KHOA
// Gọi Stored Procedure thông qua connection helper
// ====================================

const { executeStoredProcedure, sql } = require("../database/connection");
const KHOA_PROCEDURES = require("../database/procedures/khoa.procedure");

class KhoaRepository {
  /**
   * Lấy danh sách tất cả khoa
   * @returns {Promise<Array>}
   */
  async getAll() {
    // TODO: Execute Stored Procedure: SP_GET_ALL_KHOA
    const result = await executeStoredProcedure(KHOA_PROCEDURES.GET_ALL);
    return result.recordset;
  }

  /**
   * Lấy thông tin khoa theo mã
   * @param {string} maKhoa
   * @returns {Promise<Object|null>}
   */
  async getById(maKhoa) {
    // TODO: Execute Stored Procedure: SP_GET_KHOA_BY_ID
    const result = await executeStoredProcedure(KHOA_PROCEDURES.GET_BY_ID, {
      MAKHOA: { type: sql.NVarChar(50), value: maKhoa },
    });
    return result.recordset[0] || null;
  }

  /**
   * Thêm khoa mới
   * @param {Object} data - { MAKHOA, TENKHOA }
   * @returns {Promise<Object>}
   */
  async create(data) {
    // TODO: Execute Stored Procedure: SP_CREATE_KHOA
    const result = await executeStoredProcedure(KHOA_PROCEDURES.CREATE, {
      MAKHOA: { type: sql.NVarChar(50), value: data.MAKHOA },
      TENKHOA: { type: sql.NVarChar(100), value: data.TENKHOA },
    });
    return result;
  }

  /**
   * Cập nhật thông tin khoa
   * @param {string} maKhoa
   * @param {Object} data - { TENKHOA }
   * @returns {Promise<Object>}
   */
  async update(maKhoa, data) {
    // TODO: Execute Stored Procedure: SP_UPDATE_KHOA
    const result = await executeStoredProcedure(KHOA_PROCEDURES.UPDATE, {
      MAKHOA: { type: sql.NVarChar(50), value: maKhoa },
      TENKHOA: { type: sql.NVarChar(100), value: data.TENKHOA },
    });
    return result;
  }

  /**
   * Xoá khoa
   * @param {string} maKhoa
   * @returns {Promise<Object>}
   */
  async delete(maKhoa) {
    // TODO: Execute Stored Procedure: SP_DELETE_KHOA
    const result = await executeStoredProcedure(KHOA_PROCEDURES.DELETE, {
      MAKHOA: { type: sql.NVarChar(50), value: maKhoa },
    });
    return result;
  }

  /**
   * Tìm kiếm khoa theo tên
   * @param {string} keyword
   * @returns {Promise<Array>}
   */
  async search(keyword) {
    // TODO: Execute Stored Procedure: SP_SEARCH_KHOA
    const result = await executeStoredProcedure(KHOA_PROCEDURES.SEARCH, {
      KEYWORD: { type: sql.NVarChar(100), value: keyword },
    });
    return result.recordset;
  }
}

module.exports = new KhoaRepository();
