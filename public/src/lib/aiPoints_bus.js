/**
 * AI Points Event Bus - 事件匯流排與攔截器
 * 不修改既有程式，只攔截和處理點數相關事件
 */

class AIPointsBus {
    constructor() {
        this.apiBase = window.API_BASE || 'https://aijobvideobackend.zeabur.app';
        this.isInitialized = false;
        this.pendingActions = new Map(); // 儲存被攔截的動作
        this.userId = null;
        this.walletInfo = null;
        
        // 一鍵生成按鈕關鍵字白名單
        this.actionKeywords = [
            '一鍵生成', '生成腳本', '生成定位', '生成選題',
            'Generate', 'Run', 'Create', '產生',
            '開始生成', '立即生成', '快速生成'
        ];
        
        // 模組映射
        this.moduleMapping = {
            'positioning': '定位',
            'ideation': '選題', 
            'script': '腳本'
        };
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        // 綁定全域事件監聽
        document.addEventListener('click', this.handleClick.bind(this), true);
        document.addEventListener('submit', this.handleSubmit.bind(this), true);
        
        // 初始化用戶資訊
        this.initUserInfo();
        
        this.isInitialized = true;
        console.log('AI Points Bus initialized');
    }
    
    initUserInfo() {
        // 從localStorage獲取用戶資訊
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            this.userId = user.id;
        } catch (e) {
            console.warn('Failed to parse user info:', e);
        }
    }
    
    async handleClick(event) {
        const target = event.target;
        if (!target) return;
        
        // 檢查是否為一鍵生成按鈕
        const actionInfo = this.detectAction(target);
        if (!actionInfo) return;
        
        // 攔截事件
        event.preventDefault();
        event.stopPropagation();
        
        await this.processAction(actionInfo, target);
    }
    
    async handleSubmit(event) {
        const form = event.target;
        if (!form || form.tagName !== 'FORM') return;
        
        // 檢查表單是否包含一鍵生成
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;
        
        const actionInfo = this.detectAction(submitBtn);
        if (!actionInfo) return;
        
        // 攔截事件
        event.preventDefault();
        event.stopPropagation();
        
        await this.processAction(actionInfo, form);
    }
    
    detectAction(element) {
        // 1. 檢查data-action屬性
        const dataAction = element.getAttribute('data-action');
        if (dataAction) {
            return this.parseDataAction(dataAction, element);
        }
        
        // 2. 檢查按鈕文字
        const text = element.textContent?.trim() || '';
        const matchedKeyword = this.actionKeywords.find(keyword => 
            text.includes(keyword)
        );
        
        if (matchedKeyword) {
            return this.parseTextAction(matchedKeyword, element);
        }
        
        // 3. 檢查父元素
        const parent = element.closest('button, a, [role="button"]');
        if (parent && parent !== element) {
            return this.detectAction(parent);
        }
        
        return null;
    }
    
    parseDataAction(dataAction, element) {
        // 解析data-action格式: "module:mode:count"
        const parts = dataAction.split(':');
        if (parts.length < 2) return null;
        
        const module = this.moduleMapping[parts[0]] || parts[0];
        const mode = parts[1] || 'oneclick';
        const count = parseInt(parts[2]) || 1;
        
        return {
            module,
            mode,
            count,
            element,
            originalAction: dataAction
        };
    }
    
    parseTextAction(keyword, element) {
        // 根據關鍵字推測模組和模式
        let module = '腳本'; // 預設
        let mode = 'oneclick';
        let count = 1;
        
        // 根據元素位置或上下文推測模組
        const pageId = this.getCurrentPageId();
        if (pageId) {
            module = this.moduleMapping[pageId] || module;
        }
        
        // 檢查是否為聊天模式
        if (keyword.includes('聊天') || keyword.includes('對話')) {
            mode = 'chat';
        }
        
        // 檢查批次數量
        const countMatch = element.textContent.match(/(\d+)/);
        if (countMatch) {
            count = parseInt(countMatch[1]);
        }
        
        return {
            module,
            mode,
            count,
            element,
            originalAction: keyword
        };
    }
    
    getCurrentPageId() {
        // 根據URL或頁面ID判斷當前模組
        const hash = window.location.hash;
        if (hash.includes('positioning')) return 'positioning';
        if (hash.includes('ideation')) return 'ideation';
        if (hash.includes('script')) return 'script';
        
        // 檢查當前顯示的頁面
        const pages = document.querySelectorAll('.page');
        for (const page of pages) {
            if (!page.classList.contains('hidden')) {
                const id = page.id;
                if (id.includes('positioning')) return 'positioning';
                if (id.includes('ideation')) return 'ideation';
                if (id.includes('script')) return 'script';
            }
        }
        
        return null;
    }
    
    async processAction(actionInfo, element) {
        if (!this.userId) {
            this.showLoginPrompt();
            return;
        }
        
        try {
            // 顯示載入狀態
            this.showLoading(element);
            
            // 請求授權
            const authResult = await this.requestAuthorization(actionInfo);
            
            if (authResult.authorized) {
                // 授權成功，執行原動作
                await this.executeOriginalAction(actionInfo, element);
            } else if (authResult.needTopup) {
                // 需要補點，顯示點數包購買
                this.showPointsModal(authResult, actionInfo, element);
            } else if (authResult.reason === 'UPGRADE_REQUIRED') {
                // 需要升級訂閱
                this.showUpgradeModal(actionInfo, element);
            } else {
                // 其他錯誤
                this.showError('授權失敗：' + authResult.reason);
            }
        } catch (error) {
            console.error('Process action error:', error);
            this.showError('處理失敗，請稍後再試');
        } finally {
            this.hideLoading(element);
        }
    }
    
    async requestAuthorization(actionInfo) {
        const response = await fetch(`${this.apiBase}/points/authorize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                module: actionInfo.module,
                mode: actionInfo.mode,
                count: actionInfo.count
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    }
    
    async executeOriginalAction(actionInfo, element) {
        // 儲存動作資訊供後續扣點使用
        const actionId = this.generateActionId();
        this.pendingActions.set(actionId, actionInfo);
        
        // 執行原動作
        if (element.tagName === 'FORM') {
            // 表單提交
            const formData = new FormData(element);
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            element.dispatchEvent(submitEvent);
        } else {
            // 按鈕點擊
            const clickEvent = new Event('click', { bubbles: true, cancelable: true });
            element.dispatchEvent(clickEvent);
        }
        
        // 延遲扣點（等待原動作完成）
        setTimeout(() => {
            this.consumePoints(actionId, actionInfo);
        }, 1000);
    }
    
    async consumePoints(actionId, actionInfo) {
        try {
            const response = await fetch(`${this.apiBase}/points/consume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    usage_id: actionId,
                    module: actionInfo.module,
                    mode: actionInfo.mode,
                    count: actionInfo.count,
                    points: actionInfo.cost || 0
                })
            });
            
            if (response.ok) {
                // 更新錢包資訊
                this.updateWalletInfo();
                // 清理待處理動作
                this.pendingActions.delete(actionId);
            }
        } catch (error) {
            console.error('Consume points error:', error);
        }
    }
    
    showPointsModal(authResult, actionInfo, element) {
        // 觸發點數購買彈窗
        if (window.aiPointsModal) {
            window.aiPointsModal.show({
                suggestPackIds: authResult.suggestPackIds,
                onSuccess: () => {
                    // 購買成功後重新執行原動作
                    this.processAction(actionInfo, element);
                }
            });
        }
    }
    
    showUpgradeModal(actionInfo, element) {
        // 觸發升級訂閱彈窗
        if (window.aiPointsModal) {
            window.aiPointsModal.showUpgrade({
                onSuccess: () => {
                    // 升級成功後重新執行原動作
                    this.processAction(actionInfo, element);
                }
            });
        }
    }
    
    showLoginPrompt() {
        // 顯示登入提示
        if (window.showToast) {
            window.showToast('請先登入', 'error');
        }
        
        // 觸發登入彈窗
        const loginBtn = document.querySelector('#login-btn, [data-action="login"]');
        if (loginBtn) {
            loginBtn.click();
        }
    }
    
    showLoading(element) {
        const originalText = element.textContent;
        element.setAttribute('data-original-text', originalText);
        element.textContent = '處理中...';
        element.disabled = true;
    }
    
    hideLoading(element) {
        const originalText = element.getAttribute('data-original-text');
        if (originalText) {
            element.textContent = originalText;
            element.removeAttribute('data-original-text');
        }
        element.disabled = false;
    }
    
    showError(message) {
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    }
    
    async updateWalletInfo() {
        try {
            const response = await fetch(`${this.apiBase}/points/wallet`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.walletInfo = await response.json();
                // 更新點數徽章
                if (window.aiPointsBadge) {
                    window.aiPointsBadge.update(this.walletInfo);
                }
            }
        } catch (error) {
            console.error('Update wallet info error:', error);
        }
    }
    
    generateActionId() {
        return 'action_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// 全域實例
window.aiPointsBus = new AIPointsBus();
