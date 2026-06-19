// ====================================
// CONTROLLER - AUTH
// ====================================

const authService = require("../services/auth.service");

const login = async (req, res, next) => {
  try {
    const { username, password, serverId } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên đăng nhập và mật khẩu",
      });
    }

    const result = await authService.login(
      username,
      password,
      serverId || "server1"
    );

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

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { username, role } = req.user;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới",
      });
    }

    if (newPassword.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có tối thiểu 3 ký tự",
      });
    }

    await authService.changePassword(username, oldPassword, newPassword, role);

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  getProfile,
  changePassword,
};
