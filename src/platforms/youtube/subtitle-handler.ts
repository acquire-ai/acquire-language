/**
 * YouTube Subtitle Handler
 *
 * This class is responsible for getting YouTube subtitles and displaying them in a more beautiful way.
 * It uses webRequest to intercept YouTube's subtitle requests and get the complete subtitle data.
 */
import {BaseSubtitleHandler} from "../base/subtitle-handler";
import {AIService} from "@/core/types/ai.ts";

// Subtitle item interface
interface SubtitleItem {
    start: number;
    end: number;
    text: string;
}

export class YouTubeSubtitleHandler extends BaseSubtitleHandler {
    private containerObserver: MutationObserver | null = null;
    private subtitleEnabled: boolean = false;
    private subtitleData: any[] = [];
    private checkIntervalId: number | null = null;
    private currentSubtitleIndex: number = -1;

    constructor(aiService: AIService) {
        super(aiService);
    }

    /**
     * Initialize subtitle handler
     */
    async initialize(): Promise<void> {
        await this.loadSettings();

        this.createSubtitleContainer();

        this.listenToBackgroundScript();

        this.startPeriodicCheck();

    }


    /**
     * Create custom subtitle container
     */
    private createSubtitleContainer() {
        // Hide YouTube original subtitles
        this.hideYouTubeSubtitles();

        // Create custom subtitle container
        this.container = document.createElement("div");
        this.container.id = "acquire-language-subtitle";

        // Set styles
        this.applySubtitleStyles();

        // Add to document
        document.body.appendChild(this.container);

        // Add subtitle hover events - pause video
        this.addSubtitleHoverEvents();
    }

    /**
     * Hide YouTube original subtitles
     */
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
     * Apply subtitle styles
     */
    private applySubtitleStyles() {
        if (!this.container) {
            console.error("Subtitle container does not exist, cannot apply styles");
            return;
        }

        // Get video player
        const videoPlayer = document.querySelector("video");
        if (!videoPlayer) {
            console.error("Cannot find video player, cannot apply subtitle styles");
            return;
        }

        // Get video player dimensions and position
        const videoRect = videoPlayer.getBoundingClientRect();

        // Set subtitle container styles
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

        // Set subtitle position based on settings
        if (this.settings.subtitleSettings.position === "top") {
            this.container.style.top = `${videoRect.top + 10}px`;
        } else {
            // YouTube control bar height is about 40-45px, we set 60px spacing to ensure no overlap
            this.container.style.bottom = `${
                window.innerHeight - videoRect.bottom + 60
            }px`;
        }

        // Listen for window resize events to update subtitle position
        window.addEventListener("resize", () => {
            this.updateSubtitlePosition();
        });

        // Listen for video player size changes
        this.containerObserver = new MutationObserver(() => {
            this.updateSubtitlePosition();
        });

        this.containerObserver.observe(videoPlayer, {
            attributes: true,
            attributeFilter: ["style", "class"],
        });
    }

