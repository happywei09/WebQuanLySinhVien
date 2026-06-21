window.LopTinChiModule = {
  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadDropdowns();
    await this.loadData();
  },

  cacheDOM() {
    this.tbody = document.querySelector('#pageContent tbody');
    this.filterNK = document.getElementById('filterNienKhoa');
    this.filterHK = document.getElementById('filterHocKy');
    this.filterMH = document.getElementById('filterMonHoc');
    this.filterTT = document.getElementById('filterTrangThai');

    if (!document.getElementById('modalLTC')) {
      const modalHTML = `
      <div class="modal-overlay" id="modalLTC">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitleLTC">Mở Lớp Tín Chỉ</h3>
            <button class="btn-close" id="btnCloseModalLTC">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formLTC">
              <input type="hidden" id="maLTC">
              <div style="display: flex; gap: 16px;">
                <div class="form-group" style="flex: 1;">
                  <label class="form-label required">Niên khóa</label>
                  <select id="nienkhoaLTC" class="form-control" required>
                    <option value="">-- Chọn Niên khóa --</option>
                  </select>
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label required">Học kỳ</label>
                  <select id="hockyLTC" class="form-control">
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label required">Môn học</label>
                <select id="monhocLTC" class="form-control" required></select>
              </div>
              <div style="display: flex; gap: 16px;">
                <div class="form-group" style="flex: 1;">
                  <label class="form-label required">Nhóm</label>
                  <input type="number" id="nhomLTC" class="form-control" required min="1">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label required">SV tối thiểu</label>
                  <input type="number" id="svminLTC" class="form-control" required min="1">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label required">Giảng viên</label>
                <select id="giangvienLTC" class="form-control" required></select>
              </div>
              <div class="form-group" id="groupHuyLop" style="display:none;">
                <label class="form-label">Trạng thái</label>
                <select id="huylopLTC" class="form-control">
                  <option value="0">Đang mở</option>
                  <option value="1">Đã hủy</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelModalLTC">Huỷ</button>
            <button class="btn btn-primary" id="btnSaveLTC">Lưu</button>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    this.modal = document.getElementById('modalLTC');
    this.form = document.getElementById('formLTC');
    this.btnSave = document.getElementById('btnSaveLTC');
    this.inputMa = document.getElementById('maLTC');
    this.inputNK = document.getElementById('nienkhoaLTC');
    this.selectHK = document.getElementById('hockyLTC');
    this.selectMH = document.getElementById('monhocLTC');
    this.inputNhom = document.getElementById('nhomLTC');
    this.inputSVMin = document.getElementById('svminLTC');
    this.selectGV = document.getElementById('giangvienLTC');
    this.selectHuy = document.getElementById('huylopLTC');
    this.groupHuy = document.getElementById('groupHuyLop');
  },

  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';
    const btnAdd = document.querySelector('.page-header .btn-success');
    if (btnAdd) {
      if (isPGV) {
        btnAdd.onclick = () => this.openModal();
      } else {
        btnAdd.style.display = 'none';
      }
    }

    document.getElementById('btnCloseModalLTC').onclick = () => this.closeModal();
    document.getElementById('btnCancelModalLTC').onclick = () => this.closeModal();
    this.btnSave.onclick = () => this.handleSave();

    // Bind event listeners for search filters
    if (this.filterNK) this.filterNK.onchange = () => this.renderData();
    if (this.filterHK) this.filterHK.onchange = () => this.renderData();
    if (this.filterMH) this.filterMH.onchange = () => this.renderData();
    if (this.filterTT) this.filterTT.onchange = () => this.renderData();
  },

  async loadDropdowns() {
    try {
      // Tự động sinh danh sách Niên khóa (từ niên khóa hiện tại đến 5 năm sau)
      const date = new Date();
      const currentYear = date.getFullYear();
      const month = date.getMonth() + 1;
      const startYear = (month >= 8 && month <= 12) ? currentYear : (currentYear - 1);

      let nkOptions = '<option value="">-- Chọn Niên khóa --</option>';
      for (let y = startYear; y <= startYear + 5; y++) {
        const nkStr = `${y}-${y + 1}`;
        nkOptions += `<option value="${nkStr}">${nkStr}</option>`;
      }
      this.inputNK.innerHTML = nkOptions;

      const [resMH, resGV] = await Promise.all([API.get('/monhoc'), API.get('/giangvien')]);
      if (resMH.success) {
        this.selectMH.innerHTML = '<option value="">-- Chọn Môn --</option>' +
          resMH.data.map(m => `<option value="${m.MAMH}">${m.TENMH}</option>`).join('');
      }
      if (resGV.success) {
        this.selectGV.innerHTML = '<option value="">-- Chọn Giảng viên --</option>' +
          resGV.data.map(g => `<option value="${g.MAGV}">${g.HO} ${g.TEN}</option>`).join('');
        this.giangvienList = resGV.data; // Store for fetching MAKHOA
      }
    } catch (e) { }
  },

  normalizeText(str) {
    if (!str) return '';
    return str.toString().trim().replace(/\s+/g, ' ');
  },

  populateFilters() {
    const prevNK = this.filterNK.value;
    const prevMH = this.filterMH.value;

    // 1. Niên khóa
    const uniqueNK = [...new Set(this.lopTinChiListAll.map(item => this.normalizeText(item.NIENKHOA)))]
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));

    this.filterNK.innerHTML = '<option value="">Tất cả Niên khóa</option>' +
      uniqueNK.map(nk => `<option value="${nk}">${nk}</option>`).join('');

    if (prevNK && uniqueNK.includes(prevNK)) {
      this.filterNK.value = prevNK;
    }

    // 2. Môn học
    const uniqueMH = new Map();
    this.lopTinChiListAll.forEach(item => {
      if (item.MAMH) {
        const mamh = this.normalizeText(item.MAMH);
        if (!uniqueMH.has(mamh)) {
          uniqueMH.set(mamh, item.TENMH || item.MAMH);
        }
      }
    });

    let mhOptions = '<option value="">Tất cả Môn học</option>';
    uniqueMH.forEach((tenMH, mamh) => {
      mhOptions += `<option value="${mamh}">${tenMH}</option>`;
    });
    this.filterMH.innerHTML = mhOptions;

    if (prevMH && uniqueMH.has(prevMH)) {
      this.filterMH.value = prevMH;
    }
  },

  renderData() {
    const nk = this.normalizeText(this.filterNK.value);
    const hk = this.filterHK.value;
    const mh = this.filterMH.value;
    const tt = this.filterTT.value;

    let filtered = this.lopTinChiListAll;

    if (nk) {
      filtered = filtered.filter(item => this.normalizeText(item.NIENKHOA) === nk);
    }
    if (hk) {
      filtered = filtered.filter(item => String(item.HOCKY) === String(hk));
    }
    if (mh) {
      filtered = filtered.filter(item => this.normalizeText(item.MAMH) === mh);
    }
    if (tt !== '') {
      const isHuy = tt === '1';
      filtered = filtered.filter(item => !!item.HUYLOP === isHuy);
    }

    this.tbody.innerHTML = filtered.length === 0
      ? '<tr><td colspan="9" style="text-align:center;">Không tìm thấy lớp tín chỉ phù hợp</td></tr>'
      : filtered.map((item) => {
        const actionBtn = this.isPGV
          ? `<button class="btn btn-primary btn-sm" onclick="window.LopTinChiModule.openModal(${item.MALTC}, '${item.NIENKHOA}', ${item.HOCKY}, '${item.MAMH}', ${item.NHOM}, '${item.MAGV}', ${item.SOSVTOITHIEU}, ${item.HUYLOP ? 1 : 0})">Sửa</button>
               <button class="btn btn-danger btn-sm" onclick="window.LopTinChiModule.handleDelete(${item.MALTC})">Xóa</button>`
          : `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;
        return `
          <tr>
            <td>${item.MALTC}</td>
            <td>${item.NIENKHOA}</td>
            <td>${item.HOCKY}</td>
            <td>${item.TENMH || item.MAMH}</td>
            <td>${item.NHOM}</td>
            <td>${item.TENGV || item.MAGV}</td>
            <td>${item.SOSVTOITHIEU}</td>
            <td>${item.HUYLOP ? '<span style="color:red">Đã hủy</span>' : '<span style="color:green">Đang mở</span>'}</td>
            <td style="text-align:center;">
              ${actionBtn}
            </td>
          </tr>`;
      }).join('');
  },

  async loadData() {
    const user = Auth.getUser();
    this.isPGV = user && user.role === 'PGV';

    try {
      this.tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Đang tải...</td></tr>';
      const res = await API.get('/loptinchi');
      if (res.success) {
        this.lopTinChiListAll = res.data || [];
        this.populateFilters();
        this.renderData();
      }
    } catch (error) { Toast.error(error.message); }
  },

  openModal(ma = '', nk = '', hk = '1', mh = '', nhom = '', gv = '', svmin = '', huy = 0) {
    this.isEdit = !!ma;
    document.getElementById('modalTitleLTC').textContent = this.isEdit ? 'Sửa Lớp Tín Chỉ' : 'Mở Lớp Tín Chỉ';
    this.groupHuy.style.display = this.isEdit ? 'block' : 'none';

    this.inputMa.value = ma;
    if (!this.isEdit) {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      let currentNK = "";
      let currentHK = 1;

      if (month >= 8 && month <= 12) {
        currentNK = `${year}-${year + 1}`;
        currentHK = 1;
      } else if (month >= 1 && month <= 6) {
        currentNK = `${year - 1}-${year}`;
        currentHK = 2;
      } else if (month === 7) {
        currentNK = `${year - 1}-${year}`;
        currentHK = 3;
      }

      const years = currentNK.split("-").map(Number);
      const startYear = years[0];
      const endYear = years[1];

      let nextNK = "";
      let nextHK = "1";

      if (currentHK === 1) {
        nextNK = `${startYear}-${endYear}`;
        nextHK = "2";
      } else if (currentHK === 2) {
        nextNK = `${startYear}-${endYear}`;
        nextHK = "3";
      } else if (currentHK === 3) {
        nextNK = `${startYear + 1}-${endYear + 1}`;
        nextHK = "1";
      }

      this.inputNK.value = nextNK;
      this.selectHK.value = nextHK;
    } else {
      if (nk) {
        let exists = false;
        for (let option of this.inputNK.options) {
          if (option.value === nk) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          const opt = document.createElement('option');
          opt.value = nk;
          opt.textContent = nk;
          this.inputNK.appendChild(opt);
        }
      }
      this.inputNK.value = nk;
      this.selectHK.value = hk;
    }
    this.selectMH.value = mh;
    this.inputNhom.value = nhom;
    this.selectGV.value = gv;
    this.inputSVMin.value = svmin;
    this.selectHuy.value = huy;

    this.modal.classList.add('active');
  },

  closeModal() {
    this.modal.classList.remove('active');
    this.form.reset();
  },

  async handleSave() {
    const nk = this.inputNK.value.trim();
    const hk = this.selectHK.value;
    const mh = this.selectMH.value;
    const nhom = this.inputNhom.value;
    const gv = this.selectGV.value;
    const svmin = this.inputSVMin.value;
    const huy = this.selectHuy.value === '1';

    if (!nk || !mh || !nhom || !gv || !svmin) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Find the MAKHOA of the selected GiangVien
    const gvObj = this.giangvienList.find(g => g.MAGV === gv);
    const makhoa = gvObj ? gvObj.MAKHOA : '';

    try {
      this.btnSave.disabled = true;
      const data = {
        NIENKHOA: nk, HOCKY: hk, MAMH: mh, NHOM: nhom, MAGV: gv, MAKHOA: makhoa, SOSVTOITHIEU: svmin, HUYLOP: huy
      };

      let res;
      if (this.isEdit) {
        res = await API.put(`/loptinchi/update/${this.inputMa.value}`, data);
      } else {
        res = await API.post('/loptinchi/create', data);
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
    if (!confirm(`Bạn có chắc muốn xóa lớp tín chỉ ${ma}?`)) return;
    try {
      const res = await API.delete(`/loptinchi/delete/${ma}`);
      if (res.success) {
        Toast.success(res.message);
        await this.loadData();
      }
    } catch (error) {
      Toast.error(error.message);
    }
  }
};
window.LopTinChiModule.init();
