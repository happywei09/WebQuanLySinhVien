USE [QLDSV_HTC];
GO

-- =========================================================================
-- SUPPORTING INDEXES - LOPTINCHI
-- =========================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_LOPTINCHI_MAKHOA' 
      AND object_id = OBJECT_ID('dbo.LOPTINCHI')
)
BEGIN
    CREATE INDEX IX_LOPTINCHI_MAKHOA
    ON dbo.LOPTINCHI (MAKHOA)
    INCLUDE (MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAGV, SOSVTOITHIEU, HUYLOP);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_LOPTINCHI_MAGV' 
      AND object_id = OBJECT_ID('dbo.LOPTINCHI')
)
BEGIN
    CREATE INDEX IX_LOPTINCHI_MAGV
    ON dbo.LOPTINCHI (MAGV)
    INCLUDE (MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAKHOA, SOSVTOITHIEU, HUYLOP);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_LOPTINCHI_NIENKHOA_HOCKY' 
      AND object_id = OBJECT_ID('dbo.LOPTINCHI')
)
BEGIN
    CREATE INDEX IX_LOPTINCHI_NIENKHOA_HOCKY
    ON dbo.LOPTINCHI (NIENKHOA, HOCKY)
    INCLUDE (MALTC, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP);
END;
GO

-- =========================================================================
-- STORED PROCEDURES - LOPTINCHI
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_LOPTINCHI
-- Description: Lấy danh sách toàn bộ các lớp tín chỉ kèm tên Môn học và tên Giảng viên.
-- Parameters: Không
-- Returns: Bảng danh sách lớp tín chỉ xếp theo mã giảm dần.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_LOPTINCHI
AS
BEGIN
    SELECT 
        ltc.MALTC, 
        ltc.NIENKHOA, 
        ltc.HOCKY, 
        ltc.MAMH, 
        mh.TENMH,
        ltc.NHOM, 
        ltc.MAGV, 
        gv.HO + ' ' + gv.TEN AS TENGV,
        ltc.MAKHOA, 
        ltc.SOSVTOITHIEU, 
        ltc.HUYLOP
    FROM LOPTINCHI ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    ORDER BY ltc.MALTC DESC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOPTINCHI_BY_ID
-- Description: Lấy thông tin lớp tín chỉ cụ thể theo Mã Lớp tín chỉ.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ (Số nguyên tự tăng)
-- Returns: Dòng thông tin của lớp tín chỉ đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOPTINCHI_BY_ID
    @MALTC INT
AS
BEGIN
    SELECT MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP
    FROM LOPTINCHI
    WHERE MALTC = @MALTC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOPTINCHI_BY_KHOA
-- Description: Lấy danh sách các lớp tín chỉ thuộc một Khoa.
-- Parameters:
--   - @MAKHOA: Mã khoa cần lọc
-- Returns: Bảng danh sách các lớp tín chỉ của khoa.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOPTINCHI_BY_KHOA
    @MAKHOA NCHAR(10)
AS
BEGIN
    SELECT MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP
    FROM LOPTINCHI
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOPTINCHI_BY_NIENKHOA_HOCKY
-- Description: Lấy danh sách các lớp tín chỉ đang hoạt động (HUYLOP = 0)
--              theo Niên khóa và Học kỳ.
-- Parameters:
--   - @NIENKHOA: Niên khóa cần lọc (ví dụ: '2023-2024')
--   - @HOCKY: Học kỳ cần lọc (1, 2, 3)
-- Returns: Bảng danh sách lớp tín chỉ đáp ứng yêu cầu.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOPTINCHI_BY_NIENKHOA_HOCKY
    @NIENKHOA NCHAR(9),
    @HOCKY INT
AS
BEGIN
    SELECT 
        ltc.MALTC, 
        ltc.NIENKHOA, 
        ltc.HOCKY, 
        ltc.MAMH, 
        mh.TENMH,
        ltc.NHOM, 
        ltc.MAGV, 
        gv.HO + ' ' + gv.TEN AS TENGV,
        ltc.MAKHOA, 
        ltc.SOSVTOITHIEU, 
        ltc.HUYLOP
    FROM LOPTINCHI ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    WHERE ltc.NIENKHOA = @NIENKHOA 
      AND ltc.HOCKY = @HOCKY
      AND ltc.HUYLOP = 0;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOPTINCHI_BY_GIANGVIEN
-- Description: Lấy danh sách lớp tín chỉ được phân công cho một Giảng viên.
-- Parameters:
--   - @MAGV: Mã giảng viên giảng dạy
-- Returns: Bảng danh sách các lớp tín chỉ.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOPTINCHI_BY_GIANGVIEN
    @MAGV NCHAR(10)
AS
BEGIN
    SELECT MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP
    FROM LOPTINCHI
    WHERE MAGV = @MAGV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_LOPTINCHI
-- Description: Tạo mới một lớp tín chỉ.
-- Parameters:
--   - @NIENKHOA: Niên khóa lớp tín chỉ
--   - @HOCKY: Học kỳ (Số nguyên)
--   - @MAMH: Mã môn học
--   - @NHOM: Số nhóm của lớp môn học này
--   - @MAGV: Mã giảng viên phụ trách
--   - @MAKHOA: Mã khoa
--   - @SOSVTOITHIEU: Số lượng sinh viên tối thiểu để mở lớp
--   - @HUYLOP: Trạng thái hủy lớp (Bit: 1 là hủy, 0 là hoạt động)
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_LOPTINCHI
    @NIENKHOA NCHAR(9),
    @HOCKY INT,
    @MAMH NCHAR(10),
    @NHOM INT,
    @MAGV NCHAR(10),
    @MAKHOA NCHAR(10),
    @SOSVTOITHIEU INT,
    @HUYLOP BIT
