// ====================================
// CONTROLLER - DASHBOARD
// ====================================

const { executeStoredProcedure } = require("../database/connection");

/**
 * Lấy thông số thống kê tổng hợp toàn trường
 */
const getStats = async (req, res, next) => {
  try {
    const result = await executeStoredProcedure("SP_DASHBOARD_GET_STATS");
    
    // recordsets[0][0] hoặc recordset[0]: Thống kê tổng quan
    const summary = (result.recordsets && result.recordsets[0] && result.recordsets[0][0]) || result.recordset || {
      TotalStudents: 0,
      OpenClasses: 0,
      TotalClasses: 0,
      TotalRegistrations: 0
    };

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents: summary.TotalStudents,
          openClasses: summary.OpenClasses,
          totalClasses: summary.TotalClasses,
          totalRegistrations: summary.TotalRegistrations
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
};
