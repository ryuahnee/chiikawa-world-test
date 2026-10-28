# 눈 떠보니 치이카와 세상

질문 10개로 나와 닮은 치이카와 친구 7종을 찾는 비공식 팬메이드 성향 테스트입니다. 기존 Sites 배포 버전의 원본을 가져왔습니다.

## 실행

저장소 루트에서 `python3 -m http.server 8000 --directory dist`를 실행하고 http://localhost:8000 에 접속합니다. 별도 설치, 빌드, 서버 API, DB가 없습니다.

## 구조

- `dist/index.html`: 시작 페이지와 공통 구조
- `dist/style.css`: 디자인 및 반응형 스타일
- `dist/data.js`: 문항·결과·배점·동점 처리
- `dist/app.js`: 화면 전환, 결과 링크 및 PNG 저장
- `dist/art.js`, `dist/assets/`: 그림 표시 및 실제 캐릭터 이미지
- `docs/spec.md`: 구현 기준
- `tests/scoring.test.cjs`: 전체 답변 조합 검증

## 검증

`node tests/scoring.test.cjs`

## 배포

정적 호스팅에서 빌드 명령 없이 `dist`를 게시 디렉터리로 지정합니다. Cloudflare Pages를 사용한다면 브랜치는 `main`, 프레임워크는 없음, 빌드 명령은 비움, 출력 디렉터리는 `dist`입니다. GitHub 업로드만으로 호스팅 연결이 자동 생성되지는 않습니다.

## 이미지 출처

공식 캐릭터 소개 페이지에서 가져온 이미지이며 원본 URL은 `dist/assets/sources.json`에 있습니다. 캐릭터와 이미지의 권리는 각 권리자에게 있습니다. 이 프로젝트는 공식 서비스가 아닙니다.
