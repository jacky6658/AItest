/**
 * AI Points Bootstrap - 啟動程式
 * 自動掛載點數系統組件
 */

(function() {
    'use strict';
    
    // 等待DOM載入完成
    function waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // 等待依賴載入
    function waitForDependencies() {
        return new Promise((resolve) => {
            const checkDependencies = () => {
                // 檢查必要的全域變數
                if (window.API_BASE && window.showToast) {
                    resolve();
                } else {
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }
    
    // 初始化點數系統
    async function initAIPointsSystem() {
        try {
            console.log('Initializing AI Points System...');
            
            // 等待DOM和依賴載入
            await waitForDOM();
            await waitForDependencies();
            
            // 載入CSS樣式
            loadStyles();
            
            // 載入JavaScript模組
            await loadModules();
            
            // 初始化組件
            initComponents();
            
            // 設定全域方法
            setupGlobalMethods();
            
            console.log('AI Points System initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize AI Points System:', error);
        }
    }
    
    function loadStyles() {
        // 檢查是否已載入樣式
        if (document.querySelector('link[href*="points-addon.css"]')) {
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/points-addon.css';
        link.type = 'text/css';
        document.head.appendChild(link);
    }
    
    async function loadModules() {
        const modules = [
            '/src/lib/aiPoints_bus.js',
            '/src/widgets/aiPoints_badge.js',
            '/src/widgets/aiPoints_modal.js'
        ];
        
        const loadPromises = modules.map(module => {
            return new Promise((resolve, reject) => {
                // 檢查是否已載入
                if (document.querySelector(`script[src*="${module}"]`)) {
                    resolve();
                    return;
                }
                
                const script = document.createElement('script');
                script.src = module;
                script.type = 'module';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });
        
        await Promise.all(loadPromises);
    }
    
    function initComponents() {
        // 組件會在載入時自動初始化
        // 這裡可以添加額外的初始化邏輯
    }
    
    function setupGlobalMethods() {
        // 設定全域方法供外部調用
        window.aiPoints = {
            showModal: (options) => {
                if (window.aiPointsModal) {
                    window.aiPointsModal.show(options);
                }
            },
            showUpgrade: (options) => {
                if (window.aiPointsModal) {
                    window.aiPointsModal.showUpgrade(options);
                }
            },
            updateBadge: () => {
                if (window.aiPointsBadge) {
                    window.aiPointsBadge.loadWalletInfo();
                }
            },
            hideBadge: () => {
                if (window.aiPointsBadge) {
                    window.aiPointsBadge.hide();
                }
            },
            showBadge: () => {
                if (window.aiPointsBadge) {
                    window.aiPointsBadge.show();
                }
            }
        };
    }
    
    // 添加CSS動畫
    function addAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .aiPoints-badge {
                transition: all 0.3s ease;
            }
            
            .aiPoints-modal {
                transition: opacity 0.3s ease;
            }
            
            .aiPoints-modal.show {
                opacity: 1;
            }
            
            .aiPoints-pack, .aiPoints-plan {
                transition: all 0.2s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 添加錯誤處理
    function setupErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.filename && event.filename.includes('aiPoints')) {
                console.error('AI Points System Error:', event.error);
            }
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.toString().includes('aiPoints')) {
                console.error('AI Points System Promise Rejection:', event.reason);
            }
        });
    }
    
    // 添加開發模式檢查
    function checkDevelopmentMode() {
        const isDev = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('dev');
        
        if (isDev) {
            console.log('AI Points System running in development mode');
            // 可以添加開發模式特有的功能
        }
    }
    
    // 添加性能監控
    function setupPerformanceMonitoring() {
        if (window.performance && window.performance.mark) {
            window.performance.mark('aiPoints-init-start');
        }
        
        // 監控初始化時間
        setTimeout(() => {
            if (window.performance && window.performance.mark) {
                window.performance.mark('aiPoints-init-end');
                window.performance.measure('aiPoints-init', 'aiPoints-init-start', 'aiPoints-init-end');
            }
        }, 1000);
    }
    
    // 主啟動函數
    async function start() {
        try {
            addAnimations();
            setupErrorHandling();
            checkDevelopmentMode();
            setupPerformanceMonitoring();
            
            await initAIPointsSystem();
            
        } catch (error) {
            console.error('AI Points System startup failed:', error);
        }
    }
    
    // 立即啟動
    start();
    
})();
