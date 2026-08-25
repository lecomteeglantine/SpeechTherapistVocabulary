/* Speech Therapy English — V13 Pronunciation Lab
   Self-assessment only. No remote speech analysis and no recording upload. */
(() => {
  const PRON_STATS_KEY='stePronunciationStatsV12';

  // Curated bank: syllable divisions are learner-friendly guides, not phonemic transcriptions.
  // IPA remains the authoritative pronunciation guide from the site vocabulary.
  const BANK_DATA=[
    ['Dysphagia',['dys','pha','gia'],1],['Deglutition',['deg','lu','ti','tion'],2],['Mastication',['mas','ti','ca','tion'],2],
    ['Nasopharynx',['na','so','pha','rynx'],2],['Oropharynx',['o','ro','pha','rynx'],2],['Hypopharynx',['hy','po','pha','rynx'],2],
    ['Epiglottis',['e','pi','glot','tis'],2],['Oesophagus',['oe','soph','a','gus'],1],['Peristalsis',['per','i','stal','sis'],2],
    ['Regurgitation',['re','gur','gi','ta','tion'],3],['Aspiration',['as','pi','ra','tion'],2],['Penetration',['pen','e','tra','tion'],2],
    ['Gastrostomy',['gas','tros','to','my'],1],['Nasogastric tube',null,null,'na-so-GAS-tric tube'],
    ['Laryngeal elevation',null,null,'la-RYN-geal el-e-VA-tion'],
    ['Aphasia',['a','pha','sia'],1],['Anomia',['a','no','mi','a'],1],['Paraphasia',['par','a','pha','sia'],2],
    ['Neologism',['ne','ol','o','gism'],1],['Circumlocution',['cir','cum','lo','cu','tion'],3],['Perseveration',['per','sev','er','a','tion'],3],
    ['Agrammatism',['a','gram','ma','tism'],1],['Dysarthria',['dys','ar','thri','a'],1],['Apraxia of speech',null,null,'a-PRAX-i-a of SPEECH'],
    ['Neuroplasticity',['neu','ro','plas','tic','i','ty'],3],['Prognosis',['prog','no','sis'],1],['Pragmatics',['prag','mat','ics'],1],
    ['Cognitive fatigue',null,null,'COG-ni-tive fa-TIGUE'],['Speech intelligibility',null,null,'SPEECH in-tel-li-gi-BIL-i-ty'],
    ['Phonation',['pho','na','tion'],1],['Respiration',['res','pi','ra','tion'],2],['Resonance',['res','o','nance'],0],
    ['Dysphonia',['dys','pho','ni','a'],1],['Hoarseness',['hoarse','ness'],0],['Stroboscopy',['stro','bos','co','py'],1],
    ['Laryngoscopy',['lar','yn','gos','co','py'],2],['Papillomatosis',['pap','il','lo','ma','to','sis'],4],['Hypophonia',['hy','po','pho','ni','a'],2],
    ['Granuloma',['gran','u','lo','ma'],2],['Amplification',['am','pli','fi','ca','tion'],3],['Aerodynamic support',null,null,'ae-ro-dy-NAM-ic sup-PORT']
  ];

  const TERM_MAP=new Map(VOCABULARY.map(v=>[v.term.toLowerCase(),v]));
  const PRON_BANK=BANK_DATA.map(([term,syllables,stressIndex,stressText])=>{
    const v=TERM_MAP.get(term.toLowerCase());
    if(!v)return null;
    const display=stressText || syllables.map((x,i)=>i===stressIndex?x.toUpperCase():x).join('-');
    return {v,syllables,stressIndex,stressText:display};
  }).filter(Boolean);
  const QUIZ_BANK=PRON_BANK.filter(x=>Array.isArray(x.syllables)&&Number.isInteger(x.stressIndex));

  const SOUND_GROUPS=[
    {id:'theta',symbol:'/θ/',title:'Air, no voice',tip:'Put the tongue lightly between the teeth and let air pass. Do not replace it with /s/ or /t/.',items:['swallowing therapy','voice therapy','thick liquids','three therapy goals']},
    {id:'eth',symbol:'/ð/',title:'Same tongue position, add voice',tip:'Keep the tongue position for /θ/, then switch the voice on.',items:['with the patient','the therapy plan','those symptoms','this assessment']},
    {id:'ship-sheep',symbol:'/ɪ/ ↔ /iː/',title:'Short vs long vowel',tip:'Keep /ɪ/ short and relaxed; make /iː/ longer and tenser.',items:['clinical speech','speech screening','thick vs three','sit / seat']},
    {id:'cat-cut',symbol:'/æ/ ↔ /ʌ/',title:'Front-open vs central vowel',tip:'For /æ/, open the mouth and keep the vowel forward. /ʌ/ is shorter and more central.',items:['larynx / lung','aspiration / functional','assessment / muscle','cat / cut']}
  ];

  const ED_ITEMS=[
    ['assessed','t'],['reduced','t'],['watched','t'],['discussed','t'],
    ['referred','d'],['observed','d'],['examined','d'],['managed','d'],
    ['needed','id'],['reported','id'],['treated','id'],['repeated','id']
  ];
  const S_ITEMS=[
    ['patients','s'],['risks','s'],['coughs','s'],['stops','s'],
    ['words','z'],['folds','z'],['symptoms','z'],['findings','z'],
    ['cases','iz'],['changes','iz'],['voices','iz'],['exercises','iz']
  ];
  const CLINICAL_CHUNKS=[
    {plain:'The patient reports difficulty swallowing with thin liquids.',chunks:['The patient','reports difficulty swallowing','with thin liquids.']},
    {plain:'Key findings include reduced laryngeal elevation and pharyngeal residue.',chunks:['Key findings include','reduced laryngeal elevation','and pharyngeal residue.']},
    {plain:'At this stage, we recommend further assessment.',chunks:['At this stage','we recommend','further assessment.']},
    {plain:'The main concern is aspiration risk during meals.',chunks:['The main concern is','aspiration risk','during meals.']},
    {plain:'The patient presents with reduced speech intelligibility and fatigue.',chunks:['The patient presents with','reduced speech intelligibility','and fatigue.']},
    {plain:'The aim is to make communication easier and more effective.',chunks:['The aim is','to make communication easier','and more effective.']},
    {plain:'Voice quality improves when vocal effort is reduced.',chunks:['Voice quality improves','when vocal effort','is reduced.']},
    {plain:'We will review the plan according to the patient’s priorities.',chunks:['We will review the plan','according to','the patient’s priorities.']}
  ];

  let stats=loadPronStats();
  let moduleState={};
  let workoutQueue=[],workoutDone=0,sessionRatings={easy:0,tricky:0,again:0},repeatCount={};
  let recorderStream=null,mediaRecorder=null,recordChunks=[],recordUrl=null;

  function loadPronStats(){
    try{const x=JSON.parse(localStorage.getItem(PRON_STATS_KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}
  }
  function savePronStats(){localStorage.setItem(PRON_STATS_KEY,JSON.stringify(stats));updatePronStatsUI()}
  function reviewIds(){return Object.entries(stats).filter(([,m])=>m&&['tricky','again'].includes(m.lastRating)).map(([id])=>id)}
  function updatePronStatsUI(){
    const rated=Object.values(stats).filter(x=>x&&x.seen).length;
    const review=reviewIds().length;
    const a=document.querySelector('#pronWordsRated'),b=document.querySelector('#pronReviewCount');
    if(a)a.textContent=String(rated);if(b)b.textContent=String(review);
  }
  function bankEntryById(id){return PRON_BANK.find(x=>x.v.id===id)}
  function speechButton(text,label='🔊 Listen'){return `<button type="button" data-pron-speak="${esc(text)}">${label}</button>`}
  function stressMarkup(item){
    if(item.syllables)return item.syllables.map((x,i)=>`<span class="pron-syllable ${i===item.stressIndex?'is-stressed':''}">${esc(x)}</span>`).join('<span class="pron-hyphen">·</span>');
    return `<strong class="pron-stress-text">${esc(item.stressText)}</strong>`;
  }
  function recordPanel(prompt){
    return `<section class="pron-recorder" data-record-prompt="${esc(prompt)}"><div><span class="eyebrow">Optional self-recording</span><p><strong>Record yourself, then listen back.</strong> The recording stays temporary in this page and is not uploaded or stored by the site.</p></div><div class="pron-recorder-actions"><button type="button" id="pronRecordStart">🎙 Start recording</button><button type="button" id="pronRecordStop" disabled>■ Stop</button></div><p id="pronRecordStatus" class="pron-record-status">Say: <em>${esc(prompt)}</em></p><div id="pronPlayback"></div></section>`;
  }
  async function startRecording(){
    const status=document.querySelector('#pronRecordStatus'),start=document.querySelector('#pronRecordStart'),stop=document.querySelector('#pronRecordStop');
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){if(status)status.textContent='Recording is not supported in this browser. You can still use Listen and repeat aloud.';return}
    try{
      stopRecording(true);
      recorderStream=await navigator.mediaDevices.getUserMedia({audio:true});
      recordChunks=[];mediaRecorder=new MediaRecorder(recorderStream);
      mediaRecorder.ondataavailable=e=>{if(e.data?.size)recordChunks.push(e.data)};
      mediaRecorder.onstop=()=>{
        const blob=new Blob(recordChunks,{type:mediaRecorder?.mimeType||'audio/webm'});
        if(recordUrl)URL.revokeObjectURL(recordUrl);recordUrl=URL.createObjectURL(blob);
        const box=document.querySelector('#pronPlayback');if(box)box.innerHTML=`<audio controls src="${recordUrl}"></audio><button type="button" id="pronDiscardRecording">Discard recording</button>`;
        document.querySelector('#pronDiscardRecording')?.addEventListener('click',()=>{if(recordUrl)URL.revokeObjectURL(recordUrl);recordUrl=null;if(box)box.innerHTML='';if(status)status.textContent='Recording discarded. Nothing was saved.'});
        recorderStream?.getTracks().forEach(t=>t.stop());recorderStream=null;
      };
      mediaRecorder.start();if(start)start.disabled=true;if(stop)stop.disabled=false;if(status)status.textContent='Recording… speak naturally, then press Stop.';
    }catch(err){if(status)status.textContent='Microphone access was not available. You can still listen and repeat aloud.';console.warn('Pronunciation recorder:',err)}
  }
  function stopRecording(silent=false){
    const start=document.querySelector('#pronRecordStart'),stop=document.querySelector('#pronRecordStop'),status=document.querySelector('#pronRecordStatus');
    if(mediaRecorder&&mediaRecorder.state==='recording'){mediaRecorder.stop();if(!silent&&status)status.textContent='Recording stopped. Listen back below.'}
    recorderStream?.getTracks().forEach(t=>t.stop());recorderStream=null;if(start)start.disabled=false;if(stop)stop.disabled=true;
  }
  function wireRecorder(){document.querySelector('#pronRecordStart')?.addEventListener('click',startRecording);document.querySelector('#pronRecordStop')?.addEventListener('click',()=>stopRecording(false))}

  function randomQuizItem(){return QUIZ_BANK[Math.floor(Math.random()*QUIZ_BANK.length)]}
  function stressOption(item,index){return item.syllables.map((x,i)=>i===index?x.toUpperCase():x).join('-')}
  function renderStressModule(){
    stopRecording(true);const item=randomQuizItem();moduleState={type:'stress',item,locked:false};
    const indices=shuffle([...Array(item.syllables.length).keys()].filter(i=>i!==item.stressIndex)).slice(0,2);const options=shuffle([item.stressIndex,...indices]);
    document.querySelector('#pronModuleWorkspace').innerHTML=`<section class="pron-module-panel"><button class="pron-module-close" type="button">× Close</button><span class="eyebrow">🎯 Word stress</span><h3>Where is the main beat?</h3><div class="pron-challenge-word"><strong>${esc(item.v.term)}</strong><span>${esc(item.v.ipa)}</span>${speechButton(item.v.term)}</div><p>Choose the version with the correct main stress.</p><div class="pron-choice-grid">${options.map(i=>`<button type="button" data-stress-index="${i}">${esc(stressOption(item,i))}</button>`).join('')}</div><div id="pronModuleFeedback"></div><div class="pron-module-actions"><button id="nextStress" type="button" hidden>Next word →</button></div></section>`;
    document.querySelectorAll('[data-stress-index]').forEach(b=>b.addEventListener('click',()=>{if(moduleState.locked)return;moduleState.locked=true;const chosen=Number(b.dataset.stressIndex),ok=chosen===item.stressIndex;document.querySelectorAll('[data-stress-index]').forEach(x=>{x.disabled=true;x.classList.toggle('is-correct',Number(x.dataset.stressIndex)===item.stressIndex);if(x===b&&!ok)x.classList.add('is-wrong')});document.querySelector('#pronModuleFeedback').innerHTML=`<div class="pron-feedback ${ok?'correct':'review'}"><strong>${ok?'✓ Yes':'↻ Not quite'}</strong><p>Main stress: <b>${esc(item.stressText)}</b>. The IPA also marks primary stress with <b>ˈ</b>: ${esc(item.v.ipa)}</p></div>`;document.querySelector('#nextStress').hidden=false}));
    document.querySelector('#nextStress').onclick=renderStressModule;wireModuleCommon();
  }
  function renderSyllablesModule(){
    stopRecording(true);const item=randomQuizItem();const tokens=item.syllables.map((x,i)=>({x,i}));let remaining=shuffle(tokens),built=[];moduleState={type:'syllables',item};
    const draw=()=>{
      const w=document.querySelector('#pronModuleWorkspace');
      w.innerHTML=`<section class="pron-module-panel"><button class="pron-module-close" type="button">× Close</button><span class="eyebrow">🧩 Syllable builder</span><h3>Build the word in order.</h3><div class="pron-challenge-word"><strong>${esc(item.v.term)}</strong><span>${esc(item.v.ipa)}</span>${speechButton(item.v.term)}</div><div class="pron-build-zone">${built.length?built.map(t=>`<span>${esc(t.x)}</span>`).join('<b>·</b>'):'<em>Tap the syllables below…</em>'}</div><div class="pron-token-pool">${remaining.map(t=>`<button type="button" data-token-index="${t.i}">${esc(t.x)}</button>`).join('')}</div><div class="pron-module-actions"><button id="resetSyllables" type="button">Reset</button><button id="checkSyllables" type="button" class="primary-action" ${remaining.length?'disabled':''}>Check</button></div><div id="pronModuleFeedback"></div></section>`;
      document.querySelectorAll('[data-token-index]').forEach(b=>b.addEventListener('click',()=>{const idx=remaining.findIndex(t=>t.i===Number(b.dataset.tokenIndex));if(idx<0)return;built.push(remaining[idx]);remaining.splice(idx,1);draw()}));
      document.querySelector('#resetSyllables').onclick=()=>{remaining=shuffle(tokens);built=[];draw()};
      document.querySelector('#checkSyllables').onclick=()=>{const ok=built.map(t=>t.i).every((x,i)=>x===i);document.querySelector('#pronModuleFeedback').innerHTML=`<div class="pron-feedback ${ok?'correct':'review'}"><strong>${ok?'✓ Nicely chunked':'↻ Try the natural order'}</strong><p>${esc(item.stressText)} · ${esc(item.v.ipa)}</p>${ok?'<button id="nextSyllables" type="button">Another word →</button>':''}</div>`;document.querySelector('#nextSyllables')?.addEventListener('click',renderSyllablesModule)};
      wireModuleCommon();
    };draw();
  }
  function renderSoundsModule(){
    stopRecording(true);document.querySelector('#pronModuleWorkspace').innerHTML=`<section class="pron-module-panel"><button class="pron-module-close" type="button">× Close</button><span class="eyebrow">👄 Tricky sounds</span><h3>Small sound contrasts, big clarity.</h3><p class="pron-module-intro">Use these as listening-and-repetition prompts. The goal is intelligibility, not accent imitation.</p><div class="pron-sound-grid">${SOUND_GROUPS.map(g=>`<article><span class="pron-sound-symbol">${esc(g.symbol)}</span><h4>${esc(g.title)}</h4><p>${esc(g.tip)}</p><div class="pron-sound-items">${g.items.map(x=>`<button type="button" data-pron-speak="${esc(x)}">🔊 ${esc(x)}</button>`).join('')}</div></article>`).join('')}</div>${recordPanel('with the patient')}</section>`;wireRecorder();wireModuleCommon();
  }
  function renderEndingModule(kind){
    stopRecording(true);const items=kind==='ed'?ED_ITEMS:S_ITEMS;const labels=kind==='ed'?{t:'/t/',d:'/d/',id:'/ɪd/'}:{s:'/s/',z:'/z/',iz:'/ɪz/'};const [word,answer]=items[Math.floor(Math.random()*items.length)];moduleState={type:kind,word,answer,locked:false};
    document.querySelector('#pronModuleWorkspace').innerHTML=`<section class="pron-module-panel"><button class="pron-module-close" type="button">× Close</button><span class="eyebrow">${kind==='ed'?'↘ -ed endings':'〰 -s / -es endings'}</span><h3>How does the ending sound?</h3><div class="pron-ending-word"><strong>${esc(word)}</strong>${speechButton(word)}</div><div class="pron-ending-choices">${Object.entries(labels).map(([k,l])=>`<button type="button" data-ending="${k}">${l}</button>`).join('')}</div><div id="pronModuleFeedback"></div><div class="pron-module-actions"><button id="nextEnding" type="button" hidden>Next →</button></div></section>`;
    document.querySelectorAll('[data-ending]').forEach(b=>b.addEventListener('click',()=>{if(moduleState.locked)return;moduleState.locked=true;const ok=b.dataset.ending===answer;document.querySelectorAll('[data-ending]').forEach(x=>{x.disabled=true;x.classList.toggle('is-correct',x.dataset.ending===answer);if(x===b&&!ok)x.classList.add('is-wrong')});const rule=kind==='ed'?'The ending depends on the final sound of the base verb, not the spelling.':'The ending depends on the final sound of the singular/base form, not the spelling.';document.querySelector('#pronModuleFeedback').innerHTML=`<div class="pron-feedback ${ok?'correct':'review'}"><strong>${ok?'✓ Correct':'↻ Listen again'}</strong><p><b>${esc(word)}</b> ends with ${labels[answer]}. ${rule}</p></div>`;document.querySelector('#nextEnding').hidden=false}));
    document.querySelector('#nextEnding').onclick=()=>renderEndingModule(kind);wireModuleCommon();
  }
  function renderChunksModule(){
    stopRecording(true);const cards=CLINICAL_CHUNKS.map((x,i)=>`<article class="pron-chunk-card"><span>Chunk ${i+1}</span><p>${x.chunks.map(c=>`<strong>${esc(c)}</strong>`).join('<b>/</b>')}</p><button type="button" data-pron-speak="${esc(x.plain)}">🔊 Listen</button><button type="button" data-use-chunk="${i}">🎙 Practise this one</button></article>`).join('');
    document.querySelector('#pronModuleWorkspace').innerHTML=`<section class="pron-module-panel"><button class="pron-module-close" type="button">× Close</button><span class="eyebrow">🗣️ Clinical chunks</span><h3>Speak in meaning groups, not one word at a time.</h3><p class="pron-module-intro">The slashes show useful thought groups. They are not fixed rules: natural chunking changes with meaning and emphasis.</p><div class="pron-chunk-grid">${cards}</div><div id="pronChunkRecorder">${recordPanel(CLINICAL_CHUNKS[0].plain)}</div></section>`;
    document.querySelectorAll('[data-use-chunk]').forEach(b=>b.addEventListener('click',()=>{stopRecording(true);const x=CLINICAL_CHUNKS[Number(b.dataset.useChunk)];document.querySelector('#pronChunkRecorder').innerHTML=recordPanel(x.plain);wireRecorder();document.querySelector('#pronChunkRecorder').scrollIntoView({behavior:st.motion?'auto':'smooth',block:'nearest'})}));wireRecorder();wireModuleCommon();
  }
  function wireModuleCommon(){
    document.querySelector('.pron-module-close')?.addEventListener('click',()=>{stopRecording(true);document.querySelector('#pronModuleWorkspace').innerHTML=''});
  }
  function openModule(name){
    if(name==='stress')renderStressModule();else if(name==='syllables')renderSyllablesModule();else if(name==='sounds')renderSoundsModule();else if(name==='ed')renderEndingModule('ed');else if(name==='s')renderEndingModule('s');else renderChunksModule();
    document.querySelector('#pronModuleWorkspace')?.scrollIntoView({behavior:st.motion?'auto':'smooth',block:'start'});
  }

  function sourcePool(){
    const source=document.querySelector('#pronSource')?.value||'all';
    let pool=PRON_BANK;
    if(['18','19','20'].includes(source))pool=pool.filter(x=>x.v.chapter===source);
    if(source==='saved')pool=pool.filter(x=>notebook.includes(x.v.id));
    if(source==='review'){const ids=new Set(reviewIds());pool=pool.filter(x=>ids.has(x.v.id))}
    return pool;
  }
  function startWorkout(forceSize=null){
    stopRecording(true);let pool=shuffle(sourcePool());const n=Math.min(Number(forceSize||document.querySelector('#pronSize')?.value||5),pool.length);
    if(!pool.length){document.querySelector('#pronWorkout').innerHTML=`<div class="pron-empty"><span>🎧</span><h4>No words here yet.</h4><p>${document.querySelector('#pronSource')?.value==='saved'?'Save some curated pronunciation words in My Vocabulary first.':'Rate some words as Tricky or Again first, or choose another source.'}</p></div>`;return}
    workoutQueue=pool.slice(0,n);workoutDone=0;sessionRatings={easy:0,tricky:0,again:0};repeatCount={};drawWorkout();
    document.querySelector('#pronWorkout')?.scrollIntoView({behavior:st.motion?'auto':'smooth',block:'start'});
  }
  function drawWorkout(){
    stopRecording(true);updateWorkoutBar();
    if(!workoutQueue.length)return finishWorkout();
    const item=workoutQueue[0],v=item.v;const ex=v.examples?.B1||v.examples?.A2||v.examples?.B2||'';
    document.querySelector('#pronWorkout').innerHTML=`<article class="pron-word-card"><div class="pron-word-top"><span class="badge">Chapter ${esc(v.chapter)}</span><span class="badge">${esc(v.section)}</span></div><div class="pron-word-main"><span class="eyebrow">Say this clinical term</span><h4>${esc(v.term)}</h4><p class="pron-ipa">${esc(v.ipa)}</p><div class="pron-word-actions">${speechButton(v.term,'🔊 Listen to the word')}<button id="pronReveal" type="button">👀 Reveal stress & chunks</button><button type="button" data-save-id="${esc(v.id)}">${isSaved(v.id)?'♥ Saved':'♡ Save'}</button></div></div><div id="pronRevealPanel" hidden class="pron-reveal-panel"><div><small>Stress & syllables</small><div class="pron-stress-map">${stressMarkup(item)}</div><p>Primary stress is also marked by <b>ˈ</b> in the IPA.</p></div><div><small>Clinical example</small><p>${esc(ex)}</p>${speechButton(ex,'🔊 Listen to the sentence')}</div></div><div id="pronRecorderSlot"></div><div id="pronRatings" class="pron-rating-row" hidden><button type="button" data-pron-rate="easy" class="pron-easy"><strong>✓ Easy</strong><small>Feels comfortable</small></button><button type="button" data-pron-rate="tricky" class="pron-tricky"><strong>◐ Tricky</strong><small>Keep it for review</small></button><button type="button" data-pron-rate="again" class="pron-again"><strong>↻ Again</strong><small>Bring it back once</small></button></div></article>`;
    document.querySelector('#pronReveal').onclick=()=>{document.querySelector('#pronRevealPanel').hidden=false;document.querySelector('#pronRatings').hidden=false;document.querySelector('#pronRecorderSlot').innerHTML=recordPanel(v.term);wireRecorder();document.querySelector('#pronReveal').disabled=true};
    document.querySelectorAll('[data-pron-rate]').forEach(b=>b.addEventListener('click',()=>rateWorkout(item,b.dataset.pronRate)));
  }
  function rateWorkout(item,rating){
    stopRecording(true);const id=item.v.id,meta=stats[id]||{seen:0,easy:0,tricky:0,again:0};meta.seen=(meta.seen||0)+1;meta[rating]=(meta[rating]||0)+1;meta.lastRating=rating;meta.updated=Date.now();stats[id]=meta;sessionRatings[rating]++;workoutQueue.shift();workoutDone++;
    if(rating==='again'&&(repeatCount[id]||0)<1){repeatCount[id]=(repeatCount[id]||0)+1;workoutQueue.splice(Math.min(2,workoutQueue.length),0,item)}
    savePronStats();drawWorkout();
  }
  function updateWorkoutBar(){
    const total=workoutDone+workoutQueue.length,displayTotal=Math.max(total,workoutDone);const progress=displayTotal?Math.min(100,Math.round(workoutDone/displayTotal*100)):0;
    const p=document.querySelector('#pronProgress'),note=document.querySelector('#pronProgressNote'),bar=document.querySelector('#pronProgressBar');if(p)p.textContent=displayTotal?`${Math.min(workoutDone+1,displayTotal)} / ${displayTotal}`:'Ready';if(note)note.textContent=workoutQueue.length?'Listen, reveal, repeat, then rate it yourself.':'Choose a source and start when you want.';if(bar)bar.style.width=`${progress}%`;
    document.querySelector('#pronEasyCount').textContent=sessionRatings.easy;document.querySelector('#pronTrickyCount').textContent=sessionRatings.tricky;document.querySelector('#pronAgainCount').textContent=sessionRatings.again;
  }
  function finishWorkout(){
    const reviews=reviewIds().map(bankEntryById).filter(Boolean).slice(0,12);document.querySelector('#pronProgress').textContent='Done';document.querySelector('#pronProgressNote').textContent='Session complete.';document.querySelector('#pronProgressBar').style.width='100%';
    document.querySelector('#pronWorkout').innerHTML=`<section class="pron-summary"><span class="pron-summary-icon">🎧</span><span class="eyebrow">Workout complete</span><h4>Clearer because you practised, not because a robot scored you.</h4><div class="pron-summary-stats"><div><strong>${sessionRatings.easy}</strong><span>Easy</span></div><div><strong>${sessionRatings.tricky}</strong><span>Tricky</span></div><div><strong>${sessionRatings.again}</strong><span>Again</span></div></div>${reviews.length?`<div class="pron-review-box"><strong>Pronunciation to revisit</strong><div>${reviews.map(x=>`<button type="button" data-pron-focus="${esc(x.v.id)}">${esc(x.v.term)}</button>`).join('')}</div></div>`:'<p>No words are currently waiting in your pronunciation review list.</p>'}<div class="pron-summary-actions"><button id="pronAnother" class="primary-action" type="button">↻ Another session</button><button id="pronReviewSession" type="button" ${reviews.length?'':'disabled'}>🎧 Review tricky words</button></div></section>`;
    document.querySelector('#pronAnother').onclick=()=>startWorkout();document.querySelector('#pronReviewSession').onclick=()=>{document.querySelector('#pronSource').value='review';startWorkout()};document.querySelectorAll('[data-pron-focus]').forEach(b=>b.addEventListener('click',()=>{const item=bankEntryById(b.dataset.pronFocus);if(item){workoutQueue=[item];workoutDone=0;sessionRatings={easy:0,tricky:0,again:0};repeatCount={};drawWorkout()}}));updatePronStatsUI();
  }
  function randomPronWord(){
    const item=PRON_BANK[Math.floor(Math.random()*PRON_BANK.length)];workoutQueue=[item];workoutDone=0;sessionRatings={easy:0,tricky:0,again:0};repeatCount={};drawWorkout();document.querySelector('#pronWorkout')?.scrollIntoView({behavior:st.motion?'auto':'smooth',block:'start'});
  }
  function initPronunciation(){
    updatePronStatsUI();document.querySelectorAll('[data-pron-module]').forEach(b=>b.addEventListener('click',()=>openModule(b.dataset.pronModule)));
    document.querySelector('#startPronWorkout')?.addEventListener('click',()=>startWorkout());document.querySelector('#startPronQuick')?.addEventListener('click',()=>{document.querySelector('#pronSource').value='all';document.querySelector('#pronSize').value='5';startWorkout(5)});document.querySelector('#randomPronWord')?.addEventListener('click',randomPronWord);
    document.addEventListener('click',e=>{const s=e.target.closest('[data-pron-speak]');if(s){e.preventDefault();e.stopPropagation();speak(s.dataset.pronSpeak)}});
    window.addEventListener('beforeunload',()=>{stopRecording(true);if(recordUrl)URL.revokeObjectURL(recordUrl)});
  }
  document.addEventListener('DOMContentLoaded',initPronunciation);
})();
