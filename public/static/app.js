// 전역 변수
let uploadedImage = null;
let analysisResult = null;
let rawAIMetrics = null; // AI가 읽은 원본 수치
let verifiedMetrics = null; // 사용자가 확인/수정한 수치

// DOM 요소
const uploadArea = document.getElementById('upload-area');
const imageInput = document.getElementById('image-input');
const previewArea = document.getElementById('preview-area');
const previewImage = document.getElementById('preview-image');
const removeImageBtn = document.getElementById('remove-image');
const analyzeBtn = document.getElementById('analyze-btn');
const loadingArea = document.getElementById('loading-area');
const errorArea = document.getElementById('error-area');
const verificationArea = document.getElementById('verification-area');
const verificationMetrics = document.getElementById('verification-metrics');
const confirmMetricsBtn = document.getElementById('confirm-metrics-btn');
const cancelVerificationBtn = document.getElementById('cancel-verification-btn');
const resultArea = document.getElementById('result-area');
const goalSelect = document.getElementById('goal-select');
const toneSelect = document.getElementById('tone-select');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// 업로드 영역 클릭
uploadArea.addEventListener('click', (e) => {
  console.log('Upload area clicked');
  if (!uploadedImage && e.target !== imageInput) {
    console.log('Triggering file input click');
    imageInput.click();
  }
});

// 드래그 앤 드롭
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('border-blue-500', 'bg-blue-50');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleImageUpload(files[0]);
  }
});

// 파일 선택
imageInput.addEventListener('change', (e) => {
  console.log('File input changed');
  const files = e.target.files;
  if (files.length > 0) {
    console.log('File selected:', files[0].name);
    handleImageUpload(files[0]);
  }
});

// 파일 입력 직접 클릭 이벤트 (추가 보강)
imageInput.addEventListener('click', (e) => {
  console.log('File input directly clicked');
  e.stopPropagation();
});

// 이미지 업로드 처리
function handleImageUpload(file) {
  if (!file.type.startsWith('image/')) {
    showError('이미지 파일만 업로드 가능합니다.');
    return;
  }

  uploadedImage = file;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    uploadArea.classList.add('hidden');
    previewArea.classList.remove('hidden');
    hideError();
  };
  reader.readAsDataURL(file);
}

// 이미지 삭제
removeImageBtn.addEventListener('click', () => {
  uploadedImage = null;
  previewImage.src = '';
  previewArea.classList.add('hidden');
  uploadArea.classList.remove('hidden');
  imageInput.value = '';
  resultArea.classList.add('hidden');
  analysisResult = null;
});

// 분석하기 버튼
analyzeBtn.addEventListener('click', async () => {
  if (!uploadedImage) {
    showError('인바디 이미지를 업로드해주세요.');
    return;
  }

  try {
    // UI 상태 변경
    analyzeBtn.disabled = true;
    loadingArea.classList.remove('hidden');
    hideError();
    resultArea.classList.add('hidden');
    verificationArea.classList.add('hidden');

    // FormData 생성
    const formData = new FormData();
    formData.append('image', uploadedImage);
    formData.append('goal', goalSelect.value);
    formData.append('tone', toneSelect.value);

    // API 호출
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    console.log('API Response:', data);
    console.log('Metrics:', data.metrics);

    if (!response.ok) {
      throw new Error(data.error || '분석에 실패했습니다.');
    }

    // AI가 읽은 원본 수치 저장
    rawAIMetrics = data.metrics;
    analysisResult = data;

    console.log('저장된 rawAIMetrics:', rawAIMetrics);
    console.log('수치 확인 화면 표시 시작...');

    // 수치 확인 화면 표시
    showVerificationScreen(data.metrics);

  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message || '분석에 실패했습니다. 다시 시도해주세요.');
  } finally {
    analyzeBtn.disabled = false;
    loadingArea.classList.add('hidden');
  }
});

// 수치 확인 화면 표시
function showVerificationScreen(metrics) {
  console.log('showVerificationScreen 호출됨');
  console.log('metrics:', metrics);
  console.log('verificationArea:', verificationArea);
  console.log('verificationMetrics:', verificationMetrics);
  
  verificationMetrics.innerHTML = '';
  
  if (!metrics || !Array.isArray(metrics)) {
    console.error('metrics가 배열이 아닙니다:', metrics);
    return;
  }
  
  metrics.forEach((metric, index) => {
    const statusColor = {
      '정상': 'text-green-600 bg-green-50',
      '주의': 'text-yellow-600 bg-yellow-50',
      '개선 필요': 'text-red-600 bg-red-50'
    }[metric.status] || 'text-gray-600 bg-gray-50';
    
    const metricHTML = `
      <div class="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-700">${metric.name}</span>
            <span class="px-2 py-1 rounded text-xs font-medium ${statusColor}">${metric.status}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <input 
            type="text" 
            id="metric-${index}" 
            value="${metric.value || ''}" 
            class="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
            placeholder="${metric.value || '확인 불가'}"
          />
          <button 
            class="reset-metric-btn text-gray-400 hover:text-gray-600"
            data-index="${index}"
            data-original="${metric.value || ''}"
            title="원래 값으로 되돌리기"
          >
            <i class="fas fa-undo"></i>
          </button>
        </div>
      </div>
    `;
    
    verificationMetrics.innerHTML += metricHTML;
  });
  
  console.log('HTML 생성 완료, 이벤트 리스너 등록 중...');
  
  // 되돌리기 버튼 이벤트 리스너
  document.querySelectorAll('.reset-metric-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = this.dataset.index;
      const originalValue = this.dataset.original;
      document.getElementById(`metric-${index}`).value = originalValue;
    });
  });
  
  console.log('수치 확인 영역 표시 중...');
  verificationArea.classList.remove('hidden');
  console.log('스크롤 이동 중...');
  verificationArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  console.log('showVerificationScreen 완료!');
}

