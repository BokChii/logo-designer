/**
 * Usage Logger — Google Sheets via Apps Script Webhook
 *
 * 로그는 응답을 차단하지 않도록 fire-and-forget 방식으로 전송됩니다.
 * USAGE_LOG_WEBHOOK_URL 환경변수가 없으면 조용히 스킵합니다.
 */

/**
 * IP 주소 추출 (Vercel 프록시 헤더 고려)
 */
function getClientIp(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket?.remoteAddress ||
        'unknown'
    );
}

/**
 * 사용 로그를 Google Sheets에 기록 (비동기, non-blocking)
 *
 * @param {object} req - Express request object
 * @param {object} data
 * @param {string} data.action       - 'generate' | 'edit' | 'edit-region'
 * @param {boolean} data.success     - 성공 여부
 * @param {number} data.durationMs   - 소요 시간 (ms)
 * @param {string} [data.errorMsg]   - 실패 시 오류 메시지
 * @param {object} [data.meta]       - 추가 정보 (pose, style 등)
 */
export function logUsage(req, { action, success, durationMs, errorMsg = '', meta = {} }) {
    const webhookUrl = process.env.USAGE_LOG_WEBHOOK_URL;
    if (!webhookUrl) return; // 설정 안 되어 있으면 스킵

    const payload = {
        timestamp: new Date().toISOString(),
        action,
        success,
        durationMs,
        errorMsg,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
        meta: JSON.stringify(meta),
    };

    // fire-and-forget: 로그 실패가 API 응답에 영향 주지 않음
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch((err) => {
        console.warn('[Logger] 로그 전송 실패:', err.message);
    });
}