AS
BEGIN
    INSERT INTO LOPTINCHI (NIENKHOA, HOCKY, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP)
    VALUES (@NIENKHOA, @HOCKY, @MAMH, @NHOM, @MAGV, @MAKHOA, @SOSVTOITHIEU, @HUYLOP);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_LOPTINCHI
-- Description: Cập nhật thông tin chi tiết của một lớp tín chỉ đã có.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần cập nhật (Khóa chính)
--   - @NIENKHOA: Niên khóa mới
--   - @HOCKY: Học kỳ mới
--   - @MAMH: Mã môn học mới
--   - @NHOM: Nhóm mới
--   - @MAGV: Mã giảng viên mới
--   - @MAKHOA: Mã khoa mới
--   - @SOSVTOITHIEU: Số sinh viên tối thiểu mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_LOPTINCHI
    @MALTC INT,
    @NIENKHOA NCHAR(9),
    @HOCKY INT,
    @MAMH NCHAR(10),
    @NHOM INT,
    @MAGV NCHAR(10),
    @MAKHOA NCHAR(10),
    @SOSVTOITHIEU INT
AS
BEGIN
    UPDATE LOPTINCHI
    SET NIENKHOA = @NIENKHOA,
        HOCKY = @HOCKY,
        MAMH = @MAMH,
        NHOM = @NHOM,
        MAGV = @MAGV,
        MAKHOA = @MAKHOA,
        SOSVTOITHIEU = @SOSVTOITHIEU
    WHERE MALTC = @MALTC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_LOPTINCHI
-- Description: Xóa một lớp tín chỉ khỏi hệ thống.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_LOPTINCHI
    @MALTC INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Count INT;
    DECLARE @MinStudents INT;

    -- Lấy số sinh viên tối thiểu của lớp tín chỉ
    SELECT @MinStudents = SOSVTOITHIEU
    FROM LOPTINCHI
    WHERE MALTC = @MALTC;

    -- Nếu lớp tín chỉ không tồn tại, kết thúc
    IF @MinStudents IS NULL
    BEGIN
        RAISERROR(N'Lớp tín chỉ không tồn tại!', 16, 1);
        RETURN;
    END;

    -- Đếm số sinh viên hiện đang đăng ký hoạt động (HUYDANGKY = 0)
    SELECT @Count = COUNT(*)
    FROM DANGKY
    WHERE MALTC = @MALTC AND HUYDANGKY = 0;

    -- Kiểm tra điều kiện: số đăng ký phải bé hơn số tối thiểu
    IF @Count >= @MinStudents
    BEGIN
        RAISERROR(N'Không thể xóa lớp tín chỉ này vì số sinh viên đăng ký (%d) đạt hoặc vượt quá số lượng tối thiểu (%d)!', 16, 1, @Count, @MinStudents);
        RETURN;
    END;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Xóa các đăng ký của lớp tín chỉ trước để tránh lỗi khóa ngoại
        DELETE FROM DANGKY
        WHERE MALTC = @MALTC;

        -- Xóa lớp tín chỉ
        DELETE FROM LOPTINCHI
        WHERE MALTC = @MALTC;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(N'Lỗi khi xóa lớp tín chỉ: %s', 16, 1, @ErrorMessage);
    END CATCH;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CANCEL_LOPTINCHI
-- Description: Hủy một lớp tín chỉ bằng cách gán trạng thái HUYLOP = 1.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần hủy
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CANCEL_LOPTINCHI
    @MALTC INT
AS
BEGIN
    UPDATE LOPTINCHI
    SET HUYLOP = 1
    WHERE MALTC = @MALTC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_LOPTINCHI
-- Description: Khôi phục lớp tín chỉ bị hủy (HUYLOP = 0).
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần khôi phục
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_LOPTINCHI
    @MALTC INT
AS
BEGIN
    UPDATE LOPTINCHI
    SET HUYLOP = 0
    WHERE MALTC = @MALTC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_SEARCH_LOPTINCHI
-- Description: Tìm lớp tín chỉ theo Niên khóa, tên Môn học hoặc tên Giảng viên.
-- Parameters:
--   - @KEYWORD: Từ khóa tìm kiếm
-- Returns: Danh sách các lớp tín chỉ khớp từ khóa.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_SEARCH_LOPTINCHI
    @KEYWORD NVARCHAR(100)
AS
BEGIN
    SELECT ltc.MALTC, ltc.NIENKHOA, ltc.HOCKY, ltc.MAMH, ltc.NHOM, ltc.MAGV, ltc.MAKHOA, ltc.SOSVTOITHIEU, ltc.HUYLOP
    FROM LOPTINCHI ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    WHERE (ltc.NIENKHOA LIKE '%' + @KEYWORD + '%' 
       OR mh.TENMH LIKE '%' + @KEYWORD + '%'
       OR gv.HO + ' ' + gv.TEN LIKE '%' + @KEYWORD + '%');
END;
GO
