const express = require("express");
const cors = require("cors");
const morgan = require("morgan"); // reload env trigger
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config = require("./config");
const {
  initAllPools,
  closeAllConnections,
  getAvailableServers,
  dbStorage,
} = require("./database/connection");
const { errorHandler, notFound } = require("./middleware/error.middleware");

// Import Routes
const authRoutes = require("./routes/auth.routes");
const khoaRoutes = require("./routes/khoa.routes");
const lopRoutes = require("./routes/lop.routes");
const sinhVienRoutes = require("./routes/sinhvien.routes");
const giangVienRoutes = require("./routes/giangvien.routes");
const monHocRoutes = require("./routes/monhoc.routes");
const lopTinChiRoutes = require("./routes/loptinchi.routes");
const dangKyRoutes = require("./routes/dangky.routes");
const diemRoutes = require("./routes/diem.routes");

const app = express();

// ====================================
// GLOBAL MIDDLEWARES
// ====================================

// Security headers
app.use(helmet());

// Logging
if (config.server.env === "development") {
  app.use(morgan("dev"));
}

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);

// Rate Limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again later",
// });
// app.use("/api/", limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================================
// SERVER CONTEXT MIDDLEWARE
// ====================================
// Xác định serverId cho mỗi request
// Ưu tiên: Header x-server-id > JWT token > default "server1"
// ====================================

const jwt = require("jsonwebtoken");

app.use((req, res, next) => {
  let serverId = "server1"; // Default

  // 1. Kiểm tra header x-server-id
  if (req.headers["x-server-id"]) {
    serverId = req.headers["x-server-id"];
  }
  // 2. Kiểm tra từ JWT token (nếu đã đăng nhập)
  else {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, config.jwt.secret);
        if (decoded.serverId) {
          serverId = decoded.serverId;
        }
      } catch (err) {
        // Token lỗi sẽ được xử lý bởi auth middleware sau
      }
    }
  }

  // Validate serverId
  if (!["server1", "server2"].includes(serverId)) {
    serverId = "server1";
  }

  // Lưu serverId vào AsyncLocalStorage để connection.js sử dụng
  dbStorage.run(serverId, () => {
    next();
  });
});

// ====================================
// ROUTES
// ====================================

app.get("/", (req, res) => {
  res.json({ message: "Welcome to QLDSV_HTC API" });
});

const API_PREFIX = "/api";

// API lấy danh sách server khả dụng (dùng cho login page)
app.get(`${API_PREFIX}/servers`, (req, res) => {
  const servers = getAvailableServers();
  res.json({ success: true, data: servers });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/khoa`, khoaRoutes);
app.use(`${API_PREFIX}/lop`, lopRoutes);
app.use(`${API_PREFIX}/sinhvien`, sinhVienRoutes);
app.use(`${API_PREFIX}/giangvien`, giangVienRoutes);
app.use(`${API_PREFIX}/monhoc`, monHocRoutes);
app.use(`${API_PREFIX}/loptinchi`, lopTinChiRoutes);
app.use(`${API_PREFIX}/dangky`, dangKyRoutes);
app.use(`${API_PREFIX}/diem`, diemRoutes);

// ====================================
// ERROR HANDLING
// ====================================

app.use(notFound);
app.use(errorHandler);

// ====================================
// START SERVER
// ====================================

async function startServer() {
  try {
    // 1. Khởi tạo kết nối cả 2 Database (SQL Server)
    // Nếu 1 server lỗi thì vẫn chạy được với server còn lại
    try {
      const poolResults = await initAllPools();
      console.log("📊 Trạng thái kết nối:", poolResults);
    } catch (dbError) {
      console.error(
        "⚠️ Cảnh báo: Lỗi khởi tạo database pools:",
        dbError.message
      );
    }

    // 2. Start Express server
    const port = config.server.port;
    const server = app.listen(port, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
      console.log(`🌍 Environment: ${config.server.env}`);
    });

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Đang đóng server...");
      await closeAllConnections();
      server.close(() => {
        console.log("Server đã đóng.");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Không thể khởi động server:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
