/* ====================================
   MODULE LOP TIN CHI (Ghi / Phục hồi)
   File: js/modules/loptinchi.js
 ==================================== */

window.LopTinChiModule = {
  state: {
    originalData: [],
    pendingOperations: {},
    history: [],
    monhocList: [],
    giangvienList: [],
    isAddingRow: false,
    editingLTCId: null,
    editingDraft: null
  },

  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadDropdowns();
    await this.loadData();
  },

  cacheDOM() {
    this.tbody = document.querySelector('.loptinchi-list-scroll table tbody');
    this.filterNK = document.getElementById('filterNienKhoa');
    this.filterHK = document.getElementById('filterHocKy');
    this.filterMH = document.getElementById('filterMonHoc');
    this.filterTT = document.getElementById('filterTrangThai');
    this.btnCommit = document.getElementById('btnCommitLTC');
    this.btnUndo = document.getElementById('btnUndoLTC');
    this.pendingStatus = document.getElementById('loptinchiPendingStatus');

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
              <div class="form-group">
                <label class="form-label required">Khoa</label>
                <select id="khoaLTC" class="form-control" required>
                  <option value="">-- Chọn Khoa --</option>
                </select>
              </div>
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
            <button class="btn btn-primary" id="btnSaveLTC">Lưu tạm</button>
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
    this.selectKhoa = document.getElementById('khoaLTC');
  },

  bindEvents() {
    const user = Auth.getUser();
    this.isPGV = user && user.role === 'PGV';
    const btnAdd = document.getElementById('btnAddLTC');

    if (btnAdd) {
      if (this.isPGV) {
        btnAdd.onclick = () => this.openModal();
      } else {
        btnAdd.style.display = 'none';
      }
    }

    if (!this.isPGV) {
      if (this.btnCommit) this.btnCommit.style.display = 'none';
      if (this.btnUndo) this.btnUndo.style.display = 'none';
    }

    document.getElementById('btnCloseModalLTC').onclick = () => this.closeModal();
    document.getElementById('btnCancelModalLTC').onclick = () => this.closeModal();
    this.btnSave.onclick = () => this.handleSaveDraftRow();

    if (this.btnCommit) this.btnCommit.onclick = () => this.handleCommit();
    if (this.btnUndo) this.btnUndo.onclick = () => this.handleUndo();

    if (this.filterNK) this.filterNK.onchange = () => this.renderData();
    if (this.filterHK) this.filterHK.onchange = () => this.renderData();
    if (this.filterMH) this.filterMH.onchange = () => this.renderData();
    if (this.filterTT) this.filterTT.onchange = () => this.renderData();

    if (this.selectGV) {
      this.selectGV.onchange = () => {
        const gv = this.selectGV.value;
        const gvObj = this.state.giangvienList.find(g => (g.MAGV ? g.MAGV.trim() : '') === gv);
        if (gvObj && gvObj.MAKHOA && this.selectKhoa) {
          this.selectKhoa.value = gvObj.MAKHOA.trim();
        }
      };
    }
  },

  async loadDropdowns() {
    try {
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

      const [resMH, resGV, resKhoa] = await Promise.all([
        API.get('/monhoc'),
        API.get('/giangvien'),
        API.get('/khoa')
      ]);
      if (resMH.success) {
        this.state.monhocList = resMH.data || [];
        this.selectMH.innerHTML = '<option value="">-- Chọn Môn --</option>' +
          this.state.monhocList.map(m => `<option value="${m.MAMH ? m.MAMH.trim() : ''}">${m.MAMH ? m.MAMH.trim() : ''} - ${m.TENMH}</option>`).join('');
      }
      if (resGV.success) {
        this.state.giangvienList = resGV.data || [];
        this.selectGV.innerHTML = '<option value="">-- Chọn Giảng viên --</option>' +
          this.state.giangvienList.map(g => `<option value="${g.MAGV ? g.MAGV.trim() : ''}">${g.MAGV ? g.MAGV.trim() : ''} - ${g.HO} ${g.TEN}</option>`).join('');
      }
      if (resKhoa.success) {
        this.state.khoaList = resKhoa.data || [];
        this.selectKhoa.innerHTML = '<option value="">-- Chọn Khoa --</option>' +
          this.state.khoaList.map(k => `<option value="${k.MAKHOA ? k.MAKHOA.trim() : ''}">${k.TENKHOA}</option>`).join('');
      }
    } catch (e) {
      Toast.error('Không tải được danh sách môn học, giảng viên hoặc khoa');
    }
  },

  normalizeText(str) {
    if (!str) return '';
    return str.toString().trim().replace(/\s+/g, ' ');
  },

  populateFilters() {
    const prevNK = this.filterNK.value;
    const prevMH = this.filterMH.value;

    const uniqueNK = [...new Set(this.state.originalData.map(item => this.normalizeText(item.NIENKHOA)))]
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));

    this.filterNK.innerHTML = '<option value="">Tất cả Niên khóa</option>' +
      uniqueNK.map(nk => `<option value="${nk}">${nk}</option>`).join('');

    if (prevNK && uniqueNK.includes(prevNK)) {
      this.filterNK.value = prevNK;
    }

    const uniqueMH = new Map();
    this.state.originalData.forEach(item => {
      if (item.MAMH) {
        const mamh = this.normalizeText(item.MAMH);
        if (!uniqueMH.has(mamh)) {
          const mhObj = this.state.monhocList.find(m => m.MAMH === mamh);
          uniqueMH.set(mamh, mhObj ? mhObj.TENMH : item.MAMH);
        }
      }
    });

    let mhOptions = '<option value="">Tất cả Môn học</option>';
    uniqueMH.forEach((tenMH, mamh) => {
      mhOptions += `<option value="${mamh}">${mamh ? mamh.trim().toUpperCase() : ''} - ${tenMH}</option>`;
    });
    this.filterMH.innerHTML = mhOptions;

    if (prevMH && uniqueMH.has(prevMH)) {
      this.filterMH.value = prevMH;
    }
  },

  async loadData() {
    if (this.hasPendingChanges()) {
      const ok = confirm('Bạn đang có thay đổi chưa ghi. Tải lại dữ liệu sẽ bỏ các thay đổi này. Tiếp tục?');
      if (!ok) return;
    }

    try {
      this.tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Đang tải...</td></tr>';
      const res = await API.get('/loptinchi');
      if (res.success) {
        this.state.originalData = res.data || [];
        this.state.pendingOperations = {};
        this.state.history = [];
        this.populateFilters();
        this.renderData();
      }
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:red;">Lỗi kết nối API.</td></tr>';
      Toast.error(error.message);
    } finally {
      this.updateActionState();
    }
  },

  getCurrentData() {
    const map = new Map(this.state.originalData.map(item => [String(item.MALTC), { ...item }]));

    Object.values(this.state.pendingOperations).forEach(op => {
      if (op.type === 'create' || op.type === 'update') {
        map.set(String(op.key), { ...op.newValue });
      } else if (op.type === 'delete') {
        const item = map.get(String(op.key));
        if (item) {
          item._isDeleted = true;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      // Sort by nienkhoa desc, hocky desc, maltc desc
      if (a.NIENKHOA !== b.NIENKHOA) return b.NIENKHOA.localeCompare(a.NIENKHOA);
      if (a.HOCKY !== b.HOCKY) return b.HOCKY - a.HOCKY;
      return String(b.MALTC).localeCompare(String(a.MALTC));
    });
  },

  renderData() {
    const nk = this.normalizeText(this.filterNK.value);
    const hk = this.filterHK.value;
    const mh = this.filterMH.value;
    const tt = this.filterTT.value;

    let filtered = this.getCurrentData();

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
      ? '<tr><td colspan="10" style="text-align:center;">Không tìm thấy lớp tín chỉ phù hợp</td></tr>'
      : filtered.map((item) => {
          const isTemp = String(item.MALTC).startsWith('temp_');
          const displayId = isTemp ? '<i>Chờ cấp</i>' : item.MALTC;

          const trClass = item._isDeleted ? 'style="opacity: 0.6; background-color: rgba(220, 53, 69, 0.05);"' : '';

          const pendingOp = this.state.pendingOperations[item.MALTC];
          const statusBadge = this.getStatusBadge(pendingOp);

          // Get names dynamically
          const mhObj = this.state.monhocList.find(m => (m.MAMH ? m.MAMH.trim() : '') === (item.MAMH ? item.MAMH.trim() : ''));
          const tenMH = mhObj ? mhObj.TENMH : item.MAMH;

          const gvObj = this.state.giangvienList.find(g => (g.MAGV ? g.MAGV.trim() : '') === (item.MAGV ? item.MAGV.trim() : ''));
          const tenGV = gvObj ? `${gvObj.HO} ${gvObj.TEN}` : item.MAGV;

          let actionBtn = '';
          if (this.isPGV) {
            if (item._isDeleted) {
              actionBtn = `<button class="btn btn-secondary btn-sm" onclick="window.LopTinChiModule.handleCancelDelete('${item.MALTC}')">Huỷ xoá</button>`;
            } else {
              actionBtn = `<button class="btn btn-info btn-sm" onclick="window.LopTinChiModule.openModal('${item.MALTC}', '${item.NIENKHOA}', ${item.HOCKY}, '${item.MAMH ? item.MAMH.trim() : ''}', ${item.NHOM}, '${item.MAGV ? item.MAGV.trim() : ''}', ${item.SOSVTOITHIEU}, ${item.HUYLOP ? 1 : 0}, '${item.MAKHOA ? item.MAKHOA.trim() : ''}')">Sửa</button>
                           <button class="btn btn-danger btn-sm" onclick="window.LopTinChiModule.handleDelete('${item.MALTC}')">Xóa</button>`;
            }
          } else {
            actionBtn = `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;
          }

          return `
            <tr ${trClass}>
              <td>${displayId}</td>
              <td>${item.NIENKHOA}</td>
              <td>${item.HOCKY}</td>
              <td>${tenMH} ${statusBadge}</td>
              <td>${item.NHOM}</td>
              <td>${tenGV}</td>
              <td>${item.MAKHOA ? item.MAKHOA.trim() : ''}</td>
              <td>${item.SOSVTOITHIEU}</td>
              <td>${item.HUYLOP ? '<span style="color:red">Đã hủy</span>' : '<span style="color:green">Đang mở</span>'}</td>
              <td style="text-align:center;">
                <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                  ${actionBtn}
                </div>
              </td>
            </tr>`;
        }).join('');
  },

  getStatusBadge(pendingOp) {
    if (!pendingOp) return '';
    const labelMap = {
      create: 'Chờ thêm',
      update: 'Chờ cập nhật',
      delete: 'Chờ xoá'
    };
    return `
      <span style="display:inline-block; margin-left:8px; padding:2px 8px; border-radius:999px; background:rgba(147,33,32,0.12); color:var(--primary-color); font-size:12px; font-weight:600;">
        ${labelMap[pendingOp.type] || 'Chờ ghi'}
      </span>
    `;
  },

  hasPendingChanges() {
    return Object.keys(this.state.pendingOperations).length > 0;
  },

  snapshotPendingOperations() {
    return JSON.parse(JSON.stringify(this.state.pendingOperations));
  },

  pushHistory() {
    this.state.history.push(this.snapshotPendingOperations());
  },

  updateActionState() {
    const count = Object.keys(this.state.pendingOperations).length;
    if (this.btnCommit) this.btnCommit.disabled = count === 0;
    if (this.btnUndo) this.btnUndo.disabled = this.state.history.length === 0;
    if (this.pendingStatus) {
      this.pendingStatus.textContent = count > 0 ? `${count} thay đổi đang chờ ghi` : '';
    }
  },

  openModal(ma = '', nk = '', hk = '1', mh = '', nhom = '', gv = '', svmin = '', huy = 0, khoa = '') {
    this.isEdit = !!ma;
    this.state.editingLTCId = ma || null;
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
      this.selectMH.value = '';
      this.inputNhom.value = '';
      this.inputSVMin.value = '';
      this.selectGV.value = '';
      this.selectHuy.value = '0';
      if (this.selectKhoa) this.selectKhoa.value = '';
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
      this.selectMH.value = mh ? mh.trim() : '';
      this.inputNhom.value = nhom;
      this.selectGV.value = gv ? gv.trim() : '';
      this.inputSVMin.value = svmin;
      this.selectHuy.value = huy;
      if (this.selectKhoa) this.selectKhoa.value = khoa ? khoa.trim() : '';
    }

    this.modal.classList.add('active');
  },

  closeModal() {
    this.modal.classList.remove('active');
    this.form.reset();
    this.state.editingLTCId = null;
  },

  handleSaveDraftRow() {
    const nk = this.inputNK.value.trim();
    const hk = this.selectHK.value;
    const mh = this.selectMH.value;
    const nhom = this.inputNhom.value;
    const gv = this.selectGV.value;
    const svmin = this.inputSVMin.value;
    const huy = this.selectHuy.value === '1';
    const khoa = this.selectKhoa ? this.selectKhoa.value : '';

    if (!nk || !mh || !nhom || !gv || !svmin || !khoa) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    this.pushHistory();

    if (this.isEdit) {
      const ma = this.state.editingLTCId;
      const originalItem = this.state.originalData.find(item => String(item.MALTC) === String(ma));
      const existingPending = this.state.pendingOperations[ma];

      const ltcData = {
        MALTC: String(ma).startsWith('temp_') ? ma : Number(ma),
        NIENKHOA: nk,
        HOCKY: Number(hk),
        MAMH: mh,
        NHOM: Number(nhom),
        MAGV: gv,
        MAKHOA: khoa,
        SOSVTOITHIEU: Number(svmin),
        HUYLOP: huy
      };

      if (existingPending && existingPending.type === 'create') {
        this.state.pendingOperations[ma] = {
          ...existingPending,
          newValue: ltcData
        };
      } else {
        this.state.pendingOperations[ma] = {
          type: 'update',
          key: ma,
          oldValue: originalItem ? { ...originalItem } : null,
          newValue: ltcData
        };
      }

      // Check if reverted to original values
      const pending = this.state.pendingOperations[ma];
      if (pending && pending.type === 'update' && pending.oldValue &&
          pending.oldValue.NIENKHOA === nk &&
          Number(pending.oldValue.HOCKY) === Number(hk) &&
          (pending.oldValue.MAMH ? pending.oldValue.MAMH.trim() : '') === mh &&
          Number(pending.oldValue.NHOM) === Number(nhom) &&
          (pending.oldValue.MAGV ? pending.oldValue.MAGV.trim() : '') === gv &&
          (pending.oldValue.MAKHOA ? pending.oldValue.MAKHOA.trim() : '') === khoa &&
          Number(pending.oldValue.SOSVTOITHIEU) === Number(svmin) &&
          !!pending.oldValue.HUYLOP === huy) {
        delete this.state.pendingOperations[ma];
      }
    } else {
      const tempId = 'temp_' + Date.now();
      const ltcData = {
        MALTC: tempId,
        NIENKHOA: nk,
        HOCKY: Number(hk),
        MAMH: mh,
        NHOM: Number(nhom),
        MAGV: gv,
        MAKHOA: khoa,
        SOSVTOITHIEU: Number(svmin),
        HUYLOP: false
      };

      this.state.pendingOperations[tempId] = {
        type: 'create',
        key: tempId,
        newValue: ltcData
      };
    }

    this.closeModal();
    this.renderData();
    this.updateActionState();
    Toast.success('Đã lưu tạm thay đổi lớp tín chỉ');
  },

  handleDelete(ma) {
    if (!confirm(`Bạn có chắc muốn xóa lớp tín chỉ ${ma}?`)) return;

    const existingPending = this.state.pendingOperations[ma];
    this.pushHistory();

    if (existingPending && existingPending.type === 'create') {
      delete this.state.pendingOperations[ma];
    } else {
      const originalItem = this.state.originalData.find(item => String(item.MALTC) === String(ma));
      if (!originalItem) {
        Toast.error('Không tìm thấy lớp tín chỉ để xoá');
        this.state.history.pop();
        return;
      }

      this.state.pendingOperations[ma] = {
        type: 'delete',
        key: ma,
        oldValue: { ...originalItem }
      };
    }

    this.renderData();
    this.updateActionState();
    Toast.success('Đã đưa thao tác xoá lớp tín chỉ vào danh sách chờ ghi');
  },

  handleCancelDelete(ma) {
    this.pushHistory();
    delete this.state.pendingOperations[ma];
    this.renderData();
    this.updateActionState();
    Toast.success('Đã huỷ thao tác xoá lớp tín chỉ');
  },

  handleUndo() {
    if (this.state.history.length === 0) {
      Toast.info('Không có thay đổi nào để phục hồi');
      return;
    }

    this.state.pendingOperations = this.state.history.pop();
    this.renderData();
    this.updateActionState();
    Toast.success('Đã phục hồi thay đổi gần nhất');
  },

  async handleCommit() {
    const operations = Object.values(this.state.pendingOperations);
    if (operations.length === 0) {
      Toast.info('Không có thay đổi nào để ghi');
      return;
    }

    try {
      this.btnCommit.disabled = true;
      this.btnCommit.textContent = 'Đang ghi...';

      const sortedOperations = [
        ...operations.filter(op => op.type === 'create'),
        ...operations.filter(op => op.type === 'update'),
        ...operations.filter(op => op.type === 'delete')
      ];

      for (const op of sortedOperations) {
        if (op.type === 'create') {
          // Strip MALTC for create since it is auto-generated by the database
          const payload = { ...op.newValue };
          delete payload.MALTC;
          await API.post('/loptinchi/create', payload);
        } else if (op.type === 'update') {
          await API.put(`/loptinchi/update/${op.key}`, op.newValue);
        } else if (op.type === 'delete') {
          await API.delete(`/loptinchi/delete/${op.key}`);
        }
      }

      Toast.success('Đã ghi tất cả thay đổi thành công');
      await this.reloadAfterCommit();
    } catch (error) {
      Toast.error(`Ghi dữ liệu thất bại: ${error.message}`);
    } finally {
      if (this.btnCommit) {
        this.btnCommit.textContent = 'Ghi';
      }
      this.updateActionState();
    }
  },

  async reloadAfterCommit() {
    const res = await API.get('/loptinchi');
    this.state.originalData = res.success ? (res.data || []) : [];
    this.state.pendingOperations = {};
    this.state.history = [];
    this.populateFilters();
    this.renderData();
    this.updateActionState();
  }
};

window.LopTinChiModule.init();
