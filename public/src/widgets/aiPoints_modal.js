/**
 * AI Points Modal - 點數購買與訂閱升級彈窗
 * 兩個分頁：加購點數包 / 升級訂閱方案
 */

class AIPointsModal {
    constructor() {
        this.element = null;
        this.currentTab = 'packs';
        this.pointPacks = [];
        this.plans = [];
        this.selectedPack = null;
        this.apiBase = window.API_BASE || 'https://aijobvideobackend.zeabur.app';
        this.callbacks = {};
        
        this.init();
    }
    
    init() {
        this.createElement();
        this.bindEvents();
        this.loadData();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'aiPoints-modal';
        this.element.innerHTML = `
            <div class="aiPoints-modal-content">
                <div class="aiPoints-modal-header">
                    <h3 class="aiPoints-modal-title">點數管理</h3>
                    <button class="aiPoints-modal-close">×</button>
                </div>
                
                <div class="aiPoints-tabs">
                    <button class="aiPoints-tab active" data-tab="packs">加購點數</button>
                    <button class="aiPoints-tab" data-tab="plans">升級訂閱</button>
                </div>
                
                <div class="aiPoints-tab-content">
                    <!-- 點數包分頁 -->
                    <div id="packs-tab" class="aiPoints-tab-panel">
                        <div class="aiPoints-packs" id="point-packs-list">
                            <div class="aiPoints-loading show">載入中...</div>
                        </div>
                    </div>
                    
                    <!-- 訂閱方案分頁 -->
                    <div id="plans-tab" class="aiPoints-tab-panel" style="display: none;">
                        <div class="aiPoints-plans" id="plans-list">
                            <div class="aiPoints-loading show">載入中...</div>
                        </div>
                    </div>
                </div>
                
                <div class="aiPoints-actions">
                    <button class="aiPoints-btn aiPoints-btn-primary" id="purchase-btn" disabled>
                        立即購買
                    </button>
                    <button class="aiPoints-btn aiPoints-btn-secondary" id="cancel-btn">
                        取消
                    </button>
                </div>
            </div>
        `;
        
        // 添加到頁面
        document.body.appendChild(this.element);
    }
    
