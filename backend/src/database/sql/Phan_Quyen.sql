USE master;
GO

CREATE LOGIN login_pgv
WITH PASSWORD = '123',
CHECK_POLICY = OFF;
GO

CREATE LOGIN login_khoa
WITH PASSWORD = '123',
CHECK_POLICY = OFF;
GO

CREATE LOGIN login_sv
WITH PASSWORD = '123456',
CHECK_POLICY = OFF;
GO
USE QLDSV_HTC;
GO

CREATE USER login_pgv FOR LOGIN login_pgv;
GO

CREATE USER login_khoa FOR LOGIN login_khoa;
GO

CREATE USER login_sv FOR LOGIN login_sv;
GO
USE QLDSV_HTC;
GO

CREATE ROLE PGV;
GO

CREATE ROLE KHOA;
GO

CREATE ROLE SV;
GO
USE QLDSV_HTC;
GO

ALTER ROLE PGV ADD MEMBER login_pgv;
GO

ALTER ROLE KHOA ADD MEMBER login_khoa;
GO

ALTER ROLE SV ADD MEMBER login_sv;
GO
USE QLDSV_HTC;
GO

SELECT name, type_desc
FROM sys.database_principals
WHERE name IN ('login_pgv', 'login_khoa', 'login_sv');
GO
USE QLDSV_HTC;
GO

SELECT name, type_desc
FROM sys.database_principals
WHERE name IN ('PGV', 'KHOA', 'SV');
GO
-- phan quyen phong giao vu 
ALTER ROLE db_owner ADD MEMBER login_pgv;
-- phan quyen khoa
USE QLDSV_HTC;
GO

/* =========================
   PHÂN QUYỀN ROLE KHOA
   ========================= */


/* Bảng KHOA */
GRANT SELECT ON dbo.KHOA
(
    MAKHOA,
    TENKHOA
)
TO KHOA;
GO

DENY INSERT, UPDATE, DELETE ON dbo.KHOA TO KHOA;
GO


/* Bảng LOP */
GRANT SELECT ON dbo.LOP
(
    MALOP,
    TENLOP,
    KHOAHOC,
    MAKHOA
)
TO KHOA;
GO

DENY INSERT, UPDATE, DELETE ON dbo.LOP TO KHOA;
GO


/* Bảng SINHVIEN */
GRANT SELECT ON dbo.SINHVIEN
(
    MASV,
    HO,
    TEN,
    MALOP,
    PHAI,
    NGAYSINH,
    DIACHI,
    DANGHIHOC
)
TO KHOA;
GO

DENY SELECT ON dbo.SINHVIEN
(
    [PASSWORD]
)
TO KHOA;
GO

DENY INSERT, UPDATE, DELETE ON dbo.SINHVIEN TO KHOA;
GO


/* Bảng GIANGVIEN */
GRANT SELECT ON dbo.GIANGVIEN
(
    MAGV,
    HO,
    TEN,
    HOCVI,
    HOCHAM,
    CHUYENMON,
    MAKHOA
)
TO KHOA;
GO

DENY INSERT, UPDATE, DELETE ON dbo.GIANGVIEN TO KHOA;
GO


/* Bảng MONHOC */
GRANT SELECT ON dbo.MONHOC
(
    MAMH,
    TENMH,
    SOTIET_LT,
    SOTIET_TH
)
TO KHOA;
GO

DENY INSERT, UPDATE, DELETE ON dbo.MONHOC TO KHOA;
GO


/* Bảng LOPTINCHI */
GRANT SELECT ON dbo.LOPTINCHI
(
    MALTC,
    NIENKHOA,
    HOCKY,
    MAMH,
    NHOM,
    MAGV,
    MAKHOA,
    SOSVTOITHIEU,
    HUYLOP
)
TO KHOA;
GO

DENY INSERT, UPDATE, DELETE ON dbo.LOPTINCHI TO KHOA;
GO


/* Bảng DANGKY */
GRANT SELECT ON dbo.DANGKY
(
    MALTC,
    MASV,
    DIEM_CC,
    DIEM_GK,
    DIEM_CK,
    HUYDANGKY
)
TO KHOA;
GO

