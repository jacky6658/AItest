// 根據部署環境自動選擇 API 基礎 URL
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8080'  // 本地開發
  : 'https://aijobvideobackend.zeabur.app';  // 你的實際 Zeabur 後端 URL
const DEFAULT_USER_ID = `web-${Math.random().toString(36).slice(2,8)}`;

// 全域狀態管理
const state = {
  userId: localStorage.getItem('userId') || DEFAULT_USER_ID,
  currentPage: 'home',
  messagesPositioning: [],
  messagesTopics: [],
  messagesScript: [],
  lastAssistantPositioning: '',
  lastAssistantTopics: '',
  lastAssistantScript: '',
  userProfile: null,
  userNotes: [],
  topicsNotes: [],
  scriptNotes: [],
  scriptMode: 'guide',
  templateType: 'A',
  duration: 30,
  guideApplied: false,
  segments: [],
  topicType: 'trending'
};

// 保存用戶ID到localStorage
localStorage.setItem('userId', state.userId);

// 頁面管理
const pages = ['home', 'positioning', 'topics', 'script', 'copy', 'guide'];

// 工具函數
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function copyText(text, message = '已複製') {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast(message));
  } else {
    // 降級方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(message);
  }
}

function appendMsg(chatEl, role, content, isFormatted = false) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${role}`;
  
  const metaDiv = document.createElement('div');
  metaDiv.className = 'meta';
  metaDiv.textContent = `${role === 'user' ? '你' : 'assistant'} - ${new Date().toLocaleString('zh-TW')}`;
  
  const contentDiv = document.createElement('div');
  if (isFormatted) {
    contentDiv.innerHTML = content.replace(/\n/g, '<br>');
  } else {
    contentDiv.textContent = content;
  }
  
  msgDiv.appendChild(metaDiv);
  msgDiv.appendChild(contentDiv);
  chatEl.appendChild(msgDiv);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function showLoadingMsg(chatEl, message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'msg assistant loading';
  loadingDiv.innerHTML = `
    <div class="meta">assistant - ${new Date().toLocaleString('zh-TW')}</div>
    <div>${message}</div>
  `;
  chatEl.appendChild(loadingDiv);
  chatEl.scrollTop = chatEl.scrollHeight;
  return loadingDiv;
}

function hideLoadingMsg(chatEl) {
  const loadingMsg = chatEl.querySelector('.msg.loading');
  if (loadingMsg) {
    loadingMsg.remove();
  }
}

// 頁面切換
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>goPage(b.dataset.go));
function goPage(name){
  pages.forEach(p=>{
    const elPage = document.getElementById(`page-${p}`);
    if(elPage) elPage.style.display = (p===name)?'block':'none';
    const tab = document.querySelector(`.tab[data-page="${p}"]`);
    if(tab) tab.classList.toggle('active', p===name);
  });
  
  if(name==='script' && state.messagesScript.length===0){
    showScriptWelcome();
    // 不自動進入 Q1，僅顯示歡迎
    renderChips();          // 初始化 chips
  } else if(name==='positioning' && state.messagesPositioning.length===0){
    showPositioningWelcome();
    checkPositioningProfile();
  } else if(name==='topics' && state.messagesTopics.length===0){
    showTopicsWelcome();
    refreshTopicsNotes();
  } else if(name==='script' && state.messagesScript.length===0){
    showScriptWelcome();
    refreshScriptNotes();
  }
}

// 定位智能體頁面
function showPositioningWelcome(){
  const chat=document.getElementById('chatPositioning');
  const msg = '👋 我是你的AI影音定位顧問！\n\n我可以幫你：\n• 分析你的業務類型與目標受眾\n• 建立品牌定位與內容策略\n• 規劃平台經營方向\n\n請告訴我你的業務、產品或想法，我會逐步引導你建立完整的定位檔案！';
  appendMsg(chat,'assistant',msg);
  state.messagesPositioning.push({ role:'assistant', content:msg });
}

async function checkPositioningProfile(){
  try{
    const resp = await fetch(`${API_BASE}/agent/positioning/profile?user_id=${state.userId}`);
    const data = await resp.json();
    if(data && !data.error){
      state.userProfile = data.user_profile;
      state.userNotes = data.user_notes || [];
      updateProfileDisplay();
    }
  }catch(e){
    console.error('獲取定位檔案失敗:', e);
  }
}

function updateProfileDisplay(){
  const profileContent = document.getElementById('profileContent');
  if(state.userProfile){
    const profile = state.userProfile;
    // 清理欄位（去除 ** 等 Markdown 殘留；空值顯示為未設定）
    const cleanField = (v)=>{
      if(v==null) return '未設定';
      let s = String(v)
        .replace(/^\*+\s*/g,'')
        .replace(/\s*\*+$/g,'')
        .replace(/^【.*?】/,'')
        .trim();
      if(!s || s === '—' || s === '-') return '未設定';
      return s;
    };

    const notes = (state.userNotes||[]).map(n=>{
      // 清理內容，移除開場白
      let cleanContent = n.content
        .replace(/沒問題!.*?定位顧問.*?建立完整的定位檔案。/g, '')
        .replace(/哈囉!.*?影音定位顧問.*?歡迎使用。/g, '')
        .trim();
      
      // 格式化段落
      cleanContent = cleanContent
        .replace(/^/,'📍 ')
        .replace(/\n/g, '<br>')
        .replace(/(\d+\.)/g, '<br><strong>$1</strong>')
        .replace(/(定位方向|品牌策略|內容規劃|平台建議)/g, '<br><strong>$1</strong>')
        .replace(/(Hook|Value|CTA)/g, '<br><strong>$1</strong>');
      
      return `<li style="margin-bottom: 8px; line-height: 1.5; color: #555;">${cleanContent}</li>`;
    }).join('');

    // 計算完成度
    const fields = ['business_type', 'target_audience', 'brand_voice', 'primary_platform', 'content_goals', 'posting_frequency'];
    const completedFields = fields.filter(field => {
      const value = cleanField(profile[field]);
      return value !== '未設定' && value !== '';
    }).length;
    const completionRate = Math.round((completedFields / fields.length) * 100);
    
    const statusText = completionRate >= 80 
      ? '<div style="color: #4CAF50; font-weight: 600; margin-bottom: 8px;">✅ 定位檔案完整</div>'
      : `<div style="color: #FF9800; font-weight: 600; margin-bottom: 8px;">⏳ 定位檔案 ${completionRate}% 完成</div>`;

    profileContent.innerHTML = `
      ${statusText}
      <div class="profile-field"><strong>業務類型：</strong>${cleanField(profile.business_type)}</div>
      <div class="profile-field"><strong>目標受眾：</strong>${cleanField(profile.target_audience)}</div>
      <div class="profile-field"><strong>品牌語氣：</strong>${cleanField(profile.brand_voice)}</div>
      <div class="profile-field"><strong>主要平台：</strong>${cleanField(profile.primary_platform)}</div>
      <div class="profile-field"><strong>內容目標：</strong>${cleanField(profile.content_goals)}</div>
      <div class="profile-field"><strong>發文頻率：</strong>${cleanField(profile.posting_frequency)}</div>
      <div style="margin-top:12px; padding-top:8px; border-top:1px solid #eee;"><strong>📝 定位筆記：</strong></div>
      <ul style="padding-left:18px; margin:6px 0 0">${notes}</ul>
    `;
  } else {
    profileContent.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">尚未建立定位檔案，請先與AI影音定位顧問對話。</div>';
  }
}

// 定位智能體聊天
document.getElementById('sendPositioning').onclick = async () => {
  const input = document.getElementById('inputPositioning');
  const text = input.value.trim();
  if (!text) {
    showToast('請輸入內容');
    return;
  }
  
  const chat = document.getElementById('chatPositioning');
  appendMsg(chat, 'user', text);
  input.value = '';
  
  showLoadingMsg(chat, 'AI影音定位顧問正在分析中...');
  
  try {
    const response = await fetch(`${API_BASE}/agent/positioning/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.userId,
        user_input: text
      })
    });
    
    const data = await response.json();
    hideLoadingMsg(chat);
    
    if (data.response) {
      appendMsg(chat, 'assistant', data.response, true);
      state.messagesPositioning.push({ role: 'user', content: text });
      state.messagesPositioning.push({ role: 'assistant', content: data.response });
      
      // 更新用戶檔案顯示
      if (data.user_profile) {
        state.userProfile = data.user_profile;
        updateProfileDisplay();
      }
    }
  } catch (error) {
    hideLoadingMsg(chat);
    appendMsg(chat, 'assistant', `❌ 錯誤：${error.message}`);
  }
};

