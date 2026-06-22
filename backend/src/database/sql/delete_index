USE [QLDSV_HTC];
GO

-- 1. Xóa chỉ mục dư thừa IX_SINHVIEN_MASV trên bảng SINHVIEN nếu tồn tại
IF EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = 'IX_SINHVIEN_MASV' 
      AND object_id = OBJECT_ID('dbo.SINHVIEN')
)
BEGIN
    DROP INDEX IX_SINHVIEN_MASV ON dbo.SINHVIEN;
    PRINT 'Da xoa chi muc IX_SINHVIEN_MASV';
END
ELSE
BEGIN
    PRINT 'Chi muc IX_SINHVIEN_MASV khong ton tai hoặc da duoc xoa';
END;
GO

-- 2. Xóa chỉ mục dư thừa IX_DANGKY_MALTC_MASV trên bảng DANGKY nếu tồn tại
IF EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = 'IX_DANGKY_MALTC_MASV' 
      AND object_id = OBJECT_ID('dbo.DANGKY')
)
BEGIN
    DROP INDEX IX_DANGKY_MALTC_MASV ON dbo.DANGKY;
    PRINT 'Da xoa chi muc IX_DANGKY_MALTC_MASV';
END
ELSE
BEGIN
    PRINT 'Chi muc IX_DANGKY_MALTC_MASV khong ton tai hoặc da duoc xoa';
END;
GO
