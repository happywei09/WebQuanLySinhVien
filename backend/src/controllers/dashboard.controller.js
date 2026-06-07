// ====================================
// CONTROLLER - DASHBOARD
// ====================================

const { executeStoredProcedure, sql } = require("../database/connection");

/**
 * Lấy danh sách bộ lọc Khoa, Niên khoá, Học kỳ
 */
const getFilters = async (req, res, next) => {
  try {
    const result = await executeStoredProcedure("SP_DASHBOARD_GET_FILTERS");
    res.json({
      success: true,
      data: {
        khoas: result.recordsets[0] || [],
        semesters: result.recordsets[1] || []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thông số thống kê và chi tiết lớp tín chỉ
 */
const getStats = async (req, res, next) => {
  try {
    const { maKhoa, nienKhoa, hocKy } = req.query;
    const params = {};

    if (maKhoa && maKhoa !== "ALL") {
      params.MAKHOA = { type: sql.NVarChar(50), value: maKhoa };
    }
    if (nienKhoa && nienKhoa !== "ALL") {
      params.NIENKHOA = { type: sql.NVarChar(50), value: nienKhoa };
    }
    if (hocKy && hocKy !== "ALL") {
      params.HOCKY = { type: sql.Int, value: parseInt(hocKy, 10) };
    }

    const result = await executeStoredProcedure("SP_DASHBOARD_GET_STATS", params);
    
    // recordsets[0][0]: Thống kê tổng quan
    const summary = result.recordsets[0][0] || {
      TotalStudents: 0,
      OpenClasses: 0,
      TotalClasses: 0,
      TotalRegistrations: 0
    };
    
    // recordsets[1]: Danh sách chi tiết lớp tín chỉ
    const classesDetail = result.recordsets[1] || [];

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents: summary.TotalStudents,
          openClasses: summary.OpenClasses,
          totalClasses: summary.TotalClasses,
          totalRegistrations: summary.TotalRegistrations
        },
        classesDetail
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFilters,
  getStats,
};
