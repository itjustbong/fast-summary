// SRT 파싱 함수 수정
function parseSRT(srtContent) {
  const parsed = srtContent
    .split(/\d+\n/) // 숫자(자막번호)로 시작하는 부분을 기준으로 분리
    .filter((block) => block.trim()) // 빈 블록 제거
    .map((block) => {
      const lines = block.split("\n")
      // 시간 정보가 포함된 줄을 건너뛰고 나머지 텍스트만 추출
      return lines
        .filter((line) => !line.includes("-->")) // 시간 정보 줄 제외
        .join(" ")
        .replace(/<[^>]*>/g, "") // HTML 태그 제거
        .trim()
    })
    .filter((text) => text) // 빈 텍스트 제거
    .join("\n\n") // 자막 텍스트 사이에 빈 줄 추가

  return parsed
}

document.addEventListener("DOMContentLoaded", () => {
  let currentLectureTitle = ""

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

        currentLectureTitle = result
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
      const subtitleContent = document.getElementById("subtitleContent")

      if (!response || !response.url) {
        downloadList.innerHTML =
          "<p class='no-subtitle'>다운로드 가능한 자막 파일이 없습니다.</p>"
        return
      }

      // 버튼 컨테이너 생성
      const buttonContainer = document.createElement("div")
      buttonContainer.className = "button-container"

      // 다운로드 버튼
      const downloadButton = document.createElement("button")
      downloadButton.className = "download-btn"
      downloadButton.textContent = "자막 다운로드"
      downloadButton.onclick = () => {
        const filename = `${currentLectureTitle.replace(
          /[/\\?%*:|"<>]/g,
          "-"
        )}.srt`
        chrome.downloads.download({
          url: response.url,
          filename: filename,
        })
      }

      // 자막 보기 버튼
      const viewButton = document.createElement("button")
      viewButton.className = "view-btn"
      viewButton.textContent = "자막 보기"
      viewButton.onclick = async () => {
        try {
          const res = await fetch(response.url)
          const text = await res.text()
          subtitleContent.style.display = "block"
          subtitleContent.textContent = parseSRT(text)
        } catch (error) {
          subtitleContent.textContent = "자막을 불러오는데 실패했습니다."
          console.error("Error loading subtitle:", error)
        }
      }

      buttonContainer.appendChild(downloadButton)
      buttonContainer.appendChild(viewButton)
      downloadList.appendChild(buttonContainer)
    })
  })
})
