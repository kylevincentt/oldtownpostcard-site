(function(){
var WORDS = ["Plumber","Dentist","Landscaper","Real Estate Agent","Dog Groomer","Pizza Shop","Roofer","Accountant","Yoga Studio","Orthodontist","Mover","Florist","HVAC Pro","Chiropractor","Handyman","Wedding Planner","Lawn Care Pro","Optometrist","Coffee Shop","Lawyer","Barber","Tutor","Pest Control Pro","Mortgage Broker","Gym","Taco Joint","Electrician","Vet","Pilates Studio","Pediatrician","Nail Salon","Photographer","Martial Arts Dojo","Financial Planner","Painter","Dog Walker","Junk Hauler","Insurance Agent","Bakery","Locksmith","Dry Cleaner","Music Teacher","Gutter Cleaner","Hair Stylist","Pool Service","Garage Door Pro"];

// Typewriter timings — calibrated to feel close to dopl.work's landing animation.
var TYPE_MS = 65;       // time per character while typing
var ERASE_MS = 35;      // time per character while erasing
var HOLD_MS = 1500;     // pause with full word visible (cursor blinks here)
var BETWEEN_MS = 350;   // pause with empty cycler before typing the next word
var INITIAL_MS = 600;   // small delay after page load before the first char types

function ensureCss(){
  if(document.getElementById('word-cycler-style')) return;
  var s = document.createElement('style');
  s.id = 'word-cycler-style';
  s.textContent =
    '.word-cycler{display:inline-block;color:var(--red,#b03a2e);white-space:nowrap;}' +
    '.word-cycler-track{display:inline;font-weight:700;color:var(--red,#b03a2e);}' +
    '.word-cycler-cursor{display:inline-block;width:0.06em;height:0.78em;background:currentColor;color:var(--red,#b03a2e);margin-left:0.04em;vertical-align:-0.04em;animation:wc-blink 1.05s steps(2,start) infinite;border-radius:1px;}' +
    '.word-cycler[data-typing="true"] .word-cycler-cursor{animation:none;opacity:1;}' +
    '@keyframes wc-blink{50%{opacity:0;}}' +
    '@media (prefers-reduced-motion:reduce){.word-cycler-cursor{display:none;}.word-cycler-track{transition:none !important;}}' +
    '.btn{font-weight:700 !important;font-size:1rem !important;letter-spacing:-0.005em !important;box-shadow:0 1px 2px rgba(0,0,0,0.08),0 4px 12px rgba(176,58,46,0.22) !important;white-space:nowrap;transition:transform 0.15s,background 0.15s,box-shadow 0.2s !important;}' +
    '.btn:hover{box-shadow:0 2px 4px rgba(0,0,0,0.1),0 8px 18px rgba(176,58,46,0.3) !important;}' +
    '.btn-outline{box-shadow:none !important;}' +
    '.btn-outline:hover{box-shadow:none !important;}' +
    '.btn-large{font-size:1.05rem !important;}';
  document.head.appendChild(s);
}

function findHeadlineStrong(){
  var h1s = document.querySelectorAll("h1");
  for(var i=0;i<h1s.length;i++){
    var h = h1s[i];
    if(h.textContent && h.textContent.indexOf("Be the only") !== -1){
      return {h1:h, strong:h.querySelector("strong")};
    }
  }
  var existing = document.querySelector(".word-cycler .word-cycler-track");
  if(existing) return {h1:existing.closest("h1"), strong:existing.parentNode};
  return {h1:null, strong:null};
}

function ensureBr(node, position){
  var sib = position === "before" ? node.previousSibling : node.nextSibling;
  if(sib && sib.nodeName === "BR") return;
  var br = document.createElement("br");
  if(position === "before") node.parentNode.insertBefore(br, node);
  else node.parentNode.insertBefore(br, node.nextSibling);
}

function trimAdjacentText(node){
  var prev = node.previousSibling;
  while(prev && prev.nodeName === "BR") prev = prev.previousSibling;
  if(prev && prev.nodeType === 3) prev.textContent = prev.textContent.replace(/\s+$/,"");
  var next = node.nextSibling;
  while(next && next.nodeName === "BR") next = next.nextSibling;
  if(next && next.nodeType === 3) next.textContent = next.textContent.replace(/^\s+/,"");
}

function init(){
  ensureCss();

  var found = findHeadlineStrong();
  if(!found.h1) return;
  var target = found.strong;
  var wrap, track, cursor;

  if(target && target.classList && target.classList.contains("word-cycler")){
    wrap = target;
    track = wrap.querySelector(".word-cycler-track");
    cursor = wrap.querySelector(".word-cycler-cursor");
    if(!track){
      track = document.createElement("span");
      track.className = "word-cycler-track";
      wrap.innerHTML = "";
      wrap.appendChild(track);
    }
    if(!cursor){
      cursor = document.createElement("span");
      cursor.className = "word-cycler-cursor";
      cursor.setAttribute("aria-hidden","true");
      wrap.appendChild(cursor);
    }
    track.textContent = "";
    ensureBr(wrap, "before");
    ensureBr(wrap, "after");
    trimAdjacentText(wrap);
  } else if(target && /plumber|dentist|landscaper/i.test(target.textContent || "")){
    wrap = document.createElement("span");
    wrap.className = "word-cycler";
    track = document.createElement("span");
    track.className = "word-cycler-track";
    cursor = document.createElement("span");
    cursor.className = "word-cycler-cursor";
    cursor.setAttribute("aria-hidden","true");
    track.textContent = "";
    wrap.appendChild(track);
    wrap.appendChild(cursor);
    target.parentNode.replaceChild(wrap, target);
    ensureBr(wrap, "before");
    ensureBr(wrap, "after");
    trimAdjacentText(wrap);
  } else return;

  // Stable accessible name for the cycling region — also marks the live track aria-hidden so SR users
  // don't hear partial words ("Plum", "Plumb", "Plumbe", "Plumber") character by character.
  wrap.setAttribute("aria-label", "Be the only business in your category");
  track.setAttribute("aria-hidden", "true");
  if(cursor) cursor.setAttribute("aria-hidden", "true");

  var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  var pageHidden = false;
  document.addEventListener("visibilitychange", function(){ pageHidden = document.hidden; });

  if(prefersReduced){
    var ri = 0;
    track.textContent = WORDS[0];
    setInterval(function(){
      if(pageHidden) return;
      ri = (ri + 1) % WORDS.length;
      track.textContent = WORDS[ri];
    }, 2800);
    return;
  }

  var wordIdx = 0;
  var charIdx = 0;
  var phase = "typing";

  function setTyping(t){
    if(t) wrap.setAttribute("data-typing","true");
    else wrap.removeAttribute("data-typing");
  }

  function tick(){
    if(pageHidden){ setTimeout(tick, 250); return; }
    var word = WORDS[wordIdx];
    if(phase === "typing"){
      charIdx++;
      track.textContent = word.slice(0, charIdx);
      setTyping(true);
      if(charIdx >= word.length){
        phase = "holding";
        setTyping(false); // cursor blinks during the hold
        setTimeout(tick, HOLD_MS);
      } else {
        setTimeout(tick, TYPE_MS);
      }
    } else if(phase === "holding"){
      phase = "erasing";
      setTyping(true);
      setTimeout(tick, ERASE_MS);
    } else if(phase === "erasing"){
      charIdx = Math.max(0, charIdx - 1);
      track.textContent = word.slice(0, charIdx);
      if(charIdx <= 0){
        phase = "between";
        setTyping(false); // cursor blinks during the gap
        setTimeout(tick, BETWEEN_MS);
      } else {
        setTimeout(tick, ERASE_MS);
      }
    } else if(phase === "between"){
      wordIdx = (wordIdx + 1) % WORDS.length;
      charIdx = 0;
      phase = "typing";
      setTimeout(tick, TYPE_MS);
    }
  }

  setTyping(false);
  setTimeout(tick, INITIAL_MS);
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
})();
