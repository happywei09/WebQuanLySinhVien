USE [QLDSV_HTC];
GO

-- =========================================================================
-- STORED PROCEDURES - KHOA
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_KHOA
-- Description: Lấy toàn bộ danh sách khoa trong hệ thống.
-- Parameters: Không
-- Returns: Bảng chứa các trường MAKHOA, TENKHOA
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_KHOA
AS
BEGIN
    SELECT MAKHOA, TENKHOA 
    FROM KHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_KHOA_BY_ID
-- Description: Lấy thông tin khoa cụ thể theo Mã Khoa.
-- Parameters:
--   - @MAKHOA: Mã khoa cần truy vấn
-- Returns: Dòng thông tin của khoa đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_KHOA_BY_ID
    @MAKHOA NCHAR(10)
AS
BEGIN
    SELECT MAKHOA, TENKHOA 
    FROM KHOA 
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_KHOA
-- Description: Thêm mới một khoa vào hệ thống.
-- Parameters:
--   - @MAKHOA: Mã khoa mới
--   - @TENKHOA: Tên khoa mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_KHOA
    @MAKHOA NCHAR(10),
    @TENKHOA NVARCHAR(50)
AS
BEGIN
    INSERT INTO KHOA (MAKHOA, TENKHOA)
    VALUES (@MAKHOA, @TENKHOA);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_KHOA
-- Description: Cập nhật tên khoa của một khoa đã tồn tại.
-- Parameters:
--   - @MAKHOA: Mã khoa cần chỉnh sửa
--   - @TENKHOA: Tên khoa mới cập nhật
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_KHOA
    @MAKHOA NCHAR(10),
    @TENKHOA NVARCHAR(50)
AS
BEGIN
    UPDATE KHOA
    SET TENKHOA = @TENKHOA
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_KHOA
-- Description: Xóa một khoa khỏi hệ thống theo Mã Khoa.
-- Parameters:
--   - @MAKHOA: Mã khoa cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_KHOA
    @MAKHOA NCHAR(10)
AS
BEGIN
    DELETE FROM KHOA
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_KHOA
-- Description: Khôi phục khoa đã xóa (Tính năng No-op do cấu trúc bảng không có cờ xóa).
-- Parameters:
--   - @MAKHOA: Mã khoa cần khôi phục
-- Returns: Trả về 1
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_KHOA
    @MAKHOA NCHAR(10)
AS
BEGIN
    -- No-op: KHOA table doesn't have Daxoa in your schema
    SELECT 1;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_SEARCH_KHOA
-- Description: Tìm kiếm khoa theo từ khóa (Mã Khoa hoặc Tên Khoa).
-- Parameters:
--   - @KEYWORD: Từ khóa tìm kiếm
-- Returns: Danh sách khoa thỏa mãn điều kiện.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_SEARCH_KHOA
    @KEYWORD NVARCHAR(100)
AS
BEGIN
    SELECT MAKHOA, TENKHOA
    FROM KHOA
    WHERE MAKHOA LIKE '%' + @KEYWORD + '%' OR TENKHOA LIKE '%' + @KEYWORD + '%';
END;
GO
