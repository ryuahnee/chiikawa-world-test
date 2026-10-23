# 작업 지침

README.md와 docs/spec.md를 먼저 읽습니다. 별도 요청이 없으면 기존 디자인, 실제 캐릭터 이미지, 문항·결과 문구 및 배점을 보존합니다. 데이터는 dist/data.js, UI 동작은 dist/app.js에 분리되어 있습니다. 수정 후 node tests/scoring.test.cjs와 관련 JS 구문 검사를 실행합니다. 빌드 없이 dist를 정적 호스팅합니다. 이미지 출처를 보존하고 인증정보나 Sites 내부 배포 설정을 저장소에 추가하지 않습니다.
