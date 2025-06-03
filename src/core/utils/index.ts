/**
 * 通用工具函数
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 延迟函数
 * @param ms 毫秒
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 等待元素出现
 * @param selector 选择器
 * @param timeout 超时时间（毫秒）
 * @returns 元素或null
 */
export async function waitForElement(selector: string, timeout = 10000): Promise<Element | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) return element;
        await delay(100);
    }

    console.warn(`等待元素 ${selector} 超时`);
    return null;
}

/**
 * 检查URL是否匹配
 * @param url URL
 * @param patterns 匹配模式数组
 * @returns 是否匹配
 */
export function isUrlMatch(url: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(url);
    });
}

/**
 * 检查是否为YouTube视频页面
 * @param url URL
 * @returns 是否为YouTube视频页面
 */
export function isYouTubeVideoUrl(url: string): boolean {
    return /youtube\.com\/watch/.test(url);
}

/**
 * 解析语言代码
 * @param code 语言代码
 * @returns 语言名称
 */
export function getLanguageName(code: string): string {
    const languages: Record<string, string> = {
        'en-US': '英语',
        'zh-CN': '中文',
        'ja-JP': '日语',
        'ko-KR': '韩语',
        'fr-FR': '法语',
        'de-DE': '德语',
        'es-ES': '西班牙语',
        'ru-RU': '俄语',
    };

    return languages[code] || code;
}

/**
 * 合并CSS类名的工具函数
 * 用于UI组件的样式处理
 * @param inputs CSS类名
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
