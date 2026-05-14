// ====================================
// MIDDLEWARE - VALIDATION
// ====================================

/**
 * Validate required fields trong request body
 *
 * Cách dùng:
 *   router.post("/", validateRequired(["MAKHOA", "TENKHOA"]), handler)
 *
 * @param {string[]} fields - Danh sách field bắt buộc
 */
const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = [];

    for (const field of fields) {
      if (
        req.body[field] === undefined ||
        req.body[field] === null ||
        req.body[field] === ""
      ) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Thiếu các trường bắt buộc: ${missing.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Validate điểm (0-10)
 */
const validateDiem = (req, res, next) => {
  const diemFields = ["DIEM_CC", "DIEM_GK", "DIEM_CK"];

  for (const field of diemFields) {
    if (req.body[field] !== undefined && req.body[field] !== null) {
      const val = parseFloat(req.body[field]);
      if (isNaN(val) || val < 0 || val > 10) {
        return res.status(400).json({
          success: false,
          message: `${field} phải là số từ 0 đến 10`,
        });
      }
    }
  }

  next();
};

module.exports = { validateRequired, validateDiem };
