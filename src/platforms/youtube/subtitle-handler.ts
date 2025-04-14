/**
 * YouTube Subtitle Handler
 *
 * This class is responsible for getting YouTube subtitles and displaying them in a more beautiful way.
 * It uses webRequest to intercept YouTube's subtitle requests and get the complete subtitle data.
 */
import {BaseSubtitleHandler} from "../base/subtitle-handler";
import {AIService} from "@/core/types/ai.ts";


interface SubtitleItem {
    start: number;
    end: number;
    text: string;
}

export class YouTubeSubtitleHandler extends BaseSubtitleHandler {
    private containerObserver: MutationObserver | null = null;
    private subtitleEnabled: boolean = false;
    private subtitleData: SubtitleItem[] = [];
    private checkIntervalId: number | null = null;
    private currIndices: number[] = [];
    private currSubtitleText: string = "";

    constructor(aiService: AIService) {
        super(aiService);
    }

    /**
     * Initialize subtitle handler
     */
    async initialize(): Promise<void> {
        await this.loadSettings();
        this.hideYouTubeSubtitles();
        
        super.createSubtitleContainer();
        
        this.setupYouTubeSubtitles();
        
        this.listenToBackgroundScript();
        this.startPeriodicCheck();
    }

    private setupYouTubeSubtitles() {
        this.addSubtitleHoverEvents();
    }

    private hideYouTubeSubtitles() {
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
     * Add subtitle hover events - pause video
     */
    private addSubtitleHoverEvents() {
        if (!this.container) return;

        let wasPlaying = false;

        this.container.addEventListener("mouseenter", () => {
            const video = document.querySelector("video");
            if (video) {
                wasPlaying = !video.paused;
                if (wasPlaying) {
                    video.pause();
                }
            }
        });

        this.container.addEventListener("mouseleave", () => {
            const video = document.querySelector("video");
            if (video && wasPlaying) {
                video.play();
                wasPlaying = false;
            }
        });
    }

    private listenToBackgroundScript() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === "ACQ_SUBTITLE_FETCHED") {
                const {url, lang, videoId, response} = message.data;
                console.log("Get subtitle from background script", url, lang, videoId);
                this.parseSubtitle(response);
                console.log("Subtitle data length:", this.subtitleData.length);
                this.subtitleEnabled = true;

                if (this.container) {
                    this.container.style.display = "block";
                } else {
                    console.error("Subtitle container does not exist, cannot display");
                }

            }

