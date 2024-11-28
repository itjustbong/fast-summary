# FastCampus Summary Extension

<p align="center">
  <img src="icons/fast_review_128.png" alt="FastCampus Subtitle Downloader Logo" width="128" height="128">
</p>

## 소개

FastCampus Subtitle Downloader는 FastCampus 강의의 자막을 다운로드하고 ChatGPT를 활용하여 강의 내용을 효과적으로 요약할 수 있는 Chrome 확장 프로그램입니다.

## 주요 기능

- 📝 강의 자막 다운로드
- 🎥 강의 영상 다운로드
- 👀 자막 미리보기
- 🤖 ChatGPT를 활용한 강의 내용 요약
- 📋 맞춤형 프롬프트 생성 및 복사

## 기술 스택

- JavaScript
- Chrome Extension APIs
- HTML/CSS
- ChatGPT API 연동

## 설치 방법

1. 이 저장소를 클론 또는 다운로드합니다
2. Chrome 브라우저에서 `chrome://extensions`로 이동합니다
3. 우측 상단의 "개발자 모드"를 활성화합니다
4. "압축해제된 확장 프로그램을 로드합니다" 버튼을 클릭합니다
5. 다운로드 받은 폴더를 선택합니다

## 사용 방법

1. FastCampus 강의 페이지에서 확장 프로그램 아이콘을 클릭합니다
2. 현재 재생 중인 강의의 자막 또는 영상을 다운로드할 수 있습니다
3. "자막 보기" 버튼으로 자막 내용을 미리 확인할 수 있습니다
4. "GPT로 요약하기" 버튼을 통해 강의 내용을 ChatGPT로 요약할 수 있습니다

## 주요 기능 상세 설명

### 자막 다운로드 및 처리

- SRT 형식의 자막 파일 다운로드
- HTML 태그 제거 및 텍스트 정제
- 시간 정보 제외한 순수 자막 텍스트 추출

### ChatGPT 연동

- 강의 내용 자동 요약
- 주요 개념 및 용어 정리
- 실무 적용 팁 및 학습 포인트 제공
- 맞춤형 프롬프트 생성

### 보안 및 권한

- `manifest.json`에 정의된 필수 권한만 사용
- FastCampus 도메인 및 관련 서비스에 대한 제한된 접근
- 사용자 데이터 보호

## 주의사항

- 이 확장 프로그램은 교육 목적으로만 사용해야 합니다
- FastCampus의 이용약관을 준수하여 사용해 주세요
- 다운로드한 콘텐츠의 무단 배포는 금지됩니다
