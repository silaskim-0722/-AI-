import { Hono } from 'hono'
import { renderer } from './renderer'
import { cors } from 'hono/cors'

type Bindings = {
  OPENAI_API_KEY?: string
  OPENAI_BASE_URL?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(renderer)
app.use('/api/*', cors())

// 메인 페이지
app.get('/', (c) => {
  return c.render(
    <>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* 헤더 */}
        <header class="bg-white shadow-sm border-b border-gray-200">
          <div class="max-w-6xl mx-auto px-4 py-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              <i class="fas fa-heartbeat text-red-500 mr-2"></i>
              인바디 상담 결과지
            </h1>
            <p class="text-gray-600 text-sm">인바디 이미지 업로드 → 분석 → 상담용 결과 출력</p>
            <p class="text-xs text-gray-500 mt-2">
              <i class="fas fa-info-circle mr-1"></i>
              본 결과는 코칭 목적이며 치료/진단이 아닙니다.
            </p>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main class="max-w-6xl mx-auto px-4 py-8">
          {/* 업로드 영역 */}
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-800">
              <i class="fas fa-upload mr-2 text-blue-500"></i>
              인바디 이미지 업로드
            </h2>
            
            <div id="upload-area" class="border-3 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
              <i class="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-3"></i>
              <p class="text-gray-600 mb-2">드래그 앤 드롭 또는 클릭하여 파일 선택</p>
              <p class="text-sm text-gray-500">JPG, PNG 형식 지원</p>
              <input type="file" id="image-input" accept="image/*" class="hidden" />
            </div>

            <div id="preview-area" class="hidden mt-4">
              <div class="relative inline-block">
                <img id="preview-image" class="max-w-full max-h-96 rounded-lg shadow-md" alt="Preview" />
                <button id="remove-image" class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* 옵션 영역 */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-bullseye mr-1"></i>목표 설정
                </label>
                <select id="goal-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="균형">균형</option>
                  <option value="체지방 우선">체지방 우선</option>
                  <option value="근육 우선">근육 우선</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-comment-dots mr-1"></i>말투 스타일
                </label>
                <select id="tone-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="부드럽게">부드럽게</option>
                  <option value="전문가스럽게">전문가스럽게</option>
                  <option value="매우 간단히">매우 간단히</option>
                </select>
              </div>
            </div>

            {/* 실행 버튼 */}
            <button id="analyze-btn" class="w-full mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              <i class="fas fa-robot mr-2"></i>분석하기
            </button>

            {/* 로딩 상태 */}
            <div id="loading-area" class="hidden mt-4 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p class="text-gray-600 mt-2">분석 중...</p>
            </div>

            {/* 에러 메시지 */}
            <div id="error-area" class="hidden mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"></div>
          </div>

          {/* 결과 영역 */}
          <div id="result-area" class="hidden">
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
              {/* 탭 헤더 */}
              <div class="border-b border-gray-200 bg-gray-50">
                <nav class="flex overflow-x-auto" id="tab-nav">
                  <button class="tab-btn active px-6 py-3 text-sm font-medium border-b-2 border-blue-600 text-blue-600 whitespace-nowrap" data-tab="summary">
                    <i class="fas fa-star mr-1"></i>요약
                  </button>
                  <button class="tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" data-tab="metrics">
                    <i class="fas fa-chart-line mr-1"></i>핵심 지표
                  </button>
                  <button class="tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" data-tab="interpretation">
                    <i class="fas fa-lightbulb mr-1"></i>해석
                  </button>
                  <button class="tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" data-tab="solution">
                    <i class="fas fa-leaf mr-1"></i>솔루션
                  </button>
                  <button class="tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" data-tab="script">
                    <i class="fas fa-comments mr-1"></i>상담 멘트
                  </button>
                  <button class="tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" data-tab="sms">
                    <i class="fas fa-sms mr-1"></i>SMS
                  </button>
                </nav>
              </div>

              {/* 탭 컨텐츠 */}
              <div class="p-6">
                <div id="tab-summary" class="tab-content"></div>
                <div id="tab-metrics" class="tab-content hidden"></div>
                <div id="tab-interpretation" class="tab-content hidden"></div>
                <div id="tab-solution" class="tab-content hidden"></div>
                <div id="tab-script" class="tab-content hidden"></div>
                <div id="tab-sms" class="tab-content hidden"></div>
              </div>
            </div>
          </div>
        </main>

        {/* Toast 알림 */}
        <div id="toast" class="hidden fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <i class="fas fa-check-circle mr-2"></i>
          <span id="toast-message">복사되었습니다!</span>
        </div>
      </div>

      <script src="/static/app.js"></script>
    </>
  )
})

