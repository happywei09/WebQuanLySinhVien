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
        message: "Thiếu các trường bắt buộc: " + missing.join(", "),
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
          message: field + " phải là số từ 0 đến 10",
        });
      }
    }
  }

  next();
};

// ====================================
// ADDITIONAL VALIDATORS
// ====================================

const isBlank = (value) => {
  return value === undefined || value === null || String(value).trim() === "";
};

/**
 * Validate integer field with optional min/max range
 * @param {string} field - Field name
 * @param {object} options - { min, max, source }
 */
const validateIntegerField = (field, options = {}) => {
  const { min = null, max = null, source = "body" } = options;

  return (req, res, next) => {
    const value = req[source] && req[source][field];

    if (value === undefined || value === null || value === "") {
      return next();
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      return res.status(400).json({
        success: false,
        message: field + " phải là số nguyên hợp lệ",
      });
    }

    if (min !== null && parsed < min) {
      return res.status(400).json({
        success: false,
        message: field + " phải lớn hơn hoặc bằng " + min,
      });
    }

    if (max !== null && parsed > max) {
      return res.status(400).json({
        success: false,
        message: field + " phải nhỏ hơn hoặc bằng " + max,
      });
    }

    next();
  };
};

/**
 * Validate field against a regex pattern
 * @param {string} field - Field name
 * @param {RegExp} pattern - Regex pattern
 * @param {string} message - Error message when pattern does not match
 * @param {object} options - { source }
 */
const validateStringPattern = (field, pattern, message, options = {}) => {
  const { source = "body" } = options;

  return (req, res, next) => {
    const value = req[source] && req[source][field];

    if (value === undefined || value === null || value === "") {
      return next();
    }

    if (!pattern.test(String(value).trim())) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    next();
  };
};

/**
 * Validate that a field is an array with optional minimum length
 * @param {string} field - Field name
 * @param {object} options - { minLength }
 */
const validateArrayField = (field, options = {}) => {
  const { minLength = 0 } = options;

  return (req, res, next) => {
    const value = req.body && req.body[field];

    if (!Array.isArray(value)) {
      return res.status(400).json({
        success: false,
        message: field + " phải là mảng hợp lệ",
      });
    }

    if (value.length < minLength) {
      return res.status(400).json({
        success: false,
        message: field + " phải có ít nhất " + minLength + " phần tử",
      });
    }

    next();
  };
};

/**
 * Validate ma field (max 10 characters, matches nChar(10) constraint)
 * @param {string} field - Field name
 * @param {string} label - Display label
 * @param {object} options - { source }
 */
const validateMaField = (field, label = field, options = {}) => {
  const { source = "body" } = options;

  return (req, res, next) => {
    const value = req[source] && req[source][field];

    if (value === undefined || value === null || value === "") {
      return next();
    }

    const normalized = String(value).trim();
    if (normalized.length > 10) {
      return res.status(400).json({
        success: false,
        message: label + " không được vượt quá 10 ký tự",
      });
    }

    next();
  };
};

/**
 * Validate text field: not blank, optional maxLength
 * @param {string} field - Field name
 * @param {string} label - Display label
 * @param {object} options - { maxLength, source }
 */
const validateTrimmedText = (field, label = field, options = {}) => {
  const { maxLength = null, source = "body" } = options;

  return (req, res, next) => {
    const value = req[source] && req[source][field];

    if (value === undefined || value === null) {
      return next();
    }

    if (isBlank(value)) {
      return res.status(400).json({
        success: false,
        message: label + " không được để trống",
      });
    }

    const normalized = String(value).trim();
    if (maxLength !== null && normalized.length > maxLength) {
      return res.status(400).json({
        success: false,
        message: label + " không được vượt quá " + maxLength + " ký tự",
      });
    }

    next();
  };
};

module.exports = {
  validateRequired,
  validateDiem,
  validateIntegerField,
  validateStringPattern,
  validateArrayField,
  validateMaField,
  validateTrimmedText,
};