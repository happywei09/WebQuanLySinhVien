// ====================================
// CONTROLLER - MONHOC
// ====================================

const monhocService = require("../services/monhoc.service");

const getAllMonHoc = async (req, res, next) => {
  try {
    const data = await monhocService.getAllMonHoc();
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getMonHocById = async (req, res, next) => {
  try {
    const data = await monhocService.getMonHocById(req.params.id);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const createMonHoc = async (req, res, next) => {
  try {
    await monhocService.createMonHoc(req.body);
    res.status(201).json({ success: true, message: "Thêm môn học thành công" });
  } catch (error) { next(error); }
};

const updateMonHoc = async (req, res, next) => {
  try {
    await monhocService.updateMonHoc(req.params.id, req.body);
    res.json({ success: true, message: "Cập nhật môn học thành công" });
  } catch (error) { next(error); }
};

const deleteMonHoc = async (req, res, next) => {
  try {
    await monhocService.deleteMonHoc(req.params.id);
    res.json({ success: true, message: "Xoá môn học thành công" });
  } catch (error) { next(error); }
};

const searchMonHoc = async (req, res, next) => {
  try {
    const data = await monhocService.searchMonHoc(req.query.keyword || "");
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

module.exports = {
  getAllMonHoc,
  getMonHocById,
  createMonHoc,
  updateMonHoc,
  deleteMonHoc,
  searchMonHoc,
};
