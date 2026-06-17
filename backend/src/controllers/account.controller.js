// ====================================
// CONTROLLER - ACCOUNT
// ====================================

const accountRepository = require("../repositories/account.repository");

const getAllAccounts = async (req, res, next) => {
  try {
    const accounts = await accountRepository.getAll();
    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
};

const createAccount = async (req, res, next) => {
  try {
    const { fullName, username, password, role, maNV } = req.body;
    if (!fullName || !username || !password || !role || !maNV) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin: họ tên, mã nhân viên, tên tài khoản, mật mã và quyền.",
      });
    }

    // Nếu người dùng đăng nhập là KHOA, họ chỉ được tạo tài khoản KHOA hoặc SV
    if (req.user.role === "KHOA" && role === "PGV") {
      return res.status(403).json({
        success: false,
        message: "Quyền Khoa không được phép tạo tài khoản có nhóm quyền PGV.",
      });
    }

    await accountRepository.create({ fullName, username, password, role, maNV });
    res.json({
      success: true,
      message: "Tạo tài khoản thành công",
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Tên tài khoản xóa không hợp lệ.",
      });
    }

    // Không cho phép tự xóa tài khoản của chính mình
    if (username.toLowerCase() === req.user.username.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể xóa tài khoản hiện đang sử dụng để đăng nhập.",
      });
    }

    await accountRepository.delete(username);
    res.json({
      success: true,
      message: "Xóa tài khoản thành công",
    });
  } catch (error) {
    next(error);
  }
};

const getNhanVien = async (req, res, next) => {
  try {
    // Nếu role là KHOA, chỉ trả về giảng viên thuộc khoa của họ
    const userRole = req.user.role;
    const maKhoa = userRole === "KHOA" ? req.user.maKhoa : null;
    const nhanvien = await accountRepository.getNhanVien(maKhoa);
    
    // Format lại họ tên cho tiện hiển thị
    const formatted = nhanvien.map(nv => ({
      maNV: nv.MAGV.trim(),
      hoTen: `${nv.HO ? nv.HO.trim() : ""} ${nv.TEN ? nv.TEN.trim() : ""}`.trim(),
      maKhoa: nv.MAKHOA ? nv.MAKHOA.trim() : ""
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAccounts,
  createAccount,
  deleteAccount,
  getNhanVien,
};
