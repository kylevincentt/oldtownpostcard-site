(function(){
  var WORDS = ["plumber","dentist","landscaper","real estate agent","dog groomer","pizza shop","roofer","accountant","yoga studio","orthodontist","mover","florist","HVAC pro","chiropractor","handyman","wedding planner","lawn care pro","optometrist","coffee shop","lawyer","barber","tutor","pest control pro","mortgage broker","gym","taco joint","electrician","vet","pilates studio","pediatrician","nail salon","photographer","martial arts dojo","financial planner","painter","dog walker","junk hauler","insurance agent","bakery","locksmith","dry cleaner","music teacher","gutter cleaner","hair stylist","pool service","garage door pro"];
  var INTERVAL_MS = 2300;
  var TRANSITION_MS = 280;
  function ensureCss(){
    if(document.getElementById('word-cycler-style')) return;
    var s = document.createElement('style');
    s.id = 'word-cycler-style';
    s.textContent = '.word-cycler{display:inline-block;position:relative;vertical-align:baseline;text-align:left;color:var(--red,#b03a2e);}.word-cycler-track{display:inline-block;color:var(--red,#b03a2e);font-weight:700;transition:opacity 280ms ease,transform 280ms ease;will-change:opacity,transform;}.word-cycler-track[data-state="out"]{opacity:0;transform:translateY(-10px);}.word-cycler-track[data-state="enter"]{opacity:0;transform:translateY(10px);transition:none !important;}@media (prefers-reduced-motion:reduce){.word-cycler-track{transition:none !important;}.word-cycler-track[data-state="out"],.word-cycler-track[data-state="enter"]{opacity:1 !important;transform:none !important;}}';
    document.head.appendChild(s);
  }
  function findHeadline(){
    var h1s = document.querySelectorAll('h1');
    for (var i=0;i<h1s.length;i++){
      var h = h1s[i];
      if(h.textContent && h.textContent.indexOf('Be the only') !== -1){
        return h.querySelector('strong') || h;
      }
    }
    return null;
  }
  function init(){
    ensureCss();
    var h1strong = findHeadline();
    if(!h1strong) return;
    // If we found the <strong>plumber, dentist, or landscaper</strong>, replace it
    if(h1strong.tagName === 'STRONG' && /plumber|dentist|landscaper/i.test(h1strong.textContent||'')){
      var wrap = document.createElement('span');
      wrap.className = 'word-cycler';
      var track = document.createElement('span');
      track.className = 'word-cycler-track';
      track.setAttribute('data-word-cycler','');
      track.textContent = WORDS[0];
      wrap.appendChild(track);
      h1strong.parentNode.replaceChild(wrap, h1strong);
      var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      var pageHidden = false;
      function measureMin(){
        var ghost = document.createElement('span');
        var cs = window.getComputedStyle(track);
        ghost.style.fontFamily = cs.fontFamily;
        ghost.style.fontSize = cs.fontSize;
        ghost.style.fontWeight = cs.fontWeight;
        ghost.style.fontStyle = cs.fontStyle;
        ghost.style.letterSpacing = cs.letterSpacing;
        ghost.style.position = 'absolute';
        ghost.style.visibility = 'hidden';
        ghost.style.whiteSpace = 'nowrap';
        ghost.style.left = '-9999px';
        ghost.style.top = '-9999px';
        document.body.appendChild(ghost);
        var max = 0;
        for(var i=0;i<WORDS.length;i++){
          ghost.textContent = WORDS[i];
          var w = ghost.getBoundingClientRect().width;
          if(w > max) max = w;
        }
        document.body.removeChild(ghost);
        return max;
      }
      function applyMin(){ wrap.style.minWidth = Math.ceil(measureMin()) + 'px'; }
      applyMin();
      var resizeT;
      window.addEventListener('resize', function(){ clearTimeout(resizeT); resizeT = setTimeout(applyMin, 150); });
      document.addEventListener('visibilitychange', function(){ pageHidden = document.hidden; });
      var idx = 0;
      function tick(){
        if(pageHidden) return;
        idx = (idx + 1) % WORDS.length;
        if(prefersReduced){ track.textContent = WORDS[idx]; return; }
        track.setAttribute('data-state','out');
        setTimeout(function(){
          track.textContent = WORDS[idx];
          track.setAttribute('data-state','enter');
          void track.offsetWidth;
          track.removeAttribute('data-state');
        }, TRANSITION_MS);
      }
      setInterval(tick, INTERVAL_MS);
    }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