DENY INSERT ON dbo.DANGKY TO KHOA;
GO

DENY DELETE ON dbo.DANGKY TO KHOA;
GO

-- Cho KHOA được sửa 3 cột điểm
GRANT UPDATE ON dbo.DANGKY
(
    DIEM_CC,
    DIEM_GK,
    DIEM_CK
)
TO KHOA;
GO

-- Không cho KHOA sửa các cột khác trong DANGKY
DENY UPDATE ON dbo.DANGKY
(
    MALTC,
    MASV,
    HUYDANGKY
)
TO KHOA;
GO
-- phan quyen sinh vien




/* ==================================================
   4. PHÂN QUYỀN BẢNG KHOA
   ================================================== */

GRANT SELECT ON dbo.KHOA
(
    MAKHOA,
    TENKHOA
)
TO SV;
GO

DENY INSERT, UPDATE, DELETE ON dbo.KHOA TO SV;
GO


/* ==================================================
   5. PHÂN QUYỀN BẢNG LOP
   ================================================== */

GRANT SELECT ON dbo.LOP
(
    MALOP,
    TENLOP,
    KHOAHOC,
    MAKHOA
)
TO SV;
GO

DENY INSERT, UPDATE, DELETE ON dbo.LOP TO SV;
GO


/* ==================================================
   6. PHÂN QUYỀN BẢNG SINHVIEN
   ================================================== */

GRANT SELECT ON dbo.SINHVIEN
(
    MASV,
    HO,
    TEN,
    MALOP,
    PHAI,
    NGAYSINH,
    DIACHI
)
TO SV;
GO

DENY SELECT ON dbo.SINHVIEN
(
    DANGHIHOC,
    [PASSWORD]
)
TO SV;
GO

DENY INSERT, UPDATE, DELETE ON dbo.SINHVIEN TO SV;
GO


/* ==================================================
   7. PHÂN QUYỀN BẢNG GIANGVIEN
   ================================================== */

GRANT SELECT ON dbo.GIANGVIEN
(
    MAGV,
    HO,
    TEN,
    HOCVI,
    HOCHAM,
    CHUYENMON,
    MAKHOA
)
TO SV;
GO

DENY INSERT, UPDATE, DELETE ON dbo.GIANGVIEN TO SV;
GO


/* ==================================================
   8. PHÂN QUYỀN BẢNG MONHOC
   ================================================== */

GRANT SELECT ON dbo.MONHOC
(
    MAMH,
    TENMH,
    SOTIET_LT,
    SOTIET_TH
)
TO SV;
GO

DENY INSERT, UPDATE, DELETE ON dbo.MONHOC TO SV;
GO


/* ==================================================
   9. PHÂN QUYỀN BẢNG LOPTINCHI
   ================================================== */

GRANT SELECT ON dbo.LOPTINCHI
(
    MALTC,
    NIENKHOA,
    HOCKY,
    MAMH,
    NHOM,
    MAGV,
    MAKHOA,
    SOSVTOITHIEU,
    HUYLOP
)
TO SV;
GO

DENY INSERT, UPDATE, DELETE ON dbo.LOPTINCHI TO SV;
GO


/* ==================================================
   10. PHÂN QUYỀN BẢNG DANGKY
   ================================================== */

GRANT SELECT ON dbo.DANGKY
(
    MALTC,
    MASV,
    DIEM_CC,
    DIEM_GK,
    DIEM_CK,
    HUYDANGKY
)
TO SV;
GO

GRANT INSERT ON dbo.DANGKY TO SV;
GO

GRANT UPDATE ON dbo.DANGKY
(
    HUYDANGKY
)
TO SV;
GO

DENY UPDATE ON dbo.DANGKY
(
    DIEM_CC,
    DIEM_GK,
    DIEM_CK
)
TO SV;
GO

-- SV không được sửa khóa đăng ký
DENY UPDATE ON dbo.DANGKY
(
    MALTC,
    MASV
)
TO SV;
GO

DENY DELETE ON dbo.DANGKY TO SV;
GO