    bindEvents() {
        // 關閉按鈕
        this.element.querySelector('.aiPoints-modal-close').addEventListener('click', () => {
            this.hide();
        });
        
        // 背景點擊關閉
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        });
        
        // ESC鍵關閉
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
        
        // 分頁切換
        this.element.querySelectorAll('.aiPoints-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
        
        // 購買按鈕
        this.element.querySelector('#purchase-btn').addEventListener('click', () => {
            this.handlePurchase();
        });
        
        // 取消按鈕
        this.element.querySelector('#cancel-btn').addEventListener('click', () => {
            this.hide();
        });
    }
    
    async loadData() {
        await Promise.all([
            this.loadPointPacks(),
            this.loadPlans()
        ]);
    }
    
    async loadPointPacks() {
        try {
            const response = await fetch(`${this.apiBase}/points/packs`);
            if (response.ok) {
                this.pointPacks = await response.json();
                this.renderPointPacks();
            }
        } catch (error) {
            console.error('Load point packs error:', error);
            this.showError('載入點數包失敗');
        }
    }
    
    async loadPlans() {
        try {
            const response = await fetch(`${this.apiBase}/plans/list`);
            if (response.ok) {
                this.plans = await response.json();
                this.renderPlans();
            }
        } catch (error) {
            console.error('Load plans error:', error);
            this.showError('載入訂閱方案失敗');
        }
    }
    
    renderPointPacks() {
        const container = this.element.querySelector('#point-packs-list');
        const loading = this.element.querySelector('#point-packs-list .aiPoints-loading');
        
        if (loading) {
            loading.remove();
        }
        
        container.innerHTML = this.pointPacks.map(pack => `
            <div class="aiPoints-pack" data-pack-id="${pack.pack_id}">
                ${pack.name === '標準包' ? '<div class="aiPoints-pack-popular">推薦</div>' : ''}
                <div class="aiPoints-pack-header">
                    <div class="aiPoints-pack-points">${pack.points} 點</div>
                    <div class="aiPoints-pack-price">NT$ ${pack.price_ntd}</div>
                </div>
                <div class="aiPoints-pack-desc">${this.getPackDescription(pack)}</div>
                <div class="aiPoints-pack-validity">有效期 ${pack.valid_days} 天</div>
            </div>
        `).join('');
        
        // 綁定點數包選擇事件
        container.querySelectorAll('.aiPoints-pack').forEach(pack => {
            pack.addEventListener('click', () => {
                this.selectPack(parseInt(pack.dataset.packId));
            });
        });
    }
    
    renderPlans() {
        const container = this.element.querySelector('#plans-list');
        const loading = this.element.querySelector('#plans-list .aiPoints-loading');
        
        if (loading) {
            loading.remove();
        }
        
        container.innerHTML = this.plans.map(plan => `
            <div class="aiPoints-plan" data-plan-id="${plan.plan_id}">
                <div class="aiPoints-plan-name">${plan.name}</div>
                <div class="aiPoints-plan-desc">${this.getPlanDescription(plan)}</div>
                <div class="aiPoints-plan-price">NT$ ${this.calculatePlanPrice(plan)}</div>
                <ul class="aiPoints-plan-features">
                    <li>每月 ${plan.monthly_points} 點數</li>
                    <li>批次上限 ${plan.batch_limit} 次</li>
                    <li>角色上限 ${plan.roles_limit} 個</li>
                </ul>
                <button class="aiPoints-btn aiPoints-btn-primary" onclick="aiPointsModal.openSubscribe(${plan.plan_id})">
                    選擇方案
                </button>
            </div>
        `).join('');
    }
    
    getPackDescription(pack) {
        const descriptions = {
            '小額包': '適合輕度使用者，每日少量創作',
            '標準包': '適合一般創作者，平衡價格與點數',
            '大額包': '適合重度使用者，大量創作需求'
        };
        return descriptions[pack.name] || '高品質點數包';
    }
    
    getPlanDescription(plan) {
        const descriptions = {
            '基礎方案': '適合個人創作者',
            '專業方案': '適合小型團隊',
            '企業方案': '適合大型企業'
        };
        return descriptions[plan.name] || '專業訂閱方案';
    }
    
    calculatePlanPrice(plan) {
        // 這裡需要根據實際定價策略計算
        const basePrices = {
            '基礎方案': 299,
            '專業方案': 999,
            '企業方案': 2999
        };
        return basePrices[plan.name] || 999;
    }
    
    selectPack(packId) {
        // 移除其他選中狀態
        this.element.querySelectorAll('.aiPoints-pack').forEach(pack => {
            pack.classList.remove('selected');
        });
        
        // 選中當前點數包
        const packElement = this.element.querySelector(`[data-pack-id="${packId}"]`);
        if (packElement) {
            packElement.classList.add('selected');
            this.selectedPack = packId;
            
            // 啟用購買按鈕
            const purchaseBtn = this.element.querySelector('#purchase-btn');
            purchaseBtn.disabled = false;
            purchaseBtn.textContent = '立即購買';
        }
    }
    
    switchTab(tabName) {
        // 更新分頁按鈕狀態
        this.element.querySelectorAll('.aiPoints-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // 更新分頁內容
        this.element.querySelectorAll('.aiPoints-tab-panel').forEach(panel => {
            panel.style.display = panel.id === `${tabName}-tab` ? 'block' : 'none';
        });
        
        this.currentTab = tabName;
        
        // 重置購買按鈕
        const purchaseBtn = this.element.querySelector('#purchase-btn');
        purchaseBtn.disabled = true;
        purchaseBtn.textContent = tabName === 'packs' ? '請選擇點數包' : '請選擇方案';
    }
    
    async handlePurchase() {
        if (this.currentTab === 'packs') {
            await this.purchasePack();
        } else {
            // 訂閱方案由外部處理
            this.hide();
        }
    }
    
    async purchasePack() {
        if (!this.selectedPack) return;
        
        const purchaseBtn = this.element.querySelector('#purchase-btn');
        purchaseBtn.disabled = true;
        purchaseBtn.textContent = '處理中...';
        
        try {
            const response = await fetch(`${this.apiBase}/points/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    pack_id: this.selectedPack
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showSuccess('購買成功！點數已到帳');
                
                // 更新錢包資訊
                if (window.aiPointsBadge) {
                    window.aiPointsBadge.loadWalletInfo();
                }
                
                // 執行回調
                if (this.callbacks.onSuccess) {
                    this.callbacks.onSuccess(result);
                }
                
                this.hide();
            } else {
                const error = await response.json();
                this.showError('購買失敗：' + (error.detail || '未知錯誤'));
            }
        } catch (error) {
            console.error('Purchase error:', error);
            this.showError('購買失敗，請稍後再試');
        } finally {
            purchaseBtn.disabled = false;
            purchaseBtn.textContent = '立即購買';
        }
    }
    
    openSubscribe(planId) {
        // 這裡需要根據您的訂閱系統實現
        // 可能是跳轉到外部付款頁面或調用現有的訂閱API
        if (window.openSubscribe) {
            window.openSubscribe(planId);
        } else {
            this.showError('訂閱功能暫未開放，請聯繫客服');
        }
    }
    
    show(options = {}) {
        this.callbacks = options;
        
        // 根據建議的點數包預選
        if (options.suggestPackIds && options.suggestPackIds.length > 0) {
            this.switchTab('packs');
            setTimeout(() => {
                this.selectPack(options.suggestPackIds[0]);
            }, 100);
        }
        
        this.element.classList.add('show');
        document.body.classList.add('modal-open');
    }
    
    showUpgrade(options = {}) {
        this.callbacks = options;
        this.switchTab('plans');
        this.element.classList.add('show');
        document.body.classList.add('modal-open');
    }
    
    hide() {
        this.element.classList.remove('show');
        document.body.classList.remove('modal-open');
        this.callbacks = {};
    }
    
    isVisible() {
        return this.element.classList.contains('show');
    }
    
    showError(message) {
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    }
    
    showSuccess(message) {
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            alert(message);
        }
    }
}

// 全域實例
window.aiPointsModal = new AIPointsModal();
