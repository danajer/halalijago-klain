// Konfigurasi WhatsApp
const CONFIG = {
    WA_NUMBER: '6282194565774',
    DEFAULT_MESSAGE: 'Halo%20saya%20membutuhkan%20bantuan%20Bank%20Jago',
    SERVICE_HOURS: {
        start: 8,
        end: 21,
        timezone: 'Asia/Jakarta'
    }
};

// Data layanan yang sering ditanyakan
const COMMON_ISSUES = [
    { issue: 'Akun Terblokir', message: 'Halo%20saya%20membutuhkan%20bantuan%20terkait%20akun%20saya%20yang%20terblokir.%20Mohon%20bantuannya.' },
    { issue: 'Lupa PIN', message: 'Halo%20saya%20lupa%20PIN%20akun%20Bank%20Jago.%20Mohon%20bantuan%20untuk%20reset%20PIN.' },
    { issue: 'Kendala Transaksi', message: 'Halo%20saya%20mengalami%20kendala%20dalam%20melakukan%20transaksi.%20Mohon%20bantuannya.' },
    { issue: 'Informasi Produk', message: 'Halo%20saya%20ingin%20menanyakan%20informasi%20mengenai%20produk%20Bank%20Jago.' }
];

// Fungsi untuk membuat link WhatsApp
function createWhatsAppLink(message = CONFIG.DEFAULT_MESSAGE) {
    return `https://wa.me/${CONFIG.WA_NUMBER}?text=${message}`;
}

// Fungsi untuk mengecek jam operasional
function checkOperationalHours() {
    try {
        const now = new Date();
        const hours = now.getHours();
        const isOperational = hours >= CONFIG.SERVICE_HOURS.start && hours < CONFIG.SERVICE_HOURS.end;
        
        const statusElement = document.getElementById('operationalStatus');
        if (statusElement) {
            if (isOperational) {
                statusElement.innerHTML = '✅ Layanan sedang aktif | Respon cepat dalam 5-10 menit';
                statusElement.style.color = '#25D366';
            } else {
                statusElement.innerHTML = '⏰ Di luar jam operasional (08.00-21.00 WIB), pesan akan direspon besok pagi';
                statusElement.style.color = '#ff9800';
            }
        }
        
        return isOperational;
    } catch (error) {
        console.error('Error checking operational hours:', error);
        return true;
    }
}

// Fungsi untuk menambahkan tombol issue cepat
function addQuickIssueButtons() {
    const container = document.getElementById('quickIssuesContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="quick-issues-title">🔍 Pilih masalah yang dialami untuk respon lebih cepat:</div>';
    
    COMMON_ISSUES.forEach(issue => {
        const button = document.createElement('button');
        button.className = 'quick-issue-btn';
        button.textContent = issue.issue;
        button.setAttribute('aria-label', `Bantuan untuk masalah ${issue.issue}`);
        button.onclick = () => {
            const waLink = createWhatsAppLink(issue.message);
            window.open(waLink, '_blank');
            trackWhatsAppClick(`quick_issue_${issue.issue.toLowerCase().replace(/\s/g, '_')}`);
        };
        container.appendChild(button);
    });
}

// Fungsi untuk tracking WhatsApp click
function trackWhatsAppClick(source = 'main') {
    const timestamp = new Date().toISOString();
    const eventData = {
        event: 'whatsapp_click',
        source: source,
        timestamp: timestamp,
        wa_number: CONFIG.WA_NUMBER,
        url: window.location.href,
        user_agent: navigator.userAgent
    };
    
    console.log('Tracking event:', eventData);
    
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'whatsapp_click', {
            'event_category': 'engagement',
            'event_label': source,
            'value': 1
        });
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Contact', {
            contact_method: 'WhatsApp',
            source: source
        });
    }
    
    // Simpan ke localStorage
    try {
        let clicks = localStorage.getItem('wa_clicks') || '[]';
        let clicksArray = JSON.parse(clicks);
        clicksArray.push(eventData);
        if (clicksArray.length > 100) clicksArray = clicksArray.slice(-100);
        localStorage.setItem('wa_clicks', JSON.stringify(clicksArray));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

// Fungsi untuk memvalidasi link WhatsApp
function validateWhatsAppLinks() {
    const links = document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp"]');
    let fixedCount = 0;
    
    links.forEach(link => {
        if (!link.href.includes(CONFIG.WA_NUMBER)) {
            const oldHref = link.href;
            link.href = createWhatsAppLink();
            fixedCount++;
            console.log(`Fixed link: ${oldHref} -> ${link.href}`);
        }
    });
    
    if (fixedCount > 0) {
        console.log(`Fixed ${fixedCount} WhatsApp link(s)`);
    }
}

// Fungsi untuk menambahkan fitur copy nomor
function addCopyNumberFeature() {
    const waNumberElement = document.querySelector('.wa-number a');
    if (!waNumberElement) return;
    
    const waNumber = waNumberElement.textContent.trim();
    
    const copyHint = document.createElement('div');
    copyHint.className = 'copy-hint';
    copyHint.innerHTML = '📋 Klik untuk copy nomor WhatsApp';
    copyHint.style.cssText = `
        font-size: 0.7rem;
        margin-top: 5px;
        opacity: 0.7;
        cursor: pointer;
    `;
    
    waNumberElement.parentElement?.appendChild(copyHint);
    
    copyHint.onclick = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(waNumber);
            copyHint.innerHTML = '✅ Nomor tersalin!';
            setTimeout(() => {
                copyHint.innerHTML = '📋 Klik untuk copy nomor WhatsApp';
            }, 2000);
            
            // Track copy event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'copy_phone_number', {
                    'event_category': 'engagement',
                    'event_label': 'whatsapp_number'
                });
            }
        } catch (err) {
            console.error('Failed to copy:', err);
            copyHint.innerHTML = '❌ Gagal menyalin, silakan copy manual';
        }
    };
}

