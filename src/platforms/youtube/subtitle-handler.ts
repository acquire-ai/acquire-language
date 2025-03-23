/**
 * YouTube 字幕处理器
 *
 * 这个类负责获取 YouTube 字幕，并以更美观的方式显示它们。
 * 它使用注入脚本拦截 YouTube 的字幕请求，获取完整的字幕数据。
 */
import {BaseSubtitleHandler} from "../base/subtitle-handler";
import {AIService} from "@/core/types/ai.ts";

// 字幕项接口
interface SubtitleItem {
    start: number; // 开始时间（毫秒）
    end: number; // 结束时间（毫秒）
    text: string; // 字幕文本
}

export class YouTubeSubtitleHandler extends BaseSubtitleHandler {
    private containerObserver: MutationObserver | null = null;
    private subtitleCache: { [videoId: string]: { [lang: string]: string } } = {};
    private currentVideoId: string = "";
    private currentLang: string = "";
    private subtitleEnabled: boolean = false;
    private subtitleData: SubtitleItem[] = [];
    private currentSubtitleIndex: number = -1;
    private checkIntervalId: number | null = null;
    // 字幕时间偏移量（毫秒），负值表示提前显示
    private timeOffset: number = 0; // 默认不偏移
    // 是否启用自适应偏移
    private adaptiveOffset: boolean = false;
    // 记录最近的字幕切换时间，用于自适应调整
    private lastSubtitleChangeTime: number = 0;

    constructor(aiService: AIService) {
        super(aiService);
    }

    /**
     * 初始化字幕处理器
     */
    async initialize(): Promise<void> {
        // 加载设置
        await this.loadSettings();

        // 创建自定义字幕容器
        this.createSubtitleContainer();

        // 监听字幕事件
        this.listenToBackgroundScript();

        // 开始定期检查视频时间，更新当前字幕
        this.startPeriodicCheck();

        // 检查是否已经有字幕按钮被启用
        this.checkInitialSubtitleStatus();

        // 尝试预加载字幕
        this.tryPreloadSubtitles();
    }

    /**
     * 检查初始字幕状态
     */
    private checkInitialSubtitleStatus() {
        // 延迟检查，确保 YouTube 界面已完全加载
        setTimeout(() => {
            const subsToggleElement = document.querySelector(".ytp-subtitles-button");
            if (subsToggleElement) {
                const isSubtitleEnabled =
                    subsToggleElement.getAttribute("aria-pressed") === "true";

                // 更新字幕状态
                this.subtitleEnabled = isSubtitleEnabled;

                // 如果字幕已启用，尝试手动触发字幕切换以刷新字幕
                if (isSubtitleEnabled) {
                    // 获取视频播放器
                    const player = document.getElementById("movie_player");
                    if (player) {
                        // 切换字幕两次以刷新字幕
                        try {
                            // 使用类型断言，因为 TypeScript 不知道 YouTube 播放器的特定方法
                            const ytPlayer = player as any;
                            if (typeof ytPlayer.toggleSubtitles === "function") {
                                ytPlayer.toggleSubtitles();
                                setTimeout(() => {
                                    ytPlayer.toggleSubtitles();
                                }, 100);
                            }
                        } catch (e) {
                            console.error("切换字幕失败:", e);
                        }
                    }
                }
            }
        }, 2000);
    }

    /**
     * 创建自定义字幕容器
     */
    private createSubtitleContainer() {
        // 隐藏 YouTube 原始字幕
        this.hideYouTubeSubtitles();

        // 创建自定义字幕容器
        this.container = document.createElement("div");
        this.container.id = "acquire-language-subtitle";

        // 设置样式
        this.applySubtitleStyles();

        // 添加到文档
        document.body.appendChild(this.container);

        // 添加字幕悬停事件 - 暂停视频
        this.addSubtitleHoverEvents();
    }

