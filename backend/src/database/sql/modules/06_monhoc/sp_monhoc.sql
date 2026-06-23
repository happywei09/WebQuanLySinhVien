USE [QLDSV_HTC];
GO

-- =========================================================================
-- STORED PROCEDURES - MONHOC
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_MONHOC
-- Description: Lấy danh sách toàn bộ môn học trong hệ thống.
-- Parameters: Không
-- Returns: Bảng danh sách các môn học.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_MONHOC
AS
BEGIN
    SELECT MAMH, TENMH, SOTIET_LT, SOTIET_TH
    FROM MONHOC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_MONHOC_BY_ID
-- Description: Lấy thông tin chi tiết môn học theo Mã Môn học.
-- Parameters:
--   - @MAMH: Mã môn học
-- Returns: Dòng thông tin của môn học đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_MONHOC_BY_ID
    @MAMH NCHAR(10)
AS
BEGIN
    SELECT MAMH, TENMH, SOTIET_LT, SOTIET_TH
    FROM MONHOC
    WHERE MAMH = @MAMH;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_MONHOC
-- Description: Thêm mới một môn học vào hệ thống.
-- Parameters:
--   - @MAMH: Mã môn học (Khóa chính)
--   - @TENMH: Tên môn học
--   - @SOTIET_LT: Số tiết lý thuyết
--   - @SOTIET_TH: Số tiết thực hành
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_MONHOC
    @MAMH NCHAR(10),
    @TENMH NVARCHAR(50),
    @SOTIET_LT INT,
    @SOTIET_TH INT
AS
BEGIN
    INSERT INTO MONHOC (MAMH, TENMH, SOTIET_LT, SOTIET_TH)
    VALUES (@MAMH, @TENMH, @SOTIET_LT, @SOTIET_TH);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_MONHOC
-- Description: Cập nhật thông tin của môn học đã tồn tại.
-- Parameters:
--   - @MAMH: Mã môn học cần sửa
--   - @TENMH: Tên môn học mới
--   - @SOTIET_LT: Số tiết lý thuyết mới
--   - @SOTIET_TH: Số tiết thực hành mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_MONHOC
    @MAMH NCHAR(10),
    @TENMH NVARCHAR(50),
    @SOTIET_LT INT,
    @SOTIET_TH INT
AS
BEGIN
    UPDATE MONHOC
    SET TENMH = @TENMH,
        SOTIET_LT = @SOTIET_LT,
        SOTIET_TH = @SOTIET_TH
    WHERE MAMH = @MAMH;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_MONHOC
-- Description: Xóa môn học khỏi cơ sở dữ liệu theo Mã Môn học.
-- Parameters:
--   - @MAMH: Mã môn học cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_MONHOC
    @MAMH NCHAR(10)
AS
BEGIN
    DELETE FROM MONHOC
    WHERE MAMH = @MAMH;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_MONHOC
-- Description: Khôi phục môn học (Tính năng No-op).
-- Parameters:
--   - @MAMH: Mã môn học
-- Returns: Trả về 1
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_MONHOC
    @MAMH NCHAR(10)
AS
BEGIN
    -- No-op
    SELECT 1;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_SEARCH_MONHOC
-- Description: Tìm kiếm môn học theo Mã hoặc Tên môn học.
-- Parameters:
--   - @KEYWORD: Từ khóa tìm kiếm
-- Returns: Danh sách môn học khớp từ khóa.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_SEARCH_MONHOC
    @KEYWORD NVARCHAR(100)
AS
BEGIN
    SELECT MAMH, TENMH, SOTIET_LT, SOTIET_TH
    FROM MONHOC
    WHERE MAMH LIKE '%' + @KEYWORD + '%' OR TENMH LIKE '%' + @KEYWORD + '%';
END;
GO