// 수치 리셋 (전역 함수로 유지 - 호환성용)
window.resetMetric = function(index, originalValue) {
  document.getElementById(`metric-${index}`).value = originalValue;
}

// 수치 확인 완료
confirmMetricsBtn.addEventListener('click', async () => {
  try {
    // 수정된 수치 수집
    const updatedMetrics = rawAIMetrics.map((metric, index) => {
      const inputValue = document.getElementById(`metric-${index}`).value.trim();
      return {
        ...metric,
        value: inputValue || metric.value
      };
    });
    
    verifiedMetrics = updatedMetrics;
    
    // 수정된 수치로 최종 분석 재생성
    confirmMetricsBtn.disabled = true;
    confirmMetricsBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>최종 분석 생성 중...';
    
    // 수정된 데이터로 재분석 요청
    const response = await fetch('/api/reanalyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics: updatedMetrics,
        goal: goalSelect.value,
        tone: toneSelect.value,
        original_summary: analysisResult.one_line_summary
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '최종 분석 생성에 실패했습니다.');
    }
    
    // 결과 저장 및 렌더링
    analysisResult = data;
    renderResults(data);
    
    // UI 전환
    verificationArea.classList.add('hidden');
    resultArea.classList.remove('hidden');
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
  } catch (error) {
    console.error('Reanalysis error:', error);
    showError(error.message || '최종 분석 생성에 실패했습니다.');
  } finally {
    confirmMetricsBtn.disabled = false;
    confirmMetricsBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>정확합니다. 최종 분석 생성';
  }
});

// 수치 확인 취소
cancelVerificationBtn.addEventListener('click', () => {
  verificationArea.classList.add('hidden');
  rawAIMetrics = null;
  verifiedMetrics = null;
  analysisResult = null;
});

// 탭 전환
document.getElementById('tab-nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  const tabName = btn.dataset.tab;

  // 모든 탭 버튼 비활성화
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active', 'border-blue-600', 'text-blue-600');
    b.classList.add('border-transparent', 'text-gray-500');
  });

  // 클릭한 탭 활성화
  btn.classList.add('active', 'border-blue-600', 'text-blue-600');
  btn.classList.remove('border-transparent', 'text-gray-500');

  // 모든 탭 컨텐츠 숨기기
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });

  // 선택한 탭 컨텐츠 표시
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
});

// 결과 렌더링
function renderResults(data) {
  renderSummary(data);
  renderMetrics(data);
  renderInterpretation(data);
  renderSolution(data);
  renderScript(data);
  renderSMS(data);
}

// 1. 한 줄 요약
function renderSummary(data) {
  const container = document.getElementById('tab-summary');
  container.innerHTML = `
    <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
      <h3 class="text-xl font-semibold mb-2">
        <i class="fas fa-star mr-2"></i>한 줄 요약
      </h3>
      <p class="text-lg">${data.one_line_summary || '요약 정보가 없습니다.'}</p>
    </div>
  `;
}

