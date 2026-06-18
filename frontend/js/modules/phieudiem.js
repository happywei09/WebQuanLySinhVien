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
    this.tbody = document.getElementById('tbodyPhieuDiem');
    this.lblFullName = document.getElementById('pdFullName');
    this.lblMaSV = document.getElementById('pdMaSV');
  },

  async loadData() {
    try {
      const user = Auth.getUser();
      if (!user || user.role !== 'SINHVIEN') {
        this.tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Chức năng này chỉ dành cho Sinh Viên.</td></tr>';
        return;
      }

      this.lblFullName.textContent = user.fullName || user.username;
      this.lblMaSV.textContent = user.username;

      this.tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Đang tải điểm...</td></tr>';
      
      const res = await API.get(`/diem/report/phieu-diem/${user.username}`);
      
      if (res.success) {
        this.renderTable(res.data);
      } else {
        throw new Error(res.message || 'Lỗi tải phiếu điểm');
      }
    } catch (error) {
      this.tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: red;">Lỗi: ${error.message}</td></tr>`;
      Toast.error(error.message);
    }
  },

  renderTable(data) {
    this.tbody.innerHTML = '';
    if (!data || data.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Chưa có điểm môn học nào được ghi nhận.</td></tr>';
      return;
    }

    data.forEach((row, index) => {
      const tenMH = row.TENMH || 'Không xác định';
      const diem = row.DIEM !== null && row.DIEM !== undefined ? row.DIEM : '-';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.STT || index + 1}</td>
        <td><strong>${tenMH}</strong></td>
        <td style="text-align: center; font-weight: bold; color: var(--primary-color);">${diem}</td>
      `;
      this.tbody.appendChild(tr);
    });
  }
};

window.PhieuDiemModule.init();
