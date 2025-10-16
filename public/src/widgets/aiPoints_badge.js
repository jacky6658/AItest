/**
 * AI Points Badge - 右上角懸浮點數餘額徽章
 * 可關閉，顯示餘額和即將到期點數
 */

class AIPointsBadge {
    constructor() {
        this.element = null;
        this.walletInfo = null;
        this.isVisible = true;
        this.apiBase = window.API_BASE || 'https://aijobvideobackend.zeabur.app';
        
        this.init();
    }
    
    init() {
        this.createElement();
        this.bindEvents();
        this.loadWalletInfo();
        
        // 檢查用戶設定
        this.loadSettings();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'aiPoints-badge';
        this.element.innerHTML = `
            <div class="balance">載入中...</div>
            <div class="expiring" style="display: none;"></div>
            <div class="close-btn" style="display: none;">×</div>
        `;
        
        // 添加到頁面
        document.body.appendChild(this.element);
    }
    
    bindEvents() {
        // 點擊徽章顯示詳細資訊
        this.element.addEventListener('click', () => {
            this.showDetails();
        });
        
        // 關閉按鈕
        const closeBtn = this.element.querySelector('.close-btn');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
        });
        
        // 懸停顯示關閉按鈕
        this.element.addEventListener('mouseenter', () => {
            const closeBtn = this.element.querySelector('.close-btn');
            closeBtn.style.display = 'block';
        });
        
        this.element.addEventListener('mouseleave', () => {
            const closeBtn = this.element.querySelector('.close-btn');
            closeBtn.style.display = 'none';
        });
    }
    
    async loadWalletInfo() {
        try {
            const response = await fetch(`${this.apiBase}/points/wallet`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.walletInfo = await response.json();
                this.update();
            } else {
                this.hide();
            }
        } catch (error) {
            console.error('Load wallet info error:', error);
            this.hide();
        }
    }
    
    update(walletInfo = null) {
        if (walletInfo) {
            this.walletInfo = walletInfo;
        }
        
        if (!this.walletInfo) return;
        
        const balanceEl = this.element.querySelector('.balance');
        const expiringEl = this.element.querySelector('.expiring');
        
        // 更新餘額
        balanceEl.textContent = `${this.walletInfo.balance} 點`;
        
        // 更新即將到期點數
        if (this.walletInfo.expiring_soon > 0) {
            expiringEl.textContent = `${this.walletInfo.expiring_soon} 點即將到期`;
            expiringEl.style.display = 'block';
        } else {
            expiringEl.style.display = 'none';
        }
        
        // 根據餘額調整樣式
        if (this.walletInfo.balance < 50) {
            this.element.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        } else if (this.walletInfo.balance < 100) {
            this.element.style.background = 'linear-gradient(135deg, #f59e0b 0%, #f59e0b 100%)';
        } else {
            this.element.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }
    
    show() {
        this.isVisible = true;
        this.element.style.display = 'block';
        this.saveSettings();
    }
    
    hide() {
        this.isVisible = false;
        this.element.style.display = 'none';
        this.saveSettings();
    }
    
    showDetails() {
        // 觸發點數詳情彈窗
        if (window.aiPointsModal) {
            window.aiPointsModal.show();
        }
    }
    
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('aiPoints_settings') || '{}');
            this.isVisible = settings.badgeVisible !== false;
            
            if (!this.isVisible) {
                this.hide();
            }
        } catch (error) {
            console.error('Load settings error:', error);
        }
    }
    
    saveSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('aiPoints_settings') || '{}');
            settings.badgeVisible = this.isVisible;
            localStorage.setItem('aiPoints_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Save settings error:', error);
        }
    }
    
    // 動畫效果
    animateUpdate() {
        this.element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.element.style.transform = 'scale(1)';
        }, 200);
    }
    
    // 閃爍提醒
    flash() {
        this.element.style.animation = 'pulse 0.5s ease-in-out 3';
        setTimeout(() => {
            this.element.style.animation = '';
        }, 1500);
    }
}

// 全域實例
window.aiPointsBadge = new AIPointsBadge();
