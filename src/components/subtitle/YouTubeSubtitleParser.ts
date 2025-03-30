import { SubtitleParser } from './SubtitleController';
import { SubtitleItem } from '@/models/subtitle';

/**
 * YouTube 字幕解析器
 * 
 * 解析 YouTube 字幕数据
 */
export class YouTubeSubtitleParser implements SubtitleParser {
  /**
   * 解析字幕
   * @param response YouTube字幕响应文本
   */
  public parseSubtitle(response: string): SubtitleItem[] {
    console.log("开始解析字幕，长度:", response.length);
    
    // 检查字幕响应是否为空
    if (!response || response.trim() === '') {
      console.error("收到的字幕响应为空");
      return [];
    }
    
    // 更详细的格式检测
    const isJson3 = response.includes("fmt=json3");
    const isSrv3 = response.includes("fmt=srv3");
    const containsEvents = response.includes('"events"') || response.includes("'events'");
    const containsSegs = response.includes('"segs"') || response.includes("'segs'");
    const isWebVTT = response.trim().startsWith('WEBVTT');
    
    console.log("字幕格式检测:", { isJson3, isSrv3, containsEvents, containsSegs, isWebVTT });
    
    if (isWebVTT) {
      return this.parseWebVTTSubtitle(response);
    } else if (isSrv3 || isJson3 || containsEvents) {
      return this.parseJsonSubtitle(response);
    } else {
      console.log("尝试解析其他格式字幕:", response.substring(0, 100) + "...");
      
      // 尝试直接解析为JSON
      try {
        return this.parseJsonSubtitle(response);
      } catch (error) {
        console.error("尝试直接解析JSON失败:", error);
        
        // 尝试作为WebVTT解析
        if (response.includes('-->')) {
          console.log("尝试作为WebVTT格式解析");
          return this.parseWebVTTSubtitle(response);
        }
        
        console.log("不支持的字幕格式");
        return [];
      }
    }
  }
  
  /**
   * 解析 WebVTT 格式字幕
   * @param vttContent WebVTT格式的字幕内容
   */
  private parseWebVTTSubtitle(vttContent: string): SubtitleItem[] {
    try {
      console.log("开始解析WebVTT字幕，内容长度：", vttContent.length);
      
      // 创建新的字幕数组
      const subtitles: SubtitleItem[] = [];
      
      // 按行分割内容
      const lines = vttContent.split('\n');
      
      // 检查WebVTT格式
      if (!lines[0].includes('WEBVTT')) {
        console.error("不是有效的WebVTT格式");
        return [];
      }
      
      // 跳过头部元数据，查找实际的字幕条目
      let i = 1;
      while (i < lines.length) {
        // 跳过空行和头部元数据
        if (!lines[i] || lines[i].includes('Kind:') || lines[i].includes('Language:')) {
          i++;
          continue;
        }
        
        // 当找到时间戳格式 (00:00:00.000 --> 00:00:00.000) 时开始处理字幕条目
        if (lines[i].includes('-->')) {
          // 解析时间戳
          const timestamps = lines[i].split('-->').map(t => t.trim());
          
          // 检查时间戳格式
          if (timestamps.length !== 2) {
            i++;
            continue;
          }
          
          // 将时间戳转换为毫秒
          const start = this.timeToMs(timestamps[0]);
          const end = this.timeToMs(timestamps[1]);
          
          // 收集字幕文本
          let text = '';
          i++;
          
          // 收集直到下一个空行或文件结束的所有文本行
          while (i < lines.length && lines[i].trim()) {
            text += (text ? ' ' : '') + lines[i].trim();
            i++;
          }
          
          // 如果有有效文本，添加到字幕数组
          if (text) {
            subtitles.push({
              start,
              end,
              text
            });
          }
        } else {
          // 移动到下一行
          i++;
        }
      }
      
      console.log(`成功解析 ${subtitles.length} 条WebVTT字幕`);
      return subtitles;
    } catch (error) {
      console.error("解析 WebVTT 字幕失败:", error);
      console.log("错误详情:", error instanceof Error ? error.stack : String(error));
      return [];
    }
  }
  
