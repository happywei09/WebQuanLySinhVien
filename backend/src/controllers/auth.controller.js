// ====================================
// CONTROLLER - AUTH
// ====================================

const authService = require("../services/auth.service");

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên đăng nhập và mật khẩu",
      });
    }

    const result = await authService.login(username, password);

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: "Token refreshed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    // req.user được set bởi auth middleware
    res.json({
      success: true,
      message: "Success",
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  getProfile,
};
