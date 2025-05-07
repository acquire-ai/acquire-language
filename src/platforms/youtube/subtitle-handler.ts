/**
 * YouTube Subtitle Handler
 *
 * This class is responsible for getting YouTube subtitles and displaying them in a more beautiful way.
 * It uses webRequest to intercept YouTube's subtitle requests and get the complete subtitle data.
 */
import { BaseSubtitleHandler } from '../base/subtitle-handler';
import { AIService } from '@/core/types/ai.ts';

interface SubtitleItem {
    start: number;
    end: number;
    text: string;
}

export class YouTubeSubtitleHandler extends BaseSubtitleHandler {
    private containerObserver: MutationObserver | null = null;
    private subtitleData: SubtitleItem[] = [];
    private checkIntervalId: number | null = null;
    private matchIndices: number[] = [];
    private newestIndex: number = -1;

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
        const style = document.createElement('style');
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

        this.container.addEventListener('mouseenter', () => {
            const video = document.querySelector('video');
            if (video) {
                wasPlaying = !video.paused;
                if (wasPlaying) {
                    video.pause();
                }
            }
        });

        this.container.addEventListener('mouseleave', () => {
            const video = document.querySelector('video');
            if (video && wasPlaying) {
                video.play();
                wasPlaying = false;
            }
        });
    }

    private listenToBackgroundScript() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'ACQ_SUBTITLE_FETCHED') {
                const { url, lang, videoId, response } = message.data;
                console.log('Get subtitle from background script', url, lang, videoId);
                this.parseSubtitle(response);
                console.log('Subtitle data length:', this.subtitleData.length);
                this.subtitleEnabled = true;
            }

            return true;
        });

        // check if subtitle is enabled, if not, update subtitleEnabled state
        const checkSubtitleStatus = () => {
            const subsToggleElement = document.querySelector('.ytp-subtitles-button');

            if (subsToggleElement) {
                const isSubtitleEnabled = subsToggleElement.getAttribute('aria-pressed') === 'true';

                if (this.subtitleEnabled !== isSubtitleEnabled) {
                    this.subtitleEnabled = isSubtitleEnabled;

                    if (isSubtitleEnabled && this.subtitleData.length > 0) {
                        this.syncSubtitleWithVideoTime();
                    }
                }
            }
        };

        // Check subtitle status periodically, every 100ms
        setInterval(checkSubtitleStatus, 100);
    }

    private parseSubtitle(response: string) {
        this.subtitleData = this.parseJsonSubtitle(response);
        if (!this.subtitleData || this.subtitleData.length === 0) {
            console.warn('Subtitle parsing result is empty');
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

                let text = '';
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
            console.error('Failed to parse json subtitle:', error);
            return [];
        }
    }

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

        const videoPlayer = document.querySelector('video');
        if (!videoPlayer) return;

        const currentTime = videoPlayer.currentTime * 1000;
        this.matchIndices = this.findSubtitleIndices(currentTime);

        let subtitleTexts: string[] = [];
        if (this.matchIndices.length === 0) {
            this.subtitles = [];
            return;
        }
        // This for adopt the YouTube auto-generated subtitle
        // When it matches multiple subtitles, it will base one the newest one
        // that means it is the speaking one.
        this.newestIndex = this.matchIndices[this.matchIndices.length - 1];

        subtitleTexts.push(this.subtitleData[this.newestIndex].text);
        subtitleTexts = this.addCrossSubtitle(this.newestIndex, subtitleTexts);

        this.subtitles = subtitleTexts;
    }

    // some subtitles the timestamp is cross, that means the subtitle is not finished yet
    // added for easy to read
    private addCrossSubtitle(currIndex: number, subtitleTexts: string[]) {
        const currSubtitle = this.subtitleData[currIndex];
        const nextIndex = currIndex + 1;
        if (nextIndex < this.subtitleData.length) {
            const nextSubtitle = this.subtitleData[nextIndex];
            if (nextSubtitle.start < currSubtitle.end) {
                subtitleTexts.push(nextSubtitle.text);
            }
        }
        return subtitleTexts;
    }

    private findSubtitleIndices(currentTime: number): number[] {
        return this.subtitleData.reduce(
            (indices: number[], sub: SubtitleItem, index: number): number[] => {
                if (currentTime >= sub.start && currentTime < sub.end) {
                    indices.push(index);
                }
                return indices;
            },
            [],
        );
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
