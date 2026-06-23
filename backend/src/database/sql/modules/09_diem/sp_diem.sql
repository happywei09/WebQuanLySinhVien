USE [QLDSV_HTC];
GO

-- =========================================================================
-- STORED PROCEDURES - DIEM
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_DIEM_BY_LOPTINCHI
-- Description: Lấy danh sách điểm (chuyên cần, giữa kỳ, cuối kỳ) của các
--              sinh viên đăng ký lớp tín chỉ tương ứng.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần lấy bảng điểm
-- Returns: Bảng danh sách sinh viên cùng thông tin điểm số.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_DIEM_BY_LOPTINCHI
    @MALTC INT
AS
BEGIN
    SELECT dk.MALTC, dk.MASV, sv.HO, sv.TEN, dk.DIEM_CC, dk.DIEM_GK, dk.DIEM_CK
    FROM DANGKY dk
    INNER JOIN SINHVIEN sv ON dk.MASV = sv.MASV
    WHERE dk.MALTC = @MALTC AND dk.HUYDANGKY = 0;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_DIEM_BY_SINHVIEN
-- Description: Lấy bảng điểm chi tiết các môn học của một sinh viên cụ thể.
-- Parameters:
--   - @MASV: Mã sinh viên cần lấy bảng điểm
-- Returns: Bảng điểm gồm tên môn học, nhóm, và các cột điểm thành phần.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_DIEM_BY_SINHVIEN
    @MASV NCHAR(10)
AS
BEGIN
    ;WITH FilteredDangKy AS (
        SELECT MALTC, DIEM_CC, DIEM_GK, DIEM_CK
        FROM DANGKY
        WHERE MASV = @MASV AND HUYDANGKY = 0
    )
    SELECT dk.MALTC, ltc.MAMH, mh.TENMH, ltc.NHOM, dk.DIEM_CC, dk.DIEM_GK, dk.DIEM_CK
    FROM FilteredDangKy dk
    INNER JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_DIEM
-- Description: Cập nhật điểm chuyên cần, giữa kỳ, cuối kỳ cho một sinh viên.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ
--   - @MASV: Mã sinh viên
--   - @DIEM_CC: Điểm chuyên cần mới
--   - @DIEM_GK: Điểm giữa kỳ mới
--   - @DIEM_CK: Điểm cuối kỳ mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_DIEM
    @MALTC INT,
    @MASV NCHAR(10),
    @DIEM_CC INT,
    @DIEM_GK FLOAT,
    @DIEM_CK FLOAT
AS
BEGIN
    UPDATE DANGKY
    SET DIEM_CC = @DIEM_CC,
        DIEM_GK = @DIEM_GK,
        DIEM_CK = @DIEM_CK
    WHERE MALTC = @MALTC AND MASV = @MASV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_DIEM_BATCH
-- Description: Cập nhật điểm hàng loạt cho lớp tín chỉ bằng cách giải mã
--              chuỗi JSON truyền vào từ ứng dụng.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ
--   - @JSON_DATA: Chuỗi dữ liệu JSON chứa danh sách sinh viên và điểm số
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_DIEM_BATCH
    @MALTC INT,
    @JSON_DATA NVARCHAR(MAX)
AS
BEGIN
    UPDATE dk
    SET dk.DIEM_CC = jd.DIEM_CC,
        dk.DIEM_GK = jd.DIEM_GK,
        dk.DIEM_CK = jd.DIEM_CK
    FROM DANGKY dk
    INNER JOIN OPENJSON(@JSON_DATA)
    WITH (
        MASV NCHAR(10) '$.MASV',
        DIEM_CC INT '$.DIEM_CC',
        DIEM_GK FLOAT '$.DIEM_GK',
        DIEM_CK FLOAT '$.DIEM_CK'
    ) jd ON dk.MASV = jd.MASV
    WHERE dk.MALTC = @MALTC AND dk.HUYDANGKY = 0;
END;
GO
