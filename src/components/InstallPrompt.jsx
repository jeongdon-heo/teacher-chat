import React, { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;

    // Check if dismissed recently (24h)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) return;

    // iOS detection
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isiOS) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // Android / Chrome
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="install-banner">
        <div className="install-banner-content">
          <div className="install-banner-icon">
            <svg viewBox="0 0 100 100" width="40" height="40">
              <rect width="100" height="100" rx="20" fill="#1a6b5a"/>
              <path d="M25 30 h50 a5 5 0 0 1 5 5 v25 a5 5 0 0 1-5 5 h-10 l-15 12 v-12 h-25 a5 5 0 0 1-5-5 v-25 a5 5 0 0 1 5-5z" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <div className="install-banner-text">
            <strong>담임톡 앱 설치</strong>
            <span>홈 화면에 추가하여 빠르게 접속하세요</span>
          </div>
        </div>
        <div className="install-banner-actions">
          <button className="install-btn" onClick={handleInstall}>설치</button>
          <button className="install-dismiss" onClick={handleDismiss}>닫기</button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="ios-guide-overlay" onClick={handleDismiss}>
          <div className="ios-guide" onClick={(e) => e.stopPropagation()}>
            <h3>홈 화면에 추가하기</h3>
            <ol>
              <li>하단의 <strong>공유 버튼</strong> <span className="ios-share-icon">⬆</span> 을 탭하세요</li>
              <li><strong>"홈 화면에 추가"</strong>를 선택하세요</li>
              <li><strong>"추가"</strong>를 탭하면 완료!</li>
            </ol>
            <button className="btn btn-primary" onClick={handleDismiss}>확인</button>
          </div>
        </div>
      )}
    </>
  );
}