// 快速問題按鈕
document.querySelectorAll('.chip[data-question]').forEach(btn => {
  btn.onclick = () => {
    const question = btn.dataset.question;
    const input = document.getElementById('inputPositioning');
    input.value = question;
    input.focus();
  };
});

// 一鍵生成定位
document.getElementById('oneClickPositioning').onclick = async () => {
  const theme = prompt('請輸入您的主題或業務類型：', '');
  if (!theme || !theme.trim()) {
    showToast('請輸入主題');
    return;
  }
  
  const chat = document.getElementById('chatPositioning');
  showLoadingMsg(chat, 'AI正在生成定位檔案...');
  
  try {
    const response = await fetch(`${API_BASE}/agent/positioning/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.userId,
        theme: theme.trim()
      })
    });
    
    const data = await response.json();
    hideLoadingMsg(chat);
    
    if (data.response) {
      appendMsg(chat, 'assistant', data.response, true);
      state.messagesPositioning.push({ role: 'user', content: theme });
      state.messagesPositioning.push({ role: 'assistant', content: data.response });
      
      // 更新用戶檔案顯示
      if (data.user_profile) {
        state.userProfile = data.user_profile;
        updateProfileDisplay();
      }
      
      showToast('定位檔案生成完成！');
    }
  } catch (error) {
    hideLoadingMsg(chat);
    appendMsg(chat, 'assistant', `❌ 生成失敗：${error.message}`);
  }
};

// 儲存定位檔案
document.getElementById('saveProfile').onclick = async () => {
  if (!state.userProfile) {
    showToast('尚無定位檔案可儲存');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/agent/positioning/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.userId,
        profile_data: state.userProfile
      })
    });
    
    if (response.ok) {
      showToast('定位檔案已儲存');
    } else {
      showToast('儲存失敗');
    }
  } catch (error) {
    showToast('儲存失敗：' + error.message);
  }
};

// 清空定位對話
document.getElementById('clearPositioning').onclick = () => {
  if (confirm('確定要清空對話記錄嗎？')) {
    const chat = document.getElementById('chatPositioning');
    chat.innerHTML = '';
    state.messagesPositioning = [];
    showPositioningWelcome();
  }
};

// 選題智能體頁面
function showTopicsWelcome(){
  const chat=document.getElementById('chatTopics');
  const msg = '👋 我是你的AI選題小助手！\n\n我可以幫你：\n• 基於你的定位檔案提供個性化選題建議\n• 結合熱門趨勢與季節性話題\n• 提供不同類型的內容靈感\n\n選擇選題類型或直接告訴我你想要什麼樣的選題靈感！';
  appendMsg(chat,'assistant',msg);
  state.messagesTopics.push({ role:'assistant', content:msg });
}

async function refreshTopicsNotes(){
  try{
    const resp = await fetch(`${API_BASE}/agent/notes?user_id=${state.userId}&agent_type=topic_selection&memory_type=note&limit=8`);
    const data = await resp.json();
    if(data && !data.error){
      state.topicsNotes = data.notes || [];
      updateTopicsNotesDisplay();
    }
  }catch(e){
    console.error('獲取選題筆記失敗:', e);
  }
}

// 選題筆記顯示 - 重新設計為歷史紀錄格式
function updateTopicsNotesDisplay(){
  const topicsContent = document.getElementById('topicsContent');
  if(state.topicsNotes && state.topicsNotes.length > 0){
    // 重新設計為歷史紀錄格式
    const historyItems = state.topicsNotes.map((n, index) => {
      // 清理內容，移除開場白
      let cleanContent = n.content
        .replace(/沒問題!.*?選題顧問.*?影片燒起來。/g, '')
        .replace(/哈囉!.*?選題小助手.*?歡迎使用。/g, '')
        .trim();
      
      // 確保內容完整，修復截斷問題
      if(cleanContent.includes('2. 別') && !cleanContent.includes('你out了!')) {
        cleanContent = cleanContent.replace(/2\. 別.*$/, '2. 以為我們不懂人情世故?其實只是用「新型社交通關密語」溝通，你out了!');
      }
      
      // 提取時間
      const time = n.created_at ? new Date(n.created_at).toLocaleString('zh-TW') : `記錄 ${index + 1}`;
      
      // 提取主題標題（從內容中找第一個標題）
      const titleMatch = cleanContent.match(/(蹭「[^」]+」熱點|選題方向[：:]\s*([^\n]+)|爆款\s*Hook[：:]\s*([^\n]+))/);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || titleMatch[3] || '選題建議').trim() : '選題建議';
      
      // 格式化內容為結構化顯示
      const formattedContent = cleanContent
        .replace(/\n/g, '<br>')
        .replace(/(選題方向[：:])/g, '<br><strong>🎯 $1</strong>')
        .replace(/(爆款\s*Hook[：:])/g, '<br><strong>🔥 $1</strong>')
        .replace(/(主體內容切入點[：:])/g, '<br><strong>💡 $1</strong>')
        .replace(/(建議\s*Hashtag[：:])/g, '<br><strong># $1</strong>')
        .replace(/(\d+\.)/g, '<br><strong>$1</strong>');
      
      return `
        <div class="history-item" style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2196F3;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #666;">${time}</span>
            <span style="font-size: 11px; color: #2196F3; background: #e3f2fd; padding: 2px 6px; border-radius: 4px;">選題建議</span>
          </div>
          <div style="font-weight: 600; color: #333; margin-bottom: 8px;">✨ ${title}</div>
          <div style="line-height: 1.6; color: #555;">${formattedContent}</div>
        </div>
      `;
    }).join('');
    
    topicsContent.innerHTML = `
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <strong>📚 歷史紀錄</strong>
        <button onclick="clearTopicsHistory()" style="font-size: 12px; color: #666; background: none; border: none; cursor: pointer;">清空</button>
      </div>
      <div style="max-height: 400px; overflow-y: auto;">${historyItems}</div>
    `;
  } else {
    topicsContent.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">點擊「獲取靈感」開始生成選題建議。</div>';
  }
}

// 清空選題歷史
function clearTopicsHistory() {
  if(confirm('確定要清空所有選題歷史嗎？')) {
    state.topicsNotes = [];
    updateTopicsNotesDisplay();
  }
}

// 選題智能體聊天
document.getElementById('getTopics').onclick = async () => {
  const input = document.getElementById('inputTopics');
  const text = input.value.trim();
  if (!text) {
    showToast('請輸入內容');
    return;
  }
  
  const chat = document.getElementById('chatTopics');
  appendMsg(chat, 'user', text);
  input.value = '';
  
  showLoadingMsg(chat, 'AI選題小助手正在思考中...');
  
  try {
    const response = await fetch(`${API_BASE}/chat_stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.userId,
        user_input: text,
        agent_type: 'topics'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    // 清除載入訊息
    hideLoadingMsg(chat);
    
    // 創建新的AI回應容器
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg assistant';
    const metaDiv = document.createElement('div');
    metaDiv.className = 'meta';
    metaDiv.textContent = `assistant - ${new Date().toLocaleString('zh-TW')}`;
    const contentDiv = document.createElement('div');
    msgDiv.appendChild(metaDiv);
    msgDiv.appendChild(contentDiv);
    chat.appendChild(msgDiv);
    
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 保留不完整的行
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullResponse += data.content;
              contentDiv.innerHTML = fullResponse.replace(/\n/g, '<br>');
              chat.scrollTop = chat.scrollHeight;
            }
          } catch (e) {
            // 忽略解析錯誤
          }
        }
      }
    }
    
    // 保存完整回應
    state.messagesTopics.push({ role: 'user', content: text });
    state.messagesTopics.push({ role: 'assistant', content: fullResponse });
    
    // 更新選題筆記
    await refreshTopicsNotes();
    
  } catch (error) {
    hideLoadingMsg(chat);
    appendMsg(chat, 'assistant', `❌ 錯誤：${error.message}`);
  }
};

