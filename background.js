let downloadUrlsByTab = new Map()

// URL 저장 구조 변경
class DownloadUrls {
  constructor() {
    this.subtitle = null
    this.video = null
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    console.log("Intercepted URL:", details.url)

    if (!downloadUrlsByTab.has(details.tabId)) {
      downloadUrlsByTab.set(details.tabId, new DownloadUrls())
    }

    const urls = downloadUrlsByTab.get(details.tabId)

    // 자막 URL 체크
    if (
      details.url.includes("fastcamp.ycdn.kollus.com/kr/subtitle/fastcamp/") &&
      details.url.includes(".srt")
    ) {
      urls.subtitle = details.url
      console.log("Added subtitle URL:", details.url)
    }

    // 영상 URL 체크
    if (
      details.url.includes("fastcamp.ycdn.kollus.com/kr/") &&
      details.url.includes(".mp4") &&
      details.url.includes("auth_key")
    ) {
      urls.video = details.url
      console.log("Added video URL:", details.url)
    }
  },
  {
    urls: ["*://fastcamp.ycdn.kollus.com/*", "*://*.kollus.com/*"],
  }
)

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.includes("fastcampus.co.kr/classroom/")
  ) {
    chrome.tabs.get(tabId, (tabInfo) => {
      if (chrome.runtime.lastError) {
        console.log("Tab not found:", chrome.runtime.lastError.message)
        return
      }

      if (tabInfo) {
        chrome.scripting
          .executeScript({
            target: { tabId },
            func: () => {
              const entries = performance.getEntriesByType("resource")
              return entries
                .map((entry) => entry.name)
                .filter(
                  (url) =>
                    (url.includes(
                      "fastcamp.ycdn.kollus.com/kr/subtitle/fastcamp/"
                    ) &&
                      url.includes(".srt")) ||
                    (url.includes("fastcamp.ycdn.kollus.com/kr/") &&
                      url.includes(".mp4") &&
                      url.includes("auth_key"))
                )
            },
          })
          .then(([{ result }]) => {
            if (!result) return

            if (!downloadUrlsByTab.has(tabId)) {
              downloadUrlsByTab.set(tabId, new DownloadUrls())
            }

            const urls = downloadUrlsByTab.get(tabId)
            result.forEach((url) => {
              if (url.includes(".srt")) {
                urls.subtitle = url
              } else if (url.includes(".mp4")) {
                urls.video = url
              }
            })
          })
          .catch((error) => {
            console.error("Error executing script:", error)
          })
      }
    })
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  downloadUrlsByTab.delete(tabId)
  console.log("Removed URLs for closed tab:", tabId)
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDownloadUrls") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTabId = tabs[0].id
      const urls = downloadUrlsByTab.get(currentTabId) || new DownloadUrls()
      console.log("Current URLs for tab", currentTabId, ":", urls)
      sendResponse(urls)
    })
    return true
  }
})
