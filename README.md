# AIJob 短影音顧問智能 - 前端

## 檔案結構

```
front/
├── index.html                    # 主頁面
├── admin_dashboard.html          # 管理後台（備用）
├── admin.html                    # 管理頁面
├── admin.js                      # 管理功能 JS
├── app.js                        # 應用程式 JS
├── login.html                    # 登入頁面
├── indexolduse.html              # 舊版頁面（備用）
├── 前端文件部署清單_最新版.md    # 部署清單
└── public/                       # 點數系統資源
    ├── points-addon.css          # 點數系統樣式
    └── src/
        ├── boot/
        │   └── aiPoints_bootstrap.js
        ├── lib/
        │   └── aiPoints_bus.js
        └── widgets/
            ├── aiPoints_badge.js
            └── aiPoints_modal.js
```

## 功能特色

- 🎯 AI 短影音定位顧問
- 💡 AI 選題小助手  
- 📝 AI 腳本生成大師
- 💰 點數系統
- 📱 響應式設計（RWD）
- 🌙 日間/夜間模式
- 🔐 用戶認證系統

## 部署說明

1. 將所有檔案上傳到 Web 伺服器
2. 確保 `public/` 資料夾的靜態資源可正常訪問
3. 配置後端 API 端點
4. 設定環境變數

## 技術棧

- HTML5
- Tailwind CSS
- JavaScript (ES6+)
- 響應式設計
