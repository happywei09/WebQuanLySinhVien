USE [QLDSV_HTC];
GO

-- =========================================================================
-- SUPPORTING INDEXES - LOP
-- =========================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_LOP_MAKHOA' 
      AND object_id = OBJECT_ID('dbo.LOP')
)
BEGIN
    CREATE INDEX IX_LOP_MAKHOA
    ON dbo.LOP (MAKHOA)
    INCLUDE (MALOP, TENLOP, KHOAHOC);
END;
GO

-- =========================================================================
-- STORED PROCEDURES - LOP
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_LOP
-- Description: Lấy toàn bộ danh sách lớp học trong hệ thống.
-- Parameters: Không
-- Returns: Bảng chứa danh sách lớp học.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_LOP
AS
BEGIN
    SELECT MALOP, TENLOP, KHOAHOC, MAKHOA
    FROM LOP;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOP_BY_ID
-- Description: Lấy chi tiết lớp học theo Mã Lớp.
-- Parameters:
--   - @MALOP: Mã lớp học cần truy vấn
-- Returns: Dòng thông tin của lớp đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOP_BY_ID
    @MALOP NCHAR(10)
AS
BEGIN
    SELECT MALOP, TENLOP, KHOAHOC, MAKHOA
    FROM LOP
    WHERE MALOP = @MALOP;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOP_BY_KHOA
-- Description: Lấy danh sách lớp học thuộc một Khoa cụ thể.
-- Parameters:
--   - @MAKHOA: Mã khoa cần lọc lớp
-- Returns: Danh sách lớp học thuộc khoa đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOP_BY_KHOA
    @MAKHOA NCHAR(10)
AS
BEGIN
    SELECT MALOP, TENLOP, KHOAHOC, MAKHOA
    FROM LOP
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_LOP
-- Description: Thêm mới một lớp học.
-- Parameters:
--   - @MALOP: Mã lớp mới
--   - @TENLOP: Tên lớp học
--   - @KHOAHOC: Niên khóa/Khóa học (ví dụ: '2023-2027')
--   - @MAKHOA: Mã khoa quản lý lớp học này
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_LOP
    @MALOP NCHAR(10),
    @TENLOP NVARCHAR(50),
    @KHOAHOC NCHAR(9),
    @MAKHOA NCHAR(10)
AS
BEGIN
    INSERT INTO LOP (MALOP, TENLOP, KHOAHOC, MAKHOA)
    VALUES (@MALOP, @TENLOP, @KHOAHOC, @MAKHOA);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_LOP
-- Description: Cập nhật thông tin lớp học đã có.
-- Parameters:
--   - @MALOP: Mã lớp cần sửa
--   - @TENLOP: Tên lớp học mới
--   - @KHOAHOC: Khóa học mới
--   - @MAKHOA: Mã khoa mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_LOP
    @MALOP NCHAR(10),
    @TENLOP NVARCHAR(50),
    @KHOAHOC NCHAR(9),
    @MAKHOA NCHAR(10)
AS
BEGIN
    UPDATE LOP
    SET TENLOP = @TENLOP,
        KHOAHOC = @KHOAHOC,
        MAKHOA = @MAKHOA
    WHERE MALOP = @MALOP;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_LOP
-- Description: Xóa một lớp học khỏi hệ thống.
-- Parameters:
--   - @MALOP: Mã lớp cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_LOP
    @MALOP NCHAR(10)
AS
BEGIN
    DELETE FROM LOP
    WHERE MALOP = @MALOP;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_LOP
-- Description: Khôi phục lớp học (Tính năng No-op).
-- Parameters:
--   - @MALOP: Mã lớp cần khôi phục
-- Returns: Trả về 1
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_LOP
    @MALOP NCHAR(10)
AS
BEGIN
    -- No-op
    SELECT 1;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_SEARCH_LOP
-- Description: Tìm kiếm lớp học theo Mã Lớp hoặc Tên Lớp.
-- Parameters:
--   - @KEYWORD: Từ khóa tìm kiếm
-- Returns: Danh sách các lớp học thỏa mãn điều kiện.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_SEARCH_LOP
    @KEYWORD NVARCHAR(100)
AS
BEGIN
    SELECT MALOP, TENLOP, KHOAHOC, MAKHOA
    FROM LOP
    WHERE MALOP LIKE '%' + @KEYWORD + '%' OR TENLOP LIKE '%' + @KEYWORD + '%';
END;
GO
