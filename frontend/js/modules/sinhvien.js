/* ====================================
   MODULE SINH VIÊN
   File: js/modules/sinhvien.js
==================================== */

window.SinhVienModule = {
  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadLopList();
  },

  cacheDOM() {
    this.selectLop = document.getElementById('selectLopSV');
    this.btnLoad = document.getElementById('btnLoadSV');
    this.btnAdd = document.getElementById('btnAddSV');
    this.tbody = document.querySelector('#cardSV tbody');
    this.cardSV = document.getElementById('cardSV');
    
    // Modal
    this.modal = document.getElementById('modalSV');
    this.form = document.getElementById('formSV');
    this.btnSave = document.getElementById('btnSaveSV');
    this.inputMa = document.getElementById('maSV');
    this.inputHo = document.getElementById('hoSV');
    this.inputTen = document.getElementById('tenSV');
    this.inputPhai = document.getElementById('phaiSV');
  },

  bindEvents() {
    this.btnLoad.onclick = () => this.loadSinhVien();
    this.btnAdd.onclick = () => this.openModal();
    document.getElementById('btnCloseModalSV').onclick = () => this.closeModal();
    document.getElementById('btnCancelModalSV').onclick = () => this.closeModal();
    this.btnSave.onclick = () => this.handleSave();
  },

  async loadLopList() {
    try {
      const res = await API.get('/lop');
      if (res.success) {
        this.selectLop.innerHTML = '<option value="">-- Chọn một lớp --</option>';
        res.data.forEach(lop => {
          this.selectLop.innerHTML += `<option value="${lop.MALOP}">${lop.MALOP} - ${lop.TENLOP}</option>`;
        });
      }
    } catch (error) {
      console.error('Không thể tải danh sách lớp', error);
    }
  },

  async loadSinhVien() {
    const maLop = this.selectLop.value;
    if (!maLop) {
      Toast.warning('Vui lòng chọn lớp');
      return;
    }

    try {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Đang tải...</td></tr>';
      this.cardSV.style.display = 'block';
      const res = await API.get(`/sinhvien/lop/${maLop}`);
      if (res.success) this.renderTable(res.data);
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Lỗi tải dữ liệu</td></tr>';
      Toast.error(error.message);
    }
  },

  renderTable(data) {
    this.tbody.innerHTML = '';
    if (data.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Lớp này chưa có sinh viên</td></tr>';
      return;
    }

    data.forEach((sv, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${sv.MASV}</td>
        <td>${sv.HO}</td>
        <td>${sv.TEN}</td>
        <td>${sv.MALOP}</td>
        <td>${sv.PHAI ? 'Nữ' : 'Nam'}</td>
        <td style="text-align: center;">
          <button class="btn btn-secondary btn-sm" onclick="window.SinhVienModule.openModal('${sv.MASV}', '${sv.HO}', '${sv.TEN}', ${sv.PHAI ? 1 : 0})">Sửa</button>
          <button class="btn btn-danger btn-sm" onclick="window.SinhVienModule.handleDelete('${sv.MASV}')">Xoá</button>
        </td>
      `;
      this.tbody.appendChild(tr);
    });
  },

  openModal(ma = '', ho = '', ten = '', phai = 0) {
    const maLop = this.selectLop.value;
    if (!maLop && !ma) {
      Toast.warning('Vui lòng chọn lớp trước khi thêm sinh viên');
      return;
    }

    this.isEdit = !!ma;
    document.getElementById('modalTitleSV').textContent = this.isEdit ? 'Sửa Sinh Viên' : 'Thêm Sinh Viên';
    
    this.inputMa.value = ma;
    this.inputMa.readOnly = this.isEdit;
    this.inputHo.value = ho;
    this.inputTen.value = ten;
    this.inputPhai.value = phai;
    
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
    const phai = this.inputPhai.value;
    const maLop = this.selectLop.value;

    if (!ma || !ho || !ten) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      this.btnSave.disabled = true;
      let res;
      
      if (this.isEdit) {
        res = await API.put(`/sinhvien/update/${ma}`, { HO: ho, TEN: ten, PHAI: phai === "1" });
      } else {
        res = await API.post('/sinhvien/create', { MASV: ma, HO: ho, TEN: ten, PHAI: phai === "1", MALOP: maLop });
      }

      if (res.success) {
        Toast.success(res.message);
        this.closeModal();
        await this.loadSinhVien();
      }
    } catch (error) {
      Toast.error(error.message);
    } finally {
      this.btnSave.disabled = false;
    }
  },

  async handleDelete(ma) {
    if (!confirm(`Bạn có chắc chắn muốn xoá sinh viên ${ma}?`)) return;

    try {
      const res = await API.delete(`/sinhvien/delete/${ma}`);
      if (res.success) {
        Toast.success(res.message);
        await this.loadSinhVien();
      }
    } catch (error) {
      Toast.error(error.message);
    }
  }
};

window.SinhVienModule.init();