// Fungsi untuk inisialisasi event listeners
function initializeEventListeners() {
    const waButton = document.getElementById('waButton');
    if (waButton) {
        waButton.addEventListener('click', (e) => {
            e.preventDefault();
            const waLink = createWhatsAppLink();
            window.open(waLink, '_blank');
            trackWhatsAppClick('button');
        });
    }
    
    const waMainLink = document.getElementById('waMainLink');
    if (waMainLink) {
        waMainLink.addEventListener('click', (e) => {
            trackWhatsAppClick('top_banner');
        });
    }
}

// Fungsi untuk menambahkan CSS dinamis
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .quick-issues-container {
            margin-top: 20px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 20px;
        }
        
        .quick-issues-title {
            font-size: 0.85rem;
            font-weight: 600;
            color: #475569;
            margin-bottom: 12px;
            text-align: center;
        }
        
        .quick-issue-btn {
            background: white;
            border: 1px solid #e2e8f0;
            padding: 8px 16px;
            margin: 6px;
            border-radius: 40px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s ease;
            color: #334155;
        }
        
        .quick-issue-btn:hover {
            background: #25D366;
            border-color: #25D366;
            color: white;
            transform: translateY(-2px);
        }
        
        .operational-status {
            margin-top: 12px;
            font-size: 0.75rem;
            text-align: center;
            font-weight: 500;
        }
        
        .copy-hint {
            transition: all 0.2s ease;
        }
        
        .copy-hint:hover {
            opacity: 1 !important;
            text-decoration: underline;
        }
        
        @media (max-width: 550px) {
            .quick-issue-btn {
                font-size: 0.75rem;
                padding: 6px 12px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Lazy loading images
function lazyLoadImages() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Performance monitoring
function reportPerformance() {
    if ('performance' in window && 'getEntriesByType' in performance) {
        const paintMetrics = performance.getEntriesByType('paint');
        paintMetrics.forEach(metric => {
            console.log(`${metric.name}: ${metric.startTime}ms`);
        });
        
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            console.log(`DOM Content Loaded: ${navigation.domContentLoadedEventEnd}ms`);
            console.log(`Load Complete: ${navigation.loadEventEnd}ms`);
        }
    }
}

// Inisialisasi halaman
function init() {
    console.log('Bank Jago CS Page initialized');
    console.log(`WhatsApp Number: ${CONFIG.WA_NUMBER}`);
    
    // Report performance
    reportPerformance();
    
    // Validasi link
    validateWhatsAppLinks();
    
    // Inisialisasi event
    initializeEventListeners();
    
    // Fitur copy nomor
    addCopyNumberFeature();
    
    // Cek jam operasional
    checkOperationalHours();
    
    // Dynamic styles
    addDynamicStyles();
    
    // Add quick issues container
    const infoText = document.querySelector('.info-text');
    if (infoText && !document.getElementById('quickIssuesContainer')) {
        const quickContainer = document.createElement('div');
        quickContainer.id = 'quickIssuesContainer';
        quickContainer.className = 'quick-issues-container';
        infoText.insertAdjacentElement('afterend', quickContainer);
        
        const statusContainer = document.createElement('div');
        statusContainer.id = 'operationalStatus';
        statusContainer.className = 'operational-status';
        quickContainer.insertAdjacentElement('afterend', statusContainer);
        
        addQuickIssueButtons();
        checkOperationalHours();
    }
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
    
    // Keyboard shortcut: Ctrl + Shift + C
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            const waNumber = CONFIG.WA_NUMBER;
            navigator.clipboard.writeText(waNumber).then(() => {
                const notification = document.createElement('div');
                notification.textContent = '✅ Nomor WhatsApp tersalin!';
                notification.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #25D366;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 40px;
                    font-size: 14px;
                    z-index: 1000;
                    animation: fadeInOut 2s ease;
                `;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 2000);
            });
        }
    });
    
    // Lazy load images
    lazyLoadImages();
    
    // Register service worker for PWA (optional)
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    }
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export untuk testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, createWhatsAppLink, checkOperationalHours };
      }
