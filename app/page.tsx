"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { ArrowRight, Play, Check, X } from "lucide-react";

// 地区数据配置 (Exactly from target page)
const regions = [
  {
    id: 0,
    name: "亚太地区",
    gmv: "~$4.44T",
    cagr: "+10.3%",
    penetration: "～20%",
    premium: "++++",
    position: "-0.5486480439652968m 1.4775669874312245m -1.7725976550136735m"
  },
  {
    id: 1,
    name: "东南亚地区",
    gmv: "~$0.4539T",
    cagr: "+11.14%",
    penetration: "～12.8%",
    premium: "++++",
    position: "-1.0057529136436034m -0.12986786027995423m -2.1424169404943227m"
  },
  {
    id: 2,
    name: "北美地区",
    gmv: "~$1.25T",
    cagr: "+5.0%",
    penetration: "～16.3%",
    premium: "+++",
    position: "-0.29709103452649344m 1.5134071865400724m 1.795262940213165m"
  },
  {
    id: 3,
    name: "欧洲地区",
    gmv: "~$0.68T",
    cagr: "+7%",
    penetration: "～7.9-29.8%",
    premium: "+++-",
    position: "1.4283934306386246m 1.8894230850450324m 0.055148412763570576m"
  },
  {
    id: 4,
    name: "拉美地区",
    gmv: "~$1.45T",
    cagr: "+19%",
    penetration: "<10%",
    premium: "++++",
    position: "1.383549740055114m -0.21364446293400108m 1.9065582926204068m"
  },
  {
    id: 5,
    name: "中东与非洲地区",
    gmv: "~$0.155T",
    cagr: "+14.28%",
    penetration: "～8-15%",
    premium: "+++++",
    position: "1.64376911562809m 0.9692231200150622m -1.4060847546521011m"
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
    
    // Parse position: "x y z"
    // The original logic:
    // const posStr = hotspot.dataset.position.replace(/m/g,'');
    // const [x,y,z] = posStr.split(' ').map(Number);
    // let longitude = Math.atan2(x,z) * 180 / Math.PI;
    // longitude += 15;
    
    const cleanPos = positionStr.replace(/m/g, '');
    const [x, y, z] = cleanPos.split(' ').map(Number);
    let longitude = Math.atan2(x, z) * 180 / Math.PI;
    longitude += 15; // Offset from original script

    mv.cameraOrbit = `${longitude}deg 90deg 10m`;
    mv.interpolationDecay = 200;

    // Resume auto-rotate after delay
    setTimeout(() => {
      if (mv) mv.autoRotate = true;
    }, 3000);
  };

  // Scroll Interaction Logic (The "SetPage" equivalent)
  const setPage = (direction: number) => {
    if (!isLoaded) return;
    
    const mv = modelViewerRef.current;
    if (!mv) return;

    if (isAnimatingRef.current) {
      currentAnimationsRef.current.forEach(anim => anim.kill());
      currentAnimationsRef.current = [];
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    }

    isAnimatingRef.current = true;
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

    if (direction === -1) {
      // Go to Home (Up Scroll)
      const tl1 = gsap.to(bhome2Ref.current, {
        background: 'rgba(0, 0, 0, 0)',
        pointerEvents: 'none',
        duration: 0.3,
        overwrite: 'auto'
      });
      const tl2 = gsap.to(bhome2ZuoRef.current, {
        opacity: 0,
        clipPath: 'inset(100% 0)',
        duration: 0.3,
        overwrite: 'auto'
      });
      const tl3 = gsap.to(bhome2YouRef.current, {
        opacity: 0,
        clipPath: 'inset(100% 0)',
        duration: 0.3,
        overwrite: 'auto'
      });

      const tl4 = gsap.to(mv, {
        scale: 1,
        right: pc ? '-4vw' : 0,
        top: '10vh', // Original: winH / 10 which is roughly 10vh
        duration: 1,
        overwrite: 'auto',
        onComplete: function () {
            // Show hotspots
            const hotspots = document.querySelectorAll('.Hotspot');
            hotspots.forEach(el => el.classList.remove('on'));

            gsap.to(bhome1ZuoRef.current, {
                opacity: 1,
                pointerEvents: 'auto',
                clipPath: 'inset(0 0%)',
                duration: 0.2,
                overwrite: 'auto',
                onComplete: () => {
                    isAnimatingRef.current = false;
                    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
                }
            });
            gsap.to(bhome1YouRef.current, {
                opacity: 1,
                pointerEvents: 'auto',
                duration: 0.6,
                overwrite: 'auto',
            });
            gsap.to(gridSvgRef.current, {
                opacity: 1,
                duration: 0.6,
                overwrite: 'auto'
            });
        }
      });
      
      currentAnimationsRef.current.push(tl1, tl2, tl3, tl4);
    }

    if (direction === 1) {
      // Go to CTA (Down Scroll)
      const tl1 = gsap.to(bhome1ZuoRef.current, {
        opacity: 0,
        pointerEvents: 'none',
        clipPath: 'inset(0 100%)',
        duration: 0.3,
        overwrite: 'auto'
      });
      const tl2 = gsap.to(bhome1YouRef.current, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.3,
        overwrite: 'auto'
      });
      const tl3 = gsap.to(gridSvgRef.current, {
        opacity: 0,
        duration: 0.3,
        overwrite: 'auto'
      });
      const tl4 = gsap.to(bhome2Ref.current, {
        background: 'rgba(0, 0, 0, 0.35)',
        pointerEvents: 'auto',
        delay: 0.3,
        duration: 1,
        overwrite: 'auto'
      });
      const tl5 = gsap.to(bhome2ZuoRef.current, {
        opacity: 1,
        clipPath: 'inset(0% 0)',
        delay: 0.3,
        duration: 1.2,
        overwrite: 'auto'
      });
      const tl6 = gsap.to(bhome2YouRef.current, {
        opacity: 1,
        clipPath: 'inset(0% 0)',
        delay: 0.3,
        duration: 1.2,
        overwrite: 'auto'
      });

      // Hide hotspots
      const hotspots = document.querySelectorAll('.Hotspot');
      hotspots.forEach(el => el.classList.add('on'));

      const tl7 = gsap.to(mv, {
        scale: 1.5,
        right: offsetRight / 2,
        top: offsetTop / 2,
        duration: 1,
        overwrite: 'auto',
        onComplete: () => {
            isAnimatingRef.current = false;
            if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
        }
      });
      
      currentAnimationsRef.current.push(tl1, tl2, tl3, tl4, tl5, tl6, tl7);
    }
  };

  // Event Listeners for Scroll
  useEffect(() => {
    const handleWheel = throttle((e: WheelEvent) => {
      const delta = e.deltaY;
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
        // Wait, standard scroll:
        // Swipe Up (finger moves up) -> content moves down -> deltaY < 0 -> Scroll Down (Direction 1)
        // Swipe Down (finger moves down) -> content moves up -> deltaY > 0 -> Scroll Up (Direction -1)
        // Original logic: handleScroll(deltaY < 0 ? 1 : -1);
        
        if (Math.abs(deltaY) > 30) {
            setPage(deltaY < 0 ? 1 : -1);
        }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
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

  return (
    <div className="bhome-full">
      {/* Grid Background */}
      <div className="grid-svg" ref={gridSvgRef}>
         <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
         </svg>
      </div>

      {/* 3D Model Viewer */}
      <model-viewer
        id="modelViewer"
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
            className={`Hotspot ${index === activeIndex ? 'selected' : ''}`}
            slot={`hotspot-${region.id + 2}`}
            data-position={region.position}
            data-normal={region.normal}
            data-visibility-attribute="visible"
            onClick={() => handleHotspotClick(index, region.position)}
          >
            <div className="HotspotAnnotation">{region.name}</div>
          </button>
        ))}
      </model-viewer>

      {/* Home State (bhome1) */}
      <div className="bhome1">
        <div className="zuo" ref={bhome1ZuoRef}>
          <div className="t1">
            Global<br />
            Expansion <span>Map</span>
          </div>
          <div className="bhome1-btn">
            开始你的全球化之旅
            <ArrowRight size={16} />
          </div>
          <div className="t3">
            Pithy AI：无需经验，搭建属于你的国际化品牌进阶之路
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
          <div className="t1 f_16">查看我们的案例</div>
          <div className="t2">
            集顶级品牌策略方法论、<br />
            数据洞察与执行路径于一体<br />
            让正确策略的方向，掌握每一分的投放。
          </div>
          <div className="t3">Pithy AI：无需经验，搭建属于你的国际化品牌进阶之路</div>
          <a href="#" className="bhome2-btn">浏览方案</a>
        </div>

        <div className="you" ref={bhome2YouRef}>
          <video 
            width='100%' 
            loop 
            muted 
            autoPlay 
            playsInline
            src='https://www.super-i.cn/bpsf/img/texiao3.mp4' 
          />
          <div className="sec2" id="joinProBtn">
             <div className="icon">
                {/* Simple icon placeholder */}
                <div style={{ width: '40px', height: '40px', background: '#D4FE94', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={24} color="#000" />
                </div>
             </div>
             <div className="t5 f_16 co-w">
               加入超级会员，<br />
               拥有两次免费试用机会！
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