// 選題類型切換
document.querySelectorAll('[data-topic-type]').forEach(btn => {
  btn.onclick = () => {
    state.topicType = btn.dataset.topicType;
    document.querySelectorAll('[data-topic-type]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const suggestions = {
      trending: '我想要熱門趨勢類型的選題建議',
      educational: '我想要教育分享類型的選題建議',
      personal: '我想要個人故事類型的選題建議',
      product: '我想要產品介紹類型的選題建議'
    };
    
    const input = document.getElementById('inputTopics');
    input.value = suggestions[state.topicType] || '';
  };
});

// 複製選題建議
document.getElementById('copyAllTopics').onclick = () => {
  const suggestions = document.getElementById('topicsContent').textContent;
  if (suggestions && suggestions.trim()) {
    copyText(suggestions, '選題建議已複製');
  } else {
    showToast('尚無選題建議可複製');
  }
};

// 清空選題對話
document.getElementById('cancelTopics').onclick = () => {
  if (confirm('確定要停止生成嗎？')) {
    // 這裡可以添加停止生成的邏輯
    showToast('已停止生成');
  }
};

// 腳本模式：歡迎說明
function showScriptWelcome(){
  const chat=document.getElementById('chatScript');
  const msg = '👋 歡迎使用腳本模式！\n— 如果你用【引導模式】：請先輸入你的主題，我會一步步引導你生成屬於你的腳本（先選結構＋時長）。\n— 已有想法 → 切到【自由模式】直接聊，你說想做什麼，我來補齊腳本與畫面建議。';
  appendMsg(chat,'assistant',msg);
  state.messagesScript.push({ role:'assistant', content:msg });
  state.lastAssistantScript = msg;
  
  // 確保輸入框可見
  setTimeout(() => {
    const inputScript = document.getElementById('inputScript');
    const inputbar = document.querySelector('#page-script .inputbar');
    if(inputScript) {
      inputScript.style.display = 'block';
      inputScript.style.visibility = 'visible';
      inputScript.style.opacity = '1';
      console.log('腳本輸入框已顯示');
    }
    if(inputbar) {
      inputbar.style.display = 'flex';
      inputbar.style.visibility = 'visible';
      inputbar.style.opacity = '1';
      console.log('輸入框區域已顯示');
    }
  }, 100);
}

