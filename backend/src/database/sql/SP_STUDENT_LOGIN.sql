CREATE PROCEDURE SP_STUDENT_LOGIN
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

EXEC SP_STUDENT_LOGIN @MaSV = 'N23DCCN115', @Password = '123456';