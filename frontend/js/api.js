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
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              // Gọi API refresh token trực tiếp bằng fetch
              const refreshRes = await fetch(`${API_CONFIG.baseURL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
              });
              const refreshData = await refreshRes.json();
              
              if (refreshRes.ok && refreshData.success && refreshData.data?.token) {
                // Lưu token mới
                localStorage.setItem('token', refreshData.data.token);
                
                // Gửi lại request gốc với header Authorization mới
                const retryResponse = await fetch(url, {
                  ...options,
                  headers: this.getHeaders(),
                });
                
                const retryData = await retryResponse.json();
                if (!retryResponse.ok) {
                  throw new Error(retryData.message || 'Có lỗi xảy ra từ máy chủ');
                }
                return retryData;
              }
            } catch (refreshErr) {
              console.error('Error refreshing token:', refreshErr);
            }
          }
          
          // Hoặc logout luôn nếu không thể refresh
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('serverId');
          window.location.href = 'login.html';
          throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
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
