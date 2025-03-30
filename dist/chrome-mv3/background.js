var background = function() {
  "use strict";
  var _a, _b;
  const browser = (
    // @ts-expect-error
    ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) == null ? globalThis.chrome : (
      // @ts-expect-error
      globalThis.browser
    )
  );
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  var _MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null)
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        const [_, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url) {
      if (this.isAllUrls)
        return true;
      const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http")
          return this.isHttpMatch(u);
        if (protocol === "https")
          return this.isHttpsMatch(u);
        if (protocol === "file")
          return this.isFileMatch(u);
        if (protocol === "ftp")
          return this.isFtpMatch(u);
        if (protocol === "urn")
          return this.isUrnMatch(u);
      });
    }
    isHttpMatch(url) {
      return url.protocol === "http:" && this.isHostPathMatch(url);
    }
    isHttpsMatch(url) {
      return url.protocol === "https:" && this.isHostPathMatch(url);
    }
    isHostPathMatch(url) {
      if (!this.hostnameMatch || !this.pathnameMatch)
        return false;
      const hostnameMatchRegexs = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))
      ];
      const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
      return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
    }
    isFileMatch(url) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern);
      const starsReplaced = escaped.replace(/\\\*/g, ".*");
      return RegExp(`^${starsReplaced}$`);
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var MatchPattern = _MatchPattern;
  MatchPattern.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super(`Invalid match pattern "${matchPattern}": ${reason}`);
    }
  };
  function validateProtocol(matchPattern, protocol) {
    if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*")
      throw new InvalidMatchPattern(
        matchPattern,
        `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`
      );
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":"))
      throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*."))
      throw new InvalidMatchPattern(
        matchPattern,
        `If using a wildcard (*), it must go at the start of the hostname`
      );
  }
  const DEFAULT_SETTINGS = {
    nativeLanguage: "zh-CN",
    targetLanguage: "en-US",
    languageLevel: "B1",
    aiModel: "deepseek",
    apiKey: "",
    subtitleSettings: {
      fontSize: 16,
      position: "bottom",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      textColor: "#ffffff",
      opacity: 0.9
    }
  };
  class StorageManager {
    /**
     * 获取存储数据
     * @param key 键
     * @returns 数据
     */
    static async get(key) {
      const result2 = await browser.storage.local.get(key);
      return result2[key] || null;
    }
    /**
     * 设置存储数据
     * @param key 键
     * @param value 值
     */
    static async set(key, value) {
      await browser.storage.local.set({ [key]: value });
    }
    /**
     * 获取设置
     * @returns 设置
     */
    static async getSettings() {
      return await this.get("settings") || DEFAULT_SETTINGS;
    }
    /**
     * 保存设置
     * @param settings 设置
     */
    static async saveSettings(settings) {
      await this.set("settings", settings);
    }
    /**
     * 获取生词本
     * @returns 生词本数据
     */
    static async getVocabulary() {
      return await this.get("vocabulary") || {};
    }
    /**
     * 保存生词本
     * @param vocabulary 生词本数据
     */
    static async saveVocabulary(vocabulary) {
      await this.set("vocabulary", vocabulary);
    }
  }
  background;
  const definition = defineBackground(() => {
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        var _a2;
        if (details.method !== "GET") return;
        if ((_a2 = details.initiator) == null ? void 0 : _a2.startsWith("chrome-extension://")) {
          return;
        }
        const url = details.url;
        if (!url.includes("/api/timedtext") && !url.includes("timedtext")) {
          return;
        }
        try {
          const urlObject = new URL(url);
          const lang = urlObject.searchParams.get("tlang") || urlObject.searchParams.get("lang") || "";
          const videoId = urlObject.searchParams.get("v") || urlObject.pathname.split("/").pop() || "";
          if (details.tabId > 0) {
            fetchSubtitle(urlObject.href).then((subtitleContent) => {
              chrome.tabs.sendMessage(details.tabId, {
                type: "ACQ_SUBTITLE_FETCHED",
                data: { url: urlObject.href, lang, videoId, response: subtitleContent }
              }).catch((err) => console.error("Failed to send message to content script:", err));
            }).catch((err) => console.error("Failed to fetch subtitle:", err));
          }
        } catch (e) {
          console.error("Failed to capture subtitle request:", e);
        }
      },
      { urls: ["*://*.youtube.com/*timedtext*", "*://*.youtube.com/api/*"] }
    );
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "SAVE_WORD") {
        saveWordToVocabulary(message.word, message.context).then(() => sendResponse({ success: true })).catch(
          (error) => sendResponse({ success: false, error: error.message })
        );
        return true;
      }
    });
    async function saveWordToVocabulary(word, context) {
      const vocabulary = await StorageManager.getVocabulary();
      if (vocabulary[word]) {
        if (!vocabulary[word].contexts.includes(context)) {
          vocabulary[word].contexts.push(context);
        }
      } else {
        vocabulary[word] = {
          word,
          contexts: [context],
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      await StorageManager.saveVocabulary(vocabulary);
      return vocabulary[word];
    }
  });
  async function fetchSubtitle(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch subtitle: ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Failed to fetch subtitle:", error);
      throw error;
    }
  }
  background;
  function initPlugins() {
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  let ws;
  function getDevServerWebSocket() {
    if (ws == null) {
      const serverUrl = `${"ws:"}//${"localhost"}:${3e3}`;
      logger.debug("Connecting to dev server @", serverUrl);
      ws = new WebSocket(serverUrl, "vite-hmr");
      ws.addWxtEventListener = ws.addEventListener.bind(ws);
      ws.sendCustom = (event, payload) => ws == null ? void 0 : ws.send(JSON.stringify({ type: "custom", event, payload }));
      ws.addEventListener("open", () => {
        logger.debug("Connected to dev server");
      });
      ws.addEventListener("close", () => {
        logger.debug("Disconnected from dev server");
      });
      ws.addEventListener("error", (event) => {
        logger.error("Failed to connect to dev server", event);
      });
      ws.addEventListener("message", (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === "custom") {
            ws == null ? void 0 : ws.dispatchEvent(
              new CustomEvent(message.event, { detail: message.data })
            );
          }
        } catch (err) {
          logger.error("Failed to handle message", err);
        }
      });
    }
    return ws;
  }
  function keepServiceWorkerAlive() {
    setInterval(async () => {
      await browser.runtime.getPlatformInfo();
    }, 5e3);
  }
  function reloadContentScript(payload) {
    const manifest = browser.runtime.getManifest();
    if (manifest.manifest_version == 2) {
      void reloadContentScriptMv2();
    } else {
      void reloadContentScriptMv3(payload);
    }
  }
  async function reloadContentScriptMv3({
    registration,
    contentScript
  }) {
    if (registration === "runtime") {
      await reloadRuntimeContentScriptMv3(contentScript);
    } else {
      await reloadManifestContentScriptMv3(contentScript);
    }
  }
  async function reloadManifestContentScriptMv3(contentScript) {
    const id = `wxt:${contentScript.js[0]}`;
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const existing = registered.find((cs) => cs.id === id);
    if (existing) {
      logger.debug("Updating content script", existing);
      await browser.scripting.updateContentScripts([{ ...contentScript, id }]);
    } else {
      logger.debug("Registering new content script...");
      await browser.scripting.registerContentScripts([{ ...contentScript, id }]);
    }
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadRuntimeContentScriptMv3(contentScript) {
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const matches = registered.filter((cs) => {
      var _a2, _b2;
      const hasJs = (_a2 = contentScript.js) == null ? void 0 : _a2.find((js) => {
        var _a3;
        return (_a3 = cs.js) == null ? void 0 : _a3.includes(js);
      });
      const hasCss = (_b2 = contentScript.css) == null ? void 0 : _b2.find((css) => {
        var _a3;
        return (_a3 = cs.css) == null ? void 0 : _a3.includes(css);
      });
      return hasJs || hasCss;
    });
    if (matches.length === 0) {
      logger.log(
        "Content script is not registered yet, nothing to reload",
        contentScript
      );
      return;
    }
    await browser.scripting.updateContentScripts(matches);
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadTabsForContentScript(contentScript) {
    const allTabs = await browser.tabs.query({});
    const matchPatterns = contentScript.matches.map(
      (match) => new MatchPattern(match)
    );
    const matchingTabs = allTabs.filter((tab) => {
      const url = tab.url;
      if (!url) return false;
      return !!matchPatterns.find((pattern) => pattern.includes(url));
    });
    await Promise.all(
      matchingTabs.map(async (tab) => {
        try {
          await browser.tabs.reload(tab.id);
        } catch (err) {
          logger.warn("Failed to reload tab:", err);
        }
      })
    );
  }
  async function reloadContentScriptMv2(_payload) {
    throw Error("TODO: reloadContentScriptMv2");
  }
  {
    try {
      const ws2 = getDevServerWebSocket();
      ws2.addWxtEventListener("wxt:reload-extension", () => {
        browser.runtime.reload();
      });
      ws2.addWxtEventListener("wxt:reload-content-script", (event) => {
        reloadContentScript(event.detail);
      });
      if (true) {
        ws2.addEventListener(
          "open",
          () => ws2.sendCustom("wxt:background-initialized")
        );
        keepServiceWorkerAlive();
      }
    } catch (err) {
      logger.error("Failed to setup web socket connection with dev server", err);
    }
    browser.commands.onCommand.addListener((command) => {
      if (command === "wxt:reload-extension") {
        browser.runtime.reload();
      }
    });
  }
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) {
      console.warn(
        "The background's main() function return a promise, but it must be synchronous"
      );
    }
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  const result$1 = result;
  return result$1;
}();
background;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIvY2hyb21lLm1qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9zYW5kYm94L2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9Ad2ViZXh0LWNvcmUvbWF0Y2gtcGF0dGVybnMvbGliL2luZGV4LmpzIiwiLi4vLi4vc3JjL2NvcmUvc3RvcmFnZS9pbmRleC50cyIsIi4uLy4uL3NyYy9lbnRyeXBvaW50cy9iYWNrZ3JvdW5kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBicm93c2VyID0gKFxuICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gIGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWQgPT0gbnVsbCA/IGdsb2JhbFRoaXMuY2hyb21lIDogKFxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgKVxuKTtcbiIsImV4cG9ydCBmdW5jdGlvbiBkZWZpbmVCYWNrZ3JvdW5kKGFyZykge1xuICBpZiAoYXJnID09IG51bGwgfHwgdHlwZW9mIGFyZyA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4geyBtYWluOiBhcmcgfTtcbiAgcmV0dXJuIGFyZztcbn1cbiIsIi8vIHNyYy9pbmRleC50c1xudmFyIF9NYXRjaFBhdHRlcm4gPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybikge1xuICAgIGlmIChtYXRjaFBhdHRlcm4gPT09IFwiPGFsbF91cmxzPlwiKSB7XG4gICAgICB0aGlzLmlzQWxsVXJscyA9IHRydWU7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IFsuLi5fTWF0Y2hQYXR0ZXJuLlBST1RPQ09MU107XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSAvKC4qKTpcXC9cXC8oLio/KShcXC8uKikvLmV4ZWMobWF0Y2hQYXR0ZXJuKTtcbiAgICAgIGlmIChncm91cHMgPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBcIkluY29ycmVjdCBmb3JtYXRcIik7XG4gICAgICBjb25zdCBbXywgcHJvdG9jb2wsIGhvc3RuYW1lLCBwYXRobmFtZV0gPSBncm91cHM7XG4gICAgICB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpO1xuICAgICAgdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKTtcbiAgICAgIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSk7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IHByb3RvY29sID09PSBcIipcIiA/IFtcImh0dHBcIiwgXCJodHRwc1wiXSA6IFtwcm90b2NvbF07XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBob3N0bmFtZTtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IHBhdGhuYW1lO1xuICAgIH1cbiAgfVxuICBpbmNsdWRlcyh1cmwpIHtcbiAgICBpZiAodGhpcy5pc0FsbFVybHMpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCB1ID0gdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIiA/IG5ldyBVUkwodXJsKSA6IHVybCBpbnN0YW5jZW9mIExvY2F0aW9uID8gbmV3IFVSTCh1cmwuaHJlZikgOiB1cmw7XG4gICAgcmV0dXJuICEhdGhpcy5wcm90b2NvbE1hdGNoZXMuZmluZCgocHJvdG9jb2wpID0+IHtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBzXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cHNNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmaWxlXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRmlsZU1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZ0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0Z0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcInVyblwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc1Vybk1hdGNoKHUpO1xuICAgIH0pO1xuICB9XG4gIGlzSHR0cE1hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cDpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSHR0cHNNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHBzOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIb3N0UGF0aE1hdGNoKHVybCkge1xuICAgIGlmICghdGhpcy5ob3N0bmFtZU1hdGNoIHx8ICF0aGlzLnBhdGhuYW1lTWF0Y2gpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgaG9zdG5hbWVNYXRjaFJlZ2V4cyA9IFtcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaCksXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gucmVwbGFjZSgvXlxcKlxcLi8sIFwiXCIpKVxuICAgIF07XG4gICAgY29uc3QgcGF0aG5hbWVNYXRjaFJlZ2V4ID0gdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5wYXRobmFtZU1hdGNoKTtcbiAgICByZXR1cm4gISFob3N0bmFtZU1hdGNoUmVnZXhzLmZpbmQoKHJlZ2V4KSA9PiByZWdleC50ZXN0KHVybC5ob3N0bmFtZSkpICYmIHBhdGhuYW1lTWF0Y2hSZWdleC50ZXN0KHVybC5wYXRobmFtZSk7XG4gIH1cbiAgaXNGaWxlTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZpbGU6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzRnRwTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZ0cDovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNVcm5NYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogdXJuOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBjb252ZXJ0UGF0dGVyblRvUmVnZXgocGF0dGVybikge1xuICAgIGNvbnN0IGVzY2FwZWQgPSB0aGlzLmVzY2FwZUZvclJlZ2V4KHBhdHRlcm4pO1xuICAgIGNvbnN0IHN0YXJzUmVwbGFjZWQgPSBlc2NhcGVkLnJlcGxhY2UoL1xcXFxcXCovZywgXCIuKlwiKTtcbiAgICByZXR1cm4gUmVnRXhwKGBeJHtzdGFyc1JlcGxhY2VkfSRgKTtcbiAgfVxuICBlc2NhcGVGb3JSZWdleChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgfVxufTtcbnZhciBNYXRjaFBhdHRlcm4gPSBfTWF0Y2hQYXR0ZXJuO1xuTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUyA9IFtcImh0dHBcIiwgXCJodHRwc1wiLCBcImZpbGVcIiwgXCJmdHBcIiwgXCJ1cm5cIl07XG52YXIgSW52YWxpZE1hdGNoUGF0dGVybiA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4sIHJlYXNvbikge1xuICAgIHN1cGVyKGBJbnZhbGlkIG1hdGNoIHBhdHRlcm4gXCIke21hdGNoUGF0dGVybn1cIjogJHtyZWFzb259YCk7XG4gIH1cbn07XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpIHtcbiAgaWYgKCFNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmluY2x1ZGVzKHByb3RvY29sKSAmJiBwcm90b2NvbCAhPT0gXCIqXCIpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgJHtwcm90b2NvbH0gbm90IGEgdmFsaWQgcHJvdG9jb2wgKCR7TWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5qb2luKFwiLCBcIil9KWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKSB7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIjpcIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBgSG9zdG5hbWUgY2Fubm90IGluY2x1ZGUgYSBwb3J0YCk7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIipcIikgJiYgaG9zdG5hbWUubGVuZ3RoID4gMSAmJiAhaG9zdG5hbWUuc3RhcnRzV2l0aChcIiouXCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYElmIHVzaW5nIGEgd2lsZGNhcmQgKCopLCBpdCBtdXN0IGdvIGF0IHRoZSBzdGFydCBvZiB0aGUgaG9zdG5hbWVgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSkge1xuICByZXR1cm47XG59XG5leHBvcnQge1xuICBJbnZhbGlkTWF0Y2hQYXR0ZXJuLFxuICBNYXRjaFBhdHRlcm5cbn07XG4iLCIvKipcbiAqIOWtmOWCqOeuoeeQhuW3peWFt1xuICovXG5pbXBvcnQge1NldHRpbmdzLCBWb2NhYnVsYXJ5RGF0YX0gZnJvbSAnLi4vdHlwZXMvc3RvcmFnZSc7XG5cbi8vIOm7mOiupOiuvue9rlxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNldHRpbmdzID0ge1xuICAgIG5hdGl2ZUxhbmd1YWdlOiAnemgtQ04nLFxuICAgIHRhcmdldExhbmd1YWdlOiAnZW4tVVMnLFxuICAgIGxhbmd1YWdlTGV2ZWw6ICdCMScsXG4gICAgYWlNb2RlbDogJ2RlZXBzZWVrJyxcbiAgICBhcGlLZXk6ICcnLFxuICAgIHN1YnRpdGxlU2V0dGluZ3M6IHtcbiAgICAgICAgZm9udFNpemU6IDE2LFxuICAgICAgICBwb3NpdGlvbjogJ2JvdHRvbScsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMCwgMCwgMCwgMC43KScsXG4gICAgICAgIHRleHRDb2xvcjogJyNmZmZmZmYnLFxuICAgICAgICBvcGFjaXR5OiAwLjksXG4gICAgfSxcbn07XG5cbi8qKlxuICog5a2Y5YKo566h55CG57G7XG4gKi9cbmV4cG9ydCBjbGFzcyBTdG9yYWdlTWFuYWdlciB7XG4gICAgLyoqXG4gICAgICog6I635Y+W5a2Y5YKo5pWw5o2uXG4gICAgICogQHBhcmFtIGtleSDplK5cbiAgICAgKiBAcmV0dXJucyDmlbDmja5cbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgZ2V0PFQ+KGtleTogc3RyaW5nKTogUHJvbWlzZTxUIHwgbnVsbD4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0KGtleSk7XG4gICAgICAgIHJldHVybiByZXN1bHRba2V5XSB8fCBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruWtmOWCqOaVsOaNrlxuICAgICAqIEBwYXJhbSBrZXkg6ZSuXG4gICAgICogQHBhcmFtIHZhbHVlIOWAvFxuICAgICAqL1xuICAgIHN0YXRpYyBhc3luYyBzZXQ8VD4oa2V5OiBzdHJpbmcsIHZhbHVlOiBUKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoe1trZXldOiB2YWx1ZX0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluiuvue9rlxuICAgICAqIEByZXR1cm5zIOiuvue9rlxuICAgICAqL1xuICAgIHN0YXRpYyBhc3luYyBnZXRTZXR0aW5ncygpOiBQcm9taXNlPFNldHRpbmdzPiB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldDxTZXR0aW5ncz4oJ3NldHRpbmdzJykgfHwgREVGQVVMVF9TRVRUSU5HUztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkv53lrZjorr7nva5cbiAgICAgKiBAcGFyYW0gc2V0dGluZ3Mg6K6+572uXG4gICAgICovXG4gICAgc3RhdGljIGFzeW5jIHNhdmVTZXR0aW5ncyhzZXR0aW5nczogU2V0dGluZ3MpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5zZXQoJ3NldHRpbmdzJywgc2V0dGluZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPlueUn+ivjeacrFxuICAgICAqIEByZXR1cm5zIOeUn+ivjeacrOaVsOaNrlxuICAgICAqL1xuICAgIHN0YXRpYyBhc3luYyBnZXRWb2NhYnVsYXJ5KCk6IFByb21pc2U8Vm9jYWJ1bGFyeURhdGE+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0PFZvY2FidWxhcnlEYXRhPigndm9jYWJ1bGFyeScpIHx8IHt9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS/neWtmOeUn+ivjeacrFxuICAgICAqIEBwYXJhbSB2b2NhYnVsYXJ5IOeUn+ivjeacrOaVsOaNrlxuICAgICAqL1xuICAgIHN0YXRpYyBhc3luYyBzYXZlVm9jYWJ1bGFyeSh2b2NhYnVsYXJ5OiBWb2NhYnVsYXJ5RGF0YSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLnNldCgndm9jYWJ1bGFyeScsIHZvY2FidWxhcnkpO1xuICAgIH1cbn0gIiwiLyoqXG4gKiDkuaDlvpfor63oqIAgKEFjcXVpcmUgTGFuZ3VhZ2UpIOWQjuWPsOiEmuacrFxuICovXG5pbXBvcnQge2RlZmluZUJhY2tncm91bmR9IGZyb20gXCJ3eHQvc2FuZGJveFwiO1xuaW1wb3J0IHtTdG9yYWdlTWFuYWdlcn0gZnJvbSBcIkAvY29yZS9zdG9yYWdlXCI7XG5pbXBvcnQge1dvcmR9IGZyb20gXCJAL2NvcmUvdHlwZXMvc3RvcmFnZVwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVCYWNrZ3JvdW5kKCgpID0+IHtcblxuICAgIGNocm9tZS53ZWJSZXF1ZXN0Lm9uQmVmb3JlUmVxdWVzdC5hZGRMaXN0ZW5lcihcbiAgICAgICAgKGRldGFpbHMpID0+IHtcbiAgICAgICAgICAgIGlmIChkZXRhaWxzLm1ldGhvZCAhPT0gXCJHRVRcIikgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBpZ25vcmUgcmVxdWVzdHMgZnJvbSBjaHJvbWUgZXh0ZW5zaW9uXG4gICAgICAgICAgICBpZiAoZGV0YWlscy5pbml0aWF0b3I/LnN0YXJ0c1dpdGgoXCJjaHJvbWUtZXh0ZW5zaW9uOi8vXCIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBkZXRhaWxzLnVybDtcblxuICAgICAgICAgICAgaWYgKCF1cmwuaW5jbHVkZXMoXCIvYXBpL3RpbWVkdGV4dFwiKSAmJiAhdXJsLmluY2x1ZGVzKFwidGltZWR0ZXh0XCIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHVybE9iamVjdCA9IG5ldyBVUkwodXJsKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGxhbmcgPVxuICAgICAgICAgICAgICAgICAgICB1cmxPYmplY3Quc2VhcmNoUGFyYW1zLmdldChcInRsYW5nXCIpIHx8XG4gICAgICAgICAgICAgICAgICAgIHVybE9iamVjdC5zZWFyY2hQYXJhbXMuZ2V0KFwibGFuZ1wiKSB8fFxuICAgICAgICAgICAgICAgICAgICBcIlwiO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgdmlkZW9JZCA9XG4gICAgICAgICAgICAgICAgICAgIHVybE9iamVjdC5zZWFyY2hQYXJhbXMuZ2V0KFwidlwiKSB8fFxuICAgICAgICAgICAgICAgICAgICB1cmxPYmplY3QucGF0aG5hbWUuc3BsaXQoXCIvXCIpLnBvcCgpIHx8XG4gICAgICAgICAgICAgICAgICAgIFwiXCI7XG5cblxuXG4gICAgICAgICAgICAgICAgLy8gc2VuZCBtZXNzYWdlIHRvIGNvbnRlbnQgc2NyaXB0XG4gICAgICAgICAgICAgICAgaWYgKGRldGFpbHMudGFiSWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZldGNoU3VidGl0bGUodXJsT2JqZWN0LmhyZWYpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihzdWJ0aXRsZUNvbnRlbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKGRldGFpbHMudGFiSWQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJBQ1FfU1VCVElUTEVfRkVUQ0hFRFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7dXJsOiB1cmxPYmplY3QuaHJlZiwgbGFuZywgdmlkZW9JZCwgcmVzcG9uc2U6IHN1YnRpdGxlQ29udGVudH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gc2VuZCBtZXNzYWdlIHRvIGNvbnRlbnQgc2NyaXB0OlwiLCBlcnIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZmV0Y2ggc3VidGl0bGU6XCIsIGVycikpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gY2FwdHVyZSBzdWJ0aXRsZSByZXF1ZXN0OlwiLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge3VybHM6IFtcIio6Ly8qLnlvdXR1YmUuY29tLyp0aW1lZHRleHQqXCIsIFwiKjovLyoueW91dHViZS5jb20vYXBpLypcIl19XG4gICAgKTtcblxuXG4gICAgLy8g55uR5ZCs5p2l6Ieq5YaF5a656ISa5pys55qE5raI5oGvXG4gICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICAgICAgLy8g5Zyo6L+Z6YeM5aSE55CG5raI5oGvXG4gICAgICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiU0FWRV9XT1JEXCIpIHtcbiAgICAgICAgICAgIC8vIOS/neWtmOWNleivjeWIsOeUn+ivjeacrFxuICAgICAgICAgICAgc2F2ZVdvcmRUb1ZvY2FidWxhcnkobWVzc2FnZS53b3JkLCBtZXNzYWdlLmNvbnRleHQpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gc2VuZFJlc3BvbnNlKHtzdWNjZXNzOiB0cnVlfSkpXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT5cbiAgICAgICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2V9KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8g6KGo56S65bCG5byC5q2l5Y+R6YCB5ZON5bqUXG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgLy8g5L+d5a2Y5Y2V6K+N5Yiw55Sf6K+N5pysXG4gICAgYXN5bmMgZnVuY3Rpb24gc2F2ZVdvcmRUb1ZvY2FidWxhcnkoXG4gICAgICAgIHdvcmQ6IHN0cmluZyxcbiAgICAgICAgY29udGV4dDogc3RyaW5nXG4gICAgKTogUHJvbWlzZTxXb3JkPiB7XG4gICAgICAgIGNvbnN0IHZvY2FidWxhcnkgPSBhd2FpdCBTdG9yYWdlTWFuYWdlci5nZXRWb2NhYnVsYXJ5KCk7XG5cbiAgICAgICAgLy8g5qOA5p+l5Y2V6K+N5piv5ZCm5bey5a2Y5ZyoXG4gICAgICAgIGlmICh2b2NhYnVsYXJ5W3dvcmRdKSB7XG4gICAgICAgICAgICAvLyDlpoLmnpzljZXor43lt7LlrZjlnKjvvIzmt7vliqDmlrDnmoTkuIrkuIvmlofvvIjlpoLmnpzkuI3ph43lpI3vvIlcbiAgICAgICAgICAgIGlmICghdm9jYWJ1bGFyeVt3b3JkXS5jb250ZXh0cy5pbmNsdWRlcyhjb250ZXh0KSkge1xuICAgICAgICAgICAgICAgIHZvY2FidWxhcnlbd29yZF0uY29udGV4dHMucHVzaChjb250ZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWmguaenOWNleivjeS4jeWtmOWcqO+8jOWIm+W7uuaWsOadoeebrlxuICAgICAgICAgICAgdm9jYWJ1bGFyeVt3b3JkXSA9IHtcbiAgICAgICAgICAgICAgICB3b3JkLFxuICAgICAgICAgICAgICAgIGNvbnRleHRzOiBbY29udGV4dF0sXG4gICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5L+d5a2Y5pu05paw5ZCO55qE55Sf6K+N5pysXG4gICAgICAgIGF3YWl0IFN0b3JhZ2VNYW5hZ2VyLnNhdmVWb2NhYnVsYXJ5KHZvY2FidWxhcnkpO1xuXG4gICAgICAgIC8vIOi/lOWbnuabtOaWsOWQjueahOWNleivjeadoeebrlxuICAgICAgICByZXR1cm4gdm9jYWJ1bGFyeVt3b3JkXTtcbiAgICB9XG59KTtcblxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFN1YnRpdGxlKHVybDogc3RyaW5nKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaCBzdWJ0aXRsZTogJHtyZXNwb25zZS5zdGF0dXN9ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZmV0Y2ggc3VidGl0bGU6XCIsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufSJdLCJuYW1lcyI6WyJyZXN1bHQiLCJfYSJdLCJtYXBwaW5ncyI6Ijs7O0FBQU8sUUFBTTtBQUFBO0FBQUEsTUFFWCxzQkFBVyxZQUFYLG1CQUFvQixZQUFwQixtQkFBNkIsT0FBTSxPQUFPLFdBQVc7QUFBQTtBQUFBLE1BRW5ELFdBQVc7QUFBQTtBQUFBO0FDSlIsV0FBUyxpQkFBaUIsS0FBSztBQUNwQyxRQUFJLE9BQU8sUUFBUSxPQUFPLFFBQVEsV0FBWSxRQUFPLEVBQUUsTUFBTSxJQUFLO0FBQ2xFLFdBQU87QUFBQSxFQUNUO0FDRkEsTUFBSSxnQkFBZ0IsTUFBTTtBQUFBLElBQ3hCLFlBQVksY0FBYztBQUN4QixVQUFJLGlCQUFpQixjQUFjO0FBQ2pDLGFBQUssWUFBWTtBQUNqQixhQUFLLGtCQUFrQixDQUFDLEdBQUcsY0FBYyxTQUFTO0FBQ2xELGFBQUssZ0JBQWdCO0FBQ3JCLGFBQUssZ0JBQWdCO0FBQUEsTUFDM0IsT0FBVztBQUNMLGNBQU0sU0FBUyx1QkFBdUIsS0FBSyxZQUFZO0FBQ3ZELFlBQUksVUFBVTtBQUNaLGdC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QUFBLFFBQUEsTUFBQSw2QkFBQSxHQUFBLENBQUE7QUFBQSxVQUV0QjtBQUFBLFFBQ3JFLFNBQUEsR0FBQTtBQUdBLGtCQUFBLE1BQUEsdUNBQUEsQ0FBQTtBQUFBLFFBQXNEO0FBQUEsTUFDMUQ7QUFBQSxNQUNKLEVBQUEsTUFBQSxDQUFBLGlDQUFBLHlCQUFBLEVBQUE7QUFBQSxJQUNtRTtBQUt2RSxZQUFBLFFBQUEsVUFBQSxZQUFBLENBQUEsU0FBQSxRQUFBLGlCQUFBO0FBRUksVUFBQSxRQUFBLFNBQUEsYUFBQTtBQUVJLDZCQUFBLFFBQUEsTUFBQSxRQUFBLE9BQUEsRUFBQSxLQUFBLE1BQUEsYUFBQSxFQUFBLFNBQUEsS0FBQSxDQUFBLENBQUEsRUFBQTtBQUFBLFVBRUssQ0FBQSxVQUFBLGFBQUEsRUFBQSxTQUFBLE9BQUEsT0FBQSxNQUFBLFFBQUEsQ0FBQTtBQUFBLFFBQ3NEO0FBRTNELGVBQUE7QUFBQSxNQUFPO0FBQUEsSUFDWCxDQUFBO0FBS0osbUJBQUEscUJBQUEsTUFBQSxTQUFBO0FBSUksWUFBQSxhQUFBLE1BQUEsZUFBQSxjQUFBO0FBR0EsVUFBQSxXQUFBLElBQUEsR0FBQTtBQUVJLFlBQUEsQ0FBQSxXQUFBLElBQUEsRUFBQSxTQUFBLFNBQUEsT0FBQSxHQUFBO0FBQ0kscUJBQUEsSUFBQSxFQUFBLFNBQUEsS0FBQSxPQUFBO0FBQUEsUUFBc0M7QUFBQSxNQUMxQyxPQUFBO0FBR0EsbUJBQUEsSUFBQSxJQUFBO0FBQUEsVUFBbUI7QUFBQSxVQUNmLFVBQUEsQ0FBQSxPQUFBO0FBQUEsVUFDa0IsWUFBQSxvQkFBQSxLQUFBLEdBQUEsWUFBQTtBQUFBLFFBQ2dCO0FBQUEsTUFDdEM7QUFJSixZQUFBLGVBQUEsZUFBQSxVQUFBO0FBR0EsYUFBQSxXQUFBLElBQUE7QUFBQSxJQUFzQjtBQUFBLEVBRTlCLENBQUE7QUFHQSxpQkFBQSxjQUFBLEtBQUE7QUFDSSxRQUFBO0FBQ0ksWUFBQSxXQUFBLE1BQUEsTUFBQSxHQUFBO0FBQ0EsVUFBQSxDQUFBLFNBQUEsSUFBQTtBQUNJLGNBQUEsSUFBQSxNQUFBLDZCQUFBLFNBQUEsTUFBQSxJQUFBLFNBQUEsVUFBQSxFQUFBO0FBQUEsTUFBcUY7QUFFekYsYUFBQSxNQUFBLFNBQUEsS0FBQTtBQUFBLElBQTJCLFNBQUEsT0FBQTtBQUUzQixjQUFBLE1BQUEsNkJBQUEsS0FBQTtBQUNBLFlBQUE7QUFBQSxJQUFNO0FBQUEsRUFFZDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDJdfQ==
