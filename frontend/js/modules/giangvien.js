window.GiangVienModule = {
  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadKhoaList();
    await this.loadData();
  },

  cacheDOM() {
    this.tbody = document.querySelector('#pageContent tbody');
    if (!document.getElementById('modalGV')) {
      const modalHTML = `
      <div class="modal-overlay" id="modalGV">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitleGV">Thêm Giảng Viên</h3>
            <button class="btn-close" id="btnCloseModalGV">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formGV">
              <div class="form-group">
                <label class="form-label required">Mã Giảng Viên</label>
                <input type="text" id="maGV" class="form-control" required>
              </div>
              <div style="display: flex; gap: 16px;">
                <div class="form-group" style="flex: 2;">
                  <label class="form-label required">Họ và đệm</label>
                  <input type="text" id="hoGV" class="form-control" required>
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label required">Tên</label>
                  <input type="text" id="tenGV" class="form-control" required>
                </div>
              </div>
              <div style="display: flex; gap: 16px;">
                <div class="form-group" style="flex: 1;">
                  <label class="form-label required">Học vị</label>
                  <input type="text" id="hocviGV" class="form-control" required>
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label required">Học hàm</label>
                  <input type="text" id="hochamGV" class="form-control" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label required">Khoa trực thuộc</label>
                <select id="khoaGV" class="form-control" required></select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelModalGV">Huỷ</button>
            <button class="btn btn-primary" id="btnSaveGV">Lưu</button>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    this.modal = document.getElementById('modalGV');
    this.form = document.getElementById('formGV');
    this.btnSave = document.getElementById('btnSaveGV');
    this.inputMa = document.getElementById('maGV');
    this.inputHo = document.getElementById('hoGV');
    this.inputTen = document.getElementById('tenGV');
    this.inputHocVi = document.getElementById('hocviGV');
    this.inputHocHam = document.getElementById('hochamGV');
    this.selectKhoa = document.getElementById('khoaGV');
  },

  bindEvents() {
    const btnAdd = document.querySelector('.page-header .btn-primary');
    if (btnAdd) btnAdd.onclick = () => this.openModal();
    
    document.getElementById('btnCloseModalGV').onclick = () => this.closeModal();
    document.getElementById('btnCancelModalGV').onclick = () => this.closeModal();
    this.btnSave.onclick = () => this.handleSave();
  },

  async loadKhoaList() {
    try {
      const res = await API.get('/khoa');
      if (res.success) {
        this.selectKhoa.innerHTML = '<option value="">-- Chọn Khoa --</option>' + 
          res.data.map(k => `<option value="${k.MAKHOA}">${k.MAKHOA} - ${k.TENKHOA}</option>`).join('');
      }
    } catch (e) {}
  },

  async loadData() {
    try {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Đang tải...</td></tr>';
      const res = await API.get('/giangvien');
      if (res.success) {
        this.tbody.innerHTML = res.data.length === 0 
          ? '<tr><td colspan="7" style="text-align:center;">Không có dữ liệu</td></tr>'
          : res.data.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.MAGV}</td>
              <td>${item.HO} ${item.TEN}</td>
              <td>${item.HOCVI}</td>
              <td>${item.HOCHAM}</td>
              <td>${item.MAKHOA}</td>
              <td style="text-align:center;">
                <button class="btn btn-secondary btn-sm" onclick="window.GiangVienModule.openModal('${item.MAGV}', '${item.HO}', '${item.TEN}', '${item.HOCVI}', '${item.HOCHAM}', '${item.MAKHOA}')">Sửa</button>
                <button class="btn btn-danger btn-sm" onclick="window.GiangVienModule.handleDelete('${item.MAGV}')">Xóa</button>
              </td>
            </tr>`).join('');
      }
    } catch (error) { Toast.error(error.message); }
  },

  openModal(ma = '', ho = '', ten = '', hocvi = '', hocham = '', khoa = '') {
    this.isEdit = !!ma;
    document.getElementById('modalTitleGV').textContent = this.isEdit ? 'Sửa Giảng Viên' : 'Thêm Giảng Viên';
    
    this.inputMa.value = ma;
    this.inputMa.readOnly = this.isEdit;
    this.inputHo.value = ho;
    this.inputTen.value = ten;
    this.inputHocVi.value = hocvi;
    this.inputHocHam.value = hocham;
    this.selectKhoa.value = khoa;
    
    this.modal.classList.add('active');
  },

  closeModal() {
    this.modal.classList.remove('active');
    this.form.reset();
  },

  async handleSave() {
    const ma = this.inputMa.value.trim();
    const ho = this.inputHo.value.trim();
    const ten = this.inputTen.value.trim();
    const hocvi = this.inputHocVi.value.trim();
    const hocham = this.inputHocHam.value.trim();
    const khoa = this.selectKhoa.value;

    if (!ma || !ho || !ten || !khoa) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      this.btnSave.disabled = true;
      const data = { MAGV: ma, HO: ho, TEN: ten, HOCVI: hocvi, HOCHAM: hocham, MAKHOA: khoa };
      let res;
      if (this.isEdit) {
        res = await API.put(`/giangvien/update/${ma}`, data);
      } else {
        res = await API.post('/giangvien/create', data);
      }

      if (res.success) {
        Toast.success(res.message);
        this.closeModal();
        await this.loadData();
      }
    } catch (error) {
      Toast.error(error.message);
    } finally {
      this.btnSave.disabled = false;
    }
  },

  async handleDelete(ma) {
    if (!confirm(`Bạn có chắc muốn xóa giảng viên ${ma}?`)) return;
    try {
      const res = await API.delete(`/giangvien/delete/${ma}`);
      if (res.success) {
        Toast.success(res.message);
        await this.loadData();
      }
    } catch (error) {
      Toast.error(error.message);
    }
  }
};
window.GiangVienModule.init();
