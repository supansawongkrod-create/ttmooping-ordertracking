const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxAgWawSRlh1PsoVEX5UoU-btb0Ia5pKCMWDNYBq5RzBZJ472PO5MNi7IDLwrrFZzwG/exec';


export default async function handler(req, res) {
  // อนุญาตเฉพาะ GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      found: false,
      trackingNumbers: []
    });
  }

  // ลบช่องว่างและอักขระที่ไม่ใช่ตัวเลข
  const phone = String(
    req.query.phone || ''
  ).replace(/\D/g, '');

  // ตรวจสอบรูปแบบเบอร์โทร
  if (!/^0\d{8,9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      found: false,
      message: '電話號碼格式不正確',
      trackingNumbers: []
    });
  }

  try {
    const url =
      `${APPS_SCRIPT_URL}` +
      `?phone=${encodeURIComponent(phone)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(
        `Apps Script request failed: ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      return res.status(200).json({
        success: false,
        found: false,
        message:
          data.message ||
          '系統暫時無法查詢',
        trackingNumbers: []
      });
    }

    // ป้องกันไม่ให้หน้าเว็บแสดงเกินหนึ่งเลข
    const trackingNumbers =
      Array.isArray(data.trackingNumbers)
        ? data.trackingNumbers
            .map(number =>
              String(number || '')
                .replace(/\D/g, '')
            )
            .filter(Boolean)
            .slice(0, 1)
        : [];

    // ไม่เก็บ Cache ข้อมูลลูกค้า
    res.setHeader(
      'Cache-Control',
      'private, no-store, max-age=0'
    );

    return res.status(200).json({
      success: true,
      found: trackingNumbers.length > 0,
      trackingNumbers: trackingNumbers
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      found: false,
      message: '系統暫時無法查詢',
      trackingNumbers: []
    });
  }
}