// 快速模板 / 快速問題（依模式更換）
function renderChips(){
  const wrap=document.getElementById('chipsScript');
  wrap.innerHTML='';
  if(state.scriptMode==='guide'){
    const hint = document.createElement('span'); hint.className='muted'; hint.textContent='已選擇模板與時長 → 直接輸入主題或需求開始生成';
    wrap.appendChild(hint);
  }else{
    const hint = document.createElement('span'); hint.className='muted'; hint.textContent='快速提問：';
    wrap.appendChild(hint);
    [
      '幫我把這個想法拆成 60 秒腳本，Hook 要很強：',
      '請先用簡短方式介紹 A~F 六種結構的差異與適用情境，然後依我這個主題挑一種並給第一版：',
      '我想要一個能快速抓住注意力的開場，適合我的主題：',
      '請幫我設計一個有記憶點的結尾 CTA：'
    ].forEach(q=>{
      const b=document.createElement('button'); b.className='chip'; b.textContent=q;
      b.onclick=()=>{ const t=document.getElementById('inputScript'); t.value=q; t.focus(); };
      wrap.appendChild(b);
    });
  }
}

// 引導模式：把上方的模板/時長直接先回答 Q1/Q2（省兩步）
document.getElementById('btnStartGuide').onclick = async ()=>{
  if(state.scriptMode!=='guide') return;
  const tpl = document.querySelector('input[name="tpl"]:checked').value;
  const dur = document.querySelector('input[name="dur"]:checked').value;
  state.templateType = tpl;
  state.duration = parseInt(dur,10);
  state.guideApplied = true;
  showToast('已套用模板與時長設定');
};

