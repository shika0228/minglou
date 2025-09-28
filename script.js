// ====== loading ======
window.onload = function() {
  const loadingContainer = document.querySelector('.loading-container');
  const header = document.querySelector('header');
  const main = document.querySelector('main');

  const bar = document.getElementById("progress");
  const text = document.getElementById("progress-text");
  bar.style.width = "100%";
  text.textContent = "100%";
  setTimeout(() => {
    loadingContainer.classList.add('hidden');
    header.style.display = 'flex';   // 这两行会改变布局高度:contentReference[oaicite:2]{index=2}
    main.style.display   = 'block';

    // ====== 重要：所有依赖滚动位置的动画在显示后再初始化 ======
    initCostumeCarousel();
    initHeartParallax();
    initCatScroll();

    // 立刻刷新一次，确保 start/end 正确
    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }, 500);
};


// ====== Carousel: 中心放大(1.5) + 两侧变小 + 分级透明 + 无限循环 + 自动轮播 ======
function initCostumeCarousel() {
  const root      = document.getElementById('costume-carousel');
  if (!root) return;

  const items     = Array.from(root.querySelectorAll('.carousel-wrap'));
  const prevBtn   = root.querySelector('.nav-btn.prev');
  const nextBtn   = root.querySelector('.nav-btn.next');

  const N         = items.length;
  let   index     = 0;
  const stepX     = 260;
  const maxShow   = 4;
  const blurUnit  = 0.4;
  const rotUnit   = -2.5;

  const scaleLevels = { 0: 1.5, 1: 0.9, 2: 0.8, 3: 0.7, 4: 0.7 };
  const opacityLevels = { 0: 1.0, 1: 0.3, 2: 0.15, 3: 0.05, 4: 0.0 };

  function setPointerEvents(centerIdx) {
    items.forEach((el,i)=> el.style.pointerEvents = (i===centerIdx ? 'auto' : 'none'));
  }
  function rel(i, cur) {
    let d = i - cur;
    if (d >  N/2) d -= N;
    if (d <= -N/2) d += N;
    return d;
  }
  function layout(cur, animate = true) {
    items.forEach((el, i) => {
      const r   = rel(i, cur);
      const ar  = Math.abs(r);
      if (ar > maxShow) {
        el.style.opacity   = '0';
        el.style.transform = `translate(-50%, -50%) translateX(${r*stepX}px) scale(${scaleLevels[4]})`;
        el.style.filter    = `blur(${(maxShow+1)*blurUnit}px)`;
        el.style.zIndex    = `${50 - ar}`;
        return;
      }
      const x   = r * stepX;
      const sc  = scaleLevels[ar];
      const op  = opacityLevels[ar];
      const blur= ar * blurUnit;
      const z   = 100 - ar;
      const rotY= r * rotUnit;

      el.style.zIndex  = `${z}`;
      el.style.opacity = `${op}`;
      el.style.filter  = `blur(${blur}px)`;
      const base = `translate(-50%, -50%) translateX(${x}px) rotateY(${rotY}deg) scale(${sc})`;
      el.style.transition = animate ? 'transform .6s ease, opacity .6s ease, filter .6s ease' : 'none';
      el.style.transform  = base;
    });
    setPointerEvents(cur);
  }
  function go(delta = 1) { index = (index + delta + N) % N; layout(index, true); }

  let timer = null;
  const AUTOPLAY_MS = 2000; // 改为 3000 即 3 秒
  function start(){ if (!timer) timer = setInterval(()=>go(+1), AUTOPLAY_MS); }
  function stop(){ if (timer){ clearInterval(timer); timer=null; } }

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => { stop(); go(-1); start(); });
    nextBtn.addEventListener('click', () => { stop(); go(+1); start(); });
  }
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);

  layout(index, false);
  start();
  window.addEventListener('resize', () => layout(index, false));
}


// ====== Heart Parallax（安全版：只管理自身触发器，不误杀其它动画） ======
function initHeartParallax(){
  const section = document.querySelector('#illustration');
  const heart   = section && section.querySelector('.heart-bg');
  if (!section || !heart || typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const buildHeart = (range) => gsap.fromTo(
    heart,
    { yPercent: range },
    {
      yPercent: -range,
      ease: "none",
      scrollTrigger: {
        id: "heart-parallax",
        trigger: section,
        start: "top bottom",
        end:   "bottom top",
        scrub: true,
        invalidateOnRefresh: true
      }
    }
  );

  let heartTween = buildHeart(14);
  ScrollTrigger.matchMedia({
    "(max-width: 768px)": () => {
      heartTween?.scrollTrigger?.kill();
      heartTween?.kill();
      heartTween = buildHeart(10);
      return () => {
        heartTween?.scrollTrigger?.kill();
        heartTween?.kill();
        heartTween = buildHeart(14);
      };
    }
  });
}


// ====== Cat Scroll（进入画面后随滚动下移 150px；当 footer 的 bottom 触到视口底部时停止） ======
function initCatScroll(){
  const cat    = document.querySelector('.cat');
  const footer = document.querySelector('footer');
  if (!cat || !footer || typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // 如果开始到结束区间过短，可选扩大结束点（在 footer 触底后再多给一点滚动距离）
  const extra = 0; // 需要更明显进度时可改为 100~200

  gsap.fromTo(
    cat,
    { y: 0 },
    {
      y:130,
      ease: "none",
      scrollTrigger: {
        trigger: cat,
        start: "top bottom",          // “进入画面时”开始
        endTrigger: footer,
        end: `bottom+=${extra} bottom`, // “footer bottom 到达视口底部”即停止
        scrub: true,
        invalidateOnRefresh: true
        // ,markers: true              // 调试可打开观察 start/end
      }
    }
  );
}
