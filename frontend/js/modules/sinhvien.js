/* ====================================
   MODULE SINH VIÊN
   File: js/modules/sinhvien.js
==================================== */

window.SinhVienModule = {
  allSV: [],   // Danh sách toàn bộ sinh viên từ API
  allLops: [], // Danh sách toàn bộ lớp học từ API

  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadLopList();
    await this.loadSinhVien();
  },

  cacheDOM() {
    // Bộ lọc và Tìm kiếm
    this.searchSV = document.getElementById('searchSV');
    this.filterSVKhoaHoc = document.getElementById('filterSVKhoaHoc');
    this.filterSVLop = document.getElementById('filterSVLop');
    this.btnAdd = document.getElementById('btnAddSV');
    this.tbody = document.querySelector('#cardSV tbody');
    this.cardSV = document.getElementById('cardSV');
    
    // Modal & Form
    this.modal = document.getElementById('modalSV');
    this.form = document.getElementById('formSV');
    this.btnSave = document.getElementById('btnSaveSV');
    this.inputMa = document.getElementById('maSV');
    this.inputHo = document.getElementById('hoSV');
    this.inputTen = document.getElementById('tenSV');
    this.inputPhai = document.getElementById('phaiSV');
    this.selectLopModal = document.getElementById('lopSV');
  },

  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';
    
    if (this.btnAdd) {
      if (isPGV) {
        this.btnAdd.onclick = () => this.openModal();
      } else {
        this.btnAdd.style.display = 'none';
      }
    }
    
    document.getElementById('btnCloseModalSV').onclick = () => this.closeModal();
    document.getElementById('btnCancelModalSV').onclick = () => this.closeModal();
    this.btnSave.onclick = () => this.handleSave();

    // Lắng nghe sự kiện tìm kiếm & bộ lọc
    if (this.searchSV) {
      this.searchSV.addEventListener('input', () => this.filterAndRenderData());
    }
    if (this.filterSVKhoaHoc) {
      this.filterSVKhoaHoc.addEventListener('change', () => {
        this.updateClassFilterOptions(); // Khi đổi khóa học, cập nhật lại danh sách lớp khả dụng trong bộ lọc
        this.filterAndRenderData();
      });
    }
    if (this.filterSVLop) {
      this.filterSVLop.addEventListener('change', () => this.filterAndRenderData());
    }
  },

  async loadLopList() {
    try {
      const res = await API.get('/lop');
      if (res.success) {
        this.allLops = res.data || [];
        
        // 1. Điền danh sách Khóa học vào bộ lọc (Distinct KHOAHOC)
        if (this.filterSVKhoaHoc) {
          this.filterSVKhoaHoc.innerHTML = '<option value="ALL">Tất cả Khóa học</option>';
          const distinctKhoaHoc = [...new Set(this.allLops.map(lop => lop.KHOAHOC).filter(Boolean))].sort();
          distinctKhoaHoc.forEach(kh => {
            const opt = document.createElement('option');
            opt.value = kh;
            opt.textContent = kh;
            this.filterSVKhoaHoc.appendChild(opt);
          });
        }

        // 2. Điền tất cả các Lớp vào bộ lọc lúc đầu
        this.updateClassFilterOptions();

        // 3. Điền danh sách Lớp vào select trong Modal (dùng khi thêm/sửa)
        if (this.selectLopModal) {
          this.selectLopModal.innerHTML = '<option value="">-- Chọn một lớp --</option>';
          this.allLops.forEach(lop => {
            this.selectLopModal.innerHTML += `<option value="${lop.MALOP}">${lop.MALOP} - ${lop.TENLOP}</option>`;
          });
        }
      }
    } catch (error) {
      console.error('Không thể tải danh sách lớp', error);
    }
  },

  // Cập nhật danh sách Lớp học trong bộ lọc tùy theo Khóa học đang chọn
  updateClassFilterOptions() {
    if (!this.filterSVLop) return;
    const selectedCohort = this.filterSVKhoaHoc ? this.filterSVKhoaHoc.value : 'ALL';
    
    this.filterSVLop.innerHTML = '<option value="ALL">Tất cả Lớp</option>';
    
    const filteredLops = selectedCohort === 'ALL'
      ? this.allLops
      : this.allLops.filter(lop => lop.KHOAHOC === selectedCohort);

    filteredLops.forEach(lop => {
      const opt = document.createElement('option');
      opt.value = lop.MALOP;
      opt.textContent = `${lop.MALOP} - ${lop.TENLOP}`;
      this.filterSVLop.appendChild(opt);
    });
  },

  async loadSinhVien() {
    try {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Đang tải toàn bộ sinh viên...</td></tr>';
      const res = await API.get('/sinhvien');
      if (res.success) {
        this.allSV = res.data || [];
        this.filterAndRenderData();
      }
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Lỗi tải dữ liệu sinh viên</td></tr>';
      Toast.error(error.message);
    }
  },

  filterAndRenderData() {
    const keyword = this.searchSV ? this.searchSV.value.trim().toLowerCase() : '';
    const selectedCohort = this.filterSVKhoaHoc ? this.filterSVKhoaHoc.value : 'ALL';
    const selectedClass = this.filterSVLop ? this.filterSVLop.value : 'ALL';

    const filtered = this.allSV.filter(sv => {
      // 1. Tìm kiếm theo Mã SV hoặc Họ tên
      const fullName = `${sv.HO || ''} ${sv.TEN || ''}`.trim().toLowerCase();
      const matchesSearch = !keyword ||
        (sv.MASV && sv.MASV.toLowerCase().includes(keyword)) ||
        fullName.includes(keyword);

      // 2. Lọc theo Khóa học (KHOAHOC từ bảng LOP)
      let matchesCohort = true;
      if (selectedCohort !== 'ALL') {
        const studentClass = this.allLops.find(l => l.MALOP === sv.MALOP);
        matchesCohort = studentClass && studentClass.KHOAHOC === selectedCohort;
      }

      // 3. Lọc theo Lớp
      const matchesClass = selectedClass === 'ALL' || sv.MALOP === selectedClass;

      return matchesSearch && matchesCohort && matchesClass;
    });

    this.renderTable(filtered);
  },

  renderTable(data) {
    this.tbody.innerHTML = '';
    if (data.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Không tìm thấy sinh viên nào phù hợp</td></tr>';
      return;
    }

    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    data.forEach((sv, index) => {
      const tr = document.createElement('tr');
      
      const actionContent = isPGV
        ? `<button class="btn btn-primary btn-sm" onclick="window.SinhVienModule.openModal('${sv.MASV}', '${sv.HO || ''}', '${sv.TEN || ''}', ${sv.PHAI ? 1 : 0}, '${sv.MALOP}')">Sửa</button>
           <button class="btn btn-danger btn-sm" onclick="window.SinhVienModule.handleDelete('${sv.MASV}')">Xoá</button>`
        : `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td style="font-weight: 600;">${sv.MASV}</td>
        <td>${sv.HO}</td>
        <td>${sv.TEN}</td>
        <td>${sv.MALOP}</td>
        <td>${sv.PHAI ? 'Nữ' : 'Nam'}</td>
        <td>
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            ${actionContent}
          </div>
        </td>
      `;
      this.tbody.appendChild(tr);
    });
  },

  openModal(ma = '', ho = '', ten = '', phai = 0, malop = '') {
    this.isEdit = !!ma;
    document.getElementById('modalTitleSV').textContent = this.isEdit ? 'Sửa Sinh Viên' : 'Thêm Sinh Viên';
    
    this.inputMa.value = ma;
    this.inputMa.readOnly = this.isEdit;
    this.inputHo.value = ho;
    this.inputTen.value = ten;
    this.inputPhai.value = phai;
    
    // Nếu có chọn một lớp cụ thể ở bộ lọc, tự động gán làm lớp mặc định trong modal
    if (this.selectLopModal) {
      if (malop) {
        this.selectLopModal.value = malop;
      } else {
        const filterLopVal = this.filterSVLop ? this.filterSVLop.value : 'ALL';
        this.selectLopModal.value = filterLopVal !== 'ALL' ? filterLopVal : '';
      }
    }
    
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
    const maLop = this.selectLopModal ? this.selectLopModal.value : '';

    if (!ma || !ho || !ten || !maLop) {
      Toast.warning('Vui lòng điền đầy đủ thông tin sinh viên và chọn lớp');
      return;
    }

    try {
      this.btnSave.disabled = true;
      let res;
      
      if (this.isEdit) {
        res = await API.put(`/sinhvien/update/${ma}`, { HO: ho, TEN: ten, PHAI: phai === "1", MALOP: maLop });
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
