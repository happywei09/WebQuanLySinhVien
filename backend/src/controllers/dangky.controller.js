// ====================================
// CONTROLLER - DANGKY
// ====================================

const dangkyService = require("../services/dangky.service");

const getDangKyByLopTinChi = async (req, res, next) => {
  try {
    const data = await dangkyService.getDangKyByLopTinChi(parseInt(req.params.maLTC));
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getDangKyBySinhVien = async (req, res, next) => {
  try {
    const data = await dangkyService.getDangKyBySinhVien(req.params.maSV);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const createDangKy = async (req, res, next) => {
  try {
    await dangkyService.createDangKy(req.body);
    res.status(201).json({ success: true, message: "Đăng ký thành công" });
  } catch (error) { next(error); }
};

const cancelDangKy = async (req, res, next) => {
  try {
    const maLTC = req.body.maLTC || req.body.MALTC;
    const maSV = req.body.maSV || req.body.MASV;
    await dangkyService.cancelDangKy(parseInt(maLTC), maSV);
    res.json({ success: true, message: "Huỷ đăng ký thành công" });
  } catch (error) { next(error); }
};

const deleteDangKy = async (req, res, next) => {
  try {
    const maLTC = req.body.maLTC || req.body.MALTC;
    const maSV = req.body.maSV || req.body.MASV;
    await dangkyService.deleteDangKy(parseInt(maLTC), maSV);
    res.json({ success: true, message: "Xoá đăng ký thành công" });
  } catch (error) { next(error); }
};

module.exports = {
  getDangKyByLopTinChi,
  getDangKyBySinhVien,
  createDangKy,
  cancelDangKy,
  deleteDangKy,
};
