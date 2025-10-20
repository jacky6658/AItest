# AI 短影音顧問智能系統 - 前端

## 🚀 系統概述

這是一個現代化的 AI 短影音顧問智能系統前端，提供三種核心 AI 功能：
- 🎯 AI 短影音定位顧問
- 💡 AI 選題小助手  
- 📝 AI 腳本生成大師

## 📊 當前系統狀態 (2024-10-20)

### ✅ 已完成功能
- **響應式設計**：完美支援桌面、平板、手機（iOS Safari 優化）
- **登入系統**：Email 註冊/登入 + Google OAuth（彈窗模式）
- **推薦碼系統**：邀請朋友功能，一鍵複製邀請連結
- **點數管理**：即時顯示點數餘額和使用統計
- **模態視窗**：知識庫、帳戶管理、設定、幫助中心
- **SSE 串流**：即時逐字輸出，提供 GPT 般體驗
- **深色模式**：自動適配系統主題，手動切換

### 🔧 技術架構狀態
- **原生 HTML/CSS/JS**：無框架依賴，快速載入
- **Tailwind CSS**：現代化樣式框架
- **EventSource**：SSE 串流技術
- **LocalStorage**：本地數據存儲
- **PWA 支援**：可安裝為桌面應用

## ✨ 主要功能

### 用戶體驗
- **響應式設計**：完美支援桌面、平板、手機
- **深色/淺色模式**：自動適配系統主題
- **即時串流**：SSE 技術提供 GPT 般的逐字輸出體驗
- **智能記憶**：記住用戶偏好和對話歷史

### 登入系統
- **多種登入方式**：Email 註冊、Google OAuth
- **推薦碼系統**：邀請朋友註冊，雙方各得 500 點數
- **點數管理**：即時顯示點數餘額和使用統計
- **用戶檔案**：完整的個人資料管理
- **會話管理**：安全的登入狀態保持
- **彈窗登入**：iOS Safari 優化的 Google 登入體驗

### AI 功能
- **定位顧問**：基於知識庫的短影音定位分析
- **選題助手**：智能選題建議和內容規劃
- **腳本生成**：支持多種模板和平台
- **一鍵生成**：快速生成專業內容
- **AI 對話**：智能問答和建議

### 管理功能
- **知識庫**：查看歷史生成內容和聊天記錄
- **帳戶管理**：個人資料和點數管理
- **設定中心**：個性化配置
- **幫助中心**：使用指南和常見問題
- **邀請朋友**：一鍵複製邀請連結，獲得推薦獎勵
- **模態視窗**：所有功能都通過模態視窗實現，不影響主界面

## 🛠 技術架構

### 前端技術棧
- **原生 HTML/CSS/JavaScript**：無框架依賴，快速載入
- **Tailwind CSS**：現代化 CSS 框架
- **EventSource**：SSE 串流技術
- **LocalStorage**：本地數據存儲
- **Fetch API**：現代化 HTTP 請求

### 核心特性
- **PWA 支援**：可安裝為桌面應用
- **離線快取**：關鍵資源本地快取
- **SEO 優化**：搜索引擎友好
- **無障礙設計**：支援螢幕閱讀器

## 🚀 快速開始

### 環境要求
- 現代瀏覽器（Chrome 90+, Firefox 88+, Safari 14+）
- 本地服務器（可選）

### 安裝步驟

1. **下載專案**
```bash
git clone <repository-url>
cd ai_web_app/對話式/原始/front
```

2. **本地預覽**
```bash
# 使用 Python 簡單服務器
python -m http.server 8000

# 或使用 Node.js
npx serve .

# 或使用 Live Server（VS Code 擴展）
```

3. **訪問應用**
打開瀏覽器訪問 `http://localhost:8000`

### 生產部署

#### GitHub Pages
1. 將代碼推送到 GitHub
2. 在 Repository Settings 中啟用 GitHub Pages
3. 選擇 Source 為 main branch
4. 訪問 `https://yourusername.github.io/repository-name`

#### 其他平台
- **Netlify**：拖拽部署
- **Vercel**：Git 集成部署
- **Zeabur**：一鍵部署

## 📱 響應式設計

### 斷點設計
- **手機**：< 768px
- **平板**：768px - 1024px
- **桌面**：> 1024px

### 適配特性
- **iOS Safari 優化**：特殊處理彈窗和手勢
- **Android Chrome**：優化觸控體驗
- **桌面瀏覽器**：完整功能支援

## 🎨 主題系統

### 深色模式
```css
/* 自動適配系統主題 */
@media (prefers-color-scheme: dark) {
  /* 深色模式樣式 */
}
```

### 手動切換
點擊右上角月亮/太陽圖標切換主題

## 🔧 配置說明

### API 配置
```javascript
// 在 index.html 中修改
const API_BASE = 'https://your-backend-domain.com';
```

### 功能開關
```javascript
// 啟用/禁用特定功能
const FEATURES = {
  GOOGLE_LOGIN: true,
  EMAIL_SIGNUP: true,
  REFERRAL_SYSTEM: true,
  DARK_MODE: true
};
```

## 📚 使用指南

### 首次使用
1. **註冊帳號**：使用 Email 或 Google 登入
2. **獲取點數**：新用戶自動獲得 500 點數
3. **邀請朋友**：分享邀請連結，雙方各得 500 點數
4. **開始使用**：選擇 AI 功能開始創作

### AI 功能使用
1. **定位顧問**：輸入行業資訊，獲得定位建議
2. **選題助手**：提供主題，獲得選題建議
3. **腳本生成**：選擇模板和平台，生成完整腳本

### 管理功能
1. **知識庫**：查看歷史生成內容
2. **帳戶管理**：管理個人資料和點數
3. **設定中心**：個性化配置

## 🔍 開發指南

### 添加新功能
1. 在 `index.html` 中添加 HTML 結構
2. 在 `<script>` 中添加 JavaScript 邏輯
3. 使用 Tailwind CSS 添加樣式
4. 測試響應式設計

### 調試技巧
```javascript
// 開啟調試模式
localStorage.setItem('debug', 'true');

// 查看 API 請求
console.log('API Request:', request);

// 查看用戶狀態
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

## 🚀 性能優化

### 載入優化
- **圖片懶載入**：減少初始載入時間
- **代碼分割**：按需載入功能模組
- **快取策略**：合理使用瀏覽器快取

### 運行優化
- **防抖處理**：避免頻繁 API 調用
- **虛擬滾動**：處理大量數據
- **記憶化**：快取計算結果

## 🛠 故障排除

### 常見問題

#### 登入問題
```javascript
// 檢查登入狀態
console.log('Login Status:', localStorage.getItem('isLoggedIn'));

// 清除登入狀態
localStorage.removeItem('isLoggedIn');
localStorage.removeItem('user');
```

#### API 連接問題
```javascript
// 檢查 API 狀態
fetch('/api/healthz')
  .then(res => res.json())
  .then(data => console.log('API Status:', data));
```

#### 樣式問題
- 清除瀏覽器快取
- 檢查 Tailwind CSS 是否正確載入
- 確認響應式斷點設定

## 📞 支援

### 技術支援
- **文檔**：https://docs.example.com
- **GitHub Issues**：https://github.com/your-repo/issues
- **Email**：support@example.com

### 社群
- **Discord**：https://discord.gg/your-server
- **Telegram**：https://t.me/your-group

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 文件

---

## 🎯 快速連結

- [後端文檔](../backend/README.md)
- [部署指南](DEPLOYMENT.md)
- [API 文檔](https://your-backend-domain.com/docs)
- [線上演示](https://your-frontend-domain.com)