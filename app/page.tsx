"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { ArrowRight, Play, Check, X } from "lucide-react";

// 地区数据配置 (Exactly from target page)
const regions = [
  {
    id: 0,
    name: "亚太地区",
    // 含中国，体量最大。如果做跨境(不含中国内贸)，实际addressable market要小很多
    gmv: "~$3.5T", 
    cagr: "+9.8%",
    penetration: "～25%",
    // 亚太极其内卷，除日韩澳洲外，溢价极低
    premium: "++",
    position: "-0.5486480439652968m 1.4775669874312245m -1.7725976550136735m",
    normal: "-0.2657068842640681m 0.6147703602713593m -0.7426016804360897m"
  },
  {
    id: 1,
    name: "东南亚地区",
    // Google e-Conomy 2023报告数据：电商GMV约139B-150B
    gmv: "~$0.15T", 
    cagr: "+15.0%",
    penetration: "～14%",
    // 价格战重灾区，溢价低
    premium: "++", 
    position: "-1.0057529136436034m -0.12986786027995423m -2.1424169404943227m",
    normal: "-0.42639945106977467m -0.07347541574399662m -0.9015458232439668m"
  },
  {
    id: 2,
    name: "北美地区",
    // 品牌高地，也是Pithy AI服务的最佳战场
    gmv: "~$1.3T", 
    cagr: "+9.0%", // 受TikTok/Temu拉动，实际增速在回暖
    penetration: "～17%",
    // 真正的品牌溢价之王
    premium: "+++++", 
    position: "-0.29709103452649344m 1.5134071865400724m 1.795262940213165m",
    normal: "-0.11116269599976415m 0.6527212881755552m 0.7493982752719064m"
  },
  {
    id: 3,
    name: "欧洲地区",
    // 西欧高溢价，东欧高增长
    gmv: "~$0.75T", 
    cagr: "+8%",
    penetration: "～15%",
    premium: "++++",
    position: "1.4283934306386246m 1.8894230850450324m 0.055148412763570576m",
    normal: "0.6149504465772905m 0.7879868319301883m 0.030210941048180503m"
  },
  {
    id: 4,
    name: "拉美地区",
    // 修正了之前的 trillion 级错误，eMarketer 数据约 150B-190B
    gmv: "~$0.19T", 
    cagr: "+18%", // 全球增速最快地区之一
    penetration: "～11%",
    // 关税与物流壁垒导致的高终端价
    premium: "++++", 
    position: "1.383549740055114m -0.21364446293400108m 1.9065582926204068m",
    normal: "0.5940892594672141m -0.07347600365567172m 0.8010363466613042m"
  },
  {
    id: 5,
    name: "中东与非洲地区",
    // 主要是海湾六国(GCC)贡献高客单
    gmv: "~$0.06T", 
    cagr: "+13%",
    penetration: "～9%",
    // 豪客多，客单价(AOV)高，但退货率也是隐形成本
    premium: "++++", 
    position: "1.64376911562809m 0.9692231200150622m -1.4060847546521011m",
    normal: "0.6775186388869548m 0.4048332580339706m -0.6140672008423581m"
  }
];

type ModelViewer = HTMLElement & {
  loaded?: boolean;
  autoRotate?: boolean;
  cameraOrbit?: string;
  interpolationDecay?: number;
  play?: () => void;
  availableAnimations?: string[];
  animationName?: string;
};

