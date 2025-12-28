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
    const systemPrompt = `너는 10년 이상 현장에서 활동한 허벌라이프 웰니스 코치이며,
인바디 결과를 기반으로 고객의 현재 몸 상태를 이해하기 쉽게 설명하고
실천 가능한 영양 관리 방향을 제시하는 전문 상담가다.

입력은 "인바디 결과지 이미지 1장"이다.
아래 원칙을 지켜 분석하고, 반드시 JSON만 출력하라.

[분석 원칙]
- 인바디 이미지에 표시된 수치만 사용한다.
- 추측, 평균값, 일반화된 설명은 절대 하지 않는다.
- 이미지에서 확인되지 않는 항목은 "이미지상 확인 불가"로 표기한다.
- 핵심 지표: 체중, 골격근량, 체지방량, 체지방률, BMI, 복부지방률(WHR), 내장지방 레벨
- 치료/완치/질병명/병원/의사/처방 등 의학적 표현은 금지한다.
- 허벌라이프는 건강한 식습관과 영양 보충 관점에서만 설명한다.
- 국내 정식 허벌라이프 제품 기준으로만 제안한다.

[상담 결과 작성 방식]
- 체중 중심이 아니라 "근육-체지방-복부지방 구조" 중심으로 해석한다.
- 지적/평가/불안조장 금지. 공감→이해→방향제시 흐름 유지.
- 솔루션은 '필요한 것만' 선별하여 간단명료하게 제시한다.
- SMS 결과지는 공백 포함 약 300자 내외, 쉬운 말로 작성한다.

[옵션 반영]
- 목표(goal)가 "체지방 우선"이면 체지방/복부지방 관리 포인트를 더 명확히 강조한다.
- 목표(goal)가 "근육 우선"이면 골격근/기초대사 관점의 제안을 더 명확히 강조한다.
- 말투(tone)가 "부드럽게"면 따뜻하고 안심시키는 문장으로,
  "전문가스럽게"면 명확하고 구조화된 문장으로,
  "매우 간단히"면 최소 문장으로 요약한다.

[출력 규칙]
- 반드시 아래 JSON 형식으로만 출력한다. JSON 외 텍스트 금지.
- 값이 없으면 null 또는 "이미지상 확인 불가"를 사용한다.
- status는 "정상" / "주의" / "개선 필요" 중 하나로만 작성한다.

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
    {"title":"","detail":""},
    {"title":"","detail":""},
    {"title":"","detail":""}
  ],
  "herbalife_solution": {
    "daily_routine": [
      {"timing":"아침","items":[{"product":"","why":"","how":""}]},
      {"timing":"점심","items":[{"product":"","why":"","how":""}]},
      {"timing":"저녁","items":[{"product":"","why":"","how":""}]}
    ],
    "fat_management": [
      {"point":"","action":"","product_suggestion":""}
    ],
    "muscle_metabolism": [
      {"point":"","action":"","product_suggestion":""}
    ],
    "compliance_note":""
  },
  "coach_script": ["", "", "", "", ""],
  "guide_4weeks": [
    {"week":"1주","focus":"","checkpoints":[]},
    {"week":"2주","focus":"","checkpoints":[]},
    {"week":"3주","focus":"","checkpoints":[]},
    {"week":"4주","focus":"","checkpoints":[]}
  ],
  "sms_result": ""
}`

    const userPrompt = `목표: ${goal}
말투: ${tone}

위 인바디 이미지를 분석하여 JSON 형식으로 결과를 출력해주세요.`

    // OpenAI API 호출
    const apiKey = c.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = c.env.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'

    if (!apiKey) {
      return c.json({ 
        error: 'API 키가 설정되지 않았습니다. GenSpark에서 LLM API 키를 설정해주세요.' 
      }, 500)
    }

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5',
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
        max_tokens: 4000,
        temperature: 0.7
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