    /**
     * 隐藏 YouTube 原始字幕
     */
    private hideYouTubeSubtitles() {
        console.log("隐藏 YouTube 原始字幕");
        // 添加样式以隐藏原始字幕
        const style = document.createElement("style");
        style.textContent = `
            .ytp-caption-segment {
                opacity: 0 !important;
            }
            .caption-visual-line {
                opacity: 0 !important;
            }
            .captions-text {
                opacity: 0 !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 应用字幕样式
     */
    private applySubtitleStyles() {
        if (!this.container) {
            console.error("字幕容器不存在，无法应用样式");
            return;
        }

        // 获取视频播放器
        const videoPlayer = document.querySelector("video");
        if (!videoPlayer) {
            console.error("找不到视频播放器，无法应用字幕样式");
            return;
        }

        // 获取视频播放器尺寸和位置
        const videoRect = videoPlayer.getBoundingClientRect();

        // 设置字幕容器样式
        const cssText = `
            position: absolute;
            z-index: 1000;
            left: ${videoRect.left}px;
            width: ${videoRect.width}px;
            text-align: center;
            padding: 10px;
            font-family: Arial, sans-serif;
            font-size: ${this.settings.subtitleSettings.fontSize}px;
            color: ${this.settings.subtitleSettings.textColor};
            background-color: ${this.settings.subtitleSettings.backgroundColor};
            opacity: ${this.settings.subtitleSettings.opacity};
            border-radius: 4px;
            transition: opacity 0.3s ease;
            pointer-events: auto;
            user-select: none;
        `;
        this.container.style.cssText = cssText;

        // 根据设置设置字幕位置
        if (this.settings.subtitleSettings.position === "top") {
            this.container.style.top = `${videoRect.top + 10}px`;
        } else {
            // 调整底部位置，避免遮挡控制栏
            // YouTube控制栏高度约为40-45px，我们设置60px的间距以确保不会遮挡
            this.container.style.bottom = `${
                window.innerHeight - videoRect.bottom + 60
            }px`;
        }

        // 监听窗口大小变化，更新字幕位置
        window.addEventListener("resize", () => {
            this.updateSubtitlePosition();
        });

        // 监听视频播放器大小变化
        this.containerObserver = new MutationObserver(() => {
            this.updateSubtitlePosition();
        });

        this.containerObserver.observe(videoPlayer, {
            attributes: true,
            attributeFilter: ["style", "class"],
        });
    }

    /**
     * 更新字幕位置
     */
    private updateSubtitlePosition() {
        if (!this.container) return;

        // 获取视频播放器
        const videoPlayer = document.querySelector("video");
        if (!videoPlayer) return;

        // 获取视频播放器尺寸和位置
        const videoRect = videoPlayer.getBoundingClientRect();

        // 更新字幕容器位置
        this.container.style.left = `${videoRect.left}px`;
        this.container.style.width = `${videoRect.width}px`;

        // 根据设置更新字幕位置
        if (this.settings.subtitleSettings.position === "top") {
            this.container.style.top = `${videoRect.top + 10}px`;
            this.container.style.bottom = "auto";
        } else {
            // 调整底部位置，避免遮挡控制栏
            this.container.style.bottom = `${
                window.innerHeight - videoRect.bottom + 60
            }px`;
            this.container.style.top = "auto";
        }
    }

    /**
     * 添加字幕悬停事件 - 暂停视频
     */
    private addSubtitleHoverEvents() {
        if (!this.container) return;

        // 记录视频播放状态
        let wasPlaying = false;

        // 鼠标进入字幕区域时暂停视频
        this.container.addEventListener("mouseenter", () => {
            const video = document.querySelector("video");
            if (video) {
                wasPlaying = !video.paused;
                if (wasPlaying) {
                    video.pause();
                }
            }
        });

        // 鼠标离开字幕区域时恢复视频播放
        this.container.addEventListener("mouseleave", () => {
            const video = document.querySelector("video");
            if (video && wasPlaying) {
                video.play();
                wasPlaying = false;
            }
        });
    }

    /**
     * listen to the event sent by content script
     */
    private listenToBackgroundScript() {

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === "ACQ_SUBTITLE_FETCHED") {
                const {url, lang, videoId, response} = message.data;
                console.log("Get subtitle from background script", url, lang, videoId);
                // TODO: change subtitle format by change param fmt=srv3 to fmt=json3
                // or using separate function to parse subtitle
                // 解析字幕
                this.parseSubtitle(response);

                // 启用字幕
                this.subtitleEnabled = true;

                // 显示字幕容器
                if (this.container) {
                    this.container.style.display = "block";
                } else {
                    console.error("字幕容器不存在，无法显示");
                }

            }

            return true;
        });

        // 添加一个方法来手动检查字幕状态
        const checkSubtitleStatus = () => {
            const subsToggleElement = document.querySelector(".ytp-subtitles-button");

            if (subsToggleElement) {
                const isSubtitleEnabled =
                    subsToggleElement.getAttribute("aria-pressed") === "true";

                // 如果字幕状态变化
                if (this.subtitleEnabled !== isSubtitleEnabled) {
                    this.subtitleEnabled = isSubtitleEnabled;

                    // 如果字幕被禁用，清空字幕显示
                    if (!isSubtitleEnabled && this.container) {
                        this.container.innerHTML = "";
                        this.container.style.display = "none";
                    } else if (isSubtitleEnabled && this.container) {
                        // 如果字幕被启用，显示字幕容器
                        this.container.style.display = "block";

                        // 如果有字幕数据但没有显示，尝试重新显示
                        if (
                            this.subtitleData.length > 0 &&
                            this.container.innerHTML === ""
                        ) {
                            this.checkCurrentTime();
                        }
                    }
                }
            }
        };

        // 定期检查字幕状态，降低频率到 2 秒一次
        setInterval(checkSubtitleStatus, 2000);
        console.log("已设置定期检查字幕状态");
    }

    private parseSubtitle(response: string) {
        if (response.includes("fmt=srv3") || response.includes("fmt=json3")) {
            this.parseJsonSubtitle(response);
        } else if (response.includes("fmt=vtt")) {
            this.parseVTT(response);
        }

        // 输出前5条字幕内容用于调试
        if (this.subtitleData.length > 0) {
            console.log("前5条字幕内容:");
            for (let i = 0; i < Math.min(5, this.subtitleData.length); i++) {
                console.log(
                    `[${i}] ${this.subtitleData[i].start}-${this.subtitleData[i].end}: ${this.subtitleData[i].text}`
                );
            }
        }
    }

    /**
     * 获取字幕内容
     * @param url 字幕URL
     */
    private async fetchSubtitle(url: string) {
        try {
            // 检查是否已经缓存了这个字幕
            const cacheKey = `subtitle:${url}`;
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                try {
                    this.subtitleData = JSON.parse(cachedData);
                    this.currentSubtitleIndex = -1;
                    return;
                } catch (e) {
                    console.error("解析缓存的字幕数据失败:", e);
                }
            }

            // 使用 background 脚本获取字幕内容，避免跨域问题
            const response = await new Promise<any>((resolve, reject) => {
                chrome.runtime.sendMessage(
                    {type: "fetchSubtitle", url},
                    (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else if (response.error) {
                            reject(new Error(response.error));
                        } else {
                            resolve(response);
                        }
                    }
                );
            });

            if (!response.data) {
                throw new Error("获取字幕失败: 没有返回数据");
            }

            const subtitleContent = response.data;

            // 解析字幕内容
            if (url.includes("fmt=srv3") || url.includes("fmt=json3")) {
                // JSON 格式字幕
                this.parseJsonSubtitle(subtitleContent);
            } else if (url.includes("fmt=vtt")) {
                // WebVTT 格式字幕
                this.subtitleData = this.parseVTT(subtitleContent);
            } else {
                // 默认尝试解析为 JSON，如果失败则尝试解析为 WebVTT
                try {
                    this.parseJsonSubtitle(subtitleContent);
                } catch (e) {
                    this.subtitleData = this.parseVTT(subtitleContent);
                }
            }

            // 输出前5条字幕内容用于调试
            if (this.subtitleData.length > 0) {
                console.log("前5条字幕内容:");
                for (let i = 0; i < Math.min(5, this.subtitleData.length); i++) {
                    console.log(
                        `[${i}] ${this.subtitleData[i].start}-${this.subtitleData[i].end}: ${this.subtitleData[i].text}`
                    );
                }
            }

            // 缓存字幕数据到 sessionStorage
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(this.subtitleData));
            } catch (e) {
                console.warn("缓存字幕数据失败:", e);
            }

            // 重置当前字幕索引
            this.currentSubtitleIndex = -1;
        } catch (error) {
            console.error("获取字幕失败:", error);
        }
    }

    /**
     * 解析 JSON 格式字幕
     * @param jsonContent JSON 字幕内容
     */
    private parseJsonSubtitle(jsonContent: string) {
        try {
            // 解析 JSON
            const data = JSON.parse(jsonContent);

            // 检查是否有字幕数据
            if (!data.events) {
                return;
            }

            // 清空字幕数据
            this.subtitleData = [];

            // 解析字幕数据
            for (const event of data.events) {
                // 跳过没有文本的事件
                if (!event.segs) continue;

                // 获取开始时间和持续时间
                const start = event.tStartMs || 0;
                const duration = event.dDurationMs || 0;
                const end = start + duration;

                // 拼接文本
                let text = "";
                for (const seg of event.segs) {
                    if (seg.utf8) {
                        text += seg.utf8;
                    }
                }

                // 跳过空文本
                if (!text.trim()) continue;

                // 添加到字幕数据
                this.subtitleData.push({
                    start,
                    end,
                    text: text.trim(),
                });
            }
        } catch (error) {
            console.error("解析 JSON 字幕失败:", error);
        }
    }

    /**
     * 解析 VTT 字幕
     * @param vttContent VTT 字幕内容
     * @returns 解析后的字幕数据
     */
    private parseVTT(vttContent: string): SubtitleItem[] {
        const subtitles: SubtitleItem[] = [];

        // 按行分割
        const lines = vttContent.split("\n");

        let currentSubtitle: Partial<SubtitleItem> | null = null;

        // 跳过 WEBVTT 头部
        let i = 0;
        while (i < lines.length && !lines[i].includes("-->")) {
            i++;
        }

        // 解析字幕
        for (; i < lines.length; i++) {
            const line = lines[i].trim();

            // 空行表示一个字幕的结束
            if (line === "") {
                if (currentSubtitle && currentSubtitle.text) {
                    subtitles.push(currentSubtitle as SubtitleItem);
                }
                currentSubtitle = null;
                continue;
            }

            // 解析时间戳行
            if (line.includes("-->")) {
                const [startTime, endTime] = this.parseTimeLine(line);
                currentSubtitle = {
                    start: startTime,
                    end: endTime,
                    text: "",
                };
                continue;
            }

            // 解析文本行
            if (currentSubtitle) {
                if (currentSubtitle.text) {
                    currentSubtitle.text += " " + line;
                } else {
                    currentSubtitle.text = line;
                }
            }
        }

        // 添加最后一个字幕
        if (currentSubtitle && currentSubtitle.text) {
            subtitles.push(currentSubtitle as SubtitleItem);
        }

        return subtitles;
    }

    /**
     * 解析时间戳行
     * @param line 时间戳行，如 "00:00:10.500 --> 00:00:13.000"
     * @returns [开始时间（毫秒）, 结束时间（毫秒）]
     */
    private parseTimeLine(line: string): [number, number] {
        const parts = line.split("-->").map((part) => part.trim());
        if (parts.length !== 2) {
            return [0, 0];
        }

        return [
            this.timeToMilliseconds(parts[0]),
            this.timeToMilliseconds(parts[1].split(" ")[0]), // 去除可能的样式设置
        ];
    }

    /**
     * 将时间字符串转换为毫秒
     * @param timeStr 时间字符串，如 "00:00:10.500"
     * @returns 毫秒
     */
    private timeToMilliseconds(timeStr: string): number {
        // 处理 VTT 格式的时间戳
        const parts = timeStr.split(":");

        if (parts.length === 3) {
            // 格式: 00:00:10.500
            const [hours, minutes, seconds] = parts;
            const [secondsInt, millisecondsStr] = seconds.split(".");
            const milliseconds = millisecondsStr
                ? parseInt(millisecondsStr.padEnd(3, "0").substring(0, 3))
                : 0;

            return (
                parseInt(hours) * 3600000 +
                parseInt(minutes) * 60000 +
                parseInt(secondsInt) * 1000 +
                milliseconds
            );
        } else if (parts.length === 2) {
            // 格式: 00:10.500
            const [minutes, seconds] = parts;
            const [secondsInt, millisecondsStr] = seconds.split(".");
            const milliseconds = millisecondsStr
                ? parseInt(millisecondsStr.padEnd(3, "0").substring(0, 3))
                : 0;

            return (
                parseInt(minutes) * 60000 + parseInt(secondsInt) * 1000 + milliseconds
            );
        }

        return 0;
    }

    /**
     * 开始定期检查视频时间，更新当前字幕
     */
    private startPeriodicCheck() {
        // 清除之前的定时器
        if (this.checkIntervalId !== null) {
            cancelAnimationFrame(this.checkIntervalId as unknown as number);
        }

        // 上次检查的时间戳
        let lastCheckTime = 0;
        // 目标检查间隔（毫秒）
        const targetInterval = 60; // 约 16.7fps，足够流畅且不会过度消耗资源

        // 使用 requestAnimationFrame 代替 setInterval，提高性能和精确度
        const checkFrame = (timestamp: number) => {
            // 计算距离上次检查的时间
            const elapsed = timestamp - lastCheckTime;

            // 如果距离上次检查的时间超过目标间隔，执行检查
            if (elapsed >= targetInterval) {
                this.checkCurrentTime();
                lastCheckTime = timestamp;
            }

            // 继续下一帧检查
            if (this.checkIntervalId !== null) {
                requestAnimationFrame(checkFrame);
            }
        };

        // 启动帧检查
        this.checkIntervalId = window.requestAnimationFrame(
            checkFrame
        ) as unknown as number;
    }

    /**
     * 检查当前视频时间，更新字幕
     */
    private checkCurrentTime() {
        // 如果字幕被禁用或没有字幕数据，不更新字幕
        if (!this.subtitleEnabled) {
            return;
        }

        if (this.subtitleData.length === 0) {
            return;
        }

        // 获取视频播放器
        const videoPlayer = document.querySelector("video");
        if (!videoPlayer) {
            return;
        }

        // 获取当前时间（毫秒），并应用偏移量
        const currentTime = videoPlayer.currentTime * 1000;
        const adjustedTime = currentTime - this.timeOffset;

        // 查找当前时间对应的字幕索引
        const index = this.findSubtitleIndex(adjustedTime);

        // 如果索引没有变化，不更新字幕
        if (index === this.currentSubtitleIndex) return;

        // 如果启用了自适应偏移，并且索引变化了，记录当前时间用于自适应调整
        if (
            this.adaptiveOffset &&
            index !== -1 &&
            this.currentSubtitleIndex !== -1
        ) {
            const now = performance.now();
            const subtitle = this.subtitleData[index];

            // 如果是第一次切换或者距离上次切换超过1秒，才进行调整
            if (
                this.lastSubtitleChangeTime > 0 &&
                now - this.lastSubtitleChangeTime < 1000
            ) {
                // 计算实际切换时间与预期切换时间的差值
                const expectedSwitchTime = subtitle.start;
                const actualSwitchTime = currentTime;
                const difference = actualSwitchTime - expectedSwitchTime;

                // 如果差值超过100ms，调整偏移量
                if (Math.abs(difference) > 100) {
                    // 逐渐调整偏移量，避免剧烈变化
                    this.timeOffset = Math.round(
                        this.timeOffset * 0.8 + difference * 0.2
                    );
                }
            }

            this.lastSubtitleChangeTime = now;
        }

        // 更新当前字幕索引
        this.currentSubtitleIndex = index;

        // 如果没有找到字幕，清空字幕显示
        if (index === -1) {
            this.updateSubtitle("");
            return;
        }

        // 获取字幕文本
        const subtitle = this.subtitleData[index];

        // 更新字幕显示
        this.updateSubtitle(subtitle.text);

        // 触发字幕变化事件
        window.dispatchEvent(
            new CustomEvent("acquireLanguageSubtitleChanged", {
                detail: {text: subtitle.text},
            })
        );
    }

    /**
     * 查找当前时间对应的字幕索引
     * @param currentTime 当前视频时间（毫秒）
     * @returns 字幕索引，如果没有找到则返回 -1
     */
    private findSubtitleIndex(currentTime: number): number {
        // 如果没有字幕数据，返回 -1
        if (this.subtitleData.length === 0) return -1;

        // 如果当前索引有效，先检查当前索引是否仍然匹配
        if (
            this.currentSubtitleIndex >= 0 &&
            this.currentSubtitleIndex < this.subtitleData.length
        ) {
            const current = this.subtitleData[this.currentSubtitleIndex];
            if (currentTime >= current.start && currentTime <= current.end) {
                return this.currentSubtitleIndex;
            }

            // 检查下一个字幕（预测性查找，假设字幕是按时间顺序排列的）
            if (this.currentSubtitleIndex + 1 < this.subtitleData.length) {
                const next = this.subtitleData[this.currentSubtitleIndex + 1];
                if (currentTime >= next.start && currentTime <= next.end) {
                    return this.currentSubtitleIndex + 1;
                }

                // 如果当前时间在下一个字幕的开始时间之前，但很接近（200ms内），提前显示下一个字幕
                if (currentTime < next.start && next.start - currentTime < 200) {
                    return this.currentSubtitleIndex + 1;
                }
            }

            // 如果当前时间超过了当前字幕的结束时间，尝试查找下一个合适的字幕
            // 这种情况通常发生在快进或跳转时
            if (currentTime > current.end) {
                // 从当前索引开始向后查找
                for (
                    let i = this.currentSubtitleIndex + 1;
                    i < this.subtitleData.length;
                    i++
                ) {
                    const subtitle = this.subtitleData[i];
                    // 如果找到匹配的字幕，或者当前时间接近下一个字幕的开始时间
                    if (
                        (currentTime >= subtitle.start && currentTime <= subtitle.end) ||
                        (currentTime < subtitle.start && subtitle.start - currentTime < 200)
                    ) {
                        return i;
                    }
                    // 如果已经超过了当前时间很多，停止查找
                    if (subtitle.start > currentTime + 5000) break;
                }
            } else if (currentTime < current.start) {
                // 从当前索引开始向前查找
                for (let i = this.currentSubtitleIndex - 1; i >= 0; i--) {
                    const subtitle = this.subtitleData[i];
                    if (currentTime >= subtitle.start && currentTime <= subtitle.end) {
                        return i;
                    }
                    // 如果已经小于当前时间很多，停止查找
                    if (subtitle.end < currentTime - 5000) break;
                }
            }
        }

        // 使用二分查找算法快速定位字幕
        let low = 0;
        let high = this.subtitleData.length - 1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const subtitle = this.subtitleData[mid];

            if (currentTime < subtitle.start) {
                // 如果当前时间接近字幕开始时间（200ms内），提前显示该字幕
                if (subtitle.start - currentTime < 200) {
                    return mid;
                }
                high = mid - 1;
            } else if (currentTime > subtitle.end) {
                low = mid + 1;
            } else {
                // 找到匹配的字幕
                return mid;
            }
        }

        // 没有找到匹配的字幕，但检查是否接近下一个字幕
        if (low < this.subtitleData.length) {
            const nextSubtitle = this.subtitleData[low];
            // 如果当前时间接近下一个字幕的开始时间（200ms内），提前显示该字幕
            if (nextSubtitle.start - currentTime < 200) {
                return low;
            }
        }

        // 没有找到匹配的字幕
        return -1;
    }

    /**
     * 更新字幕
     * @param text 字幕文本
     */
    updateSubtitle(text: string = ""): void {
        // 如果字幕没有变化，则不更新
        if (text === this._currentSubtitle) {
            return;
        }

        // 更新当前字幕
        this._currentSubtitle = text;

        // 如果没有容器或字幕被禁用，不更新DOM
        if (!this.container) {
            console.error("字幕容器不存在，无法更新字幕");
            return;
        }

        if (!this.subtitleEnabled) {
            return;
        }

        // 处理字幕
        const processedText = this.processSubtitle(text);

        // 使用 requestAnimationFrame 优化DOM更新，减少重排
        requestAnimationFrame(() => {
            // 更新字幕容器
            if (this.container) {
                this.container.innerHTML = processedText;

                // 添加单词点击事件
                if (processedText) {
                    this.addWordClickEvents();
                }
            } else {
                console.error("字幕容器不存在，无法更新DOM");
            }
        });
    }

    /**
     * 处理字幕文本
     * @param text 原始字幕文本
     * @returns 处理后的字幕文本
     */
    processSubtitle(text: string): string {
        if (!text) return "";

        // 使用缓存优化，避免重复处理相同的文本
        const cacheKey = `processed:${text}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            return cached;
        }

