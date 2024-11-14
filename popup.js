document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentTab = tabs[0]

    if (currentTab.url.includes("fastcampus.co.kr")) {
      try {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          function: () => {
            const activeChapter = document.querySelector(
              ".classroom-sidebar-clip__chapter__clip--active .classroom-sidebar-clip__chapter__clip__title"
            )
            return activeChapter
              ? activeChapter.textContent.trim()
              : "강의 정보를 찾을 수 없습니다."
          },
        })

        document.getElementById("lectureTitle").textContent = result
      } catch (e) {
        document.getElementById("lectureTitle").textContent =
          "강의 정보를 불러올 수 없습니다."
        console.error("Error getting chapter title:", e)
      }
    } else {
      document.getElementById("lectureTitle").textContent =
        "FastCampus 강의 페이지가 아닙니다."
    }

    // 다운로드 URL 가져오기
    chrome.runtime.sendMessage({ action: "getDownloadUrls" }, (response) => {
      const downloadList = document.getElementById("downloadList")

      if (!response || !response.url) {
        downloadList.innerHTML =
          "<p class='no-subtitle'>다운로드 가능한 자막 파일이 없습니다.</p>"
        return
      }

      // 단일 버튼만 생성
      const button = document.createElement("button")
      button.className = "download-btn"
      button.textContent = `자막 다운로드 받기 (.srt)`
      button.onclick = () => {
        chrome.downloads.download({
          url: response.url,
          filename: `fastcampus_subtitle.srt`,
        })
      }
      downloadList.appendChild(button)
    })
  })
})
