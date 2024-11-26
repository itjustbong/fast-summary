// SRT 파싱 함수 수정
function parseSRT(srtContent) {
  const parsed = srtContent
    .split(/\d+\n/) // 숫자(자막번호)로 시작하는 부분을 기준으로 분리
    .filter((block) => block.trim()) // 빈 블록 제거
    .map((block) => {
      const lines = block.split("\n")
      return lines
        .filter((line) => !line.includes("-->")) // 시간 정보 줄 제외
        .map((line) => line.replace(/^\d+\s*/, "")) // 각 줄 시작의 숫자 제거
        .join(" ")
        .replace(/<[^>]*>/g, "") // HTML 태그 제거
        .trim()
    })
    .filter((text) => text) // 빈 텍스트 제거
    .join("\n\n") // 자막 블록 사이에 빈 줄 추가

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

            const prompt = `당신은 IT/개발 교육 컨텐츠 전문 튜터입니다.
아래는 IT/개발 관련 교육 영상의 자막입니다. 
학습자의 이해를 돕기 위해 다음 형식으로 자세히 정리해주세요:

1. 강의 핵심 요약 (2-3줄)
- 이 강의에서 다루는 핵심 내용을 간단히 설명

2. 주요 개념 및 용어 정리
- 핵심 기술/개념 용어를 bullet point로 정리
- 각 용어에 대한 간단한 설명 포함

3. 상세 내용 분석
- 강의 내용을 논리적 흐름에 따라 단계별로 구조화
- 중요 개념의 실제 구현 방법과 예시 코드 포함
- Best Practice와 실무 적용 팁 정리

4. 학습 포인트
- 실무에서 특히 주의해야 할 점
- 관련 심화 학습 주제 추천
- 연관된 기술스택이나 도구 소개

주의: 자막에서 추출한 내용이므로 일부 오류가 있을 수 있습니다.
전문 지식을 바탕으로 내용을 보완하고, 실무에 도움되는 인사이트를 추가해주세요.

자막 내용:
${subtitleText}`

            subtitleContent.style.display = "block"
            subtitleContent.textContent = prompt

            // 복사하기 버튼 생성 및 추가
            const copyButton = document.createElement("button")
            copyButton.className = "copy-btn"
            copyButton.textContent = "복사하기"
            copyButton.onclick = () => {
              navigator.clipboard
                .writeText(prompt)
                .then(() => alert("프롬프트가 복사되었습니다."))
                .catch((err) => console.error("복사 실패:", err))
            }

            // 기존 복사 버튼이 있다면 제거
            const existingCopyButton = document.querySelector(".copy-btn")
            if (existingCopyButton) {
              existingCopyButton.remove()
            }

            subtitleContent.parentNode.insertBefore(
              copyButton,
              subtitleContent.nextSibling
            )
          } catch (error) {
            console.error("Error in GPT button click handler:", error)
            alert("GPT 요약 준비 중 오류가 발생했습니다.")
          }
        }
        buttonContainer.appendChild(gptButton)

        // 요약 프롬프트 보기 버튼 추가
        const showPromptButton = document.createElement("button")
        showPromptButton.className = "prompt-btn"
        showPromptButton.textContent = "요약 프롬프트 보기"
        showPromptButton.onclick = async () => {
          try {
            if (!subtitleText) {
              const res = await fetch(response.subtitle)
              const text = await res.text()
              subtitleText = parseSRT(text)
            }

            const prompt = `당신은 IT/개발 교육 컨텐츠 전문 튜터입니다.
아래는 IT/개발 관련 교육 영상의 자막입니다. 
학습자의 이해를 돕기 위해 다음 형식으로 자세히 정리해주세요:

1. 강의 핵심 요약 (2-3줄)
- 이 강의에서 다루는 핵심 내용을 간단히 설명

2. 주요 개념 및 용어 정리
- 핵심 기술/개념 용어를 bullet point로 정리
- 각 용어에 대한 간단한 설명 포함

3. 상세 내용 분석
- 강의 내용을 논리적 흐름에 따라 단계별로 구조화
- 중요 개념의 실제 구현 방법과 예시 코드 포함
- Best Practice와 실무 적용 팁 정리

4. 학습 포인트
- 실무에서 특히 주의해야 할 점
- 관련 심화 학습 주제 추천
- 연관된 기술스택이나 도구 소개

주의: 자막에서 추출한 내용이므로 일부 오류가 있을 수 있습니다.
전문 지식을 바탕으로 내용을 보완하고, 실무에 도움되는 인사이트를 추가해주세요.

자막 내용:
${subtitleText}`

            subtitleContent.style.display = "block"
            subtitleContent.textContent = prompt

            // 복사하기 버튼 생성 및 추가
            const copyButton = document.createElement("button")
            copyButton.className = "copy-btn"
            copyButton.textContent = "복사하기"
            copyButton.onclick = () => {
              navigator.clipboard
                .writeText(prompt)
                .then(() => alert("프롬프트가 복사되었습니다."))
                .catch((err) => console.error("복사 실패:", err))
            }

            // 기존 복사 버튼이 있다면 제거
            const existingCopyButton = document.querySelector(".copy-btn")
            if (existingCopyButton) {
              existingCopyButton.remove()
            }

            subtitleContent.parentNode.insertBefore(
              copyButton,
              subtitleContent.nextSibling
            )
          } catch (error) {
            console.error("Error showing prompt:", error)
            subtitleContent.textContent =
              "프롬프트를 표시하는 중 오류가 발생했습니다."
          }
        }
        buttonContainer.appendChild(showPromptButton)
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
