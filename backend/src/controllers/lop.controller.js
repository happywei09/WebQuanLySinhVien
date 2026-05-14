// ====================================
// CONTROLLER - LOP
// ====================================

const lopService = require("../services/lop.service");

const getAllLop = async (req, res, next) => {
  try {
    const data = await lopService.getAllLop();
    res.json({ success: true, message: "Success", data });
  } catch (error) {
    next(error);
  }
};

const getLopById = async (req, res, next) => {
  try {
    const data = await lopService.getLopById(req.params.id);
    res.json({ success: true, message: "Success", data });
  } catch (error) {
    next(error);
  }
};

const getLopByKhoa = async (req, res, next) => {
  try {
    const data = await lopService.getLopByKhoa(req.params.maKhoa);
    res.json({ success: true, message: "Success", data });
  } catch (error) {
    next(error);
  }
};

const createLop = async (req, res, next) => {
  try {
    await lopService.createLop(req.body);
    res.status(201).json({ success: true, message: "Thêm lớp thành công" });
  } catch (error) {
    next(error);
  }
};

const updateLop = async (req, res, next) => {
  try {
    await lopService.updateLop(req.params.id, req.body);
    res.json({ success: true, message: "Cập nhật lớp thành công" });
  } catch (error) {
    next(error);
  }
};

const deleteLop = async (req, res, next) => {
  try {
    await lopService.deleteLop(req.params.id);
    res.json({ success: true, message: "Xoá lớp thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLop,
  getLopById,
  getLopByKhoa,
  createLop,
  updateLop,
  deleteLop,
};
