/* ====================================
   REPORTS MODULE
   File: js/modules/reports.js
==================================== */

window.ReportsModule = {
  state: {
    reportType: null,
    nienKhoaList: [],
    lopTinChiList: [],
    lopList: [],
    activeData: [],
    activeMeta: {}
  },

  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadInitialFilters();
  },

  cacheDOM() {
    this.typeSelect = document.getElementById('reportTypeSelect');
    this.btnGenerate = document.getElementById('btnGenerateReport');
    this.btnPrint = document.getElementById('btnPrintReport');
    this.btnExport = document.getElementById('btnExportExcel');
    this.groupNKHK = document.getElementById('groupNienKhoaHocKy');
    this.groupHK = document.getElementById('groupHocKy');
    this.groupLTC = document.getElementById('groupLopTinChi');
    this.groupSV = document.getElementById('groupSinhVien');
    this.groupLop = document.getElementById('groupLop');
    this.selectNienKhoa = document.getElementById('reportNienKhoa');
    this.selectHocKy = document.getElementById('reportHocKy');
    this.selectLTC = document.getElementById('reportLTC');
    this.inputMaSV = document.getElementById('reportMaSV');
    this.selectLop = document.getElementById('reportMaLop');
    this.actionsCard = document.getElementById('reportActionsCard');
    this.displayCard = document.getElementById('reportDisplayCard');
    this.reportHeader = document.getElementById('reportHeader');
    this.tbody = document.getElementById('reportTableBody');
    this.thead = document.getElementById('reportTableHead');
    this.reportFooter = document.getElementById('reportFooter');
  },

  bindEvents() {
    this.typeSelect.addEventListener('change', (e) => this.handleReportTypeChange(e.target.value));
    this.selectNienKhoa.addEventListener('change', () => this.loadLopTinChiOptions());
    this.selectHocKy.addEventListener('change', () => this.loadLopTinChiOptions());
    this.btnGenerate.addEventListener('click', () => this.generateReport());
    this.btnPrint.addEventListener('click', () => window.print());
    this.btnExport.addEventListener('click', () => this.exportToExcel());
  },

  async loadInitialFilters() {
    try {
      const filterRes = await API.get('/dashboard/filters');
      if (filterRes.success && filterRes.data) {
        const semesters = filterRes.data.semesters || [];
        this.state.nienKhoaList = [...new Set(semesters.map(s => s.NIENKHOA))].sort();
        this.selectNienKhoa.innerHTML = '<option value="">-- Chọn niên khóa --</option>';
        this.state.nienKhoaList.forEach(nk => {
          this.selectNienKhoa.innerHTML += '<option value="' + nk + '">' + nk + '</option>';
        });
      }

      const lopRes = await API.get('/lop');
      if (lopRes.success) {
        this.state.lopList = lopRes.data || [];
        this.selectLop.innerHTML = '<option value="">-- Chọn lớp --</option>';
        this.state.lopList.forEach(lop => {
          this.selectLop.innerHTML += '<option value="' + lop.MALOP + '">' + lop.MALOP + ' - ' + lop.TENLOP + '</option>';
        });
      }
    } catch (error) {
      console.error('Không thể tải bộ lọc ban đầu:', error);
      Toast.error('Lỗi khi tải bộ lọc');
    }
  },

  async loadLopTinChiOptions() {
    const nienKhoa = this.selectNienKhoa.value;
    const hocKy = this.selectHocKy.value;
    if (!nienKhoa || !hocKy) return;

    try {
      this.selectLTC.innerHTML = '<option value="">Đang tải lớp tín chỉ...</option>';
      const res = await API.get('/diem/report/ds-lop-tin-chi?nienKhoa=' + encodeURIComponent(nienKhoa) + '&hocKy=' + hocKy);
      if (res.success) {
        this.state.lopTinChiList = res.data || [];
        this.selectLTC.innerHTML = '<option value="">-- Chọn lớp tín chỉ --</option>';
        this.state.lopTinChiList.forEach(ltc => {
          const label = (ltc.TENMH || ltc.MAMH) + ' - Nhóm ' + ltc.NHOM + ' - ' + (ltc.HOTEN_GV || '');
          this.selectLTC.innerHTML += '<option value="' + ltc.MALTC + '">' + label + '</option>';
        });
      }
    } catch (error) {
      this.selectLTC.innerHTML = '<option value="">Lỗi tải lớp tín chỉ</option>';
      console.error(error);
    }
  },

  handleReportTypeChange(type) {
    this.state.reportType = type;
    [this.groupNKHK, this.groupHK, this.groupLTC, this.groupSV, this.groupLop].forEach(el => el.style.display = 'none');
    this.actionsCard.style.display = 'none';
    this.displayCard.style.display = 'none';
    if (!type) return;

    if (type === 'ds_ltc') {
      this.groupNKHK.style.display = 'block';
      this.groupHK.style.display = 'block';
    } else if (type === 'dssv_ltc' || type === 'bang_diem_mh') {
      this.groupNKHK.style.display = 'block';
      this.groupHK.style.display = 'block';
      this.groupLTC.style.display = 'block';
      this.loadLopTinChiOptions();
    } else if (type === 'phieu_diem') {
      this.groupSV.style.display = 'block';
    } else if (type === 'bang_diem_tk') {
      this.groupLop.style.display = 'block';
    }
  },

  buildSubtitle(meta) {
    const lines = [];
    if (meta.khoa) lines.push('KHOA: ' + meta.khoa);
    if (meta.nienKhoa) lines.push('Niên khóa: ' + meta.nienKhoa);
    if (meta.hocKy) lines.push('Học kỳ: ' + meta.hocKy);
    if (meta.monHoc) lines.push('Môn học: ' + meta.monHoc);
    if (meta.nhom) lines.push('Nhóm: ' + meta.nhom);
    if (meta.lop) lines.push('Lớp: ' + meta.lop);
    if (meta.sinhVien) lines.push('Sinh viên: ' + meta.sinhVien);
    return lines.join('<br/>');
  },

  formatScore(value) {
    return value === null || value === undefined ? '-' : (Math.round(value * 100) / 100);
  },

  async generateReport() {
    const type = this.state.reportType;
    if (!type) return Toast.warning('Vui lòng chọn loại báo cáo');

    try {
      this.tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Đang tạo báo cáo...</td></tr>';
      this.thead.innerHTML = '';
      this.reportFooter.innerHTML = '';
      this.actionsCard.style.display = 'none';
      this.displayCard.style.display = 'block';

      const user = Auth.getUser();
      const khoa = (user && (user.tenKhoa || user.khoaName || user.serverName)) || '';
      let endpoint = '';
      let meta = { khoa };

      if (type === 'ds_ltc') {
        const nk = this.selectNienKhoa.value;
        const hk = this.selectHocKy.value;
        if (!nk || !hk) return Toast.warning('Vui lòng chọn niên khóa và học kỳ');
        endpoint = '/diem/report/ds-lop-tin-chi?nienKhoa=' + encodeURIComponent(nk) + '&hocKy=' + hk;
        meta = { ...meta, nienKhoa: nk, hocKy: hk };
      } else if (type === 'dssv_ltc' || type === 'bang_diem_mh') {
        const ltc = this.selectLTC.value;
        if (!ltc) return Toast.warning('Vui lòng chọn lớp tín chỉ');
        const selected = this.state.lopTinChiList.find(x => String(x.MALTC) === String(ltc));
        endpoint = type === 'dssv_ltc' ? '/diem/report/dssv-dang-ky/' + ltc : '/diem/report/bang-diem-mon-hoc/' + ltc;
        meta = {
          ...meta,
          nienKhoa: selected?.NIENKHOA,
          hocKy: selected?.HOCKY,
          monHoc: selected?.TENMH || selected?.MAMH,
          nhom: selected?.NHOM,
          khoa: selected?.TENKHOA || khoa,
        };
      } else if (type === 'phieu_diem') {
        const masv = this.inputMaSV.value.trim();
        if (!masv) return Toast.warning('Vui lòng nhập mã sinh viên');
        endpoint = '/diem/report/phieu-diem/' + encodeURIComponent(masv);
        meta = { ...meta, sinhVien: masv };
      } else if (type === 'bang_diem_tk') {
        const lop = this.selectLop.value;
        if (!lop) return Toast.warning('Vui lòng chọn lớp học');
        endpoint = '/diem/report/bang-diem-tong-ket/' + encodeURIComponent(lop);
        meta = { ...meta, lop };
      }

      const res = await API.get(endpoint);
      if (!res.success) throw new Error(res.message || 'Lỗi tải báo cáo');

      this.state.activeData = res.data || [];
      this.state.activeMeta = meta;
      this.actionsCard.style.display = 'flex';
      const titles = {
        ds_ltc: 'DANH SÁCH LỚP TÍN CHỈ ĐÃ MỞ',
        dssv_ltc: 'DANH SÁCH SINH VIÊN ĐĂNG KÝ LỚP TÍN CHỈ',
        bang_diem_mh: 'BẢNG ĐIỂM MÔN HỌC',
        phieu_diem: 'PHIẾU ĐIỂM CÁ NHÂN',
        bang_diem_tk: 'BẢNG ĐIỂM TỔNG KẾT CUỐI KHÓA'
      };
      this.reportHeader.innerHTML = '<h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">' + titles[type] + '</h2><p style="font-size: 14px; color: var(--text-muted); line-height: 1.6;">' + this.buildSubtitle(meta) + '</p>';
      this.renderReportTable(type);
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:red;">Lỗi: ' + error.message + '</td></tr>';
      Toast.error(error.message);
    }
  },

  renderReportTable(type) {
    const data = this.state.activeData;
    this.tbody.innerHTML = '';
    if (!data.length) {
      this.thead.innerHTML = '';
      this.tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:24px;">Không có dữ liệu báo cáo</td></tr>';
      return;
    }

    if (type === 'ds_ltc') {
      this.thead.innerHTML = '<tr><th width="60">STT</th><th>Tên môn học</th><th width="80" style="text-align:center;">Nhóm</th><th>Họ tên GV giảng</th><th width="120" style="text-align:center;">Số SV tối thiểu</th><th width="120" style="text-align:center;">Số SV đã đăng ký</th></tr>';
      data.forEach((row, index) => this.tbody.insertAdjacentHTML('beforeend', '<tr><td>' + (index + 1) + '</td><td style="font-weight:600;">' + (row.TENMH || row.MAMH || '') + '</td><td style="text-align:center;">' + (row.NHOM ?? '') + '</td><td>' + (row.HOTEN_GV || '') + '</td><td style="text-align:center;">' + (row.SOSVTOITHIEU ?? 0) + '</td><td style="text-align:center; font-weight:700; color:var(--primary-color);">' + (row.SOSV_DANGKY ?? 0) + '</td></tr>'));
      this.reportFooter.innerHTML = 'Số lượng lớp đã mở: ' + data.length;
    } else if (type === 'dssv_ltc') {
      this.thead.innerHTML = '<tr><th width="60">STT</th><th width="150">Mã SV</th><th>Họ</th><th>Tên</th><th width="100" style="text-align:center;">Phái</th><th width="150">Mã lớp</th></tr>';
      data.forEach((row, index) => this.tbody.insertAdjacentHTML('beforeend', '<tr><td>' + (index + 1) + '</td><td style="font-weight:600;">' + (row.MASV || '') + '</td><td>' + (row.HO || '') + '</td><td>' + (row.TEN || '') + '</td><td style="text-align:center;">' + (row.PHAI ? 'Nữ' : 'Nam') + '</td><td>' + (row.MALOP || '') + '</td></tr>'));
      this.reportFooter.innerHTML = 'Số sinh viên đã đăng ký: ' + data.length;
    } else if (type === 'bang_diem_mh') {
      this.thead.innerHTML = '<tr><th width="60">STT</th><th width="150">Mã SV</th><th>Họ</th><th>Tên</th><th width="100" style="text-align:center;">Điểm chuyên cần</th><th width="100" style="text-align:center;">Điểm giữa kỳ</th><th width="100" style="text-align:center;">Điểm cuối kỳ</th><th width="120" style="text-align:center; font-weight:bold; color:var(--primary-color);">Điểm hết môn</th></tr>';
      data.forEach((row, index) => this.tbody.insertAdjacentHTML('beforeend', '<tr><td>' + (index + 1) + '</td><td style="font-weight:600;">' + (row.MASV || '') + '</td><td>' + (row.HO || '') + '</td><td>' + (row.TEN || '') + '</td><td style="text-align:center;">' + this.formatScore(row.DIEM_CC) + '</td><td style="text-align:center;">' + this.formatScore(row.DIEM_GK) + '</td><td style="text-align:center;">' + this.formatScore(row.DIEM_CK) + '</td><td style="text-align:center; font-weight:700; color:var(--primary-color);">' + this.formatScore(row.DIEM_KTHP) + '</td></tr>'));
      this.reportFooter.innerHTML = 'Số sinh viên: ' + data.length;
    } else if (type === 'phieu_diem') {
      this.thead.innerHTML = '<tr><th width="60">STT</th><th>Tên môn học</th><th width="150" style="text-align:center; font-weight:bold; color:var(--primary-color);">Điểm</th></tr>';
      data.forEach((row, index) => this.tbody.insertAdjacentHTML('beforeend', '<tr><td>' + (row.STT || (index + 1)) + '</td><td style="font-weight:600;">' + (row.TENMH || '') + '</td><td style="text-align:center; font-weight:700; color:var(--primary-color);">' + this.formatScore(row.DIEM) + '</td></tr>'));
      this.reportFooter.innerHTML = 'Số môn học: ' + data.length;
    } else if (type === 'bang_diem_tk') {
      const sample = data[0];
      const subjectKeys = Object.keys(sample).filter(k => !['MASV', 'HO', 'TEN'].includes(k));
      this.thead.innerHTML = '<tr><th width="200">MASV - Họ tên</th>' + subjectKeys.map(s => '<th style="text-align:center; min-width:100px;">' + s + '</th>').join('') + '</tr>';
      data.forEach(row => {
        const fullName = (row.HO || '') + ' ' + (row.TEN || '');
        const cells = subjectKeys.map(s => '<td style="text-align:center;">' + this.formatScore(row[s]) + '</td>').join('');
        this.tbody.insertAdjacentHTML('beforeend', '<tr><td style="font-weight:600;">' + (row.MASV || '') + ' - ' + fullName.trim() + '</td>' + cells + '</tr>');
      });
      this.reportFooter.innerHTML = 'Số sinh viên: ' + data.length;
    }
  },

  exportToExcel() {
    if (!this.state.reportType || !this.state.activeData.length) return;
    const table = document.getElementById('reportTable');
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    const csv = [];
    csv.push('"' + (this.reportHeader.querySelector('h2')?.innerText || '') + '"');
    csv.push('"' + ((this.reportHeader.querySelector('p')?.innerText || '').replace(/\n/g, ' - ')) + '"');
    csv.push('');
    rows.forEach(row => {
      const cols = row.querySelectorAll('td, th');
      csv.push(Array.from(cols).map(col => '"' + col.innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/\s\s+/g, ' ').replace(/"/g, '""') + '"').join(','));
    });
    if (this.reportFooter.innerText) csv.push('', '"' + this.reportFooter.innerText + '"');
    const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bao_cao_' + this.state.reportType + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Toast.success('Đã tải xuống file CSV');
  }
};

if (document.getElementById('reportTypeSelect')) {
  window.ReportsModule.init();
} else {
  document.addEventListener('pageLoaded', (e) => {
    if (e.detail.pageId === 'reports') window.ReportsModule.init();
  });
}
