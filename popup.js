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
  let subtitleText = "" // 자막 텍스트를 저장할 변수 추가

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

      if (!response || (!response.subtitle && !response.video)) {
        downloadList.innerHTML =
          "<p class='no-subtitle'>다운로드 가능한 파일이 없습니다.</p>"
        return
      }

      const buttonContainer = document.createElement("div")
      buttonContainer.className = "button-container"

      // 자막 다운로드 버튼
      if (response.subtitle) {
        const subtitleButton = document.createElement("button")
        subtitleButton.className = "download-btn"
        subtitleButton.textContent = "자막 다운로드"
        subtitleButton.onclick = () => {
          const filename = `${currentLectureTitle.replace(
            /[/\\?%*:|"<>]/g,
            "-"
          )}.srt`
          chrome.downloads.download({
            url: response.subtitle,
            filename: filename,
          })
        }
        buttonContainer.appendChild(subtitleButton)

        // 자막 보기 버튼
        const viewButton = document.createElement("button")
        viewButton.className = "view-btn"
        viewButton.textContent = "자막 보기"
        viewButton.onclick = async () => {
          try {
            const res = await fetch(response.subtitle)
            const text = await res.text()
            subtitleText = parseSRT(text) // 파싱된 자막 텍스트 저장
            subtitleContent.style.display = "block"
            subtitleContent.textContent = subtitleText
          } catch (error) {
            subtitleContent.textContent = "막을 불러오는데 실패했습니다."
            console.error("Error loading subtitle:", error)
          }
        }
        buttonContainer.appendChild(viewButton)

        // ChatGPT로 요약하기 버튼 추가
        const gptButton = document.createElement("button")
        gptButton.className = "gpt-btn"
        gptButton.textContent = "GPT로 요약하기"
        gptButton.onclick = async () => {
          try {
            if (!subtitleText) {
              const res = await fetch(response.subtitle)
              const text = await res.text()
              subtitleText = parseSRT(text)
            }

            const prompt = `이것은 IT/개발 관련 교육 영상의 자막입니다. 다음 내용을 아래 형식으로 정리해주세요:

1. 주요 개념 및 키워드
- 핵심 용어와 개념을 bullet point로 정리

2. 상세 내용 정리
- 강의 내용을 논리적 흐름에 따라 구조화하여 정리
- 중요한 설명과 예시 포함
- 실제 적용 방법이나 사용 사례 포함 (있는 경우)

3. 추가 참고사항
- 주의해야 할 점이나 팁 (있는 경우)
- 연관된 개념이나 기술 (있는 경우)

자막 내용:
${subtitleText}`

            // 프롬프트를 storage에 저장
            await chrome.storage.local.set({ gptPrompt: prompt })
            console.log("Subtitle saved to storage")

            // ChatGPT 페이지 열기
            await chrome.tabs.create({
              url: "https://chatgpt.com/",
            })
          } catch (error) {
            console.error("Error in GPT button click handler:", error)
            alert("GPT 요약 준비 중 오류가 발생했습니다.")
          }
        }
        buttonContainer.appendChild(gptButton)
      }

      // 영상 다운로드 버튼
      if (response.video) {
        const videoButton = document.createElement("button")
        videoButton.className = "video-btn"
        videoButton.textContent = "강의 다운로드"
        videoButton.onclick = () => {
          window.open(response.video, "_blank")
        }
        buttonContainer.appendChild(videoButton)
      }

      downloadList.appendChild(buttonContainer)
    })
  })
})
