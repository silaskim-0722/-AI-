# 인바디 상담 결과지 (Herbalife Coach InBody Report)

## 프로젝트 개요
- **프로젝트명**: 인바디 상담 결과지 웹앱
- **목표**: 허벌라이프 코치들이 인바디 결과지 이미지를 업로드하면 AI가 수치를 분석하고 맞춤 솔루션, 상담 스크립트, SMS 결과지를 자동 생성
- **주요 기능**: 
  - 인바디 이미지 업로드 (드래그&드롭 + 파일 선택)
  - AI 비전 모델을 통한 인바디 수치 자동 인식 및 분석
  - 허벌라이프 제품 중심의 맞춤 솔루션 제공
  - 상담용 멘트 및 SMS 결과지 자동 생성
  - 탭/섹션으로 구분된 결과 표시
  - 각 섹션별 복사 기능

## 📍 URL
- **개발 서버**: https://3000-isso04whx9nn6o9avgi93-d0b9e1e2.sandbox.novita.ai
- **API 엔드포인트**: `/api/analyze` (POST)

## 🎯 완성된 기능

### 1. 인바디 이미지 업로드
- ✅ 드래그 앤 드롭 지원
- ✅ 파일 선택 버튼
- ✅ 이미지 미리보기
- ✅ 이미지 삭제 및 재선택

### 2. 분석 옵션 설정
- ✅ 목표 선택: 균형 / 체지방 우선 / 근육 우선
- ✅ 말투 선택: 부드럽게 / 전문가스럽게 / 매우 간단히

### 3. AI 분석 실행
- ✅ "분석하기" 버튼으로 AI 호출
- ✅ 로딩 상태 표시 (스피너 + 안내 메시지)
- ✅ 에러 처리 및 사용자 피드백

### 4. 결과 표시 (6개 탭)
- ✅ **요약**: 한 줄 요약 (카드 형태)
- ✅ **핵심 지표**: 체중, 골격근량, 체지방량, 체지방률, BMI, 복부지방률, 내장지방 레벨 (테이블 + 상태 표시)
- ✅ **해석**: 3개 카드로 현재 상태 해석
- ✅ **솔루션**: 
  - 일일 루틴 (아침/점심/저녁)
  - 체지방 관리 포인트
  - 근육/대사 관리 포인트
  - 컴플라이언스 안내
- ✅ **상담 멘트**: 5문장 + 전체 복사 버튼
- ✅ **SMS**: 약 300자 결과지 + 복사 버튼

### 5. 복사 기능
- ✅ 각 섹션별 복사 버튼
- ✅ 복사 성공 시 토스트 알림

## 🚧 아직 구현되지 않은 기능
- ⏳ 데이터 저장 기능 (현재는 브라우저 내에서만 처리, 새로고침 시 초기화)
- ⏳ 이전 분석 결과 조회
- ⏳ PDF 다운로드 기능
- ⏳ 4주 가이드 탭 (데이터는 받지만 UI 미구현)
- ⏳ Cloudflare Pages 프로덕션 배포

## 📊 데이터 아키텍처

### AI 모델
- **사용 모델**: GPT-5 (GenSpark LLM Proxy)
- **입력**: 인바디 결과지 이미지 + 시스템 프롬프트 + 사용자 옵션(목표/말투)
- **출력**: JSON 형식의 구조화된 분석 결과

### 데이터 흐름
1. 사용자가 인바디 이미지 업로드
2. 프론트엔드에서 이미지를 base64로 변환
3. `/api/analyze` 엔드포인트로 POST 요청
4. 백엔드에서 OpenAI Vision API 호출 (이미지 분석)
5. AI가 JSON 형식으로 분석 결과 반환
6. 프론트엔드에서 결과를 파싱하여 6개 탭으로 렌더링

### 데이터 모델
```typescript
{
  one_line_summary: string,
  metrics: Array<{
    name: string,
    value: string,
    status: "정상" | "주의" | "개선 필요"
  }>,
  interpretation: Array<{
    title: string,
    detail: string
  }>,
  herbalife_solution: {
    daily_routine: Array<{
      timing: string,
      items: Array<{
        product: string,
        why: string,
        how: string
      }>
    }>,
    fat_management: Array<{
      point: string,
      action: string,
      product_suggestion: string
    }>,
    muscle_metabolism: Array<{
      point: string,
      action: string,
      product_suggestion: string
    }>,
    compliance_note: string
  },
  coach_script: string[],
  guide_4weeks: Array<{
    week: string,
    focus: string,
    checkpoints: string[]
  }>,
  sms_result: string
}
```

### 저장소
- **현재**: 저장 없음 (브라우저 메모리)
- **향후 계획**: Cloudflare D1 Database 또는 KV Storage

