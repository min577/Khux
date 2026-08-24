import { useEffect } from "react";
import { Link } from "react-router";
import { SideRays } from "../components/side-rays/SideRays";
import { SITE_LINKS } from "../data/site-links";

// 히어로 하단 외부 채널 바로가기. 주소는 site-links.ts 한 곳에서만 관리한다.
const HERO_LINKS = [
  { label: "웹사이트 바로가기", href: SITE_LINKS.mainSite },
  { label: "인스타 바로가기", href: SITE_LINKS.instagram },
  { label: "링크드인 바로가기", href: SITE_LINKS.linkedin },
].filter((l) => l.href);

// 디자이너가 제공한 정적 랜딩(khux-apply-landing.html)을 최대한 그대로 이식.
// 전역 스타일과 충돌하지 않도록 .khux-landing 스코프 아래에 원본 CSS를 유지.
const LANDING_STYLES = `
.khux-landing{
  --bg: var(--background);
  --card: #0d1119;
  --border: var(--border);
  --border-strong: rgba(255,255,255,0.18);
  --mint: var(--primary);
  --mint-deep: #17a37d;
  --mint-dim: rgba(45,212,166,0.12);
  --text-1: var(--foreground);
  --text-2: #98A3A8;
  --text-3: #565F66;
  position:relative;
  background:var(--bg);
  color:var(--text-1);
  font-family:'Pretendard Variable', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height:1.6;
  overflow-x:hidden;
}
.khux-landing *{box-sizing:border-box; margin:0; padding:0;}
/* 화면 좌상단에 고정으로 깔리는 앰비언트 글로우. 천천히 숨 쉬듯 밝기가 오간다. */
.khux-landing::before{
  content:'';
  position:fixed;
  top:-300px; left:-300px;
  width:1000px; height:1000px;
  background:radial-gradient(circle, rgba(45,212,166,0.26), rgba(45,212,166,0.08) 45%, transparent 72%);
  pointer-events:none;
  z-index:0;
  animation:khuxAmbient 11s ease-in-out infinite;
}
/* 오른쪽 아래에서 올라오는 반대편 글로우 */
.khux-landing::after{
  content:'';
  position:fixed;
  right:-320px; bottom:-360px;
  width:900px; height:900px;
  background:radial-gradient(circle, rgba(45,212,166,0.16), transparent 70%);
  pointer-events:none;
  z-index:0;
  animation:khuxAmbient 11s ease-in-out 3.5s infinite;
}
.khux-landing .mono{font-family:'IBM Plex Mono', monospace;}
/* 히어로는 화면 폭에 비례해 꽉 차도록 유동 패딩 사용 */
.khux-landing{ --side-pad:clamp(24px, 6vw, 120px); }
.khux-landing .wrap{max-width:960px; margin:0 auto; padding:0 32px;}
.khux-landing .wrap-wide{max-width:none; margin:0 auto; padding:0 var(--side-pad);}
.khux-landing a{color:inherit; text-decoration:none;}
.khux-landing em{font-style:normal; color:var(--mint);}

.khux-landing .track{
  position:absolute;
  left:50%;
  top:0;
  bottom:0;
  width:1px;
  background:linear-gradient(to bottom, transparent, rgba(45,212,166,0.25) 8%, rgba(45,212,166,0.25) 92%, transparent);
  transform:translateX(-480px);
  z-index:0;
}
@media (max-width:1240px){ .khux-landing .track{display:none;} }

.khux-landing .root-mark{
  position:absolute;
  left:50%;
  transform:translate(-481px,-50%);
  width:9px; height:9px;
  border-radius:50%;
  background:var(--bg);
  border:1.5px solid var(--mint);
  opacity:0;
  transition:opacity .6s ease, transform .6s ease;
  z-index:1;
}
.khux-landing .root-mark::before{
  content:'';
  position:absolute;
  left:50%; top:50%;
  width:16px; height:1px;
  background:var(--mint);
  transform:translate(0,-50%);
  opacity:.5;
}
.khux-landing .in-view .root-mark{ opacity:1; }
@media (max-width:1240px){ .khux-landing .root-mark{display:none;} }

.khux-landing section{ position:relative; z-index:1; }
.khux-landing .track-region{ position:relative; }

/* HERO */
.khux-landing .hero{
  /* 첫 화면이 브라우저 높이를 꽉 채우고 콘텐츠는 세로 중앙 정렬 */
  min-height:100vh;
  min-height:100svh;
  display:flex;
  align-items:center;
  padding:32px 0;
  overflow:hidden;
}
.khux-landing .hero .wrap-wide{ width:100%; }
.khux-landing .eyebrow-tag{
  display:inline-flex; align-items:center; gap:8px;
  font-size:12px;
  letter-spacing:.08em;
  color:var(--mint);
  margin-bottom:28px;
}
.khux-landing .eyebrow-tag::before{
  content:'';
  width:6px; height:6px;
  border-radius:50%;
  background:var(--mint);
  box-shadow:0 0 10px var(--mint);
}
.khux-landing .hero-inner{ position:relative; }
.khux-landing .hero-copy{ position:relative; z-index:1; max-width:58%; }
.khux-landing .hero-title{
  /* 오른쪽 브랜드 마크와 겹치지 않도록 축소된 vw 기반 스케일 */
  font-size:clamp(40px, min(7vw, 12vh), 150px);
  font-weight:800;
  letter-spacing:-0.03em;
  line-height:1.06;
  color:var(--text-1);
}
.khux-landing .hero-org{
  margin-top:26px;
  font-size:clamp(15px, 1.4vw, 19px);
  font-weight:500;
  color:var(--text-1);
}
/* 브랜드 마크: 화면 오른쪽 절반을 차지하며 둥둥 떠 있는 배경 오브젝트 */
.khux-landing .hero-visual{
  position:absolute;
  right:-6%;
  top:50%;
  transform:translateY(-54%);
  width:clamp(340px, 48vw, 960px);
  z-index:0;
  pointer-events:none;
  /* 마크가 큰 만큼 원근을 멀리 둬야 좌우 반동이 과하게 일그러지지 않는다 */
  perspective:2400px;
}
.khux-landing .hero-mark{ position:relative; transform-style:preserve-3d; }
/* 마크 모양대로 마스킹한 하이라이트. 반동과 같은 주기로 훑고 지나간다. */
.khux-landing .hero-sheen{
  position:absolute;
  inset:0;
  opacity:0;
  pointer-events:none;
  background:linear-gradient(112deg,
    transparent 40%,
    rgba(200,255,240,0.30) 46%,
    rgba(255,255,255,0.95) 50%,
    rgba(200,255,240,0.30) 54%,
    transparent 60%);
  background-size:280% 280%;
  background-position:130% 0%;
  -webkit-mask-image:url(/khux-mark.webp);
  mask-image:url(/khux-mark.webp);
  -webkit-mask-size:contain;
  mask-size:contain;
  -webkit-mask-repeat:no-repeat;
  mask-repeat:no-repeat;
  -webkit-mask-position:center;
  mask-position:center;
  mix-blend-mode:screen;
}
.khux-landing .hero-visual::before{
  content:'';
  position:absolute;
  inset:-14%;
  background:radial-gradient(circle, rgba(45,212,166,0.22), transparent 65%);
  filter:blur(30px);
}
.khux-landing .hero-visual img{
  position:relative;
  width:100%;
  filter:drop-shadow(0 30px 60px rgba(45,212,166,0.2));
}
@media (max-width:860px){
  .khux-landing .hero-inner{ text-align:center; }
  .khux-landing .hero-copy{ max-width:none; }
  .khux-landing .hero-title{ font-size:clamp(42px, 11.5vw, 64px); }
  .khux-landing .eyebrow-tag{ justify-content:center; }
  .khux-landing .hero-visual{
    position:relative;
    right:auto; top:auto;
    /* 데스크톱의 translateY(-54%)를 반드시 해제한다. 남겨두면 마크가 자기 높이의 절반만큼
       위로 끌려 올라가 hero의 overflow:hidden에 윗부분이 잘린다. */
    transform:none;
    margin:0 auto 16px;
    width:min(58vw, 250px);
  }
  .khux-landing .meta-row{ margin-top:40px; padding-top:24px; }
}

.khux-landing .hero-cta{
  display:flex;
  justify-content:flex-start;
  gap:12px;
  margin-top:40px;
  flex-wrap:wrap;
}
@media (max-width:860px){ .khux-landing .hero-cta{justify-content:center;} }
.khux-landing .btn-primary{
  background:var(--mint);
  color:#06231b;
  font-weight:700;
  font-size:15px;
  padding:14px 28px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  gap:8px;
  transition:transform .15s ease, background .15s ease;
}
.khux-landing .btn-primary:hover{ background:#3fe6b8; transform:translateY(-1px); }
.khux-landing .btn-ghost{
  border:1px solid var(--border-strong);
  color:var(--text-1);
  font-weight:600;
  font-size:15px;
  padding:14px 24px;
  border-radius:999px;
  transition:border-color .15s ease, background .15s ease;
}
.khux-landing .btn-ghost:hover{ border-color:var(--mint); background:var(--mint-dim); }

.khux-landing .meta-row{
  display:flex;
  justify-content:flex-start;
  gap:32px;
  margin-top:40px;
  padding-top:26px;
  border-top:1px solid var(--border);
  flex-wrap:wrap;
}
@media (max-width:860px){ .khux-landing .meta-row{justify-content:center; text-align:center;} }
.khux-landing .meta-item{ text-align:left; }
@media (max-width:860px){ .khux-landing .meta-item{text-align:center;} }
.khux-landing .meta-item .k{
  font-size:11px;
  color:var(--text-3);
  letter-spacing:.06em;
  text-transform:uppercase;
  margin-bottom:6px;
}
.khux-landing .meta-item .v{ font-size:15px; color:var(--text-1); font-weight:500; }
.khux-landing .meta-item .v .mono{ color:var(--mint); }

/* 히어로가 100vh를 채우는 레이아웃이라, 바로가기 줄은 첫 화면 안에 들어오도록 최대한 납작하게 둔다 */
.khux-landing .hero-links{
  display:flex;
  justify-content:flex-start;
  gap:10px;
  margin-top:22px;
  flex-wrap:wrap;
  /* pill 안쪽 여백(22px)+테두리만큼 왼쪽으로 당겨, 글자 시작점을 위 meta-row와 맞춘다 */
  margin-left:-23px;
}
@media (max-width:860px){ .khux-landing .hero-links{justify-content:center; margin-left:0;} }
.khux-landing .link-pill{
  display:inline-flex;
  align-items:center;
  gap:10px;
  border:1px solid rgba(45,212,166,0.55);
  color:var(--text-1);
  font-size:14px;
  font-weight:600;
  padding:12px 22px;
  border-radius:999px;
  transition:border-color .15s ease, background .15s ease, color .15s ease;
}
.khux-landing .link-pill .arrow{ color:var(--text-3); transition:color .15s ease, transform .15s ease; }
.khux-landing .link-pill:hover{ border-color:var(--mint); background:var(--mint-dim); color:var(--text-1); }
.khux-landing .link-pill:hover .arrow{ color:var(--mint); transform:translateX(2px); }

/* SECTION HEADER */
.khux-landing .sec-head{ margin-bottom:44px; }
.khux-landing .eyebrow{
  font-size:12px;
  letter-spacing:.08em;
  color:var(--mint);
  margin-bottom:14px;
  display:block;
}
.khux-landing .sec-head h2{
  font-size:34px;
  font-weight:800;
  letter-spacing:-0.015em;
  line-height:1.3;
  color:var(--text-1);
}
.khux-landing .sec-head p{
  margin-top:14px;
  font-size:15px;
  color:var(--text-2);
  max-width:480px;
}

.khux-landing section.pad{ padding:88px 0; }
.khux-landing section.pad + section.pad{ border-top:1px solid var(--border); }

/* WHY */
.khux-landing .why-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:1px;
  background:var(--border);
  border:1px solid var(--border);
  border-radius:16px;
  overflow:hidden;
}
.khux-landing .why-card{
  background:var(--card);
  padding:32px 28px;
}
.khux-landing .why-card .num{
  font-size:12px;
  color:var(--mint);
  margin-bottom:20px;
}
.khux-landing .why-card h3{
  font-size:18px;
  font-weight:700;
  margin-bottom:10px;
  color:var(--text-1);
}
.khux-landing .why-card p{ font-size:14px; color:var(--text-2); }
@media (max-width:760px){ .khux-landing .why-grid{grid-template-columns:1fr;} }

/* TRACKS */
.khux-landing .track-list{ display:flex; flex-direction:column; gap:1px; background:var(--border); border:1px solid var(--border); border-radius:16px; overflow:hidden;}
.khux-landing .track-item{
  background:var(--card);
  padding:24px 28px;
  display:grid;
  grid-template-columns:180px 1fr;
  gap:24px;
  align-items:baseline;
}
.khux-landing .track-item .role{ font-size:17px; font-weight:700; color:var(--mint); }
.khux-landing .track-item .desc{ font-size:14px; color:var(--text-2); }
@media (max-width:640px){ .khux-landing .track-item{grid-template-columns:1fr; gap:6px;} }

/* PROCESS */
.khux-landing .process-list{ display:flex; flex-direction:column; }
.khux-landing .proc-item{
  display:grid;
  grid-template-columns:88px 1fr 140px;
  gap:20px;
  align-items:center;
  padding:22px 0;
  border-top:1px solid var(--border);
}
.khux-landing .proc-item:last-child{ border-bottom:1px solid var(--border); }
.khux-landing .proc-item .step{ font-size:12px; color:var(--mint); }
.khux-landing .proc-item h4{ font-size:16px; font-weight:700; color:var(--text-1); }
.khux-landing .proc-item .when{ font-size:13px; color:var(--text-2); text-align:right; }
@media (max-width:640px){
  .khux-landing .proc-item{grid-template-columns:1fr; text-align:left; gap:4px;}
  .khux-landing .proc-item .when{ text-align:left; }
}

/* FAQ */
.khux-landing details{
  border-top:1px solid var(--border);
  padding:20px 0;
}
.khux-landing details:last-child{ border-bottom:1px solid var(--border); }
.khux-landing summary{
  cursor:pointer;
  list-style:none;
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:16px;
  font-weight:600;
  color:var(--text-1);
}
.khux-landing summary::-webkit-details-marker{ display:none; }
.khux-landing summary::after{
  content:'+';
  font-size:20px;
  color:var(--mint);
  font-weight:400;
  transition:transform .2s ease;
}
.khux-landing details[open] summary::after{ transform:rotate(45deg); }
.khux-landing details p{
  margin-top:14px;
  font-size:14px;
  color:var(--text-2);
  max-width:600px;
}

/* FINAL CTA */
.khux-landing .final{
  text-align:center;
  padding:120px 0 140px;
  overflow:hidden;
  position:relative;
}
.khux-landing .final::before{
  content:'';
  position:absolute;
  left:50%; top:50%;
  width:900px; height:900px;
  transform:translate(-50%,-50%);
  background:radial-gradient(circle, rgba(45,212,166,0.10), transparent 65%);
  pointer-events:none;
}
.khux-landing .final-mark{
  position:absolute;
  left:50%; top:50%;
  width:520px;
  transform:translate(-50%,-50%) rotate(-8deg);
  opacity:0.05;
  pointer-events:none;
}
.khux-landing .final h2{
  font-size:46px;
  font-weight:800;
  letter-spacing:-0.02em;
  line-height:1.25;
  margin-bottom:36px;
  position:relative;
}
.khux-landing .deadline{
  font-size:13px;
  color:var(--text-3);
  margin-top:24px;
  position:relative;
}
.khux-landing .deadline .mono{ color:var(--mint); }

.khux-landing .reveal{
  opacity:0;
  transform:translateY(16px);
  transition:opacity .6s ease, transform .6s ease;
}
.khux-landing .in-view .reveal{ opacity:1; transform:translateY(0); }

.khux-landing .hero .reveal{ opacity:1; transform:none; }

/* ── 모션/강조효과 ─────────────────────────────────────────── */
@keyframes khuxRise{
  from{ opacity:0; transform:translateY(18px); }
  to{ opacity:1; transform:translateY(0); }
}
@keyframes khuxFloat{
  0%,100%{ transform:translateY(0) rotate(0deg); }
  50%{ transform:translateY(-18px) rotate(-2.5deg); }
}
/* 마크 좌우 반동 + 그 리듬에 맞춰 지나가는 메탈릭 하이라이트 */
@keyframes khuxTilt{
  0%,100%{ transform:rotateY(-16deg); }
  50%{ transform:rotateY(16deg); }
}
@keyframes khuxSweep{
  0%{ background-position:130% 0%; opacity:0; }
  12%{ opacity:1; }
  46%{ opacity:1; }
  62%{ background-position:-40% 0%; opacity:0; }
  100%{ background-position:-40% 0%; opacity:0; }
}
/* 옆 도트: 글자와 같은 타임라인으로 부드럽게 밝기가 오간다 */
@keyframes khuxNeonDot{
  0%,100%{ opacity:.6; box-shadow:0 0 5px rgba(45,212,166,.45); }
  12%,46%{ opacity:1; box-shadow:0 0 11px var(--mint), 0 0 22px rgba(45,212,166,.55); }
  54%{ opacity:.72; box-shadow:0 0 6px rgba(45,212,166,.5); }
  64%,88%{ opacity:1; box-shadow:0 0 11px var(--mint), 0 0 22px rgba(45,212,166,.55); }
}
@keyframes khuxGlow{
  0%,100%{ box-shadow:0 0 0 0 rgba(45,212,166,0.0); }
  50%{ box-shadow:0 0 26px 4px rgba(45,212,166,0.28); }
}

/* 히어로: 로드 시 순차 등장 + 브랜드 마크 플로팅 */
.khux-landing .hero-copy > *{ animation:khuxRise .7s ease both; }
.khux-landing .hero-copy > :nth-child(2){ animation-delay:.08s; }
.khux-landing .hero-copy > :nth-child(3){ animation-delay:.16s; }
.khux-landing .hero-cta{ animation:khuxRise .7s ease .3s both; }
.khux-landing .meta-row{ animation:khuxRise .7s ease .4s both; }
/* 마크 모션 전체를 1.35배속으로 (플로팅 7s→5.2s, 반동·스윕 5s→3.7s) */
.khux-landing .hero-visual img{ animation:khuxRise .9s ease both, khuxFloat 5.2s ease-in-out 1.2s infinite; }
.khux-landing .hero-mark{ animation:khuxTilt 3.7s ease-in-out 1.4s infinite; }
.khux-landing .hero-sheen{ animation:khuxSweep 3.7s ease-in-out 1.4s infinite; }

/* 상단 태그: 켜졌다 꺼지는 점멸 대신, 밝기가 완만하게 오가는 네온.
   꺼질 때도 완전히 죽지 않게 바닥값을 올리고 주기도 늘려 눈에 덜 걸리게 한다. */
@keyframes khuxNeonText{
  0%,100%{ color:rgba(45,212,166,.62); text-shadow:0 0 4px rgba(45,212,166,.22); }
  12%,46%{ color:#eafff8; text-shadow:0 0 7px rgba(45,212,166,.85), 0 0 18px rgba(45,212,166,.45); }
  54%{ color:rgba(45,212,166,.72); text-shadow:0 0 4px rgba(45,212,166,.3); }
  64%,88%{ color:#eafff8; text-shadow:0 0 7px rgba(45,212,166,.85), 0 0 18px rgba(45,212,166,.45); }
}
.khux-landing .eyebrow-tag{
  font-size:13px;
  font-weight:600;
  animation:khuxRise .7s ease both, khuxNeonText 3.6s ease-in-out .7s infinite;
}
.khux-landing .eyebrow-tag::before{ animation:khuxNeonDot 3.6s ease-in-out .7s infinite; }

@keyframes khuxAmbient{
  0%,100%{ opacity:.55; transform:scale(1); }
  50%{ opacity:1; transform:scale(1.12); }
}

/* 스크롤 등장: 카드/리스트 스태거 */
.khux-landing .why-card,
.khux-landing .track-item,
.khux-landing .proc-item,
.khux-landing details{ opacity:0; }
.khux-landing .in-view .why-card,
.khux-landing .in-view .track-item,
.khux-landing .in-view .proc-item,
.khux-landing .in-view details{ animation:khuxRise .55s ease both; }
.khux-landing .in-view .why-card:nth-child(2),
.khux-landing .in-view .track-item:nth-child(2),
.khux-landing .in-view .proc-item:nth-child(2),
.khux-landing .in-view details:nth-child(2){ animation-delay:.1s; }
.khux-landing .in-view .why-card:nth-child(3),
.khux-landing .in-view .track-item:nth-child(3),
.khux-landing .in-view .proc-item:nth-child(3),
.khux-landing .in-view details:nth-child(3){ animation-delay:.2s; }
.khux-landing .in-view .proc-item:nth-child(4),
.khux-landing .in-view details:nth-child(4){ animation-delay:.3s; }
.khux-landing .in-view .proc-item:nth-child(5){ animation-delay:.4s; }
.khux-landing .in-view .proc-item:nth-child(6){ animation-delay:.5s; }

/* 호버 강조 (transform은 등장 애니메이션과 충돌하므로 배경/글로우만 사용) */
.khux-landing .why-card{ transition:background .25s ease; }
.khux-landing .why-card:hover{ background:#111826; }
.khux-landing .why-card:hover .num{ text-shadow:0 0 12px rgba(45,212,166,.8); }
.khux-landing .track-item{ transition:background .25s ease; }
.khux-landing .track-item:hover{ background:#111826; }
.khux-landing .track-item:hover .role{ text-shadow:0 0 14px rgba(45,212,166,.55); }
.khux-landing .proc-item{ transition:background .2s ease; }
.khux-landing .proc-item:hover{ background:rgba(45,212,166,0.045); }

/* 최종 CTA: 은은한 글로우 펄스 */
.khux-landing .final .btn-primary{ animation:khuxGlow 2.8s ease-in-out infinite; }

/* 모션 최소화 설정 사용자는 즉시 표시 */
@media (prefers-reduced-motion: reduce){
  .khux-landing *,
  .khux-landing *::before,
  .khux-landing *::after{ animation:none !important; transition:none !important; }
  .khux-landing .reveal,
  .khux-landing .why-card,
  .khux-landing .track-item,
  .khux-landing .proc-item,
  .khux-landing details{ opacity:1 !important; transform:none !important; }
}
`;