    /**
     * Update subtitle position
     */
    private updateSubtitlePosition() {
        if (!this.container) return;

        // Get video player
        const videoPlayer = document.querySelector("video");
        if (!videoPlayer) return;

        // Get video player dimensions and position
        const videoRect = videoPlayer.getBoundingClientRect();

        // Update subtitle container position
        this.container.style.left = `${videoRect.left}px`;
        this.container.style.width = `${videoRect.width}px`;

        // Update subtitle position based on settings
        if (this.settings.subtitleSettings.position === "top") {
            this.container.style.top = `${videoRect.top + 10}px`;
            this.container.style.bottom = "auto";
        } else {
            // Adjust bottom position to avoid overlapping with control bar
            this.container.style.bottom = `${
                window.innerHeight - videoRect.bottom + 60
            }px`;
            this.container.style.top = "auto";
        }
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

    /**
     * Listen to the event sent by content script
     */
    private listenToBackgroundScript() {

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === "ACQ_SUBTITLE_FETCHED") {
                const {url, lang, videoId, response} = message.data;
                console.log("Get subtitle from background script", url, lang, videoId);
                this.parseSubtitle(response);

                // Enable subtitles
                this.subtitleEnabled = true;

                // Show subtitle container
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
                            this.checkCurrentTime();
                        }
                    }
                }
            }
        };

        // Check subtitle status periodically, every 100ms
        setInterval(checkSubtitleStatus, 100);
        console.log("Periodic subtitle status check set up");
    }

    private parseSubtitle(response: string) {
        this.subtitleData  = this.parseJsonSubtitle(response);
        if (this.subtitleData  && this.subtitleData .length > 0) {
            console.log(`Parsing successful, got ${this.subtitleData.length} subtitle entries`);
        } else {
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
                    text: text.trim(),
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
            this.checkCurrentTime();
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
    private checkCurrentTime() {
        console.log("Checking current time, updating subtitle");
        if (!this.subtitleEnabled || this.subtitleData.length === 0) {
            return;
        }

        const videoPlayer = document.querySelector("video");
        if (!videoPlayer) return;
        
        if (videoPlayer.paused) {
            return;
        }

        const currentTime = videoPlayer.currentTime * 1000;

        // Find subtitle index for current time
        const index = this.findSubtitleIndex(currentTime);

        // If index hasn't changed, don't update subtitle
        if (index === this.currentSubtitleIndex) return;

        // Update current subtitle index
        this.currentSubtitleIndex = index;

        // If no subtitle found, clear subtitle display
        if (index === -1) {
            this.updateSubtitle("");
            return;
        }

        // Get subtitle text
        const subtitle = this.subtitleData[index];

        // Update subtitle display
        this.updateSubtitle(subtitle.text);

        // Trigger subtitle change event
        window.dispatchEvent(
            new CustomEvent("acquireLanguageSubtitleChanged", {
                detail: { text: subtitle.text },
            })
        );
    }

    private findSubtitleIndex(currentTime: number): number {
        if (this.subtitleData.length === 0) return -1;

        // If current index is valid, first check if current index still matches
        if (
            this.currentSubtitleIndex >= 0 &&
            this.currentSubtitleIndex < this.subtitleData.length
        ) {
            const current = this.subtitleData[this.currentSubtitleIndex];
            if (currentTime >= current.start && currentTime <= current.end) {
                return this.currentSubtitleIndex;
            }

            // Check next subtitle (predictive lookup, assuming subtitles are in chronological order)
            if (this.currentSubtitleIndex + 1 < this.subtitleData.length) {
                const next = this.subtitleData[this.currentSubtitleIndex + 1];
                if (currentTime >= next.start && currentTime <= next.end) {
                    return this.currentSubtitleIndex + 1;
                }

                // If current time is before next subtitle start time but very close (within 200ms), show next subtitle early
                if (currentTime < next.start && next.start - currentTime < 200) {
                    return this.currentSubtitleIndex + 1;
                }
            }

            // If current time has passed current subtitle end time, try to find next suitable subtitle
            // This usually happens during fast forward or seeking
            if (currentTime > current.end) {
                // Search forward from current index
                for (
                    let i = this.currentSubtitleIndex + 1;
                    i < this.subtitleData.length;
                    i++
                ) {
                    const subtitle = this.subtitleData[i];
                    // If found matching subtitle, or current time is close to next subtitle start time
                    if (
                        (currentTime >= subtitle.start && currentTime <= subtitle.end) ||
                        (currentTime < subtitle.start && subtitle.start - currentTime < 200)
                    ) {
                        return i;
                    }
                    // If already far ahead of current time, stop searching
                    if (subtitle.start > currentTime + 5000) break;
                }
            } else if (currentTime < current.start) {
                // Search backward from current index
                for (let i = this.currentSubtitleIndex - 1; i >= 0; i--) {
                    const subtitle = this.subtitleData[i];
                    if (currentTime >= subtitle.start && currentTime <= subtitle.end) {
                        return i;
                    }
                    // If already far behind current time, stop searching
                    if (subtitle.end < currentTime - 5000) break;
                }
            }
        }

        // Use binary search algorithm to quickly locate subtitle
        let low = 0;
        let high = this.subtitleData.length - 1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const subtitle = this.subtitleData[mid];

            if (currentTime < subtitle.start) {
                // If current time is close to subtitle start time (within 200ms), show this subtitle early
                if (subtitle.start - currentTime < 200) {
                    return mid;
                }
                high = mid - 1;
            } else if (currentTime > subtitle.end) {
                low = mid + 1;
            } else {
                // Found matching subtitle
                return mid;
            }
        }

        // No matching subtitle found, but check if close to next subtitle
        if (low < this.subtitleData.length) {
            const nextSubtitle = this.subtitleData[low];
            // If current time is close to next subtitle start time (within 200ms), show next subtitle early
            if (nextSubtitle.start - currentTime < 200) {
                return low;
            }
        }

        // No matching subtitle found
        return -1;
    }

    /**
     * Update subtitle
     * @param text Subtitle text
     */
    updateSubtitle(text: string = ""): void {
        if (text === this._currentSubtitle) {
            return;
        }

        this._currentSubtitle = text;

        if (!this.container) {
            console.error("Subtitle container does not exist, cannot update subtitle");
            return;
        }

        if (!this.subtitleEnabled) {
            return;
        }

        // Process subtitle
        const processedText = this.processSubtitle(text);

        // Use requestAnimationFrame to optimize DOM updates, reduce reflow
        requestAnimationFrame(() => {
            // Update subtitle container
            if (this.container) {
                this.container.innerHTML = processedText;

                // Add word click events
                if (processedText) {
                    this.addWordClickEvents();
                }
            } else {
                console.error("Subtitle container does not exist, cannot update DOM");
            }
        });
    }

    /**
     * Process subtitle text
     * @param text Original subtitle text
     * @returns Processed subtitle text
     */
    processSubtitle(text: string): string {
        if (!text) return "";

        // Use cache optimization to avoid processing the same text repeatedly
        const cacheKey = `processed:${text}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            return cached;
        }

        // Split text into words
        const words = text.split(/(\s+|[,.!?;:'"()[\]{}])/);

        // Process each word
        const processedWords = words.map((word) => {
            // Skip whitespace and punctuation
            if (!word.trim() || /^[,.!?;:'"()[\]{}]$/.test(word)) {
                return word;
            }

            // Wrap word in clickable span
            return `<span class="acquire-language-word" data-word="${word}">${word}</span>`;
        });

        // Merge processed words
        const result = processedWords.join("");

        // Cache processed result
        try {
            sessionStorage.setItem(cacheKey, result);
        } catch (e) {
            // Ignore storage error
        }

        return result;
    }

    /**
     * Add word click events
     */
    addWordClickEvents() {
        if (!this.container) return;

        // Get all word elements
        const wordElements = this.container.querySelectorAll(
            ".acquire-language-word"
        );

        // Add click event to each word
        wordElements.forEach((element: Element) => {
            element.addEventListener("click", async (event: Event) => {
                // Stop event propagation
                event.stopPropagation();

                // Get word and position
                const word = element.getAttribute("data-word") || "";
                const rect = element.getBoundingClientRect();
                const position = {
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY + 10,
                };

                this.wordPopup.showLoading(word, position);

                // Get word definition
                try {
                    // Call AI service to get definition
                    const definition = await this.aiService.getWordDefinition(
                        word,
                        this._currentSubtitle,
                        this.settings.targetLanguage
                    );

                    // Show word definition
                    this.wordPopup.show(word, definition, position);
                } catch (error: any) {
                    console.error("Failed to get word definition:", error);
                    this.wordPopup.show(word, `Failed to get definition: ${error.message}`, position);
                }
            });
        });
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
