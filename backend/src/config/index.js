require("dotenv").config();

module.exports = {
  // ====================================
  // SERVER
  // ====================================
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || "development",
  },

  // ====================================
  // DATABASE - Dual Server Configuration
  // ====================================
  databases: {
    server1: {
      server: process.env.DB_SERVER_1 || "localhost",
      port: parseInt(process.env.DB_PORT_1) || 1433,
      database: process.env.DB_DATABASE_1 || "QLDSV_HTC",
      user: process.env.DB_USER_1 || "sa",
      password: process.env.DB_PASSWORD_1 || "",
      displayName: process.env.DB_NAME_1 || "Server 1",
      options: {
        encrypt: process.env.DB_ENCRYPT_1 === "true",
        trustServerCertificate:
          process.env.DB_TRUST_SERVER_CERTIFICATE_1 === "true",
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    },
    server2: {
      server: process.env.DB_SERVER_2 || "localhost",
      port: parseInt(process.env.DB_PORT_2) || 1433,
      database: process.env.DB_DATABASE_2 || "QLDSV",
      user: process.env.DB_USER_2 || "sa",
      password: process.env.DB_PASSWORD_2 || "",
      displayName: process.env.DB_NAME_2 || "Server 2",
      options: {
        encrypt: process.env.DB_ENCRYPT_2 === "true",
        trustServerCertificate:
          process.env.DB_TRUST_SERVER_CERTIFICATE_2 === "true",
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    },
  },

  // ====================================
  // JWT
  // ====================================
  jwt: {
    secret: process.env.JWT_SECRET || "default_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  // ====================================
  // CORS
  // ====================================
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  },
};