export function RecruitLanding() {
  useEffect(() => {
    const items = document.querySelectorAll("[data-observe]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
      },
      { threshold: 0.2 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="khux-landing">
      <style>{LANDING_STYLES}</style>

      {/* 페이지 전체 배경에 깔리는 레이 모션 (콘텐츠는 z-index 1 이상이라 가려지지 않음).
          기본값은 거의 보이지 않아, 밝기·불투명도를 올려 배경 글로우가 드러나게 조정. */}
      <SideRays intensity={2.8} opacity={0.85} saturation={1.2} spread={1.7} />

      <section className="hero">
        <div className="wrap-wide">
          <div className="hero-inner">
            <div className="hero-visual">
              <div className="hero-mark">
                <img src="/khux-mark.webp" alt="KHUX 브랜드 마크" width={628} height={628} />
                <span className="hero-sheen" aria-hidden="true" />
              </div>
            </div>
            <div className="hero-copy">
              <span className="eyebrow-tag mono">KHUX 4th Recruiting</span>
              <h1 className="hero-title">
                치열한 고민과
                <br />
                <em>밀도 있는 성장</em>
              </h1>
              <p className="hero-org">
                경희대학교 UX/HCI 학회 <em>KHUX</em>
              </p>
            </div>
          </div>
          <div className="hero-cta">
            <a href="#apply" className="btn-primary">
              4기 지원하기 →
            </a>
            <a href="#tracks" className="btn-ghost">
              모집 분야 보기
            </a>
          </div>
          <div className="meta-row">
            <div className="meta-item">
              <div className="k mono">모집 인원</div>
              <div className="v">
                총 <span className="mono">10명</span>
              </div>
            </div>
            <div className="meta-item">
              <div className="k mono">활동 기간</div>
              <div className="v">1년 (주 1회 정기 세션)</div>
            </div>
            <div className="meta-item">
              <div className="k mono">지원 마감</div>
              <div className="v">
                <span className="mono">8.23 (일) 23:59</span>
              </div>
            </div>
          </div>
          <div className="hero-links">
            {HERO_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-pill"
              >
                {label} <span className="arrow">→</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="track-region">
        <div className="track" />

        <section className="pad" data-observe>
        <div className="root-mark" />
        <div className="wrap reveal">
          <div className="sec-head">
            <span className="eyebrow mono">WHY KHUX</span>
            <h2>
              세 가지는 <em>분명합니다</em>
            </h2>
            <p>전공, 학년, 경험 무관하게 지원할 수 있어요.</p>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="num mono">01</div>
              <h3>프로젝트로 배웁니다</h3>
              <p>이론 스터디보다 실제 프로젝트가 중심입니다. 문제 정의부터 프로토타입까지, 손으로 완성해봅니다.</p>
            </div>
            <div className="why-card">
              <div className="num mono">02</div>
              <h3>직군을 넘나듭니다</h3>
              <p>기획, 리서치, 디자인, 개발이 한 팀에서 붙어 일합니다. 내 역할 밖의 언어도 자연히 익히게 됩니다.</p>
            </div>
            <div className="why-card">
              <div className="num mono">03</div>
              <h3>결과로 증명합니다</h3>
              <p>발표 자료가 아니라 실제로 사용 가능한 서비스, 결과물을 남깁니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pad" id="tracks" data-observe>
        <div className="root-mark" />
        <div className="wrap reveal">
          <div className="sec-head">
            <span className="eyebrow mono">RECRUITING TRACKS</span>
            <h2>
              3개 분야에서 <em>모집합니다</em>
            </h2>
            <p>지원서에서 희망 분야를 2지망까지 선택할 수 있어요.</p>
          </div>
          <div className="track-list">
            <div className="track-item">
              <div className="role">Education</div>
              <div className="desc">
                예비 UX 전문가들을 위해 가장 효율적인 커리큘럼을 기획하고 교육 콘텐츠를 제작합니다. 이론 학습과 실무 적용 사이의 간극을 줄일 수 있는 세션을 운영하며, 학회원들이 서로의 지식을 공유하고 함께 성장하는 학습 문화를 주도합니다.
              </div>
            </div>
            <div className="track-item">
              <div className="role">Operations</div>
              <div className="desc">
                학회의 살림을 책임지며, 구성원들이 깊은 소속감을 느끼고 시너지를 낼 수 있는 조직 문화를 만듭니다. 리크루팅부터 온보딩, 운영 관리까지 활동 전반에서 발생할 수 있는 불필요한 마찰을 줄여 매끄럽고 즐거운 활동 경험을 제공합니다.
              </div>
            </div>
            <div className="track-item">
              <div className="role">Growth</div>
              <div className="desc">
                학회의 성장에 온전히 집중하는 팀입니다. 학회를 하나의 브랜드로 정의하여 마케팅 전략을 수립하고, 적극적인 기업 파트너십 유치를 통해 외부와의 연결 고리를 만듭니다. 학회원들이 더 넓은 무대에서 활약할 수 있도록 성장의 발판을 마련합니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pad" data-observe>
        <div className="root-mark" />
        <div className="wrap reveal">
          <div className="sec-head">
            <span className="eyebrow mono">PROCESS</span>
            <h2>
              지원부터 <em>합류까지</em>
            </h2>
          </div>
          <div className="process-list">
            <div className="proc-item">
              <div className="step mono">STEP 01</div>
              <h4>1차 서류 전형</h4>
              <div className="when mono">8.12 – 8.25</div>
            </div>
            <div className="proc-item">
              <div className="step mono">STEP 02</div>
              <h4>
                1차 전형 결과
                <br />
                <span style={{ fontWeight: 400, color: "var(--text-2)", fontSize: 13 }}>개별 문자 안내</span>
              </h4>
              <div className="when mono">8.26</div>
            </div>
            <div className="proc-item">
              <div className="step mono">STEP 03</div>
              <h4>
                2차 면접 전형
                <br />
                <span style={{ fontWeight: 400, color: "var(--text-2)", fontSize: 13 }}>비대면</span>
              </h4>
              <div className="when mono">8.26 – 8.28</div>
            </div>
            <div className="proc-item">
              <div className="step mono">STEP 04</div>
              <h4>
                2차 전형 결과
                <br />
                <span style={{ fontWeight: 400, color: "var(--text-2)", fontSize: 13 }}>개별 문자 안내</span>
              </h4>
              <div className="when mono">8.29</div>
            </div>
            <div className="proc-item">
              <div className="step mono">STEP 05</div>
              <h4>
                부트캠프
                <br />
                <span style={{ fontWeight: 400, color: "var(--text-2)", fontSize: 13 }}>비대면 · 필참</span>
              </h4>
              <div className="when mono">8.31</div>
            </div>
            <div className="proc-item">
              <div className="step mono">STEP 06</div>
              <h4>
                OT
                <br />
                <span style={{ fontWeight: 400, color: "var(--text-2)", fontSize: 13 }}>대면 · 필참</span>
              </h4>
              <div className="when mono">9.3</div>
            </div>
          </div>
        </div>
      </section>

      <section className="pad" data-observe>
        <div className="root-mark" />
        <div className="wrap reveal">
          <div className="sec-head">
            <span className="eyebrow mono">FAQ</span>
            <h2>
              지원 전에 <em>궁금한 것들</em>
            </h2>
          </div>
          <div>
            <details open>
              <summary>전공 무관하게 지원할 수 있나요?</summary>
              <p>네. 실제로 3기 멤버 대부분이 서로 다른 전공입니다. 대신 지원 분야에 대한 관심과, 프로젝트를 끝까지 만들어보려는 의지를 봅니다.</p>
            </details>
            <details>
              <summary>활동은 온라인인가요, 오프라인인가요?</summary>
              <p>정기 세션은 온라인으로 진행하고, 팀 작업은 온오프라인을 병행합니다. 학기 중 필요에 따라 조정됩니다.</p>
            </details>
            <details>
              <summary>주당 얼마나 시간을 써야 하나요?</summary>
              <p>정기 세션 1시간 + 팀 작업 시간이 별도로 필요합니다. 프로젝트 막바지에는 그보다 더 쓰게 되는 주도 있습니다.</p>
            </details>
            <details>
              <summary>디자인 툴을 다뤄본 적이 없어도 되나요?</summary>
              <p>네, 괜찮습니다. 툴 사용 경험보다 문제를 어떻게 풀어가는지를 더 봅니다. 합류 후 부트캠프를 통해 시각화 실력을 키울 수 있습니다.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="final" id="apply" data-observe>
        <img className="final-mark" src="/khux-mark.webp" alt="" role="presentation" width={628} height={628} />
        <div className="wrap reveal">
          <h2>
            지금,
            <br />
            <em>지원하세요</em>
          </h2>
          <Link to="/recruit" className="btn-primary">
            지원서 작성하기 →
          </Link>
          <div className="deadline">
            지원 마감 <span className="mono">2026.08.23 (일) 23:59</span>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
