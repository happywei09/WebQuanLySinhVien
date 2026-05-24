/* ====================================
   MODULE PHIẾU ĐIỂM CÁ NHÂN
   File: js/modules/phieudiem.js
 ==================================== */

window.PhieuDiemModule = {
  async init() {
    this.cacheDOM();
    await this.loadData();
  },

  cacheDOM() {
    this.container = document.getElementById('phieuDiemContainer');
    this.lblFullName = document.getElementById('pdFullName');
    this.lblMaSV = document.getElementById('pdMaSV');
  },

  async loadData() {
    try {
      const user = Auth.getUser();
      if (!user || user.role !== 'SINHVIEN') {
        this.container.innerHTML = '<div style="text-align: center; color: red; padding: 20px;">Chức năng này chỉ dành cho Sinh Viên.</div>';
        return;
      }

      this.lblFullName.textContent = user.fullName || user.username;
      this.lblMaSV.textContent = user.username;

      this.container.innerHTML = '<div style="text-align: center; padding: 20px;">⏳ Đang tải điểm...</div>';

      // Sử dụng endpoint /diem/sinhvien/:maSV vì Stored Procedure SP_GET_DIEM_BY_SINHVIEN của máy bạn đã có sẵn NIENKHOA và HOCKY!
      const res = await API.get(`/diem/sinhvien/${user.username}`);

      if (res.success) {
        this.renderTable(res.data);
      } else {
        throw new Error(res.message || 'Lỗi tải phiếu điểm');
      }
    } catch (error) {
      this.container.innerHTML = `<div style="text-align: center; color: red; padding: 20px;">Lỗi: ${error.message}</div>`;
      Toast.error(error.message);
    }
  },

  renderTable(data) {
    this.container.innerHTML = '';
    if (!data || data.length === 0) {
      this.container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Chưa có điểm môn học nào được ghi nhận.</div>';
      return;
    }

    // Nhóm điểm theo Niên khóa và Học kỳ (Hỗ trợ cả HOA và thường cho thuộc tính)
    const groups = {};
    data.forEach(row => {
      const nienKhoa = row.NIENKHOA || row.nienKhoa || 'Chưa rõ niên khóa';
      const hocKy = row.HOCKY || row.hocKy || 'Chưa rõ học kỳ';
      const groupKey = `${nienKhoa} - Học kỳ ${hocKy}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          nienKhoa,
          hocKy,
          subjects: []
        };
      }
      groups[groupKey].subjects.push(row);
    });

    // Sắp xếp các nhóm học kỳ theo thứ tự thời gian (tăng dần: niên khóa trước, học kỳ trước)
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const groupA = groups[a];
      const groupB = groups[b];

      // So sánh niên khóa
      if (String(groupA.nienKhoa) !== String(groupB.nienKhoa)) {
        return String(groupA.nienKhoa).localeCompare(String(groupB.nienKhoa));
      }
      // So sánh học kỳ
      return parseInt(groupA.hocKy || 0) - parseInt(groupB.hocKy || 0);
    });

    // Render từng nhóm học kỳ ra giao diện
    sortedGroupKeys.forEach(key => {
      const group = groups[key];

      // Xác định thuộc tính tên môn học (Case-insensitive)
      const firstRow = group.subjects[0];
      const keyTenMH = 'TENMH' in firstRow ? 'TENMH' :
        ('TEN_MH' in firstRow ? 'TEN_MH' :
          ('tenMH' in firstRow ? 'tenMH' :
            ('ten_mh' in firstRow ? 'ten_mh' : 'MAMH')));

      // Sắp xếp môn học theo bảng chữ cái tiếng Việt/tiếng Anh
      group.subjects.sort((a, b) => {
        const nameA = String(a[keyTenMH] || '').toUpperCase();
        const nameB = String(b[keyTenMH] || '').toUpperCase();
        return nameA.localeCompare(nameB);
      });

      // Tạo container cho mỗi học kỳ
      const section = document.createElement('div');
      section.className = 'semester-section card';
      section.style.marginBottom = '25px';
      section.style.overflow = 'hidden';
      section.style.boxShadow = 'var(--shadow-sm)';
      section.style.borderRadius = 'var(--radius-md)';
      section.style.border = '1px solid var(--border-color)';

      // Tiêu đề học kỳ
      const header = document.createElement('div');
      header.className = 'semester-header';
      header.style.padding = '12px 20px';
      header.style.background = 'var(--primary-light)';
      header.style.borderBottom = '1px solid var(--border-color)';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.innerHTML = `
        <h4 style="margin: 0; color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
          📅 Niên khóa: ${group.nienKhoa} — Học kỳ: ${group.hocKy}
        </h4>
        <span class="badge" style="background: var(--bg-hover); color: var(--text-color); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 12px; font-size: 12px;">
          ${group.subjects.length} môn học
        </span>
      `;
      section.appendChild(header);

      // Bảng điểm cho học kỳ
      const tableDiv = document.createElement('div');
      tableDiv.className = 'table-responsive';

      const table = document.createElement('table');
      table.className = 'table';
      table.style.margin = '0';

      table.innerHTML = `
        <thead>
          <tr>
            <th width="60" style="padding: 12px 15px; text-align: center;">STT</th>
            <th width="120" style="padding: 12px 15px;">Mã môn</th>
            <th style="padding: 12px 15px;">Tên môn học</th>
            <th width="95" style="text-align: center; padding: 12px 15px;">Điểm CC</th>
            <th width="95" style="text-align: center; padding: 12px 15px;">Điểm GK</th>
            <th width="95" style="text-align: center; padding: 12px 15px;">Điểm CK</th>
            <th width="130" style="text-align: center; padding: 12px 15px;">Hết môn</th>
          </tr>
        </thead>
      `;

      const tbody = document.createElement('tbody');
      group.subjects.forEach((row, index) => {
        const maMH = row.MAMH || row.mamh || row.maMH || '—';
        const tenMH = row[keyTenMH] || 'Không rõ tên môn';

        // Điểm chi tiết (Hỗ trợ cả HOA và thường)
        const cc = row.DIEM_CC !== null && row.DIEM_CC !== undefined ? row.DIEM_CC :
          (row.diemCC !== null && row.diemCC !== undefined ? row.diemCC :
            (row.DIEMCC !== null && row.DIEMCC !== undefined ? row.DIEMCC : '—'));

        const gk = row.DIEM_GK !== null && row.DIEM_GK !== undefined ? row.DIEM_GK :
          (row.diemGK !== null && row.diemGK !== undefined ? row.diemGK :
            (row.DIEMGK !== null && row.DIEMGK !== undefined ? row.DIEMGK : '—'));

        const ck = row.DIEM_CK !== null && row.DIEM_CK !== undefined ? row.DIEM_CK :
          (row.diemCK !== null && row.diemCK !== undefined ? row.diemCK :
            (row.DIEMCK !== null && row.DIEMCK !== undefined ? row.DIEMCK : '—'));

        // Điểm tổng kết hết môn (thử nhiều trường hợp tên cột khác nhau)
        let diemVal = null;
        if (row.DIEM_KTHP !== undefined && row.DIEM_KTHP !== null) diemVal = row.DIEM_KTHP;
        else if (row.diemKTHP !== undefined && row.diemKTHP !== null) diemVal = row.diemKTHP;
        else if (row.DIEM_HETMON !== undefined && row.DIEM_HETMON !== null) diemVal = row.DIEM_HETMON;
        else if (row.diemHetMon !== undefined && row.diemHetMon !== null) diemVal = row.diemHetMon;
        else if (row.DIEM !== undefined && row.DIEM !== null) diemVal = row.DIEM;
        else if (row.diem !== undefined && row.diem !== null) diemVal = row.diem;

        let diemHtml = '';
        if (diemVal === null || diemVal === undefined || (cc === '—' && gk === '—' && ck === '—')) {
          diemHtml = '<span style="color: var(--text-muted); font-style: italic;">Chưa nhập điểm</span>';
        } else {
          const roundedDiem = typeof diemVal === 'number' ? Math.round(diemVal * 100) / 100 : diemVal;
          diemHtml = `<span style="font-weight: 700; color: var(--primary-color); font-size: 15px;">${roundedDiem}</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="padding: 12px 15px; text-align: center;">${index + 1}</td>
          <td style="padding: 12px 15px;"><code>${maMH}</code></td>
          <td style="padding: 12px 15px;"><strong>${tenMH}</strong></td>
          <td style="text-align: center; padding: 12px 15px; color: var(--text-muted);">${cc}</td>
          <td style="text-align: center; padding: 12px 15px; color: var(--text-muted);">${gk}</td>
          <td style="text-align: center; padding: 12px 15px; color: var(--text-muted);">${ck}</td>
          <td style="text-align: center; padding: 12px 15px;">${diemHtml}</td>
        `;
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      tableDiv.appendChild(table);
      section.appendChild(tableDiv);

      this.container.appendChild(section);
    });
  }
};

window.PhieuDiemModule.init();
