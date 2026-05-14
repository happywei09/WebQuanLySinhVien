/* ====================================
   TOAST COMPONENT
   File: js/components/toast.js
==================================== */

class Toast {
  static container = document.getElementById('toastContainer');

  static show(message, type = 'success', duration = 3000) {
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon mapping
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div style="font-weight: bold; font-size: 16px;">${icons[type] || ''}</div>
      <div style="flex: 1;">${message}</div>
    `;

    this.container.appendChild(toast);

    // Xoá toast sau khoảng thời gian duration
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }

  static success(msg) { this.show(msg, 'success'); }
  static error(msg) { this.show(msg, 'error'); }
  static warning(msg) { this.show(msg, 'warning'); }
  static info(msg) { this.show(msg, 'info'); }
}

window.Toast = Toast;
