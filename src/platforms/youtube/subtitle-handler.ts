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
    private currSubtitleIndices: number[] = [];
    private currSubtitleText: string = "";

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


    private createSubtitleContainer() {
        this.hideYouTubeSubtitles();

        this.container = document.createElement("div");
        this.container.id = "acquire-language-subtitle";
        this.applySubtitleStyles();
        this.addSubtitleHoverEvents();

        document.body.appendChild(this.container)
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

    private applySubtitleStyles() {
        if (!this.container) {
            console.error("Subtitle container does not exist, cannot apply styles");
            return;
        }

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

    private updateSubtitlePosition() {
        if (!this.container) return;

        const videoPlayer = document.querySelector("video");
        if (!videoPlayer) return;

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
        console.log("Checking current time, updating subtitle");
        if (!this.subtitleEnabled || this.subtitleData.length === 0) {
            return;
        }

        const videoPlayer = document.querySelector("video");
        if (!videoPlayer) return;
        

        const currentTime = videoPlayer.currentTime * 1000;

        const indices = this.findSubtitleIndices(currentTime);


        if (indices.length >= 2) {
            this.currSubtitleText = indices.map(index => this.subtitleData[index].text).join("\n");
        } else if (indices.length === 1) {
            this.currSubtitleText = this.subtitleData[indices[0]].text;
            // do need next subtitle
            const  currSubtitle = this.subtitleData[indices[0]];
            const nextIndex = indices[0] + 1;
            if (nextIndex < this.subtitleData.length) {
                const nextSubtitle = this.subtitleData[nextIndex];
                if (nextSubtitle.start <= currSubtitle.end) {
                    this.currSubtitleText += "\n" + nextSubtitle.text;
                }
            }
        } else {
            this.currSubtitleText = "";
        }

        console.log("Current time subtitle:", currentTime, this.currSubtitleText);

        this.updateSubtitle(this.currSubtitleText);

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
