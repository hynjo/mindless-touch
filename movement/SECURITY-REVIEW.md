# Movement 보안 검토

검사일: 2026-09-11 (America/Toronto)

## 결과

현재 소스에서 직접 악용 가능한 애플리케이션 취약점은 확인하지 못했다. 다만 실제 설치된 빌드 의존성 두 패키지에 알려진 취약점이 있으며, `npm audit`은 High 2개, Critical 0개로 집계했다. 이는 패키지 단위 집계이고 관련 권고는 총 4개다. 패키지 경고 등급과 이 애플리케이션에서의 악용 가능성은 구분해야 한다.

## 범위와 방법

- `movement/`의 Movement/Pole HTML, JavaScript, JSON 가져오기·저장·렌더링 경로와 테스트를 검토했다.
- 공통 `package.json`, `package-lock.json`, `vite.config.js`, `.github/workflows/deploy.yml`을 확인했다.
- 실제 설치 트리는 `vite@8.1.4 → postcss@8.5.16 → nanoid@3.3.15`, 런타임 의존성은 `three@0.186.0`이다.
- `npm audit --json`을 npm 레지스트리에 조회했고, 관련 GitHub 보안 권고와 대조했다.
- `node --test movement/tests/*.test.js`: 36개 통과, 실패 0개.
- 추가 파서 검사 8개 통과: 201개 포즈, 비유한 숫자의 JSON 변환 결과(null), 위치 초과, 알 수 없는 관절, 비정상 접촉 객체, 이름 길이 초과, 음수 시간 거부 및 prototype 관련 키 제거 확인. HTML 문자열은 파서에서 문자열로 유지되고 DOM에서는 `textContent`로 처리됨을 소스로 확인했다.
- 소스·의존성 파일을 수정하거나 배포하지 않았다. 이 보고서만 추가했다.

## 발견 사항

### 1. PostCSS 8.5.16의 소스맵 경로 탐색 취약점

위치: `package-lock.json:733`, 공통 Vite 빌드 의존성.

공격자가 조작한 CSS의 `sourceMappingURL`을 PostCSS가 처리하면 처리 프로세스가 접근할 수 있는 다른 `.map` 파일을 읽고, 생성된 소스맵으로 내용이 노출될 수 있다. 경로 탐색 권고는 High이며 8.5.18에서 수정됐지만, `from` 옵션이 없는 경우의 추가 우회까지 해결하려면 8.5.23 이상이 필요하다. [경로 탐색 권고](https://github.com/advisories/GHSA-r28c-9q8g-f849), [후속 우회 권고](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp).

현재 프로젝트는 저장소의 CSS를 빌드하며, 사용자가 불러오는 JSON을 PostCSS로 보내지 않는다. 외부 사용자가 CSS를 제출하는 서버도 없다. 따라서 공개 편집기에서의 원격 파일 유출 경로는 확인되지 않았다. 신뢰할 수 없는 CSS를 빌드 입력으로 받게 되면 별도 평가가 필요하다.

권장 조치: 호환되는 PostCSS 8.5.23 이상으로 잠금 파일을 갱신하고 빌드·테스트·audit을 다시 실행한다.

### 2. nanoid 3.3.15의 무한 루프 취약점

위치: `package-lock.json:694`, PostCSS의 간접 의존성.

비보안 생성기에 음수 크기를 전달하거나 사용자 정의 생성기에 크기 0을 전달하면 무한 루프가 발생할 수 있다. npm audit은 두 권고를 High로 보고한다. 3.x에서는 두 문제를 모두 수정한 3.3.18 이상이 필요하다. [음수 크기 권고](https://github.com/advisories/GHSA-28wg-ghj8-5hjv), [크기 0 권고](https://github.com/advisories/GHSA-2v37-7h3g-55p8).

설치된 PostCSS의 `lib/input.js:80`은 고정 양수 `nanoid(6)`을 사용한다. Movement의 포즈 ID는 `crypto.randomUUID()`로 생성한다. 검토한 경로에서 공격자가 취약 함수의 크기 인자를 제어하는 호출은 발견하지 못했다.

권장 조치: nanoid 3.3.18 이상으로 잠금 파일을 갱신한다. PostCSS 갱신 후에도 실제 해석 버전을 `npm ls postcss nanoid`로 확인한다.

## 확인된 방어 조치

- `main.js:688`: 파일 전체를 읽기 전에 2 MiB 초과 파일을 거부한다.
- `sequence-file.js`: 포즈 수 200개, 이름 길이, 중복 ID, 관절 목록, 벡터 길이, 유한 숫자, 좌표·시간·그립 범위를 검증한다.
- 허용한 필드로 반환 객체를 재구성하며, JSON 객체 전체를 실행 상태에 병합하지 않는다.
- `main.js:618`, `main.js:624`, `main.js:584`: 사용자 텍스트를 `textContent` 또는 입력 요소의 값으로 표시한다. 가져온 값이 HTML 파싱이나 동적 코드 실행으로 들어가는 경로는 발견하지 못했다.
- `main.js:680`: 다운로드 이름을 제한하고 Blob URL을 해제한다.
- `main.js:738`: 외부 참조 링크에 `noopener noreferrer`를 지정한다. 링크는 가져온 JSON이 아닌 저장소의 포즈 카탈로그에서 생성한다.
- Movement 소스에서 API 인증정보, 사용자 데이터 전송, 쿠키·브라우저 저장소 사용은 발견하지 못했다. 서버·DB·로그인 기능이 없어 SQL 주입, 서버 권한 검사, 세션·CSRF 검토는 이 범위에 적용되지 않는다.

## 추가 개선 사항 — 악용이 확인된 취약점과 별도

- CI의 Actions가 커밋 SHA 대신 버전 태그로 지정돼 있다. 승인된 전체 SHA로 고정하면 태그 변경에 따른 공급망 위험을 줄일 수 있다. `npm ci`를 수행하는 빌드 작업과 Pages 배포 작업을 분리하고 배포 작업에만 `pages: write`, `id-token: write`를 주는 구성을 권장한다.
- HTML에는 CSP 메타 정책이 없고 저장소에서 응답 보안 헤더 설정도 확인되지 않았다. 실제 호스팅 응답을 확인한 뒤 CSP와 프레임 삽입 제한을 검토한다. 서버에서 헤더를 추가할 수 있으므로 현재 정보만으로 운영 사이트에 헤더가 없다고 단정할 수 없다.
- `main.js:461`의 썸네일 생성은 모든 포즈의 렌더링·PNG 변환을 동기적으로 수행한다. 최대 200개로 제한돼 있지만 저사양 기기의 반응성을 위해 작업 분할·취소·캐시를 고려할 수 있다. 브라우저 정지나 DoS는 이번 검사에서 재현하지 않았다.

## 후속 검증

우선 잠금 파일의 PostCSS/nanoid를 패치 버전으로 갱신한 뒤 `npm ls postcss nanoid`, `npm audit`, `npm test`, `npm run build`를 실행한다. CI에 지속적인 의존성 취약점 검사를 추가한다.

운영 URL의 TLS·응답 헤더·호스팅 권한, 다른 페이지와 공유하는 origin의 영향, Git 기록 전체의 비밀정보, 브라우저/WebGL 드라이버 취약점은 검사하지 않았다. 실제 브라우저에서의 XSS 실행 시험이나 부하 시험도 수행하지 않았다. 테스트 통과와 이번 미발견 결과가 모든 취약점의 부재를 보장하지는 않는다.
