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
    const systemPrompt = `[중요: 이 작업은 의료 진단이나 치료 목적이 아닙니다]
이것은 웰니스 코칭 및 영양 보충제 추천을 위한 체성분 데이터 분석입니다.
인바디(InBody)는 상용 체성분 분석 기기이며, 이 데이터는 건강한 라이프스타일과 
영양 계획을 위한 참고 자료로만 사용됩니다.

역할: 너는 10년 이상 현장에서 수천 명의 고객을 상담한 허벌라이프 프리미어 웰니스 코치이며,
인바디 체성분 분석 전문가이자 영양학 컨설턴트다. 초보 코치들도 전문가처럼 상담할 수 있도록 
상세하고 실질적인 가이드를 제공한다.

입력: "인바디 결과지 이미지 1장"
출력: 웰니스 코칭을 위한 전문 분석 결과 (JSON 형식)

준수사항:
- 의료 진단, 질병 치료, 처방 관련 내용은 절대 포함하지 않음
- 건강한 식습관 및 영양 보충 관점으로만 제안
- 허벌라이프 제품은 영양 보충제로서만 설명

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

[허벌라이프 제품 전문 지식 - 2025년 최신 정보]
반드시 아래 실제 제품명과 가격으로만 제안. 각 제품의 정확한 역할과 섭취 방법 명시:

**핵심 영양 (체중조절용 조제식품/특수영양식품):**
- Formula 1 건강한 식사 (63,000원): 7가지 맛 (바닐라, 초콜릿, 스트로베리, 쿠키앤크림, 민트초코렛, 부드러운커피, 부드러운캐러멜)
  * 단백질 9g, 17가지 비타민·무기질, 식이섬유 3g, 허브 성분
  * 체중조절용 조제식품 - 식사 대용으로 섭취
  → 섭취법: 물 250ml + 저지방우유 200ml에 2스푼(26g), 쉐이커로 20초 흔들기
  → 시간: 일어나서 30분 이내 (아침) 또는 저녁 식사 대체
  
- Formula 2 멀티비타민·무기질 컴플렉스 (33,300원): 12가지 비타민 + 9가지 무기질 + 5가지 식물성분
  * 건강기능식품
  → 섭취법: 아침/저녁 식사 후 각 1정씩, 물과 함께
  
- Formula 3 퍼스널 단백질 파우더 (65,600원): 순수 단백질 보충
  → 섭취법: 쉐이크에 1스푼 추가 또는 요거트, 음료에 혼합

**번들팩 (편리한 세트):**
- Formula 1 쿠키앤크림맛 번들팩 (66,000원): 30포 개별포장
- 허벌 베버리지 번들팩 (79,600원): 30포 개별포장

**에너지 & 수분 보충:**
- 허벌 베버리지 (77,300원): 에너지 음료, 상쾌한 맛
  → 섭취법: 물 350ml에 2스푼, 하루 2-3회
  
- 엔-알-지 티 (N-R-G Tea) (34,700원): 오렌지페코 홍차와 녹차 추출물
  → 섭취법: 따뜻한 물 250ml에 반스푼, 오전/오후
  
- 허벌 알로에 겔 (51,300원): 알로에베라 농축액, 소화 건강
  → 섭취법: 물 120ml에 15ml(캡 1개), 하루 3회

**장 건강 & 식이섬유:**
- 셀-유-로쓰 (32,800원): 식이섬유 보충
  → 섭취법: 물 300ml에 1포, 저녁 식사 30분 전
  
- 액티브 화이버 컴플렉스 (53,000원): 식이섬유 + 프로바이오틱스
  → 섭취법: 물 200ml에 1포, 아침 공복

- 프로바이오틱 컴플렉스 플러스 (85,600원): 유산균 20억 CFU
  → 섭취법: 아침 공복에 1정

**면역 & 활력:**
- 마이뮨 플러스 (65,500원): 면역 기능 지원
  → 섭취법: 아침 식후 1정
  
- 홍삼 진센 겔 (187,600원): 6년근 홍삼 농축액
  → 섭취법: 하루 1포, 물 없이 직접 섭취
  
- 프롤레사 듀오 (202,200원): 이중 발효 유산균
  → 섭취법: 아침 공복 1포

**간편 간식:**
- 프로틴 바 디럭스 (58,200원): 초콜릿가공품, 단백질 10g
  → 섭취법: 오후 3-4시 간식 또는 운동 후
  
- 하이 프로틴 아이스 커피 (57,300원): 일반식품(커피), 크리미커피/모카
  → 섭취법: 차가운 물 250ml에 1포

**기타 영양 보충:**
- 나이트웍스 (113,000원): 비타민 C, E, 엽산 - 혈행 개선
- 리프트오프 (103,000원): 에너지 부스터 태블릿
- 트리플 헬스 드링크 10병 (61,700원): 간편한 영양 음료
- 릴렉세이션 티 (77,300원): 허브차, 진정 효과
- 키토산 플러스 (99,000원): 키토산 보충

**스포츠 라인 (HERBALIFE24):**
- Formula 1 스포츠 (96,400원): 운동선수용 식사 대체
- 리빌드 스트랭쓰 (156,300원): 운동 후 근육 회복
- 씨알세븐 드라이브 (57,200원): 운동 전 에너지
- 스포츠 프로그램 (309,900원): 종합 스포츠 세트

**프로그램 (고객 맞춤 세트):**
- 건강한 아침식사 프로그램 (161,900원)
- 퀵스타트 프로그램 (290,500원)
- 체중조절 프로그램 (441,400원)
- 장튼튼&식이섬유 프로그램 (446,400원)
- 면역튼튼 알로에겔 세트 (307,900원)

[실전 제품 설명 가이드 - 고객 언어로]
**Formula 1 건강한 식사 설명법:**
"우주에서도 먹을 수 있을 정도로 완벽한 영양소만 쏙쏙 뽑아 만든 식사예요. 
7가지 맛으로 질리지 않고, 두부 1모에 달하는 단백질 9g이 들어있어요. 
놀라운 건 칼로리가 밥 2스푼, 김밥 2알 정도인 90칼로리밖에 안 돼서 
칼로리 걱정 없이 영양은 꽉 채울 수 있다는 거죠.
17가지 비타민·무기질 + 식이섬유 + 허브 + 소화효소(파파인, 브로멜라인)까지 들어있어서
속이 더부룩하거나 불편한 분들도 편하게 드실 수 있어요."

**Formula 2 멀티비타민 설명법:**
"쉐이크가 밥이라면 이건 반찬이에요. 쉐이크와 짝꿍으로 맞춰놓은 비타민·무기질 타블렛이죠.
다른 비타민 드시고 계시면 다 먹고 이걸로 바꾸세요.
에너지가 부족하거나 감량 속도가 느릴 때, 생각보다 미량영양소 부족으로 대사가 안 될 가능성이 높거든요.
이럴 때 집중적으로 사용하면 효과가 확 달라집니다."

**Formula 3 단백질 파우더 설명법:**
"이름 그대로 퍼스널, 개인 맞춤 단백질이에요.
근육이 부족하거나, 운동하시거나, 단백질이 더 필요한 분들을 위한 순수 단백질 보충제입니다.
쉐이크에 1스푼 추가하면 단백질이 15g 이상으로 올라가죠."

[인바디 결과별 프로그램 접근법]
**다이어트 프로그램 (체지방 과다형):**
- 체지방률 높음 + 내장지방 주의 → Formula 1 저녁 대체 + 셀-유-로쓰 + 허벌 베버리지
- 강조: "저녁을 쉐이크로 바꾸는 게 핵심이에요. 90칼로리로 영양은 다 채우니까요."
- 추가: 액티브 화이버 컴플렉스로 아침 포만감, 식사량 자연스럽게 조절

**피로개선 프로그램 (에너지 부족형):**
- 골격근량 부족 + 기초대사 낮음 → Formula 1+2+3 조합 + 리프트오프 또는 엔-알-지 티
- 강조: "단백질로 근육을 만들면 기초대사가 올라가 에너지가 생깁니다."
- 추가: 허벌 알로에 겔로 영양 흡수 개선

**장건강 프로그램 (소화 불편형):**
- 복부팽만 + 변비 경향 → Formula 1 + 셀-유-로쓰 + 액티브 화이버 + 프로바이오틱 컴플렉스
- 강조: "식이섬유 + 유산균 조합으로 장 환경을 완전히 바꿔드립니다."
- 추가: 허벌 알로에 겔 (아침/점심/저녁 3회)

**여성건강 프로그램 (호르몬 균형형):**
- 체지방 분포 + 대사 균형 → Formula 1+2 + 릴렉세이션 티 + 프롤레사 듀오
- 강조: "영양 균형을 맞추면 호르몬도 따라 안정됩니다."

**면역건강 프로그램 (면역력 저하형):**
- 잦은 감기 + 피로 → Formula 1+2 + 마이뮨 플러스 + 홍삼 진센 겔
- 강조: "기초 영양부터 채우고, 면역 특화 제품으로 방어막을 세웁니다."

**혈행건강 프로그램 (순환 개선형):**
- 내장지방 높음 + 나이 고려 → Formula 1+2 + 나이트웍스 + 허벌 알로에
- 강조: "혈행 개선은 내장지방 관리와 함께 가야 효과적입니다."

**헬씨에이징 프로그램 (40대 이상):**
- 근감소증 예방 + 대사 유지 → Formula 1+2+3 + 나이트웍스 + 프로바이오틱
- 강조: "나이가 들수록 단백질이 더 중요합니다. 근육 지키는 게 건강한 노화의 핵심이에요."

[상담 스크립트 작성 전략 - 실전 멘트]
초보 코치도 자신감 있게 말할 수 있도록, 고객이 공감하는 언어로:

1. 오프닝 (공감 + 긍정 + 생활 습관 인정):
   "○○님, 인바디 결과 보니까 [구체적 긍정 포인트]이 정말 인상적이네요! 
    특히 [긍정 수치]는 같은 연령대에서 상위권이에요.
    평소에 [추정 생활 습관 - 예: 물 많이 드시거나 / 규칙적으로 운동하시거나]을 하셨던 게 느껴지거든요."
   
   예시: "골격근량이 ○○kg인 거 보니까 평소에 활동량이 있으신 분이시네요!"

2. 핵심 이슈 설명 (수치 → 일상 증상 연결):
   "다만 한 가지 주목할 부분이 있는데요, [구체적 지표]가 [구체적 수치]로 나왔어요.
    표준 범위가 [XX-YY]인데 현재 [ZZ]이거든요.
    혹시 평소에 [일상 증상 - 예: 오후만 되면 피곤하시거나 / 배가 자주 나오시거나 / 
    계단 오르면 숨이 차시거나] 이런 거 느끼시진 않으셨어요?"
   
   예시: "체지방률이 35%인데, 표준이 18-28%예요. 혹시 다이어트해도 잘 안 빠지셨죠?"

3. 연관성 설명 (교육 + 이해 유도):
   "사실 [지표A]와 [지표B]를 함께 보면 더 정확한데요,
    지금 몸 상태가 [구체적 대사 상황 - 예: 근육은 부족한데 지방은 많아서 / 
    영양은 부족한데 칼로리는 과다해서] 이런 상태예요.
    그래서 [일상 불편함]이 생기는 거죠."
   
   예시: "골격근량이 적으면 기초대사가 낮아져서 조금만 먹어도 살이 찌게 돼요."

4. 솔루션 제시 (구체적 + 실천 가능 + 제품 연결):
   "그래서 제가 ○○님께 딱 맞춰서 제안드리고 싶은 게 [N]가지예요.
    
    첫 번째, [실천법 + 제품 + 이유]
    예: 아침을 Formula 1 쉐이크로 바꾸는 거예요. 우주식이라고 들어보셨죠? 
        90칼로리에 단백질 9g, 비타민 17종이 다 들어있어서 영양은 꽉 채우면서 칼로리는 확 줄일 수 있어요.
        두부 1모 먹는 단백질을 한 잔으로 해결하는 거죠.
    
    두 번째, [실천법 + 제품 + 이유]
    예: 저녁 30분 전에 셀-유-로쓰 한 포를 물 300ml에 타서 드세요.
        식이섬유가 배를 채워줘서 자연스럽게 저녁 식사량이 줄어들어요.
        그럼 내장지방이 확 빠지기 시작합니다.
    
    세 번째, [실천법 + 제품 + 이유]
    예: Formula 2 비타민을 아침/저녁으로 꼭 챙겨 드세요.
        감량할 때 비타민이 부족하면 대사가 안 돌아가서 살이 안 빠져요.
        이게 쉐이크랑 짝꿍으로 맞춰져 있어서 효과가 배가 됩니다."

5. 클로징 (동기부여 + 기대 효과 + 지속 지원):
   "이렇게 [기간 - 예: 한 달]만 해보시면요,
    [구체적 변화 - 예: 체지방 3-4kg 빠지고 / 아침에 가뿐하게 일어나시고 / 
    바지 허리가 헐렁해지는 게] 느껴지실 거예요.
    제가 인바디 체크하면서 옆에서 계속 응원해 드릴게요! 
    [기간] 후에 다시 인바디 찍으면 ○○님 깜짝 놀라실 거예요!"
   
   예시: "2주 후부터는 몸이 가벼워지는 게 확실히 느껴지실 거고, 
         한 달 후면 주변에서 '살 빠진 거 아니야?' 소리 들으실 거예요!"

[실전 멘트 팁]
- "우주식", "두부 1모", "밥 2스푼 칼로리" 같은 비유 적극 활용
- "짝꿍", "반찬", "쏙쏙" 같은 친근한 표현 사용
- 구체적 숫자 (90칼로리, 9g 단백질, 17종 비타민) 명확히 언급
- 고객 일상과 연결 ("오후만 되면", "계단 오르면", "바지 허리가")
- 기대 효과는 구체적 기간과 함께 ("2주 후부터", "한 달 후면")
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
      "product": "Formula 1 건강한 식사 (쿠키앤크림맛)",
      "why": "골격근량이 표준보다 3kg 부족해 하루 단백질 75g이 필요합니다. Formula 1은 단백질 9g + 17가지 비타민·무기질을 200kcal로 제공하여 칼로리는 조절하면서 영양은 채울 수 있습니다. 특히 아침 식사 대체로 가장 효과적입니다.",
      "how": "일어나서 30분 이내, 물 250ml + 저지방우유 200ml에 쉐이크 2스푼(26g)을 넣고 쉐이커로 20초간 흔들어 마시세요. 우유 대신 두유나 아몬드밀크도 가능합니다. 가격: 63,000원"
    },
    {
      "product": "Formula 3 퍼스널 단백질 파우더",
      "why": "쉐이크만으로 부족한 단백질을 추가 보충합니다. 근육 합성은 아침에 가장 활발하므로 아침 단백질 섭취가 중요합니다. 순수 단백질 보충으로 근육량 증가에 직접 기여합니다.",
      "how": "위 쉐이크에 1스푼(6g) 추가하여 함께 섭취하세요. 총 단백질 15g 이상으로 아침 단백질 목표를 달성합니다. 가격: 65,600원"
    },
    {
      "product": "Formula 2 멀티비타민·무기질 컴플렉스",
      "why": "12가지 비타민 + 9가지 무기질 + 5가지 식물성분으로 종합 영양을 보충합니다. 특히 골격근 합성에 필요한 비타민D, 마그네슘, 아연이 포함되어 있습니다.",
      "how": "아침 식사(쉐이크) 직후 1정을 물과 함께 섭취하세요. 지용성 비타민 흡수를 위해 식후 복용이 중요합니다. 가격: 33,300원"
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
  "point": "내장지방 레벨 12로 표준(1-9)을 크게 초과하여 대사 건강 개선이 시급합니다. 복부지방률도 0.92로 높아 심혈관 건강에 주의가 필요합니다.",
  "action": "저녁 식사를 Formula 1 쉐이크로 대체하고, 흰 쌀밥 대신 현미 반공기, 튀김/볶음 대신 찜/구이로 조리하세요. 저녁 8시 이후 간식을 끊고, 하루 30분 이상 빨리 걷기를 실천하세요. 물은 하루 2L 이상 마시고, 특히 식전 30분에 물 300ml를 마시면 포만감에 도움됩니다.",
  "product_suggestion": "허벌 베버리지(77,300원)를 오전 10시, 오후 3시에 물 350ml에 2스푼 타서 마시면 에너지 대사를 활성화합니다. 셀-유-로쓰(32,800원)를 저녁 식사 30분 전 물 300ml에 1포 타서 마시면 식이섬유로 포만감을 높이고 칼로리 섭취를 줄일 수 있습니다. 월 비용: 약 110,100원"
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
}

**[최종 중요 지침]**
1. 위 JSON 구조를 정확히 따르세요
2. 모든 필드를 빠짐없이 채우세요
3. JSON 외의 텍스트는 절대 포함하지 마세요
4. 설명이나 주석을 추가하지 마세요  
5. 유효한 JSON 형식인지 확인하세요
6. 반드시 { 로 시작하고 } 로 끝나야 합니다`

    const userPrompt = `목표: ${goal}
말투: ${tone}

위 인바디 이미지를 분석하여 반드시 순수한 JSON 형식으로만 결과를 출력해주세요.

중요:
1. JSON 이외의 텍스트는 절대 포함하지 마세요
2. 설명이나 주석을 추가하지 마세요
3. 반드시 중괄호 { 로 시작하고 } 로 끝나야 합니다
4. 모든 문자열은 반드시 큰따옴표 " "로 감싸야 합니다
5. JSON 형식이 유효해야 합니다 (쉼표, 괄호 등 문법 확인)`

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

    console.log('AI Response length:', content.length)
    console.log('AI Response preview:', content.substring(0, 200))

    // JSON 추출 (여러 방법 시도)
    let jsonString = ''
    
    // 방법 1: ```json 코드 블록 안의 JSON
    const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim()
    } else {
      // 방법 2: 첫 { 부터 마지막 } 까지
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }
    }

    if (!jsonString) {
      console.error('No JSON found in response')
      return c.json({ 
        error: 'AI 응답에서 JSON을 찾을 수 없습니다. 다시 시도해주세요.', 
        raw_response: content.substring(0, 500)
      }, 500)
    }

    try {
      const result = JSON.parse(jsonString)
      console.log('JSON parsed successfully')
      return c.json(result)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Failed JSON string preview:', jsonString.substring(0, 500))
      return c.json({ 
        error: 'JSON 파싱 실패. AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.', 
        raw_response: content.substring(0, 500),
        parse_error: parseError instanceof Error ? parseError.message : 'Unknown error'
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