// Throttle function helper
function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const modelViewerRef = useRef<ModelViewer | null>(null);
  
  // Animation state refs
  const isAnimatingRef = useRef(false);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentAnimationsRef = useRef<gsap.core.Tween[]>([]);
  
  // DOM refs for GSAP
  const bhome2Ref = useRef<HTMLDivElement>(null);
  const bhome2ZuoRef = useRef<HTMLDivElement>(null);
  const bhome2YouRef = useRef<HTMLDivElement>(null);
  const bhome1ZuoRef = useRef<HTMLDivElement>(null);
  const bhome1YouRef = useRef<HTMLDivElement>(null);
  const gridSvgRef = useRef<HTMLDivElement>(null);

  // Initialize model viewer
  useEffect(() => {
    const checkModelViewer = setInterval(() => {
      if (customElements.get("model-viewer")) {
        const mv = document.querySelector("#modelViewer") as ModelViewer;
        if (mv) {
          modelViewerRef.current = mv;
          mv.addEventListener("load", () => {
            setTimeout(() => setIsLoaded(true), 200);
            if (mv.availableAnimations && mv.availableAnimations.length > 0) {
              mv.animationName = mv.availableAnimations[0];
              mv.play?.();
            }
          });
          clearInterval(checkModelViewer);
        }
      }
    }, 100);
    return () => clearInterval(checkModelViewer);
  }, []);

  // Hotspot Click Logic
  const handleHotspotClick = (index: number, positionStr: string) => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    setActiveIndex(index);
    mv.autoRotate = false;
    
    const cleanPos = positionStr.replace(/m/g, '');
    const [x, y, z] = cleanPos.split(' ').map(Number);
    let longitude = Math.atan2(x, z) * 180 / Math.PI;
    // longitude += 15; // Offset from original script - Removed based on user feedback "needs to be centered"
    
    console.log(`Hotspot Clicked: ${index}, Pos: ${positionStr}, Calc Longitude: ${longitude}`);

    mv.cameraOrbit = `${longitude}deg 90deg 10m`;
    mv.interpolationDecay = 200;

    // Resume auto-rotate after delay
    setTimeout(() => {
      if (mv) mv.autoRotate = true;
    }, 3000);
  };

  const [pageIndex, setPageIndex] = useState(0);
  const pageIndexRef = useRef(0);
  const bhome3Ref = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    pageIndexRef.current = pageIndex;
  }, [pageIndex]);

  // Scroll Interaction Logic (The "SetPage" equivalent)
  const setPage = (direction: number) => {
    if (!isLoaded) {
        console.warn('Scroll ignored: Not loaded yet');
        return;
    }
    
    const mv = modelViewerRef.current;
    if (!mv) {
        console.warn('Scroll ignored: No model viewer');
        return;
    }

    if (isAnimatingRef.current) {
        console.log('Scroll ignored: Animating');
        return;
    }
    
    const currentIndex = pageIndexRef.current;
    let nextIndex = currentIndex + direction;

    // Clamp index
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex > 2) nextIndex = 2;

    if (nextIndex === currentIndex) return;

    console.log(`Transitioning: ${currentIndex} -> ${nextIndex}`);

    isAnimatingRef.current = true;
    setPageIndex(nextIndex);
    
    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    // Safety unlock
    lockTimeoutRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
    }, 2000);

    const winH = window.innerHeight;
    const winW = window.innerWidth;
    const pc = winW > 768;
    const offsetRight = winW - (mv.offsetWidth || 0);
    const offsetTop = winH - (mv.offsetHeight || 0);

    // 0 -> 1 (Home to CTA)
    if (currentIndex === 0 && nextIndex === 1) {
      const tl1 = gsap.to(bhome1ZuoRef.current, { opacity: 0, pointerEvents: 'none', clipPath: 'inset(0 100%)', duration: 0.3, overwrite: 'auto' });
      const tl2 = gsap.to(bhome1YouRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.3, overwrite: 'auto' });
      const tl3 = gsap.to(gridSvgRef.current, { opacity: 0, duration: 0.3, overwrite: 'auto' });
      
      const tl4 = gsap.to(bhome2Ref.current, { background: 'rgba(0, 0, 0, 0.35)', pointerEvents: 'auto', delay: 0.3, duration: 1, overwrite: 'auto' });
      const tl5 = gsap.to(bhome2ZuoRef.current, { opacity: 1, clipPath: 'inset(0% 0)', delay: 0.3, duration: 1.2, overwrite: 'auto' });
      const tl6 = gsap.to(bhome2YouRef.current, { opacity: 1, clipPath: 'inset(0% 0)', delay: 0.3, duration: 1.2, overwrite: 'auto' });

      // Hide hotspots
      const hotspots = document.querySelectorAll('.Hotspot');
      hotspots.forEach(el => el.classList.add('on'));

      const tl7 = gsap.to(mv, {
        scale: 1.5,
        right: offsetRight / 2,
        top: offsetTop / 2,
        duration: 1,
        overwrite: 'auto',
        onComplete: () => { isAnimatingRef.current = false; }
      });
      currentAnimationsRef.current.push(tl1, tl2, tl3, tl4, tl5, tl6, tl7);
    }
    // 1 -> 0 (CTA to Home)
    else if (currentIndex === 1 && nextIndex === 0) {
      const tl1 = gsap.to(bhome2Ref.current, { background: 'rgba(0, 0, 0, 0)', pointerEvents: 'none', duration: 0.3, overwrite: 'auto' });
      const tl2 = gsap.to(bhome2ZuoRef.current, { opacity: 0, clipPath: 'inset(100% 0)', duration: 0.3, overwrite: 'auto' });
      const tl3 = gsap.to(bhome2YouRef.current, { opacity: 0, clipPath: 'inset(100% 0)', duration: 0.3, overwrite: 'auto' });

      const tl4 = gsap.to(mv, {
        scale: 1,
        right: pc ? '-4vw' : 0,
        top: '10vh',
        duration: 1,
        overwrite: 'auto',
        onComplete: function () {
            const hotspots = document.querySelectorAll('.Hotspot');
            hotspots.forEach(el => el.classList.remove('on'));
            gsap.to(bhome1ZuoRef.current, { opacity: 1, pointerEvents: 'auto', clipPath: 'inset(0 0%)', duration: 0.2, overwrite: 'auto', onComplete: () => { isAnimatingRef.current = false; } });
            gsap.to(bhome1YouRef.current, { opacity: 1, pointerEvents: 'auto', duration: 0.6, overwrite: 'auto' });
            gsap.to(gridSvgRef.current, { opacity: 1, duration: 0.6, overwrite: 'auto' });
        }
      });
      currentAnimationsRef.current.push(tl1, tl2, tl3, tl4);
    }
    // 1 -> 2 (CTA to Pricing)
    else if (currentIndex === 1 && nextIndex === 2) {
       // Hide CTA
       const tl1 = gsap.to(bhome2ZuoRef.current, { opacity: 0, duration: 0.5, overwrite: 'auto' });
       const tl2 = gsap.to(bhome2YouRef.current, { opacity: 0, duration: 0.5, overwrite: 'auto' });
       
       // Adjust Earth for Background (Dim it slightly and keep it centered)
       const tl3 = gsap.to(mv, { 
           opacity: 0.6, 
           scale: 1.2, // Slightly smaller than CTA to fit background better
           filter: 'blur(2px)', // Optional: blur slightly to focus on content
           duration: 1, 
           overwrite: 'auto', 
           pointerEvents: 'none' 
       });
       
       // Show Pricing
       const tl4 = gsap.to(bhome3Ref.current, { 
           opacity: 1, 
           pointerEvents: 'auto', 
           duration: 0.8, 
           delay: 0.3,
           overwrite: 'auto',
           onComplete: () => { isAnimatingRef.current = false; } 
       });
       
       currentAnimationsRef.current.push(tl1, tl2, tl3, tl4);
    }
    // 2 -> 1 (Pricing to CTA)
    else if (currentIndex === 2 && nextIndex === 1) {
       // Hide Pricing
       const tl1 = gsap.to(bhome3Ref.current, { opacity: 0, pointerEvents: 'none', duration: 0.5, overwrite: 'auto' });
       
       // Restore Earth for CTA
       const tl2 = gsap.to(mv, { 
           opacity: 1, 
           scale: 1.5, 
           filter: 'blur(0px)',
           duration: 0.8, 
           delay: 0.3, 
           overwrite: 'auto', 
           pointerEvents: 'auto' 
       });
       
       // Show CTA
       const tl3 = gsap.to(bhome2ZuoRef.current, { opacity: 1, duration: 0.8, delay: 0.3, overwrite: 'auto' });
       const tl4 = gsap.to(bhome2YouRef.current, { opacity: 1, duration: 0.8, delay: 0.3, overwrite: 'auto', onComplete: () => { isAnimatingRef.current = false; } });
       
       currentAnimationsRef.current.push(tl1, tl2, tl3, tl4);
    }
  };

  // Event Listeners for Scroll
  useEffect(() => {
    const handleWheel = throttle((e: WheelEvent) => {
      const delta = e.deltaY;
      console.log('Wheel delta:', delta);
      // Threshold from original: 20 or 30
      if (Math.abs(delta) > 20) {
        setPage(delta > 0 ? 1 : -1);
      }
    }, 16);

    // Touch logic
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
        startY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
        const endY = e.changedTouches[0].clientY;
        const deltaY = endY - startY; // Swipe down (negative delta) vs Swipe up (positive delta)
        
        if (Math.abs(deltaY) > 30) {
            setPage(deltaY < 0 ? 1 : -1);
        }
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('touchstart', handleTouchStart, { capture: true });
      window.removeEventListener('touchend', handleTouchEnd, { capture: true });
    };
  }, [isLoaded]);

  // Initial GSAP Setups (from original script)
  useEffect(() => {
    if (!bhome2Ref.current) return;
    
    gsap.set(bhome2Ref.current, {
      background: 'rgba(0, 0, 0, 0)',
      pointerEvents: 'none',
      duration: 0.3,
      overwrite: 'auto'
    });
    gsap.set(bhome2ZuoRef.current, {
      opacity: 0,
      clipPath: 'inset(100% 0)',
      duration: 0.3,
      overwrite: 'auto'
    });
    gsap.set(bhome2YouRef.current, {
      opacity: 0,
      clipPath: 'inset(100% 0)',
      duration: 0.3,
      overwrite: 'auto'
    });
  }, []);

  const activeData = regions[activeIndex];

  // Handle active class manually to avoid re-rendering and losing model-viewer transforms
  useEffect(() => {
    const buttons = document.querySelectorAll('.Hotspot');
    buttons.forEach((btn, index) => {
        if (index === activeIndex) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
  }, [activeIndex]);

  return (
    <div className="bhome-full">
      {/* Grid Background */}
      <div className="grid-svg" ref={gridSvgRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <img 
            src="https://www.super-i.cn/bpsf/img/bhome1-1.svg" 
            alt="Background Grid" 
            style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                opacity: 0.6 // Adjust opacity if needed to match previous subtlety
            }} 
         />
      </div>

      {/* @ts-ignore */}
      <model-viewer
        id="modelViewer"
        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 1s ease' }}
        src="https://www.super-i.cn/bpsf/img/earth.glb?v=1.0.1"
        camera-controls
        tone-mapping="neutral"
        shadow-intensity="0"
        shadow-softness="0"
        min-camera-orbit="auto 90deg auto"
        max-camera-orbit="auto 90deg auto"
        disable-pan
        disable-tap
        disable-zoom
        interaction-prompt="none"
        auto-rotate
      >
        {regions.map((region, index) => (
          <button
            key={region.id}
            className="Hotspot"
            slot={`hotspot-${region.id + 2}`}
            data-position={region.position}
            data-normal={region.normal}
            data-visibility-attribute="visible"
            onClick={() => handleHotspotClick(index, region.position)}
          >
            <div className="HotspotAnnotation">{region.name}</div>
          </button>
        ))}
      {/* @ts-ignore */}
      </model-viewer>

      {/* Home State (bhome1) */}
      <div className="bhome1" style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 1s ease', pointerEvents: isLoaded ? 'auto' : 'none' }}>
        {/* Logo positioned absolutely at top-left */}
        <div className="logo-container">
            <div className="logo-icon"></div>
            <span className="logo-text" style={{ 
                color: (pageIndex === 2 && isMobile) ? '#000' : (pageIndex > 0 ? '#fff' : '#000'), 
                transition: 'color 0.5s ease'
            }}>款世科技</span>
        </div>

        <div className="zuo" ref={bhome1ZuoRef}>
          <div className="t1" style={{ fontSize: '1.2vw', fontWeight: 600, marginBottom: '1.5vw', letterSpacing: '0.05em', opacity: 0.6 }}>
            QUANSE AI · 品牌出海策略引擎
          </div>
          <div className="t2" style={{ fontSize: '3.8vw', fontWeight: 'bold', lineHeight: 1.1, marginBottom: '2vw', letterSpacing: '-0.02em' }}>
            以数据定义款式，<br />
            用算法连接世界。
          </div>
          <div className="t3" style={{ fontSize: '1.1vw', lineHeight: 1.6, color: 'rgba(0,0,0,0.6)', marginBottom: '3vw', maxWidth: '32vw' }}>
            集顶级品牌策略与 AIGC 生产力于一体，<br />
            让每一次出海，都是对市场的精准降维打击。
          </div>
          
          {/* Removed button, adjusted layout spacing */}
          
          <div className="t4" style={{ marginTop: '1vw', fontSize: '0.9vw', color: 'rgba(0,0,0,0.4)', borderLeft: '2px solid #D4FE94', paddingLeft: '1vw' }}>
             QUANSE AI: 无需经验，重塑属于你的全球化商业基因。
          </div>
        </div>

        <div className="you" ref={bhome1YouRef}>
            <div className="swiper">
                {/* Active Slide Content */}
                <div className="sec1">
                    <div className="name">{activeData.name}</div>
                    <div className="swiper-pagination">
                        {regions.map((r, i) => (
                            <div 
                                key={r.id} 
                                className={`swiper-pagination-bullet ${i === activeIndex ? 'active' : ''}`}
                                onClick={() => handleHotspotClick(i, r.position)}
                            />
                        ))}
                    </div>
                </div>
                <div className="ul f_12">
                    <div className="li">
                        <span>GMV</span>
                        <span>{activeData.gmv}</span>
                    </div>
                    <div className="li">
                        <span>CAGR</span>
                        <span>{activeData.cagr}</span>
                    </div>
                    <div className="li">
                        <span>线上化渗透率</span>
                        <span>{activeData.penetration}</span>
                    </div>
                    <div className="li">
                        <span>品牌溢价空间</span>
                        <span>{activeData.premium}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* CTA State (bhome2) */}
      <div className="bhome2" ref={bhome2Ref}>
        <div className="zuo" ref={bhome2ZuoRef}>
          <div className="t1 f_16" style={{ marginBottom: '2vw', opacity: 0.8 }}>全链路增长生态 (The Growth Ecosystem)</div>
          
          <div className="solution-list" style={{ display: 'flex', flexDirection: 'column', gap: '2vw' }}>
             {/* Item 01 */}
             <div className="item">
                <div className="item-title" style={{ fontSize: '1.2vw', fontWeight: 'bold', marginBottom: '0.5vw' }}>01. 视觉基建 (Visual Infrastructure)</div>
                <div className="item-desc" style={{ fontSize: '0.9vw', lineHeight: 1.5, opacity: 0.9, marginBottom: '0.3vw' }}>
                    <span style={{ fontWeight: 600 }}>[核心：重塑成本结构]</span> 利用生成式 AI，将原本昂贵的“商拍”降维成毫秒级的代码运算。
                </div>
                <div className="item-tags" style={{ fontSize: '0.8vw', opacity: 0.6 }}>#AI商拍 #场景合成 #无限弹药</div>
             </div>

             {/* Item 02 */}
             <div className="item">
                <div className="item-title" style={{ fontSize: '1.2vw', fontWeight: 'bold', marginBottom: '0.5vw' }}>02. 流量矩阵 (Traffic Matrix)</div>
                <div className="item-desc" style={{ fontSize: '0.9vw', lineHeight: 1.5, opacity: 0.9, marginBottom: '0.3vw' }}>
                    <span style={{ fontWeight: 600 }}>[核心：饱和式攻击]</span> “2+2” 矩阵模型。用 AI 人设建立信任，用暴力分发捕获流量。
                </div>
                <div className="item-tags" style={{ fontSize: '0.8vw', opacity: 0.6 }}>#账号托管 #自动获客 #算法博弈</div>
             </div>

             {/* Item 03 */}
             <div className="item">
                <div className="item-title" style={{ fontSize: '1.2vw', fontWeight: 'bold', marginBottom: '0.5vw' }}>03. 增长风控 (Growth Certainty)</div>
                <div className="item-desc" style={{ fontSize: '0.9vw', lineHeight: 1.5, opacity: 0.9, marginBottom: '0.3vw' }}>
                    <span style={{ fontWeight: 600 }}>[核心：确定性回报]</span> 拒绝盲目烧钱。从素材 CTR 测款到全案投流，建立 ROI 数据护城河。
                </div>
                <div className="item-tags" style={{ fontSize: '0.8vw', opacity: 0.6 }}>#投流托管 #品牌溢价 #资产沉淀</div>
             </div>
          </div>

          <a href="#" className="bhome2-btn" style={{ marginTop: '3vw', background: '#D4FE94', color: '#000', fontWeight: 600 }}>开启企业基因诊断</a>
        </div>

        <div className="you" ref={bhome2YouRef} style={{ width: '45vw' }}>
          <video 
            width='100%' 
            loop 
            muted 
            autoPlay 
            playsInline
            src='https://www.super-i.cn/bpsf/img/texiao3.mp4' 
            style={{ borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
          />
        </div>
      </div>
      {/* Pricing State (bhome3) */}
      <div className="bhome3" ref={bhome3Ref}>
         <div className="pricing-container">
            {/* Card 1: Entry */}
            <div className="pricing-card">
                <div className="pricing-header-sm">入门版</div>
                <div className="pricing-header-lg">跨境出海·战略洞察包</div>
                <div className="pricing-header-sub">DeepResearch Kit</div>
                
                <div className="pricing-target">
                    <span className="pricing-target-title">针对人群</span>
                    处于转型期、犹豫是否出海、需要数据支撑决策的工厂老板。
                </div>

                <div className="pricing-price">¥3,980</div>
                <div className="pricing-period">一次性付费 / One-time</div>
                
                <div className="pricing-divider"></div>
                
                <div className="pricing-features">
                    <div className="feature-item">
                        <span className="feature-bold">基因诊断：</span><span className="feature-desc">评估现有视觉评分，测算价格竞争力</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-bold">竞品透视：</span><span className="feature-desc">拆解亚马逊热销爆品，洞察 TikTok 流量来源</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-bold">战术规划：</span><span className="feature-desc">明确平台渠道打法，制定首月落地路径</span>
                    </div>
                </div>
                
                <button className="pricing-btn">获取样本报告</button>
            </div>

            {/* Card 2: Growth (Recommended) */}
            <div className="pricing-card recommended">
                <div className="pricing-badge">推荐 / Best Value</div>
                <div className="pricing-header-sm">增长版 (Growth)</div>
                <div className="pricing-header-lg">矩阵运营托管</div>
                <div className="pricing-header-sub">Matrix Ops</div>
                
                <div className="pricing-target">
                    <span className="pricing-target-title">针对人群</span>
                    需要搭建流量矩阵，从0到1起号的客户。
                </div>

                <div className="pricing-price">询价 / 月费制</div>
                <div className="pricing-period">Custom / Monthly Retainer</div>
                
                <div className="pricing-divider"></div>
                
                <div className="pricing-features">
                    <div className="feature-item">
                        <span className="feature-bold">基建部署：</span><span className="feature-desc">配置4组独享环境，完成人设装修</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-bold">内容填充：</span><span className="feature-desc">产出AI网红生活流，制作爆款带货混剪</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-bold">运营托管：</span><span className="feature-desc">负责挂车发布操作，维护评论区互动</span>
                    </div>
                </div>
                
                <button className="pricing-btn">预约企业诊断</button>
            </div>

            {/* Card 3: Scale */}
            <div className="pricing-card">
                <div className="pricing-header-sm">品牌版 (Scale)</div>
                <div className="pricing-header-lg">全案增长</div>
                <div className="pricing-header-sub">Pro Scale</div>
                
                <div className="pricing-target">
                    <span className="pricing-target-title">针对人群</span>
                    需要投流放量、做品牌溢价的大客户。
                </div>

                <div className="pricing-price">底薪 + 佣金</div>
                <div className="pricing-period">Commission Based</div>
                
                <div className="pricing-divider"></div>
                
                <div className="pricing-features">
                    <div className="feature-item">
                        <span className="feature-bold">投流托管：</span><span className="feature-desc">每日监控投放数据，严格把控 ROI 风控</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-bold">品牌视觉：</span><span className="feature-desc">打造电影级 TVC 大片，定制30张 KV 海报</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-bold">资产归还：</span><span className="feature-desc">移交广告账户权限，沉淀人群包资产</span>
                    </div>
                </div>
                
                <button className="pricing-btn">联系销售顾问</button>
            </div>
         </div>
      </div>
    </div>
  );
}
