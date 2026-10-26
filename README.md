# 동화 놀이터

아이들이 동화 속 장면을 눌러 보며 노는 게임이에요. Vite + Phaser + TypeScript로 만들고, Capacitor로 iPhone·iPad·Mac 앱을 만들어요.

## 실행

```bash
npm install
npm run dev
```

## 폴더

- `src/stories/` — 이야기별 장면 (`hood.ts` 빨간 모자, `pigs.ts` 아기 돼지 삼형제)
- `src/scenes/StoryScene.ts` — 이야기 진행과 장면 도우미
- `src/ui.ts` — 배경, 버튼, 등장인물(`Actor`)
- `src/audio/` — 목소리와 효과음
- `public/assets/voice/` — 타입캐스트로 만든 대사 mp3
- `public/assets/img/` — 3D 점토 이미지

## 에셋 만들기

API 키는 `.env`에 넣어요 (`.env.example` 참고).

```bash
npm run lines                                   # 게임에서 말하는 대사 모두 보기
npm run voices -- --story hood --page 0         # 한 장면 대사만 mp3로
npm run voices                                  # 모든 대사
npm run images                                  # scripts/images.json의 이미지 모두
```

- 이미 만든 파일은 건너뛰어요. 다시 만들려면 해당 파일을 지우고 다시 실행하세요.
- 등장인물 목소리는 `scripts/voices.json`, 그림 목록과 그림체는 `scripts/images.json`에서 바꿔요.
- 연기 톤은 `scripts/direction.json`(연출표)에서 대사마다 감정·세기·빠르기를 정해요. 바꾼 뒤 `npm run voices -- --redo`.
- 그림 원본은 `assets-src/img/`(git에 올리지 않음)에 두고, 다듬은 그림만 `public/assets/img/`에 써요.
  다듬는 방법(테두리 정리, 여백 자르기, 크기)을 바꿨다면 `npm run images -- --process`로 원본에서 다시 다듬어요.
- 그림 한 장만 다시 만들려면 `assets-src/img/<이름>.png`를 지우고 `npm run images -- --only <이름>`.
- 대사를 고치면 파일 이름(해시)이 바뀌어서, 다음에 `npm run voices`를 돌릴 때 새로 만들어져요. 그 전까지는 브라우저 음성으로 읽어요.
- 이미지가 없는 등장인물은 이모지로 그려져요.

## iPhone·iPad·Mac 앱

Xcode가 필요해요.

```bash
npm run ios
```

Xcode가 열리면 실행 대상을 고르세요. Apple Silicon Mac에서는 "My Mac (Designed for iPad)"를 고르면 Mac에서도 실행돼요.
