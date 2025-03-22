/**
 * 平台处理器基类
 */
import {AIService} from '../../core/types/ai';
import {PlatformHandler, SubtitleHandler} from '../../core/types/platform';

/**
 * 抽象平台处理器基类
 */
export abstract class BasePlatformHandler implements PlatformHandler {
    /**
     * 检查是否支持当前URL
     * @param url 当前URL
     * @returns 是否支持
     */
    abstract isSupported(url: string): boolean;

    /**
     * 初始化平台处理器
     */
    abstract initialize(): Promise<void>;

    /**
     * 创建字幕处理器
     * @param aiService AI服务
     * @returns 字幕处理器
     */
    abstract createSubtitleHandler(aiService: AIService): SubtitleHandler;
}
