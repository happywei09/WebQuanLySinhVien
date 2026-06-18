// ====================================
// CONTROLLER - LOPTINCHI
// ====================================

const loptinchiService = require("../services/loptinchi.service");

const getAllLopTinChi = async (req, res, next) => {
  try {
    const data = await loptinchiService.getLopTinChiForUser(req.user);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getLopTinChiById = async (req, res, next) => {
  try {
    const data = await loptinchiService.getLopTinChiById(parseInt(req.params.id));
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getLopTinChiByKhoa = async (req, res, next) => {
  try {
    const data = await loptinchiService.getLopTinChiByKhoa(req.params.maKhoa);
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const getLopTinChiByNienKhoaHocKy = async (req, res, next) => {
  try {
    const { nienKhoa, hocKy } = req.query;
    const data = await loptinchiService.getLopTinChiByNienKhoaHocKy(
      nienKhoa,
      parseInt(hocKy)
    );
    res.json({ success: true, message: "Success", data });
  } catch (error) { next(error); }
};

const createLopTinChi = async (req, res, next) => {
  try {
    await loptinchiService.createLopTinChi(req.body);
    res.status(201).json({ success: true, message: "Thêm lớp tín chỉ thành công" });
  } catch (error) { next(error); }
};

const updateLopTinChi = async (req, res, next) => {
  try {
    await loptinchiService.updateLopTinChi(parseInt(req.params.id), req.body);
    res.json({ success: true, message: "Cập nhật lớp tín chỉ thành công" });
  } catch (error) { next(error); }
};

const deleteLopTinChi = async (req, res, next) => {
  try {
    await loptinchiService.deleteLopTinChi(parseInt(req.params.id));
    res.json({ success: true, message: "Xoá lớp tín chỉ thành công" });
  } catch (error) { next(error); }
};

const cancelLopTinChi = async (req, res, next) => {
  try {
    await loptinchiService.cancelLopTinChi(parseInt(req.params.id));
    res.json({ success: true, message: "Huỷ lớp tín chỉ thành công" });
  } catch (error) { next(error); }
};

module.exports = {
  getAllLopTinChi,
  getLopTinChiById,
  getLopTinChiByKhoa,
  getLopTinChiByNienKhoaHocKy,
  createLopTinChi,
  updateLopTinChi,
  deleteLopTinChi,
  cancelLopTinChi,
};
