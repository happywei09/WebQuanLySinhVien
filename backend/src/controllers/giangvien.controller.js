// ====================================
// CONTROLLER - GIANGVIEN
// ====================================

const giangvienService = require("../services/giangvien.service");

const getAllGiangVien = async (req, res, next) => {
  try {
    const data = await giangvienService.getAllGiangVien();
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getGiangVienById = async (req, res, next) => {
  try {
    const data = await giangvienService.getGiangVienById(req.params.id);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getGiangVienByKhoa = async (req, res, next) => {
  try {
    const data = await giangvienService.getGiangVienByKhoa(req.params.maKhoa);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const createGiangVien = async (req, res, next) => {
  try {
    await giangvienService.createGiangVien(req.body);
    res.status(201).json({ success: true, message: "Thêm giảng viên thành công" });
  } catch (error) { next(error); }
};

const updateGiangVien = async (req, res, next) => {
  try {
    await giangvienService.updateGiangVien(req.params.id, req.body);
    res.json({ success: true, message: "Cập nhật giảng viên thành công" });
  } catch (error) { next(error); }
};

const deleteGiangVien = async (req, res, next) => {
  try {
    await giangvienService.deleteGiangVien(req.params.id);
    res.json({ success: true, message: "Xoá giảng viên thành công" });
  } catch (error) { next(error); }
};

module.exports = {
  getAllGiangVien,
  getGiangVienById,
  getGiangVienByKhoa,
  createGiangVien,
  updateGiangVien,
  deleteGiangVien,
};
