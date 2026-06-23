USE [QLDSV_HTC];
GO

-- =========================================================================
-- STORED PROCEDURE: SP_STUDENT_LOGIN
-- Description: Kiểm tra đăng nhập của Sinh viên. Nếu thành công, trả về
--              thông tin cá nhân gồm Mã SV, Họ, Tên, Mã Lớp và Role.
-- Parameters:
--   - @MaSV: Mã sinh viên đăng nhập
--   - @Password: Mật khẩu sinh viên
-- Returns: Bảng thông tin sinh viên và RoleName 'SV'
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_STUDENT_LOGIN
    @MaSV NVARCHAR(10),
    @Password NVARCHAR(40)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra xem Mã SV và Mật khẩu có khớp trong bảng Sinhvien không
    IF EXISTS (
        SELECT 1 
        FROM dbo.Sinhvien 
        WHERE MASV = @MaSV AND [PASSWORD] = @Password AND DANGHIHOC = 0 -- 0 nghĩa là chưa nghỉ học
    )
    BEGIN
        -- Nếu khớp, trả về thông tin cá nhân để hiện lên giao diện (Yêu cầu 3.2)
        SELECT MASV, HO, TEN, MALOP, N'SV' AS [RoleName]
        FROM dbo.Sinhvien
        WHERE MASV = @MaSV;
    END
    ELSE
    BEGIN
        -- Nếu không khớp hoặc đã nghỉ học thì báo lỗi
        RAISERROR(N'Mã sinh viên hoặc Mật khẩu không đúng, hoặc tài khoản đã bị khóa (Đã nghỉ học)!', 16, 1);
    END
END
GO
