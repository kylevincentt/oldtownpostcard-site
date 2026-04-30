(function(){
  var WORDS = ["Plumber","Dentist","Landscaper","Real Estate Agent","Dog Groomer","Pizza Shop","Roofer","Accountant","Yoga Studio","Orthodontist","Mover","Florist","HVAC Pro","Chiropractor","Handyman","Wedding Planner","Lawn Care Pro","Optometrist","Coffee Shop","Lawyer","Barber","Tutor","Pest Control Pro","Mortgage Broker","Gym","Taco Joint","Electrician","Vet","Pilates Studio","Pediatrician","Nail Salon","Photographer","Martial Arts Dojo","Financial Planner","Painter","Dog Walker","Junk Hauler","Insurance Agent","Bakery","Locksmith","Dry Cleaner","Music Teacher","Gutter Cleaner","Hair Stylist","Pool Service","Garage Door Pro"];
  var INTERVAL_MS = 500;
  var TRANSITION_OUT_MS = 110;

  function ensureCss(){
    if(document.getElementById('word-cycler-style')) return;
    var s = document.createElement('style');
    s.id = 'word-cycler-style';
    s.textContent = [
      '.word-cycler{display:inline-block;position:relative;vertical-align:baseline;color:var(--red,#b03a2e);min-width:0;}',
      '.word-cycler-track{display:inline-block;color:var(--red,#b03a2e);font-weight:700;white-space:nowrap;will-change:transform,opacity;transform-origin:50% 60%;transition:transform 240ms cubic-bezier(0.34,1.56,0.64,1),opacity 110ms ease-out;}',
      '.word-cycler-track[data-state="out"]{transition:transform 110ms cubic-bezier(0.4,0,1,1),opacity 110ms ease-in;transform:translateY(-32%) scale(0.9);opacity:0;}',
      '.word-cycler-track[data-state="enter"]{transition:none !important;transform:translateY(32%) scale(0.9);opacity:0;}',
      '@media (prefers-reduced-motion:reduce){.word-cycler-track{transition:none !important;}.word-cycler-track[data-state="out"],.word-cycler-track[data-state="enter"]{transform:none !important;opacity:1 !important;}}',
      '.btn{font-weight:700 !important;font-size:1rem !important;letter-spacing:-0.005em !important;box-shadow:0 1px 2px rgba(0,0,0,0.08),0 4px 12px rgba(176,58,46,0.22) !important;white-space:nowrap;transition:transform 0.15s,background 0.15s,box-shadow 0.2s !important;}',
      '.btn:hover{box-shadow:0 2px 4px rgba(0,0,0,0.1),0 8px 18px rgba(176,58,46,0.3) !important;}',
      '.btn-outline{box-shadow:none !important;}',
      '.btn-outline:hover{box-shadow:none !important;}',
      '.btn-large{font-size:1.05rem !important;}'
    ].join('');
    document.head.appendChild(s);
  }

  function findHeadlineStrong(){
    var h1s = document.querySelectorAll('h1');
    for (var i=0;i<h1s.length;i++){
      var h = h1s[i];
      if(h.textContent && h.textContent.indexOf('Be the only') !== -1){
        return { h1: h, strong: h.querySelector('strong') };
      }
    }
    // existing word-cycler from previous deploy?
    var existing = document.querySelector('.word-cycler .word-cycler-track');
    if(existing){
      return { h1: existing.closest('h1'), strong: existing.parentNode };
    }
    return { h1: null, strong: null };
  }

  function updateCopy(){
    // "Reports back in 2 weeks" -> new text
    var spans = document.querySelectorAll('.hero-meta span');
    spans.forEach(function(span){
      span.childNodes.forEach(function(n){
        if(n.nodeType === 3 && /Reports back in 2 weeks/i.test(n.textContent)){
          n.textContent = n.textContent.replace(/Reports back in 2 weeks/i, 'Sent out once a month or when all slots can be filled');
        }
      });
    });
  }

  function init(){
    ensureCss();
    updateCopy();
    var found = findHeadlineStrong();
    if(!found.h1) return;
    var h1 = found.h1;
    var target = found.strong;
    var wrap, track;

    if(target && target.classList && target.classList.contains('word-cycler')){
      // Already a cycler from older deploy — replace it cleanly
      wrap = target;
      track = wrap.querySelector('.word-cycler-track');
      if(!track){
        track = document.createElement('span');
        track.className = 'word-cycler-track';
        track.setAttribute('data-word-cycler','');
        wrap.innerHTML = '';
        wrap.appendChild(track);
      }
      track.textContent = WORDS[0];
      wrap.style.minWidth = '0';
      // Ensure BR after wrap
      var nextSib = wrap.nextSibling;
      if(!(nextSib && nextSib.nodeName === 'BR')){
        var br = document.createElement('br');
        wrap.parentNode.insertBefore(br, wrap.nextSibling);
        // Trim leading whitespace from text node after BR
        var afterBr = br.nextSibling;
        if(afterBr && afterBr.nodeType === 3){
          afterBr.textContent = afterBr.textContent.replace(/^\s+/, '');
        }
      }
    } else if(target && /plumber|dentist|landscaper/i.test(target.textContent || '')){
      // Original <strong> markup — replace with cycler
      wrap = document.createElement('span');
      wrap.className = 'word-cycler';
      track = document.createElement('span');
      track.className = 'word-cycler-track';
      track.setAttribute('data-word-cycler','');
      track.textContent = WORDS[0];
      wrap.appendChild(track);
      var br = document.createElement('br');
      target.parentNode.replaceChild(wrap, target);
      wrap.parentNode.insertBefore(br, wrap.nextSibling);
      var afterBr = br.nextSibling;
      if(afterBr && afterBr.nodeType === 3){
        afterBr.textContent = afterBr.textContent.replace(/^\s+/, '');
      }
    } else {
      return;
    }

    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    var pageHidden = false;
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
      }, TRANSITION_OUT_MS);
    }
    setInterval(tick, INTERVAL_MS);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
