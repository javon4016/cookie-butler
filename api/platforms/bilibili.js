import { BasePlatform } from './base.js';
import { STATUS, formatCookies } from '../utils/common.js';

/**
 * 哔哩哔哩平台实现
 */
export class BilibiliPlatform extends BasePlatform {
    constructor() {
        super('bilibili');
    }

    /**
     * 生成Bilibili二维码
     */
    async generateQRCode() {
        try {
            // 预热获取基础 Cookie (buvid3, _uuid 等)
            const preWarmedCookie = await this.preWarm();

            const response = await this.request({
                method: 'GET',
                url: this.getEndpoint('generateQR')
            });

            if (response.data.code !== 0) {
                return this.createErrorResponse('获取二维码信息失败: ' + response.data.message);
            }

            const { url, qrcode_key } = response.data.data;

            // 创建会话数据，包含预热的 Cookie
            const sessionKey = this.createSessionKey({
                qrcode_key: qrcode_key,
                preCookie: preWarmedCookie
            });

            // 生成二维码图片
            const qrcodeDataURL = await this.generateQRCodeImage(url);

            return this.createSuccessResponse({
                qrcode: qrcodeDataURL,
                sessionKey: sessionKey
            });

        } catch (error) {
            return this.createErrorResponse('生成二维码失败: ' + error.message);
        }
    }

    /**
     * 检查Bilibili扫码状态
     */
    async checkStatus(sessionKey) {
        try {
            const sessionData = this.parseSessionKey(sessionKey);
            if (!sessionData) {
                return this.createSuccessResponse({ status: STATUS.EXPIRED });
            }

            const { qrcode_key, preCookie } = sessionData;
            
            const response = await this.request({
                method: 'GET',
                url: this.getEndpoint('checkStatus'),
                params: {
                    qrcode_key: qrcode_key
                }
            });
            
            const data = response.data;
            const code = data.data.code;

            // 86101: 未扫码 -> NEW
            // 86090: 已扫码未确认 -> SCANNED
            // 86038: 二维码已失效 -> EXPIRED
            // 0: 登录成功 -> CONFIRMED

            switch (code) {
                case 0:
                    // 登录成功，从响应头获取 Cookie
                    const loginCookies = response.headers['set-cookie'];
                    const formattedLoginCookies = formatCookies(loginCookies);
                    
                    // 合并预热 Cookie 和 登录 Cookie
                    const finalCookie = (preCookie || '') + formattedLoginCookies;
                    
                    return this.createSuccessResponse({
                        status: STATUS.CONFIRMED,
                        cookie: finalCookie
                    });
                    
                case 86090:
                    return this.createSuccessResponse({ status: STATUS.SCANNED });
                    
                case 86038:
                    return this.createSuccessResponse({ status: STATUS.EXPIRED });
                    
                case 86101:
                    return this.createSuccessResponse({ status: STATUS.NEW });
                    
                default:
                    // 其他错误码视为过期或错误
                    console.warn(`[Bilibili] 未知状态码: ${code}, message: ${data.message}`);
                    return this.createSuccessResponse({ status: STATUS.EXPIRED });
            }
            
        } catch (error) {
            return this.createErrorResponse('检查状态失败: ' + error.message);
        }
    }

    /**
     * 预热获取基础 Cookie
     * @private
     */
    async preWarm() {
        try {
            const response = await this.request({
                method: 'GET',
                url: 'https://www.bilibili.com/',
                headers: {
                    'User-Agent': this.getUserAgent()
                }
            });
            const cookies = response.headers['set-cookie'] || [];
            return formatCookies(cookies);
        } catch (error) {
            console.warn('[Bilibili] 预热基础 Cookie 失败:', error.message);
            return '';
        }
    }
}
