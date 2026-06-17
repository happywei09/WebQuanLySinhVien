CREATE PROCEDURE SP_CREATE_LOGIN
    @LoginName NVARCHAR(50),  -- Tên Login cần tạo (Ví dụ: 'gv_minh' hoặc 'sv')
    @Password NVARCHAR(50)    -- Mật khẩu cho Login đó
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Kiểm tra xem tên Login này đã tồn tại trên Server hay chưa
    IF EXISTS (SELECT 1 FROM master.dbo.syslogins WHERE name = @LoginName)
    BEGIN
        RAISERROR(N'Tên Login "%s" đã tồn tại trên Server này rồi!', 16, 1, @LoginName);
        RETURN;
    END

    -- 2. Tiến hành tạo Login
    BEGIN TRY
        -- Lấy tên Database hiện tại để gán làm DB mặc định khi Login này kết nối vào
        DECLARE @CurrentDB NVARCHAR(50) = DB_NAME();

        -- Gọi SP hệ thống của master để tạo Login
        EXEC master.sys.sp_addlogin @LoginName, @Password, @CurrentDB;

        PRINT N'Xử lý thành công: Đã tạo xong Login "' + @LoginName + N'" trên Server.';
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(N'Lỗi khi tạo Login: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

EXEC SP_CREATE_LOGIN @LoginName = 'gv_minh', @Password = '123456';