## 💻 기술 스택
- **프레임워크**: Hono (v4.11.3) - Cloudflare Workers 최적화
- **런타임**: Cloudflare Workers
- **프론트엔드**: 
  - TailwindCSS (CDN)
  - Font Awesome 6.4.0 (아이콘)
  - Vanilla JavaScript
- **AI**: OpenAI Vision API (GPT-5)
- **빌드 도구**: Vite (v6.3.5)
- **배포**: Wrangler (Cloudflare Pages)

## 🚀 사용 방법

### 1. 환경 설정
**중요**: AI 분석 기능을 사용하려면 GenSpark LLM API 키가 필요합니다.

1. GenSpark 프로젝트의 **API Keys** 탭으로 이동
2. API 키 생성
3. **Inject** 버튼을 클릭하여 샌드박스 환경에 주입

또는 `.dev.vars` 파일을 생성하여 로컬 개발 시 사용:
```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://www.genspark.ai/api/llm_proxy/v1
```

### 2. 로컬 개발 서버 시작
```bash
# 포트 정리
npm run clean-port

# 빌드
npm run build

# PM2로 서버 시작
pm2 start ecosystem.config.cjs

# 서버 상태 확인
pm2 list

# 로그 확인
pm2 logs webapp --nostream

# 서버 재시작
npm run clean-port && pm2 restart webapp

# 서버 중지
pm2 delete webapp
```

### 3. 웹앱 사용
1. 브라우저에서 개발 서버 URL 접속
2. 인바디 결과지 이미지 업로드 (드래그&드롭 또는 파일 선택)
3. 목표 및 말투 선택 (선택사항)
4. "분석하기" 버튼 클릭
5. AI 분석 완료 후 6개 탭에서 결과 확인
6. 필요한 섹션의 "복사" 버튼으로 클립보드에 복사

## 📋 권장 다음 단계

### 우선순위 높음
1. **API 키 설정 테스트**: GenSpark에서 LLM API 키를 설정하고 실제 인바디 이미지로 테스트
2. **에러 핸들링 개선**: JSON 파싱 실패 시 더 나은 사용자 경험 제공
3. **4주 가이드 탭 UI 구현**: 현재 데이터는 받지만 표시 안 됨

### 우선순위 중간
4. **Cloudflare Pages 배포**: 프로덕션 환경에 배포
5. **PDF 다운로드**: 결과를 PDF로 저장하는 기능 추가
6. **모바일 반응형 최적화**: 작은 화면에서 더 나은 UX

### 우선순위 낮음
7. **데이터 저장**: Cloudflare D1으로 분석 이력 저장
8. **사용자 인증**: 코치별 결과 관리
9. **통계 대시보드**: 분석 통계 및 인사이트 제공

## 🔒 컴플라이언스 및 보안
- ✅ 치료/완치/질병명/병원/의사/처방 등 의학적 표현 금지
- ✅ 코칭 목적 명시 (치료/진단 아님)
- ✅ 허벌라이프 국내 정식 제품만 제안
- ✅ 건강한 식습관 및 영양 보충 관점으로만 설명
- ⚠️ 개인정보(이름/성별/나이) 마스킹 없음 (현재는 저장하지 않으므로 문제 없음)

## 📁 프로젝트 구조
```
webapp/
├── src/
│   ├── index.tsx          # 메인 Hono 애플리케이션 (백엔드 + 프론트 렌더링)
│   └── renderer.tsx       # JSX 렌더러 (HTML 헤드 설정)
├── public/
│   └── static/
│       ├── app.js         # 프론트엔드 JavaScript (UI 로직)
│       └── style.css      # 커스텀 CSS
├── dist/                  # 빌드 결과물
├── ecosystem.config.cjs   # PM2 설정
├── wrangler.jsonc         # Cloudflare 설정
├── package.json           # 의존성 및 스크립트
├── tsconfig.json          # TypeScript 설정
├── vite.config.ts         # Vite 빌드 설정
└── README.md              # 프로젝트 문서
```

## 🎨 UI/UX 특징
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **직관적 인터페이스**: 드래그 앤 드롭, 탭 전환, 원클릭 복사
- **시각적 피드백**: 로딩 스피너, 토스트 알림, 상태 배지
- **접근성**: 의미있는 아이콘, 명확한 레이블
- **성능**: 빠른 로딩, 부드러운 애니메이션

## 🐛 알려진 이슈
- ⚠️ AI 응답이 JSON 형식이 아닐 경우 fallback 처리 필요
- ⚠️ 매우 큰 이미지 업로드 시 성능 저하 가능
- ⚠️ 인터넷 연결 없이는 AI 분석 불가 (CDN 의존성)

## 📝 라이선스
허벌라이프 코칭 전용 내부 도구

## 📧 문의
프로젝트 관련 문의는 GenSpark 프로젝트 페이지를 통해 연락주세요.

---

**마지막 업데이트**: 2025-12-28  
**상태**: ✅ 개발 완료 (프로덕션 배포 대기)  
**버전**: 1.0.0
