# App Store 출시 체크리스트

## 0. 이 Mac 준비 (한 번만)
- Xcode → Settings → Components에서 **iOS 26.5 플랫폼**을 내려받아요 (지금 없어서 빌드가 안 돼요).
- 터미널: `sudo xcode-select -s /Applications/Xcode.app` (지금은 Command Line Tools를 가리키고 있어요).

## 1. Apple Developer Program
- https://developer.apple.com/programs/ 가입 (연 $99).
- App Store Connect → 비즈니스(계약): **유료 앱 계약** 서명, 세금·은행 계좌 등록. 이게 끝나야 후원(인앱 구매)이 동작해요.
- **App Store Small Business Program** 신청 → 수수료 15%.

## 2. 앱 만들기 (App Store Connect → 앱 → +)
- 번들 ID: `com.yujeong.fairyplayground` (바꾸려면 `capacitor.config.ts`, Xcode, `src/tips.ts` 상품 ID를 함께 바꿔요)
- 이름: 동화 놀이터 / 기본 언어: 한국어
- 카테고리: **키즈 (만 5세 이하)** + 게임 또는 교육
- 연령 등급: 4+
- 가격: 무료
- 개인정보 처리방침 URL: `https://kyjzzang81.github.io/game-for-my-daughter/privacy.html` (배포 후 열리는지 확인)
- 앱 개인정보 보호: **"데이터를 수집하지 않음"**

## 3. 후원 상품 (앱 내 구입 → 소모성)
| 제품 ID | 참조 이름 | 가격 | 표시 이름 |
|---|---|---|---|
| `com.yujeong.fairyplayground.tip.coffee` | 커피 한 잔 | ₩1,500 | ☕ 커피 한 잔 |
| `com.yujeong.fairyplayground.tip.cake` | 케이크 | ₩4,400 | 🍰 케이크 한 쪽 |
| `com.yujeong.fairyplayground.tip.big` | 큰 응원 | ₩9,900 | 🎁 큰 응원 |

- 설명 예: "개발자에게 커피 한 잔을 사 줘요. 게임에서 바뀌는 건 없어요."
- 심사용 스크린샷: 후원 화면 캡처.
- 첫 앱 버전을 심사에 낼 때 이 세 상품을 **함께 선택해서** 제출해요.

## 4. 빌드와 업로드
```bash
npm run ios
```
- Xcode → App 타깃 → Signing & Capabilities → Team 선택 (In-App Purchase capability 추가).
- 버전(MARKETING_VERSION)·빌드 번호 확인 → Product → Archive → Distribute App → App Store Connect.
- 실기기에서 TestFlight로 후원 결제 테스트 (샌드박스 계정은 App Store Connect → 사용자 및 액세스 → 샌드박스).

## 5. 심사 자료
- 스크린샷: iPhone 6.9" (1320×2868 가로), iPad 13" (2064×2752 가로). 시뮬레이터에서 ⌘S.
- 심사 메모 예: "후원 화면은 홈 오른쪽 위 💌 버튼에 있으며, 보호자 확인(곱셈 문제)을 거칩니다. 팁은 소모성 인앱 구매이며 어떤 기능도 열지 않습니다. 광고·분석 SDK·외부 링크가 없습니다."
- 앱 안에는 외부 링크가 없어요. 나중에 링크를 넣는다면 보호자 확인 뒤에만 둬야 해요 (키즈 카테고리 규정).

## 앱 구조
- `src/scenes/AboutScene.ts`: 보호자 확인 → 만든 사람 이야기 + 후원 버튼
- `src/tips.ts`: 상품 ID, 웹/앱 분기
- `ios/App/App/TipJarPlugin.swift`: StoreKit 2 결제 (외부 SDK 없음)