// 模式切換
document.getElementById('modeGroup').addEventListener('change', e=>{
  if(e.target.name!=='scriptMode') return;
  state.scriptMode = e.target.value;       // guide | free
  document.getElementById('guideBar').style.display = (state.scriptMode==='guide')?'block':'none';
  renderChips();
});

// 送出：改走增強版 API，能回傳分段 → 右側顯示
const chatScript = document.getElementById('chatScript');
document.getElementById('sendScript').onclick = async ()=>{ await sendScriptMessage(); };

// 片段渲染
const segmentsWrap = document.getElementById('segmentsWrap');
function segmentToText(s){ 
  return `(${s.start_sec}s–${s.end_sec}s) [${s.type||'-'}] camera:${s.camera||'-'}\n台詞:${s.dialog||''}\n畫面:${s.visual||''}\nCTA:${s.cta||''}`;
}
function renderSegments(){
  segmentsWrap.innerHTML='';
  if(!state.segments?.length){ 
    const empty=document.createElement('div'); 
    empty.className='segment-card muted'; 
    empty.textContent='尚無片段。請輸入更具體的秒數/場景/目標。'; 
    segmentsWrap.appendChild(empty); 
    return; 
  }
  state.segments.forEach((s,i)=>{
    if(s.start_sec==null||s.end_sec==null){ s.start_sec=i*6; s.end_sec=i*6+6; }
    const card=document.createElement('div'); card.className='segment-card';
    card.innerHTML=`
      <div class="segment-head">
        <div class="seg-title">#${i+1} ${s.type||'segment'} <span class="seg-meta">${s.start_sec}s–${s.end_sec}s · 鏡位 ${s.camera||'-'}</span></div>
        <div class="seg-actions">
          <button class="btn small" data-act="copy" data-idx="${i}">複製</button>
          <button class="btn small" data-act="tweak" data-idx="${i}">微調</button>
          <button class="btn small" data-act="del" data-idx="${i}">刪除</button>
        </div>
      </div>
      <div class="muted">對白</div><div>${escapeHTML(s.dialog||'')}</div>
      <div class="muted" style="margin-top:6px">畫面感</div><div>${escapeHTML(s.visual||'')}</div>
      <div class="muted" style="margin-top:6px">CTA</div><div>${escapeHTML(s.cta||'')}</div>`;
    segmentsWrap.appendChild(card);
  });
}
segmentsWrap.onclick = e=>{
  const b=e.target.closest('button'); if(!b) return;
  const idx=+b.dataset.idx, seg=state.segments[idx];
  if(b.dataset.act==='copy') copyText(segmentToText(seg));
  if(b.dataset.act==='del'){ state.segments.splice(idx,1); renderSegments(); }
  if(b.dataset.act==='tweak'){
    const nd=prompt('微調對白（留空略過）',seg.dialog||''); if(nd!=null && nd!=='') seg.dialog=nd;
    const nv=prompt('微調畫面（留空略過）',seg.visual||''); if(nv!=null && nv!=='') seg.visual=nv;
    const nc=prompt('微調 CTA（留空略過）',seg.cta||''); if(nc!=null && nc!=='') seg.cta=nc;
    renderSegments();
  }
};