        // 分割文本为单词
        const words = text.split(/(\s+|[,.!?;:'"()[\]{}])/);

        // 处理每个单词
        const processedWords = words.map((word) => {
            // 跳过空白字符和标点符号
            if (!word.trim() || /^[,.!?;:'"()[\]{}]$/.test(word)) {
                return word;
            }

            // 将单词包装在可点击的 span 中
            return `<span class="acquire-language-word" data-word="${word}">${word}</span>`;
        });

        // 合并处理后的单词
        const result = processedWords.join("");

        // 缓存处理结果
        try {
            sessionStorage.setItem(cacheKey, result);
        } catch (e) {
            // 忽略存储错误
        }

        return result;
    }

    /**
     * 添加单词点击事件
     */
    addWordClickEvents() {
        if (!this.container) return;

        // 获取所有单词元素
        const wordElements = this.container.querySelectorAll(
            ".acquire-language-word"
        );

        // 为每个单词添加点击事件
        wordElements.forEach((element: Element) => {
            element.addEventListener("click", async (event: Event) => {
                // 阻止事件冒泡
                event.stopPropagation();

                // 获取单词和位置
                const word = element.getAttribute("data-word") || "";
                const rect = element.getBoundingClientRect();
                const position = {
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY + 10,
                };

                // 显示加载状态
                this.wordPopup.showLoading(word, position);

                // 获取单词释义
                try {
                    // 调用 AI 服务获取释义
                    const definition = await this.aiService.getWordDefinition(
                        word,
                        this._currentSubtitle,
                        this.settings.targetLanguage
                    );

                    // 显示单词释义
                    this.wordPopup.show(word, definition, position);
                } catch (error: any) {
                    console.error("获取单词释义失败:", error);
                    this.wordPopup.show(word, `获取释义失败: ${error.message}`, position);
                }
            });
        });
    }

    /**
     * 销毁字幕处理器
     */
    destroy() {
        // 停止定期检查
        if (this.checkIntervalId !== null) {
            cancelAnimationFrame(this.checkIntervalId as unknown as number);
            this.checkIntervalId = null;
        }

        // 停止监听视频播放器大小变化
        if (this.containerObserver) {
            this.containerObserver.disconnect();
            this.containerObserver = null;
        }

        // 调用基类的销毁方法
        super.destroy();
    }

    /**
     * 尝试预加载字幕
     */
    private tryPreloadSubtitles() {
        // 延迟执行，确保页面已完全加载
        setTimeout(() => {
            // 获取视频ID
            const videoId = this.getVideoIdFromUrl(window.location.href);
            if (!videoId) {
                return;
            }

            // 模拟点击字幕按钮以触发字幕加载
            const subsToggleElement = document.querySelector(".ytp-subtitles-button");
            if (subsToggleElement) {
                const isSubtitleEnabled =
                    subsToggleElement.getAttribute("aria-pressed") === "true";

                if (!isSubtitleEnabled) {
                    // 如果字幕未启用，尝试点击按钮启用字幕
                    try {
                        (subsToggleElement as HTMLElement).click();

                        // 2秒后再次点击，恢复原始状态（如果用户不想要字幕）
                        setTimeout(() => {
                            if (!this.subtitleData.length) {
                                // 如果没有加载到字幕数据，恢复原始状态
                                (subsToggleElement as HTMLElement).click();
                            } else {
                            }
                        }, 2000);
                    } catch (e) {
                        console.error("点击字幕按钮失败:", e);
                    }
                } else {
                    console.log("字幕已启用，无需预加载");
                }
            } else {
                console.log("找不到字幕按钮，无法预加载字幕");
            }
        }, 3000);
        console.log("已设置预加载字幕定时器");
    }

    /**
     * 从URL中获取视频ID
     */
    private getVideoIdFromUrl(url: string): string | null {
        try {
            const urlObj = new URL(url);
            return urlObj.searchParams.get("v");
        } catch (e) {
            console.error("解析URL失败:", e);
            return null;
        }
    }
}
