console.log("ChatGPT content script loaded!")

// storage에서 프롬프트 가져와서 입력하는 함수
async function loadAndPastePrompt() {
  try {
    const data = await chrome.storage.local.get("gptPrompt")
    console.log("Retrieved from storage:", data)

    if (data.gptPrompt) {
      const editor = document.querySelector("#prompt-textarea")
      if (editor) {
        editor.textContent = data.gptPrompt
        editor.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            cancelable: true,
          })
        )

        // 사용한 프롬프트는 storage에서 제거
        await chrome.storage.local.remove("gptPrompt")
        console.log("Prompt pasted and cleared from storage")
      }
    }
  } catch (error) {
    console.error("Error loading prompt:", error)
  }
}

// MutationObserver로 에디터 엘리먼트 감시
const observer = new MutationObserver((mutations, obs) => {
  const editor = document.querySelector("#prompt-textarea")
  if (editor) {
    console.log("Editor found, attempting to paste prompt")
    loadAndPastePrompt()
    obs.disconnect() // 에디터를 찾았으면 감시 중단
  }
})

// body 전체의 변경 감지
observer.observe(document.body, {
  childList: true,
  subtree: true,
})

// 페이지 로드 시에도 한 번 체크
document.addEventListener("DOMContentLoaded", () => {
  const editor = document.querySelector("#prompt-textarea")
  if (editor) {
    console.log("Editor found on initial load")
    loadAndPastePrompt()
  }
})
