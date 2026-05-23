/* ====================================
   API CLIENT
   File: js/api.js
   Mục đích: Wrapper cho fetch API
==================================== */

const API_CONFIG = {
  baseURL: 'http://127.0.0.1:5000/api',
};

class ApiClient {
  static getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Thêm token nếu có
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Thêm server ID để backend biết route đến server nào
    const serverId = localStorage.getItem('serverId');
    if (serverId) {
      headers['x-server-id'] = serverId;
    }
    
    return headers;
  }

  static async request(endpoint, options = {}) {
    try {
      const url = `${API_CONFIG.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle token expired logic
        if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
          // TODO: Implement refresh token logic here if needed
          // Hoặc logout luôn
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = 'login.html';
        }
        throw new Error(data.message || 'Có lỗi xảy ra từ máy chủ');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  }

  static get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  static post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  static delete(endpoint, body = null) {
    const options = { method: 'DELETE' };
    if (body) {
      options.body = JSON.stringify(body);
    }
    return this.request(endpoint, options);
  }
}

window.API = ApiClient;
