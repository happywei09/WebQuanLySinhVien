USE [QLDSV_HTC];
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CHANGE_PASSWORD
-- Description: Thay đổi mật khẩu cho tài khoản.
--              - Nếu là sinh viên: Thay đổi mật khẩu trong bảng Sinhvien.
--              - Nếu là giảng viên/nhân viên: Thay đổi mật khẩu SQL Login của hệ thống.
-- Parameters:
--   - @UserName: Mã sinh viên hoặc mã giảng viên/nhân viên
--   - @OldPassword: Mật khẩu cũ
--   - @NewPassword: Mật khẩu mới cần đổi
--   - @IsStudent: Bit phân biệt sinh viên (1) và giảng viên/PGV (0)
-- Returns: Không trả về dữ liệu, in thông báo thành công hoặc ném lỗi.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CHANGE_PASSWORD
    @UserName NVARCHAR(50),    -- Đồng bộ luôn là Mã GV hoặc Mã SV
    @OldPassword NVARCHAR(50),
    @NewPassword NVARCHAR(50),
    @IsStudent BIT             -- 1: Sinh viên, 0: Giảng viên/PGV
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- TRƯỜNG HỢP 1: ĐỔI MẬT KHẨU CHO SINH VIÊN
        IF @IsStudent = 1
        BEGIN
            -- Kiểm tra mật khẩu cũ trong bảng Sinhvien
            IF NOT EXISTS (SELECT 1 FROM dbo.Sinhvien WHERE MASV = @UserName AND [PASSWORD] = @OldPassword)
            BEGIN
                RAISERROR(N'Mật khẩu cũ của Sinh viên không chính xác!', 16, 1);
                RETURN;
            END

            -- Cập nhật mật khẩu mới vào bảng Sinhvien
            UPDATE dbo.Sinhvien 
            SET [PASSWORD] = @NewPassword 
            WHERE MASV = @UserName;

            PRINT N'Đổi mật khẩu Sinh viên thành công!';
        END
        
        -- TRƯỜNG HỢP 2: ĐỔI MẬT KHẨU CHO GIẢNG VIÊN / PGV
        ELSE
        BEGIN
            -- Khai báo biến để hứng lấy Login Name tìm được
            DECLARE @LoginName NVARCHAR(50) = NULL;

            -- Dựa vào Database User (@UserName) để tìm ra Server Login tương ứng
            SELECT @LoginName = l.name 
            FROM dbo.sysusers u 
            INNER JOIN master.dbo.syslogins l ON u.sid = l.sid 
            WHERE u.name = @UserName;

            -- Nếu không tìm thấy Login nào map với User này thì báo lỗi
            IF @LoginName IS NULL
            BEGIN
                RAISERROR(N'Không tìm thấy tài khoản hệ thống tương ứng với Mã Giảng viên "%s"!', 16, 1, @UserName);
                RETURN;
            END

            -- Thực thi đổi mật khẩu SQL Login bằng LoginName vừa tìm được
            EXEC sp_password @old = @OldPassword, @new = @NewPassword, @loginame = @LoginName;
            
            PRINT N'Đã tìm thấy Login "' + @LoginName + N'" và đổi mật khẩu thành công!';
        END
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(N'Lỗi khi đổi mật khẩu: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO
