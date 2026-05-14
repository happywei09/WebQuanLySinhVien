// ====================================
// CONTROLLER - KHOA
// ====================================

const khoaService = require("../services/khoa.service");

const getAllKhoa = async (req, res, next) => {
  try {
    const data = await khoaService.getAllKhoa();
    res.json({ success: true, message: "Success", data });
  } catch (error) {
    next(error);
  }
};

const getKhoaById = async (req, res, next) => {
  try {
    const data = await khoaService.getKhoaById(req.params.id);
    res.json({ success: true, message: "Success", data });
  } catch (error) {
    next(error);
  }
};

const createKhoa = async (req, res, next) => {
  try {
    await khoaService.createKhoa(req.body);
    res.status(201).json({ success: true, message: "Thêm khoa thành công" });
  } catch (error) {
    next(error);
  }
};

const updateKhoa = async (req, res, next) => {
  try {
    await khoaService.updateKhoa(req.params.id, req.body);
    res.json({ success: true, message: "Cập nhật khoa thành công" });
  } catch (error) {
    next(error);
  }
};

const deleteKhoa = async (req, res, next) => {
  try {
    await khoaService.deleteKhoa(req.params.id);
    res.json({ success: true, message: "Xoá khoa thành công" });
  } catch (error) {
    next(error);
  }
};

const searchKhoa = async (req, res, next) => {
  try {
    const data = await khoaService.searchKhoa(req.query.keyword || "");
    res.json({ success: true, message: "Success", data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllKhoa,
  getKhoaById,
  createKhoa,
  updateKhoa,
  deleteKhoa,
  searchKhoa,
};