// 2. 핵심 지표
function renderMetrics(data) {
  const container = document.getElementById('tab-metrics');
  
  const statusColors = {
    '정상': 'bg-green-100 text-green-800',
    '주의': 'bg-yellow-100 text-yellow-800',
    '개선 필요': 'bg-red-100 text-red-800'
  };

  const rows = data.metrics.map(m => `
    <tr class="border-b border-gray-200 hover:bg-gray-50">
      <td class="px-4 py-3 font-medium text-gray-800">${m.name}</td>
      <td class="px-4 py-3 text-gray-700">${m.value || '-'}</td>
      <td class="px-4 py-3">
        <span class="px-3 py-1 rounded-full text-sm font-semibold ${statusColors[m.status] || 'bg-gray-100 text-gray-800'}">
          ${m.status}
        </span>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white rounded-lg overflow-hidden shadow">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">항목</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">측정값</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">상태</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// 3. 해석
function renderInterpretation(data) {
  const container = document.getElementById('tab-interpretation');
  
  const cards = data.interpretation.map((item, idx) => `
    <div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      <h4 class="text-lg font-semibold text-gray-800 mb-3">
        <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>${item.title}
      </h4>
      <p class="text-gray-700 leading-relaxed">${item.detail}</p>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="grid grid-cols-1 gap-4">
      ${cards}
    </div>
  `;
}

// 4. 허벌라이프 솔루션
function renderSolution(data) {
  const container = document.getElementById('tab-solution');
  const solution = data.herbalife_solution;

  // 일일 루틴
  const routineCards = solution.daily_routine.map(routine => {
    const items = routine.items.map(item => `
      <div class="mb-3 pb-3 border-b border-gray-100 last:border-0">
        <p class="font-semibold text-indigo-700 mb-1">${item.product}</p>
        <p class="text-sm text-gray-600 mb-1"><strong>이유:</strong> ${item.why}</p>
        <p class="text-sm text-gray-600"><strong>방법:</strong> ${item.how}</p>
      </div>
    `).join('');

    return `
      <div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h4 class="text-lg font-semibold text-gray-800 mb-4">
          <i class="fas fa-clock mr-2 text-blue-500"></i>${routine.timing}
        </h4>
        ${items}
      </div>
    `;
  }).join('');

  // 체지방 관리
  const fatCards = solution.fat_management.map(item => `
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
      <p class="font-semibold text-red-800 mb-2">${item.point}</p>
      <p class="text-sm text-gray-700 mb-2"><strong>실천:</strong> ${item.action}</p>
      <p class="text-sm text-gray-700"><strong>제품:</strong> ${item.product_suggestion}</p>
    </div>
  `).join('');

  // 근육/대사 관리
  const muscleCards = solution.muscle_metabolism.map(item => `
    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
      <p class="font-semibold text-green-800 mb-2">${item.point}</p>
      <p class="text-sm text-gray-700 mb-2"><strong>실천:</strong> ${item.action}</p>
      <p class="text-sm text-gray-700"><strong>제품:</strong> ${item.product_suggestion}</p>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="space-y-6">
      <div>
        <h3 class="text-xl font-semibold text-gray-800 mb-4">
          <i class="fas fa-calendar-day mr-2"></i>일일 루틴
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${routineCards}
        </div>
      </div>

      <div>
        <h3 class="text-xl font-semibold text-gray-800 mb-4">
          <i class="fas fa-fire mr-2"></i>체지방 관리 포인트
        </h3>
        ${fatCards}
      </div>

      <div>
        <h3 class="text-xl font-semibold text-gray-800 mb-4">
          <i class="fas fa-dumbbell mr-2"></i>근육/대사 관리 포인트
        </h3>
        ${muscleCards}
      </div>

      ${solution.compliance_note ? `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p class="text-sm text-gray-700">
            <i class="fas fa-info-circle text-yellow-600 mr-2"></i>
            ${solution.compliance_note}
          </p>
        </div>
      ` : ''}
    </div>
  `;
}

// 5. 상담 멘트
function renderScript(data) {
  const container = document.getElementById('tab-script');
  
  const sentences = data.coach_script.map((sentence, idx) => `
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
      <p class="text-gray-800">${idx + 1}. ${sentence}</p>
    </div>
  `).join('');

  const fullText = data.coach_script.map((s, i) => `${i + 1}. ${s}`).join('\n\n');

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold text-gray-800">
          <i class="fas fa-comments mr-2"></i>상담 멘트
        </h3>
        <button onclick="copyToClipboard(\`${escapeForJS(fullText)}\`, '상담 멘트가 복사되었습니다!')" 
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <i class="fas fa-copy mr-2"></i>전체 복사
        </button>
      </div>
      ${sentences}
    </div>
  `;
}

// 6. SMS 결과지
function renderSMS(data) {
  const container = document.getElementById('tab-sms');
  
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold text-gray-800">
          <i class="fas fa-sms mr-2"></i>SMS 결과지
        </h3>
        <button onclick="copyToClipboard(\`${escapeForJS(data.sms_result)}\`, 'SMS 결과지가 복사되었습니다!')" 
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <i class="fas fa-copy mr-2"></i>복사
        </button>
      </div>
      <div class="bg-gray-50 border border-gray-300 rounded-lg p-5">
        <pre class="whitespace-pre-wrap text-gray-800 font-sans leading-relaxed">${data.sms_result}</pre>
      </div>
      <p class="text-sm text-gray-500">
        <i class="fas fa-info-circle mr-1"></i>
        약 ${data.sms_result.length}자 (공백 포함)
      </p>
    </div>
  `;
}

// 클립보드 복사
window.copyToClipboard = function(text, message = '복사되었습니다!') {
  navigator.clipboard.writeText(text).then(() => {
    showToast(message);
  }).catch(err => {
    console.error('복사 실패:', err);
    showToast('복사에 실패했습니다.');
  });
};

// JS 문자열 이스케이프
function escapeForJS(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/\n/g, '\\n');
}

// 토스트 표시
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// 에러 표시
function showError(message) {
  errorArea.textContent = message;
  errorArea.classList.remove('hidden');
}

// 에러 숨기기
function hideError() {
  errorArea.classList.add('hidden');
}