  /**
   * 将时间字符串转换为毫秒
   * @param timeString 时间字符串，格式为 HH:MM:SS.mmm 或 MM:SS.mmm
   */
  private timeToMs(timeString: string): number {
    try {
      // 移除可能的位置和对齐信息
      const cleanTime = timeString.split(' ')[0];
      
      // 处理不同格式的时间戳
      const parts = cleanTime.split(':');
      
      if (parts.length === 3) {
        // HH:MM:SS.mmm 格式
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseFloat(parts[2]);
        
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
      } else if (parts.length === 2) {
        // MM:SS.mmm 格式
        const minutes = parseInt(parts[0], 10);
        const seconds = parseFloat(parts[1]);
        
        return (minutes * 60 + seconds) * 1000;
      } else {
        console.error("无法解析时间格式:", timeString);
        return 0;
      }
    } catch (error) {
      console.error("时间转换错误:", timeString, error);
      return 0;
    }
  }
  
  /**
   * 解析 JSON 格式字幕
   * @param jsonContent JSON格式的字幕内容
   */
  private parseJsonSubtitle(jsonContent: string): SubtitleItem[] {
    try {
      console.log("开始解析JSON字幕，内容长度：", jsonContent.length);
      
      // 检查并移除可能存在的BOM标记或其他前缀
      let cleanedContent = jsonContent;
      if (jsonContent.startsWith('\uFEFF')) {
        cleanedContent = jsonContent.substring(1);
        console.log("移除了BOM标记");
      }
      
      // 检查内容是否为有效JSON
      const isValidJSON = (() => {
        try {
          JSON.parse(cleanedContent);
          return true;
        } catch (e) {
          return false;
        }
      })();
      
      console.log("JSON内容预览：", cleanedContent.substring(0, 100) + "...");
      console.log("是否有效JSON:", isValidJSON);
      
      let data;
      try {
        data = JSON.parse(cleanedContent);
      } catch (e) {
        console.error("JSON解析失败:", e);
        console.log("尝试修复JSON格式...");
        
        // 增强的JSON修复逻辑
        let fixedJson = cleanedContent;
        
        // 修复未加引号的属性名
        fixedJson = fixedJson.replace(/(\w+):/g, '"$1":');
        
        // 修复单引号为双引号
        fixedJson = fixedJson.replace(/'/g, '"');
        
        // 尝试修复可能的JSONP回调格式
        const jsonpMatch = fixedJson.match(/^\s*\w+\((.*)\)\s*$/);
        if (jsonpMatch && jsonpMatch[1]) {
          fixedJson = jsonpMatch[1];
          console.log("检测到JSONP格式并已修复");
        }
        
        // 尝试解析修复后的JSON
        console.log("修复后的JSON预览:", fixedJson.substring(0, 100) + "...");
        data = JSON.parse(fixedJson);
        console.log("JSON修复成功");
      }
      
      // 适应不同的JSON结构
      if (!data) {
        console.error("解析后的数据为空");
        return [];
      }
      
      // 检查是否包含events字段
      if (!data.events) {
        console.log("数据不包含events字段，尝试寻找替代结构");
        
        // 尝试寻找替代结构，例如{"body": {"events": [...]}}或其他变体
        if (data.body && data.body.events) {
          data = data.body;
          console.log("找到替代结构: data.body.events");
        } else {
          // 遍历查找包含events的对象
          for (const key in data) {
            if (data[key] && typeof data[key] === 'object' && Array.isArray(data[key].events)) {
              data = data[key];
              console.log(`找到替代结构: data.${key}.events`);
              break;
            }
          }
        }
        
        // 最后检查
        if (!data.events) {
          console.error("无法找到events字段:", Object.keys(data));
          return [];
        }
      }
      
      console.log(`找到 ${data.events.length} 个事件`);
      
      // 创建新的字幕数组
      const subtitles: SubtitleItem[] = [];
      
      // 解析字幕数据
      for (const event of data.events) {
        // 跳过不含文本段的事件
        if (!event.segs && !event.text && !event.textSegments) {
          continue;
        }
        
        const start = event.tStartMs || event.startMs || event.startTime || 0;
        const duration = event.dDurationMs || event.durationMs || event.duration || 0;
        const end = start + duration;
        
        let text = "";
        
        // 处理不同的文本结构格式
        if (event.segs) {
          for (const seg of event.segs) {
            if (seg.utf8) {
              text += seg.utf8;
            } else if (seg.text) {
              text += seg.text;
            }
          }
        } else if (event.text) {
          text = event.text;
        } else if (event.textSegments) {
          for (const seg of event.textSegments) {
            text += seg.text || "";
          }
        }
        
        if (text.trim()) {
          subtitles.push({
            start,
            end,
            text: text.trim()
          });
        }
      }
      
      console.log(`成功解析 ${subtitles.length} 条字幕`);
      return subtitles;
    } catch (error) {
      console.error("解析 JSON 字幕失败:", error);
      console.log("错误详情:", error instanceof Error ? error.stack : String(error));
      return [];
    }
  }
} 