// ====================================
// MIDDLEWARE - ROLE AUTHORIZATION (RBAC)
// ====================================

/**
 * Kiểm tra quyền truy cập theo role
 * Sử dụng sau authenticate middleware
 *
 * Roles: "PGV", "KHOA", "SINHVIEN"
 *
 * Cách dùng:
 *   router.get("/admin", authenticate, authorize("PGV"), handler)
 *   router.get("/khoa", authenticate, authorize("PGV", "KHOA"), handler)
 *
 * @param  {...string} roles - Danh sách role được phép truy cập
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực. Vui lòng đăng nhập.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện chức năng này.",
      });
    }

    next();
  };
};

// ====================================
// PERMISSION CONFIG
// ====================================
// Cấu hình quyền cho từng module
// PGV: Phòng giáo vụ (Admin toàn hệ thống)
// KHOA: Quản lý cấp khoa
// SINHVIEN: Sinh viên (chỉ xem)
// ====================================

const PERMISSIONS = {
  // Quản lý Khoa
  KHOA: {
    VIEW: ["PGV", "KHOA"],
    CREATE: ["PGV"],
    UPDATE: ["PGV"],
    DELETE: ["PGV"],
  },

  // Quản lý Lớp
  LOP: {
    VIEW: ["PGV", "KHOA"],
    CREATE: ["PGV"],
    UPDATE: ["PGV"],
    DELETE: ["PGV"],
  },

  // Quản lý Sinh viên
  SINHVIEN: {
    VIEW: ["PGV", "KHOA"],
    CREATE: ["PGV"],
    UPDATE: ["PGV"],
    DELETE: ["PGV"],
  },

  // Quản lý Giảng viên
  GIANGVIEN: {
    VIEW: ["PGV", "KHOA"],
    CREATE: ["PGV"],
    UPDATE: ["PGV"],
    DELETE: ["PGV"],
  },

  // Quản lý Môn học
  MONHOC: {
    VIEW: ["PGV", "KHOA"],
    CREATE: ["PGV"],
    UPDATE: ["PGV"],
    DELETE: ["PGV"],
  },

  // Quản lý Lớp tín chỉ
  LOPTINCHI: {
    VIEW: ["PGV", "KHOA", "SINHVIEN"],
    CREATE: ["PGV"],
    UPDATE: ["PGV"],
    DELETE: ["PGV"],
    CANCEL: ["PGV"],
  },

  // Đăng ký tín chỉ
  DANGKY: {
    VIEW: ["PGV", "KHOA", "SINHVIEN"],
    CREATE: ["PGV", "SINHVIEN"],
    CANCEL: ["PGV", "SINHVIEN"],
    DELETE: ["PGV"],
  },

  // Nhập điểm
  DIEM: {
    VIEW: ["PGV", "KHOA", "SINHVIEN"],
    UPDATE: ["PGV", "KHOA"],
  },

  // Báo cáo
  REPORT: {
    VIEW: ["PGV", "KHOA", "SINHVIEN"],
  },
};

/**
 * Middleware kiểm tra Sinh Viên chỉ được truy cập dữ liệu của chính mình.
 * PGV và KHOA được bỏ qua kiểm tra này.
 *
 * Yêu cầu: route phải có param tên là `maSV`.
 * Ví dụ: /diem/report/phieu-diem/:maSV
 *
 * Cách dùng:
 *   router.get('/phieu-diem/:maSV', authenticate, authorize('PGV','KHOA','SINHVIEN'), checkSelfAccess, handler)
 */
const checkSelfAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Chưa xác thực. Vui lòng đăng nhập.",
    });
  }

  // PGV và KHOA được xem dữ liệu của tất cả sinh viên
  if (req.user.role === "PGV" || req.user.role === "KHOA") {
    return next();
  }

  // Sinh viên chỉ được xem dữ liệu của chính mình
  const maSVParam = req.params.maSV;
  if (!maSVParam) {
    return res.status(400).json({
      success: false,
      message: "Thiếu mã sinh viên trong yêu cầu.",
    });
  }

  if (maSVParam.toUpperCase() !== req.user.username.toUpperCase()) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền xem dữ liệu của sinh viên khác.",
    });
  }

  next();
};

module.exports = { authorize, PERMISSIONS, checkSelfAccess };
