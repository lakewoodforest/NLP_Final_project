import { useEffect, useRef, useState } from "react";

export default function Intro({ onContinue }) {
  const videoRef = useRef(null);
  const exitTimer = useRef(null);
  const [finished, setFinished] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let active = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const video = videoRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video?.pause();
      setFinished(true);
    } else {
      video?.play().catch(() => {
        if (active) setFinished(true);
      });
    }

    return () => {
      active = false;
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(exitTimer.current);
      video?.pause();
    };
  }, []);

  const continueToSite = () => {
    if (leaving) return;
    videoRef.current?.pause();
    setLeaving(true);
    exitTimer.current = window.setTimeout(onContinue, 550);
  };

  return (
    <div className={`intro-screen${leaving ? " intro-screen--leaving" : ""}`} role="dialog" aria-modal="true" aria-label="한입 부동산 인트로">
      <video
        ref={videoRef}
        className="intro-screen__video"
        src="/hanip-intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => setFinished(true)}
        onError={() => setFinished(true)}
        aria-label="한입 부동산 캐릭터 인트로 영상"
      />
      <div className="intro-screen__shade" aria-hidden="true" />
      <button type="button" className="intro-screen__skip" onClick={continueToSite} autoFocus>
        {finished ? "시작하기" : "건너뛰기"}<span aria-hidden="true">→</span>
      </button>
      {finished && (
        <div className="intro-screen__end" aria-live="polite">
          <div>
            <strong>한입 부동산</strong>
            <p>나에게 맞는 방을 만나보세요</p>
          </div>
          <button type="button" className="intro-screen__start" onClick={continueToSite} aria-label="웹사이트 시작하기">→</button>
        </div>
      )}
    </div>
  );
}