            return true;
        });

        // check if subtitle is enabled, if not, hide subtitle container
        const checkSubtitleStatus = () => {
            const subsToggleElement = document.querySelector(".ytp-subtitles-button");

            if (subsToggleElement) {
                const isSubtitleEnabled =
                    subsToggleElement.getAttribute("aria-pressed") === "true";

                if (this.subtitleEnabled !== isSubtitleEnabled) {
                    this.subtitleEnabled = isSubtitleEnabled;

                    if (!isSubtitleEnabled && this.container) {
                        this.container.innerHTML = "";
                        this.container.style.display = "none";
                    } else if (isSubtitleEnabled && this.container) {
                        this.container.style.display = "block";

                        if (
                            this.subtitleData.length > 0 &&
                            this.container.innerHTML === ""
                        ) {
                            this.syncSubtitleWithVideoTime();
                        }
                    }
                }
            }
        };

        // Check subtitle status periodically, every 100ms
        setInterval(checkSubtitleStatus, 100);
    }

    private parseSubtitle(response: string) {
        this.subtitleData  = this.parseJsonSubtitle(response);
        if (!this.subtitleData || this.subtitleData.length === 0) {
            console.warn("Subtitle parsing result is empty");
        }
    }

    /**
     * Parse JSON format subtitles
     * @param jsonContent JSON subtitle content
     */
    private parseJsonSubtitle(jsonContent: string): SubtitleItem[] {
        try {
            const data = JSON.parse(jsonContent);

            if (!data.events) {
                return [];
            }

            const subtitles: SubtitleItem[] = [];

            for (const event of data.events) {
                if (!event.segs) continue;

                const start = event.tStartMs || 0;
                const duration = event.dDurationMs || 0;
                const end = start + duration;

                let text = "";
                for (const seg of event.segs) {
                    if (seg.utf8) {
                        text += seg.utf8;
                    }
                }

                if (!text.trim()) continue;

                subtitles.push({
                    start,
                    end,
                    text,
                });
            }
            
            return subtitles;
        } catch (error) {
            console.error("Failed to parse json subtitle:", error);
            return [];
        }
    }

    /**
     * Start periodic check of video time to update current subtitle
     */
    private startPeriodicCheck() {
        // Clear previous timer
        if (this.checkIntervalId !== null) {
            cancelAnimationFrame(this.checkIntervalId as unknown as number);
        }

        // Use requestAnimationFrame for more precise synchronization
        const checkFrame = (timestamp: number) => {
            this.syncSubtitleWithVideoTime();
            if (this.checkIntervalId !== null) {
                requestAnimationFrame(checkFrame);
            }
        };

        // Start frame check
        this.checkIntervalId = window.requestAnimationFrame(checkFrame) as unknown as number;
    }

    /**
     * Check current video time and update subtitle
     */
    private syncSubtitleWithVideoTime() {
        if (!this.subtitleEnabled || this.subtitleData.length === 0) {
            return;
        }

        const videoPlayer = document.querySelector("video");
        if (!videoPlayer) return;
        
        const currentTime = videoPlayer.currentTime * 1000;
        this.currIndices = this.findSubtitleIndices(currentTime);

        if (this.currIndices.length >= 2) {
            this.currSubtitleText = this.currIndices.map(index => this.subtitleData[index].text).join("\n");
        } else if (this.currIndices.length === 1) {
            this.currSubtitleText = this.subtitleData[this.currIndices[0]].text;
            // do need next subtitle
            const currSubtitle = this.subtitleData[this.currIndices[0]];
            const nextIndex = this.currIndices[0] + 1;
            if (nextIndex < this.subtitleData.length) {
                const nextSubtitle = this.subtitleData[nextIndex];
                if (nextSubtitle.start <= currSubtitle.end) {
                    this.currSubtitleText += "\n" + nextSubtitle.text;
                }
            }
        } else {
            this.currSubtitleText = "";
        }

        const processedText = this.processSubtitle(this.currSubtitleText);
        // 调用基类的方法来更新字幕
        super.updateSubtitle(processedText);
    }

    private findSubtitleIndices(currentTime: number): number[] {
        return this.subtitleData.reduce((indices: number[], sub:SubtitleItem, index:number):number[] => {
            if (currentTime >= sub.start && currentTime <= sub.end) {
                indices.push(index);
            }
            return indices;
        }, []);
    }

    updateSubtitle(text: string = ""): void {
        if (text === this._currentSubtitle) {
            return;
        }

        const processedText = this.processSubtitle(text);
        // 调用基类的方法
        super.updateSubtitle(processedText);
    }

    /**
     * Process subtitle text
     * @param text Original subtitle text
     * @returns Processed subtitle text
     */
    processSubtitle(text: string): string {
        // 只需简单处理文本，不需要添加 HTML 标签，因为 React 组件会处理单词点击
        if (!text) return "";
        return text;
    }

    /**
     * Destroy subtitle handler
     */
    destroy() {
        // Stop periodic check
        if (this.checkIntervalId !== null) {
            cancelAnimationFrame(this.checkIntervalId as unknown as number);
            this.checkIntervalId = null;
        }

        // Stop listening for video player size changes
        if (this.containerObserver) {
            this.containerObserver.disconnect();
            this.containerObserver = null;
        }

        super.destroy();
    }

}
