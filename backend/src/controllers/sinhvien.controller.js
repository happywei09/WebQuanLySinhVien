// ====================================
// CONTROLLER - SINHVIEN
// ====================================

const sinhvienService = require("../services/sinhvien.service");

const getAllSinhVien = async (req, res, next) => {
  try {
    const data = await sinhvienService.getAllSinhVien();
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getSinhVienById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'SINHVIEN' && req.user.username.toUpperCase() !== id.toUpperCase()) {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn chỉ được phép xem thông tin cá nhân của chính mình." 
      });
    }
    const data = await sinhvienService.getSinhVienById(id);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getSinhVienByLop = async (req, res, next) => {
  try {
    const data = await sinhvienService.getSinhVienByLop(req.params.maLop);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getSinhVienByKhoa = async (req, res, next) => {
  try {
    const data = await sinhvienService.getSinhVienByKhoa(req.params.maKhoa);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const createSinhVien = async (req, res, next) => {
  try {
    await sinhvienService.createSinhVien(req.body);
    res.status(201).json({ success: true, message: "Thêm sinh viên thành công" });
  } catch (error) { next(error); }
};

const updateSinhVien = async (req, res, next) => {
  try {
    await sinhvienService.updateSinhVien(req.params.id, req.body);
    res.json({ success: true, message: "Cập nhật sinh viên thành công" });
  } catch (error) { next(error); }
};

const deleteSinhVien = async (req, res, next) => {
  try {
    await sinhvienService.deleteSinhVien(req.params.id);
    res.json({ success: true, message: "Xoá sinh viên thành công" });
  } catch (error) { next(error); }
};

const searchSinhVien = async (req, res, next) => {
  try {
    const data = await sinhvienService.searchSinhVien(req.query.keyword || "");
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

module.exports = {
  getAllSinhVien,
  getSinhVienById,
  getSinhVienByLop,
  getSinhVienByKhoa,
  createSinhVien,
  updateSinhVien,
  deleteSinhVien,
  searchSinhVien,
};
