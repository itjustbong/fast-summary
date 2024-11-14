let downloadUrlsByTab = new Map()

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    console.log("Intercepted URL:", details.url)
    if (
      details.url.includes("fastcamp.ycdn.kollus.com/kr/subtitle/fastcamp/") &&
      details.url.includes(".srt")
    ) {
      downloadUrlsByTab.set(details.tabId, details.url)
      console.log("Added URL to download list:", details.url)
    }
  },
  {
    urls: ["*://fastcamp.ycdn.kollus.com/*", "*://*.kollus.com/*"],
  }
)

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.includes("fastcampus.co.kr/classroom/")
  ) {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId },
        function: async () => {
          try {
            const entries = performance.getEntriesByType("resource")
            const subtitleUrls = entries
              .map((entry) => entry.name)
              .filter(
                (url) =>
                  url.includes(
                    "fastcamp.ycdn.kollus.com/kr/subtitle/fastcamp/"
                  ) && url.includes(".srt")
              )

            return subtitleUrls[0] || null
          } catch (error) {
            console.error("Error in content script:", error)
            return null
          }
        },
      })

      if (result) {
        downloadUrlsByTab.set(tabId, result)
        console.log("Added subtitle URL from performance:", result)
      }
    } catch (error) {
      console.error("Error checking for subtitles:", error)
    }
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url) {
    if (!tab.url.includes("fastcampus.co.kr")) {
      downloadUrlsByTab.delete(tabId)
      console.log("Cleared URLs for tab:", tabId)
    }
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
      const url = downloadUrlsByTab.get(currentTabId)
      console.log("Current downloadUrl for tab", currentTabId, ":", url)
      sendResponse({ url: url || null })
    })
    return true
  }
})