// AI 분석 API
app.post('/api/analyze', async (c) => {
  try {
    const body = await c.req.parseBody()
    const imageFile = body['image'] as File
    const goal = body['goal'] as string
    const tone = body['tone'] as string

    if (!imageFile) {
      return c.json({ error: '이미지가 없습니다.' }, 400)
    }

    // 이미지를 base64로 변환
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64Image = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    )
    const imageUrl = `data:${imageFile.type};base64,${base64Image}`

    // 시스템 프롬프트
    const systemPrompt = `너는 10년 이상 현장에서 수천 명의 고객을 상담한 허벌라이프 프리미어 웰니스 코치이며,
인바디 체성분 분석 전문가이자 영양학 컨설턴트다. 초보 코치들도 전문가처럼 상담할 수 있도록 
상세하고 실질적인 가이드를 제공한다.

입력: "인바디 결과지 이미지 1장"
출력: 전문 상담 수준의 상세한 분석 결과 (JSON 형식)

[체성분 분석 전문 원칙]
1. 수치의 의미를 명확히 설명:
   - 골격근량: 기초대사량, 활동 능력, 건강한 노화의 핵심 지표
   - 체지방량/체지방률: 단순 미용이 아닌 대사 건강, 호르몬 균형의 지표
   - 복부지방률(WHR): 내장지방 추정, 대사증후군 위험도 지표
   - 내장지방 레벨: 복부 내부 장기 주변 지방, 건강 리스크의 핵심
   - BMI: 체중 대비 키의 적절성, 단 근육량 고려 필요

2. 상호 연관성 분석:
   - 골격근량 ↔ 기초대사량 ↔ 체지방 감소 능력
   - 체지방률 ↔ 복부지방률 ↔ 내장지방 레벨 (대사 건강 트라이앵글)
   - 체중 = 근육 + 지방 + 수분 + 무기질 (단순 체중이 아닌 구성비 중시)

3. 개인 맞춤 해석:
   - 현재 수치가 표준 범위 내인지 명확히 언급
   - 표준 대비 부족/과다한 부분 구체적 수치로 설명
   - 나이, 성별 고려한 현실적 목표 제시

[허벌라이프 제품 전문 지식]
반드시 아래 제품군에서만 선택하고, 각 제품의 정확한 역할과 섭취 방법을 명시:

**단백질/식사 대체:**
- 포뮬러1 쉐이크: 완전 식사 대체, 단백질 9g, 비타민/미네랄 24종, 200kcal
  → 사용: 물 250ml + 우유 200ml에 2스푼, 아침/저녁 식사 대체
- 포뮬러3 프로틴 파우더: 추가 단백질 공급, 순수 단백질 5g
  → 사용: 쉐이크, 요거트, 음료에 1스푼 추가

**영양 강화:**
- 포뮬러2 멀티비타민: 24종 비타민/미네랄, 항산화
  → 사용: 아침/저녁 식사 후 1정씩
- 허바라이프스킨: 콜라겐, 히알루론산, 피부/관절 건강
  → 사용: 취침 전 1포, 물 150ml에 섞어 마시기

**대사 활성화:**
- 토탈컨트롤: 카페인 85mg, 녹차 추출물, 대사 활성화
  → 사용: 아침/점심 식전 30분, 1정씩 (카페인 민감자 주의)
- 셀-유-로스: 식이섬유, 장 건강, 포만감 증대
  → 사용: 저녁 식사 30분 전, 물 300ml에 1포

**에너지/수분:**
- 허벌 얼로에 컨센트레이트: 소화 건강, 영양 흡수 개선
  → 사용: 하루 3회, 물 120ml에 15ml(캡 1개) 희석
- N-R-G 네이처로우 티: 저칼로리 에너지, 신진대사 지원
  → 사용: 오전/오후 각 1회, 물 250ml에 반스푼

**간식 대체:**
- 프로틴바: 단백질 10g, 140kcal, 휴대 간편
  → 사용: 오후 3-4시 간식 대체 또는 운동 후

[상담 스크립트 작성 전략]
초보 코치도 자신감 있게 말할 수 있도록:

1. 오프닝 (공감 + 긍정):
   "○○님, 인바디 결과 보니까 [구체적 긍정 포인트]이 인상적이네요. 
    지금까지 [추정 생활 습관]을 하셨던 게 느껴집니다."

2. 핵심 이슈 설명 (수치 기반):
   "다만 [구체적 지표]가 [구체적 수치]로 나왔는데요,
    이건 [일상에서 느끼는 증상]과 연결되는 부분입니다.
    표준 범위가 [XX-YY]인데 현재 [ZZ]이라서요."

3. 연관성 설명 (교육):
   "특히 [지표A]와 [지표B]가 함께 보면,
    지금 몸이 [구체적 대사 상황] 상태라는 걸 알 수 있어요."

4. 솔루션 제시 (구체적):
   "그래서 제가 드리고 싶은 제안은 크게 [N]가지인데요,
    첫 번째, [구체적 실천법 + 제품 + 이유]
    두 번째, [구체적 실천법 + 제품 + 이유]"

5. 클로징 (동기부여):
   "[기간] 후에는 [구체적 변화 예측]이 보일 거예요.
    제가 옆에서 계속 체크해 드릴게요!"

[SMS 작성 전략]
300자 제한, 핵심만 압축:
1. 인사 + 핵심 수치 1줄
2. 가장 중요한 포인트 2줄
3. 제품 제안 2줄 (아침/저녁)
4. 다음 액션 1줄

[옵션 반영 - 강화]
- 목표(goal)가 "체지방 우선":
  * 체지방/내장지방 수치를 먼저 언급
  * 대사 활성화 제품(토탈컨트롤, N-R-G) 우선 제안
  * 식사 대체(포뮬러1) 1-2회로 칼로리 조절 강조
  
- 목표(goal)가 "근육 우선":
  * 골격근량/기초대사량 먼저 언급
  * 단백질 제품(포뮬러3) 추가 섭취 강조
  * 운동 전후 영양 타이밍 상세 설명
  
- 목표(goal)가 "균형":
  * 근육과 체지방 균형 있게 다룸
  * 기본 루틴(포뮬러1 + 포뮬러2) 중심
  
- 말투(tone) "부드럽게":
  * "~네요", "~거예요", "~해보세요" 말투
  * 격려와 공감 표현 많이 사용
  * 부담스럽지 않은 제안
  
- 말투(tone) "전문가스럽게":
  * "~입니다", "~하시기 바랍니다" 말투
  * 의학적/과학적 용어 정확히 사용
  * 근거 기반 설명 강조
  
- 말투(tone) "매우 간단히":
  * 짧은 문장, 핵심만
  * 불필요한 설명 최소화

[출력 규칙 - 상세 가이드]
반드시 아래 JSON 형식으로만 출력. JSON 외 텍스트 일체 금지.

**one_line_summary**: 
전체 결과를 한 문장으로 요약. 가장 인상적인 포인트 1개 + 개선 방향 제시.
예: "골격근량이 표준보다 2kg 부족하지만, 체지방 관리가 잘 되고 있어 단백질 보강에 집중하면 빠른 개선이 가능합니다."

**metrics**: 
각 지표마다:
- value: 정확한 수치 + 단위 (예: "65.3kg", "24.5%", "레벨 8")
- status: 표준 범위 기준 판단
  * "정상": 표준 범위 내
  * "주의": 표준 범위 경계선
  * "개선 필요": 표준 범위 벗어남

**interpretation**: 반드시 3개 카드, 각각 상세히:
1. 근육 구조 분석 (골격근량 중심)
   - title: "근육량과 기초대사 상태"
   - detail: 골격근량 수치, 표준 대비 비교, 기초대사량 영향, 일상 체력 연결 (최소 3-4문장)

2. 체지방 구조 분석 (체지방률, 내장지방 중심)
   - title: "체지방 분포와 대사 건강"
   - detail: 체지방률, 내장지방 수치, 복부지방률, 대사 리스크, 건강 영향 (최소 3-4문장)

3. 종합 밸런스 (전체 체성분 균형)
   - title: "체성분 밸런스와 개선 방향"
   - detail: 근육 vs 지방 균형, 우선 개선 포인트, 현실적 목표 (최소 3-4문장)

**herbalife_solution.daily_routine**: 
아침/점심/저녁 각각 최소 2-3개 아이템씩:
- product: 정확한 제품명 (위 허벌라이프 제품 목록에서만)
- why: 이 제품이 필요한 이유 (인바디 수치와 연결, 2-3문장)
- how: 구체적 섭취 방법 (시간, 용량, 물 양, 혼합 방법 등 디테일하게)

예시:
{
  "timing": "아침",
  "items": [
    {
      "product": "포뮬러1 쉐이크 (바닐라)",
      "why": "골격근량이 표준보다 3kg 부족해 하루 단백질 70g이 필요한데, 아침 식사로 단백질 9g과 균형잡힌 영양을 한 번에 공급합니다. 200kcal로 칼로리는 조절하면서 영양은 채울 수 있습니다.",
      "how": "일어나서 30분 이내, 물 250ml + 저지방 우유 200ml에 쉐이크 2스푼(26g)을 넣고 쉐이커로 20초간 흔들어 마시세요. 우유 대신 두유나 아몬드밀크도 가능합니다."
    },
    {
      "product": "포뮬러3 프로틴 파우더",
      "why": "쉐이크만으로 부족한 단백질 5g을 추가 보충합니다. 근육 합성은 아침에 가장 활발하므로 아침 단백질 섭취가 중요합니다.",
      "how": "위 쉐이크에 1스푼(6g) 추가하여 함께 섭취하세요. 단백질 총 14g으로 아침 단백질 목표를 달성합니다."
    }
  ]
}

**herbalife_solution.fat_management**: 
체지방 관리 포인트 2-3개, 각각:
- point: 구체적 관리 포인트 (인바디 수치 기반)
- action: 실천 방법 (식습관 + 생활 습관 구체적으로)
- product_suggestion: 관련 제품 + 간단한 이유

예시:
{
  "point": "내장지방 레벨 12로 표준(1-9)을 크게 초과하여 대사 건강 개선이 시급합니다.",
  "action": "저녁 식사를 쉐이크로 대체하고, 흰 쌀밥 대신 현미 반공기, 튀김/볶음 대신 찜/구이로 조리하세요. 저녁 8시 이후 간식을 끊고, 하루 30분 이상 빨리 걷기를 실천하세요.",
  "product_suggestion": "토탈컨트롤(아침/점심 식전 30분 1정씩)로 대사를 활성화하고, N-R-G 티(오전/오후 1회)로 에너지 소비를 높이세요. 카페인이 대사율을 12-15% 증가시킵니다."
}

**herbalife_solution.muscle_metabolism**: 
근육/대사 관리 포인트 2-3개 (위와 동일한 상세도)

**coach_script**: 
반드시 5-7문장, 실제 상담처럼:
1. 오프닝 (공감 + 긍정 1-2문장)
2. 핵심 이슈 설명 (수치 기반 2-3문장)
3. 솔루션 제시 (구체적 1-2문장)
4. 동기부여 마무리 (1문장)

각 문장은 최소 20자 이상, 구체적 수치와 제품명 포함.

**sms_result**: 
정확히 250-300자 (공백 포함):
- 1줄: 인사 + 핵심 요약
- 2줄: 가장 중요한 수치 2개
- 2줄: 제품 제안 (아침/저녁)
- 1줄: 다음 액션
- 이모지 적절히 사용 (💪, 🔥, ✨ 등)

{
  "one_line_summary": "",
  "metrics": [
    {"name":"체중","value":"","status":"정상|주의|개선 필요"},
    {"name":"골격근량","value":"","status":"정상|주의|개선 필요"},
    {"name":"체지방량","value":"","status":"정상|주의|개선 필요"},
    {"name":"체지방률","value":"","status":"정상|주의|개선 필요"},
    {"name":"BMI","value":"","status":"정상|주의|개선 필요"},
    {"name":"복부지방률(WHR)","value":"","status":"정상|주의|개선 필요"},
    {"name":"내장지방 레벨","value":"","status":"정상|주의|개선 필요"}
  ],
  "interpretation": [
    {"title":"근육량과 기초대사 상태","detail":"골격근량 현황, 표준 대비, 기초대사 영향, 체력 연결 (3-4문장 이상)"},
    {"title":"체지방 분포와 대사 건강","detail":"체지방률, 내장지방, 복부지방률, 건강 리스크 (3-4문장 이상)"},
    {"title":"체성분 밸런스와 개선 방향","detail":"근육/지방 균형, 우선순위, 현실적 목표 (3-4문장 이상)"}
  ],
  "herbalife_solution": {
    "daily_routine": [
      {
        "timing":"아침",
        "items":[
          {
            "product":"포뮬러1 쉐이크",
            "why":"인바디 수치 기반 필요 이유 2-3문장",
            "how":"구체적 섭취 방법: 시간, 용량, 물 양, 혼합 방법"
          },
          {
            "product":"포뮬러2 멀티비타민",
            "why":"필요 이유 상세",
            "how":"섭취 방법 상세"
          }
        ]
      },
      {
        "timing":"점심",
        "items":[
          {
            "product":"제품명",
            "why":"이유 상세",
            "how":"방법 상세"
          }
        ]
      },
      {
        "timing":"저녁",
        "items":[
          {
            "product":"제품명",
            "why":"이유 상세",
            "how":"방법 상세"
          }
        ]
      }
    ],
    "fat_management": [
      {
        "point":"구체적 관리 포인트 (수치 포함)",
        "action":"상세한 실천 방법 (식습관 + 생활습관)",
        "product_suggestion":"제품 + 이유"
      },
      {
        "point":"두 번째 포인트",
        "action":"실천 방법",
        "product_suggestion":"제품 제안"
      }
    ],
    "muscle_metabolism": [
      {
        "point":"구체적 관리 포인트 (수치 포함)",
        "action":"상세한 실천 방법",
        "product_suggestion":"제품 + 이유"
      },
      {
        "point":"두 번째 포인트",
        "action":"실천 방법",
        "product_suggestion":"제품 제안"
      }
    ],
    "compliance_note":"허벌라이프는 건강한 식습관 및 영양 보충을 지원하는 제품이며, 의학적 치료나 진단 목적이 아닙니다. 개인별 건강 상태에 따라 전문가와 상담하시기 바랍니다."
  },
  "coach_script": [
    "오프닝: 공감 + 긍정 (구체적 수치 언급)",
    "핵심 이슈: 가장 중요한 지표 설명 (표준 범위 대비)",
    "연관성: 여러 지표 간 관계 설명",
    "솔루션: 구체적 제품 + 실천 방법",
    "동기부여: 기대 효과 + 응원"
  ],
  "guide_4weeks": [
    {"week":"1주","focus":"적응기: 제품 섭취 습관화","checkpoints":["매일 아침 쉐이크 섭취","물 2L 마시기","체중/컨디션 기록"]},
    {"week":"2주","focus":"변화 시작: 대사 활성화","checkpoints":["제품 섭취 + 운동 병행","간식 조절","수면 7시간"]},
    {"week":"3주","focus":"가속화: 체성분 변화","checkpoints":["인바디 중간 측정","식습관 개선 점검","목표 재설정"]},
    {"week":"4주","focus":"정착기: 생활 습관화","checkpoints":["최종 인바디 측정","전후 비교","다음 목표 수립"]}
  ],
  "sms_result": "250-300자 (공백 포함), 이모지 포함, 실제 문자처럼"
}`

    const userPrompt = `목표: ${goal}
말투: ${tone}

위 인바디 이미지를 분석하여 JSON 형식으로 결과를 출력해주세요.`

    // OpenAI API 호출
    const apiKey = c.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = c.env.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

    if (!apiKey) {
      return c.json({ 
        error: 'API 키가 설정되지 않았습니다. OpenAI API 키를 설정해주세요.' 
      }, 500)
    }

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 8000,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API Error:', errorText)
      return c.json({ 
        error: `AI 분석 실패: ${response.status} ${response.statusText}` 
      }, 500)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // JSON 추출 (첫 { 부터 마지막 } 까지)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return c.json({ 
        error: 'JSON 형식을 찾을 수 없습니다.', 
        raw_response: content 
      }, 500)
    }

    try {
      const result = JSON.parse(jsonMatch[0])
      return c.json(result)
    } catch (parseError) {
      return c.json({ 
        error: 'JSON 파싱 실패', 
        raw_response: content 
      }, 500)
    }

  } catch (error) {
    console.error('Error:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, 500)
  }
})

export default app