// 複製/清空
document.getElementById('copyAllScript').onclick=()=>{ 
  if(!state.segments?.length) return showToast('無可複製內容'); 
  copyText(state.segments.map(s=>segmentToText(s)).join('\n\n'),'已複製囉！');
};
document.getElementById('clearScript').onclick =()=>{ state.segments=[]; renderSegments(); };

// 腳本文案智能體（增強版）
async function sendScriptMessage(){
  const textarea = document.getElementById('inputScript');
  const text = (textarea.value || '').trim();
  if(!text){ showToast('請先輸入內容'); return; }
  
  const chat = document.getElementById('chatScript');
  appendMsg(chat, 'user', text);
  textarea.value = '';
  
  // 顯示載入狀態
  showLoadingMsg(chat, 'AI腳本生成大師正在創作中...');
  
  try{
    const payload = {
      user_id: state.userId,
      user_input: text,
      mode: 'script',
      template_type: state.templateType || null,
      duration: state.duration || null
    };
    
    const r = await fetch(`${API_BASE}/agent/content/generate`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    
    const j = await r.json();
    
    // 隱藏載入狀態
    hideLoadingMsg(chat);
    
    if(!r.ok) throw new Error(j?.assistant_message || j?.error || `HTTP ${r.status}`);
    
    if(j.assistant_message) {
      // 使用格式化顯示 AI 回應
      appendMsg(chat, 'assistant', j.assistant_message, true);
    }
    
    // 處理腳本分段 - 確保正確顯示
    if(j.generated_content?.segments) {
      state.segments = j.generated_content.segments;
      renderSegments();
    } else if(j.segments) {
      state.segments = j.segments;
      renderSegments();
    }
    
    // 更新腳本筆記
    await refreshScriptNotes();
  }catch(e){
    // 隱藏載入狀態
    hideLoadingMsg(chat);
    appendMsg(chat, 'assistant', `❌ 錯誤：${e.message}`);
  }
}

// 腳本筆記功能
async function refreshScriptNotes(){
  try{
    const resp = await fetch(`${API_BASE}/agent/notes?user_id=${state.userId}&agent_type=script_copy&memory_type=note&limit=8`);
    const data = await resp.json();
    if(data && !data.error){
      state.scriptNotes = data.notes || [];
      updateScriptNotesDisplay();
    }
  }catch(e){}
}

function updateScriptSegmentsDisplay(segments) {
  const segmentsWrap = document.getElementById('segmentsWrap');
  if (!segmentsWrap) return;

  // 清除現有內容
  const existingSegments = segmentsWrap.querySelectorAll('.script-segment');
  existingSegments.forEach(segment => segment.remove());

  if (segments && segments.length > 0) {
    segments.forEach((segment, index) => {
      const segmentDiv = document.createElement('div');
      segmentDiv.className = 'script-segment segment-card';
      segmentDiv.innerHTML = `
        <div class="segment-head">
          <div class="seg-title">#${index + 1} ${segment.type || 'segment'} 
            <span class="seg-meta">${segment.start_sec || 0}s–${segment.end_sec || 30}s · 鏡位 ${segment.camera || 'MS'}</span>
          </div>
        </div>
        <div class="muted">🎬 對白</div>
        <div style="margin-bottom: 8px;">${escapeHTML(segment.dialog || '')}</div>
        <div class="muted">📹 畫面</div>
        <div style="margin-bottom: 8px;">${escapeHTML(segment.visual || '')}</div>
        <div class="muted">📢 CTA</div>
        <div>${escapeHTML(segment.cta || '')}</div>
      `;
      segmentsWrap.appendChild(segmentDiv);
    });

    // 添加腳本筆記
    const notesDiv = document.createElement('div');
    notesDiv.className = 'script-notes';
    notesDiv.innerHTML = '<div class="muted">📝 腳本筆記</div>';
    segmentsWrap.insertBefore(notesDiv, segmentsWrap.firstChild);
  }
}

function updateScriptNotesDisplay(){
  const scriptContent = document.getElementById('scriptContent');
  if(state.scriptNotes && state.scriptNotes.length > 0){
    const notes = state.scriptNotes.map(n=>{
      // 清理內容，移除開場白和JSON代碼
      let cleanContent = n.content
        .replace(/沒問題!.*?腳本大師.*?開始創作。/g, '')
        .replace(/哈囉!.*?腳本生成大師.*?歡迎使用。/g, '')
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/---+/g, '')
        .replace(/\*\*/g, '')
        .trim();
      
      // 格式化段落
      cleanContent = cleanContent
        .replace(/^/,'📝 ')
        .replace(/\n/g, '<br>')
        .replace(/(\d+\.)/g, '<br><strong>$1</strong>')
        .replace(/(Hook|Value|CTA|開場|主體|結尾)/g, '<br><strong>$1</strong>')
        .replace(/(時長|鏡位|對白|畫面)/g, '<br><em>$1</em>');
      
      return `<li style="margin-bottom: 8px; line-height: 1.5; color: #555;">${cleanContent}</li>`;
    }).join('');
    
    scriptContent.innerHTML = `
      <div style="margin-bottom: 12px;"><strong>📝 腳本筆記</strong></div>
      <ul style="padding-left: 18px; margin: 0;">${notes}</ul>
    `;
  } else {
    scriptContent.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">尚無腳本筆記</div>';
  }
}

