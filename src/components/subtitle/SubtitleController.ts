import { 
  $subtitleData, 
  $subtitleEnabled,
  $currentTime,
  subtitleDataReceived, 
  subtitleToggled,
  currentTimeChanged,
  parseSubtitleFx,
  SubtitleItem
} from '@/models/subtitle';

/**
 * 字幕解析器接口
 */
export interface SubtitleParser {
  parseSubtitle(response: string): SubtitleItem[];
}

/**
 * 字幕控制器
 * 
 * 连接平台特定的字幕解析器和React组件
 */
export class SubtitleController {
  private videoElement: HTMLVideoElement | null = null;
  private animationFrameId: number | null = null;
  private parser: SubtitleParser;
  
  constructor(parser: SubtitleParser) {
    this.parser = parser;
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
  }
  
  /**
   * 初始化字幕控制器
   */
  public initialize(): void {
    // 查找视频元素
    this.videoElement = document.querySelector('video');
    
    if (!this.videoElement) {
      console.error('找不到视频元素，无法初始化字幕控制器');
      return;
    }
    
    // 使用requestAnimationFrame监听视频时间变化
    this.startTimeTracking();
    
    // 重写parseSubtitleFx处理函数，使用传入的解析器
    parseSubtitleFx.use(async (response: string) => {
      return this.parser.parseSubtitle(response);
    });
  }
  
  /**
   * 接收并处理字幕数据
   */
  public processSubtitleData(response: string, enabled: boolean = true): void {
    // 解析字幕
    parseSubtitleFx(response).then(subtitles => {
      // 保存字幕数据
      subtitleDataReceived(subtitles);
      
      // 启用字幕
      subtitleToggled(enabled);
      
      console.log(`解析成功，获取到 ${subtitles.length} 条字幕`);
    });
  }
  
  /**
   * 启用/禁用字幕
   */
  public toggleSubtitle(enabled: boolean): void {
    subtitleToggled(enabled);
  }
  
  /**
   * 开始跟踪视频时间
   */
  private startTimeTracking(): void {
    if (!this.videoElement) return;
    
    // 使用requestAnimationFrame实现更精确的同步
    const trackTime = () => {
      if (this.videoElement && !this.videoElement.paused) {
        // 转换为毫秒
        const time = this.videoElement.currentTime * 1000;
        currentTimeChanged(time);
      }
      
      this.animationFrameId = requestAnimationFrame(trackTime);
    };
    
    // 开始跟踪
    this.animationFrameId = requestAnimationFrame(trackTime);
  }
  
  /**
   * 停止跟踪视频时间
   */
  private stopTimeTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * 处理视频时间更新
   */
  private handleTimeUpdate(): void {
    if (!this.videoElement) return;
    
    // 获取当前时间（毫秒）
    const currentTime = this.videoElement.currentTime * 1000;
    currentTimeChanged(currentTime);
  }
  
  /**
   * 销毁字幕控制器
   */
  public destroy(): void {
    // 停止跟踪视频时间
    this.stopTimeTracking();
    
    // 禁用字幕
    subtitleToggled(false);
    
    // 清空字幕数据
    subtitleDataReceived([]);
  }
} 