CREATE PROCEDURE SP_CREATE_USER
    @LoginName NVARCHAR(50),  -- Tên Login đã tạo trước đó (Ví dụ: 'gv_an' hoặc 'sv')
    @UserName NVARCHAR(50),   -- Tên Database User (Bắt buộc là Mã GV hoặc Mã SV)
    @RoleName NVARCHAR(20)    -- Tên Nhóm quyền ('PGV', 'KHOA', hoặc 'SV')
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. KIỂM TRA TÊN ROLE CÓ HỢP LỆ TRONG HỆ THỐNG KHÔNG
    IF @RoleName NOT IN ('PGV', 'KHOA', 'SV')
    BEGIN
        RAISERROR(N'Role không hợp lệ! Hệ thống chỉ chấp nhận: PGV, KHOA, hoặc SV.', 16, 1);
        RETURN;
    END

    -- 2. KIỂM TRA TÊN LOGIN ĐÃ ĐƯỢC TẠO TRÊN SERVER CHƯA
    IF NOT EXISTS (SELECT 1 FROM master.dbo.syslogins WHERE name = @LoginName)
    BEGIN
        RAISERROR(N'Tên Login "%s" chưa tồn tại trên Server. Hãy tạo Login trước!', 16, 1, @LoginName);
        RETURN;
    END

    -- 3. KIỂM TRA XEM MÃ USER (ID) NÀY ĐÃ TỒN TẠI TRONG DATABASE CHƯA
    -- Để tránh việc một sinh viên/giảng viên bị tạo tài khoản 2 lần
    IF EXISTS (SELECT 1 FROM dbo.sysusers WHERE name = @UserName)
    BEGIN
        RAISERROR(N'Mã người dùng (User) "%s" đã tồn tại trong Database này rồi!', 16, 1, @UserName);
        RETURN;
    END

    -- 4. TIẾN HÀNH MAP LOGIN SANG USER VÀ GÁN ROLE
    BEGIN TRY
        -- Bước A: Cấp quyền truy cập DB cho Login và đặt tên đại diện (User) là Mã ID
        -- Tham số 1: Tên Login trên Server, Tham số 2: Tên User dưới Database
        EXEC sp_grantdbaccess @LoginName, @UserName;

        -- Bước B: Thêm User vừa tạo vào nhóm quyền (Role) hệ thống
        -- Tham số 1: Tên Role, Tham số 2: Tên User
        EXEC sp_addrolemember @RoleName, @UserName;

        PRINT N'Xử lý thành công:';
        PRINT N'- Login "' + @LoginName + N'" đã được liên kết với User (ID) "' + @UserName + N'"';
        PRINT N'- Đã gán quyền thuộc nhóm: ' + @RoleName;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(N'Lỗi khi liên kết Login và tạo User: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

EXEC SP_CREATE_USER @LoginName = 'gv_minh', @UserName = 'GV17', @RoleName = 'KHOA';

EXEC SP_GET_USER_ROLES @UserName = 'GV17';