// 模式按鈕事件
document.getElementById('guideMode').onclick = () => {
  // 切換到引導模式
  document.getElementById('guideBar').style.display = 'block';
  // 更新按鈕狀態
  document.getElementById('guideMode').classList.add('active');
  document.getElementById('freeMode').classList.remove('active');
  document.getElementById('oneClickScript').classList.remove('active');
  state.scriptMode = 'guide';
  renderChips();
};

document.getElementById('freeMode').onclick = () => {
  // 切換到自由模式
  document.getElementById('guideBar').style.display = 'none';
  // 更新按鈕狀態
  document.getElementById('freeMode').classList.add('active');
  document.getElementById('guideMode').classList.remove('active');
  document.getElementById('oneClickScript').classList.remove('active');
  state.scriptMode = 'free';
  renderChips();
};

document.getElementById('oneClickScript').onclick = async () => {
  // 更新按鈕狀態
  document.getElementById('oneClickScript').classList.add('active');
  document.getElementById('guideMode').classList.remove('active');
  document.getElementById('freeMode').classList.remove('active');
  
  const theme = prompt('請輸入您的主題或腳本內容：', '');
  if (!theme || !theme.trim()) {
    showToast('請輸入主題');
    return;
  }
  
  const chat = document.getElementById('chatScript');
  
  // 顯示載入狀態
  showLoadingMsg(chat, 'AI正在生成腳本...');
  
  try {
    const payload = {
      user_id: state.userId,
      theme: theme.trim(),
      template_type: state.templateType,
      duration: state.duration
    };
    
    const resp = await fetch(`${API_BASE}/agent/script/generate`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    
    const data = await resp.json();
    
    // 隱藏載入狀態
    hideLoadingMsg(chat);
    
    if (!resp.ok) {
      throw new Error(data?.error || `HTTP ${resp.status}`);
    }
    
    if (data.assistant_message) {
      // 顯示 AI 回應
      appendMsg(chat, 'assistant', data.assistant_message, true);
      
      // 更新腳本分段顯示（寫入狀態並渲染到「腳本分段 / 時間軸」）
      if (data.segments && data.segments.length > 0) {
        try {
          state.segments = data.segments;
          if (typeof renderSegments === 'function') {
            renderSegments();
          } else {
            // 若舊版函數不存在，退而使用新渲染方式
            updateScriptSegmentsDisplay(data.segments);
          }
        } catch(e) {
          updateScriptSegmentsDisplay(data.segments);
        }
      } else if (data.generated_content?.segments) {
        // 處理不同的回應格式
        state.segments = data.generated_content.segments;
        if (typeof renderSegments === 'function') {
          renderSegments();
        } else {
          updateScriptSegmentsDisplay(data.generated_content.segments);
        }
      }
      
      // 刷新腳本筆記
      await refreshScriptNotes();
      
      // 確保腳本分段區域可見
      const segmentsWrap = document.getElementById('segmentsWrap');
      if (segmentsWrap) {
        segmentsWrap.scrollTop = 0;
      }
      
      showToast('腳本生成完成！');
    }
  } catch (error) {
    hideLoadingMsg(chat);
    appendMsg(chat, 'assistant', `❌ 生成失敗：${error.message}`);
  }
};

// 初始化腳本模式按鈕
function initScriptModeButtons() {
  // 設置引導模式為預設選中
  document.getElementById('guideMode').classList.add('active');
  document.getElementById('freeMode').classList.remove('active');
  document.getElementById('oneClickScript').classList.remove('active');
  state.scriptMode = 'guide';
}

// 初始化
goPage('home');
initScriptModeButtons();

// 確保腳本頁面輸入框可見
setTimeout(() => {
  const inputScript = document.getElementById('inputScript');
  const inputbar = document.querySelector('#page-script .inputbar');
  if(inputScript) {
    console.log('腳本輸入框找到:', inputScript);
    inputScript.style.display = 'block';
    inputScript.style.visibility = 'visible';
    inputScript.style.opacity = '1';
  } else {
    console.error('腳本輸入框未找到!');
  }
  if(inputbar) {
    inputbar.style.display = 'flex';
    inputbar.style.visibility = 'visible';
    inputbar.style.opacity = '1';
    console.log('輸入框區域已確保可見');
  }
}, 100);
