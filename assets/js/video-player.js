/* ---------------------------------------------------------------------
   Xshiver Custom Video Player  –  full source
   • Catbox hosting   • Adaptive quality   • Chromecast
   • Keyboard & touch shortcuts   • Share / bookmark / toast
   • Analytics milestones          • Theater & fullscreen
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* 1)  Age-gate stub (remove when running the real module)           */
/* ------------------------------------------------------------------ */
window.ageVerification = window.ageVerification || {
    isVerified: () => true            // always verified while developing
};

/* ------------------------------------------------------------------ */
/* 2)  Constructor                                                   */
/* ------------------------------------------------------------------ */
class XshiverVideoPlayer {
    constructor(container, options = {}) {

        /* ---------------------------------
           DOM root
        --------------------------------- */
        this.container =
            typeof container === 'string'
                ? document.getElementById(container)
                : container;

        this.video = this.container.querySelector('#main-video');

        /* ---------------------------------
           Config & internal state
        --------------------------------- */
        this.options = {
            autoplay: false,
            loop: false,
            muted: false,
            volume: 0.8,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            qualities: ['auto', '4k', '1080p', '720p', '480p'],
            ...options
        };

        this.isPlaying       = false;
        this.isMuted         = false;
        this.isFullscreen    = false;
        this.isTheaterMode   = false;

        this.currentVolume   = this.options.volume;
        this.currentTime     = 0;
        this.duration        = 0;
        this.playbackRate    = 1;
        this.currentQuality  = 'auto';
        this.videoData       = null;

        this.controlsTimeout         = null;
        this.progressUpdateInterval  = null;
        this.milestones              = { 25:false, 50:false, 75:false, 95:false };

        /* ---------------------------------
           Init
        --------------------------------- */
        this.bindElements();
        this.setupEventListeners();
        this.loadVideoFromURL();
        this.initializeControls();
        this.setupKeyboardShortcuts();
        this.setupTouchControls();
        this.setupAdaptiveStreaming();
    }

    /* ================================================================
       3)  Element references
       ================================================================ */
    bindElements() {

        /* Controls */
        this.bigPlayBtn    = this.container.querySelector('#big-play-btn');
        this.playPauseBtn  = this.container.querySelector('#play-pause-btn');
        this.volumeBtn     = this.container.querySelector('#volume-btn');
        this.fullscreenBtn = this.container.querySelector('#fullscreen-btn');
        this.speedBtn      = this.container.querySelector('#speed-btn');
        this.qualityBtn    = this.container.querySelector('#quality-btn');
        this.castBtn       = this.container.querySelector('#cast-btn');

        /* Progress */
        this.progressBar    = this.container.querySelector('#progress-bar');
        this.progressFilled = this.container.querySelector('#progress-filled');
        this.progressBuffer = this.container.querySelector('#progress-buffer');
        this.progressThumb  = this.container.querySelector('#progress-thumb');

        /* Volume */
        this.volumeSlider = this.container.querySelector('#volume-slider');
        this.volumeFilled = this.container.querySelector('#volume-filled');
        this.volumeThumb  = this.container.querySelector('#volume-thumb');

        /* Time */
        this.currentTimeDisplay = this.container.querySelector('#current-time');
        this.durationDisplay    = this.container.querySelector('#duration-time');

        /* Popup menus */
        this.qualityMenu = this.container.querySelector('#quality-menu');
        this.speedMenu   = this.container.querySelector('#speed-menu');

        /* Overlays */
        this.controlsOverlay = this.container.querySelector('#controls-overlay');
        this.loadingOverlay  = this.container.querySelector('#video-loading');

        /* Info outside player */
        this.videoTitle            = document.getElementById('current-video-title');
        this.currentQualityDisplay = document.getElementById('current-quality');
        this.speedText             = document.getElementById('speed-text');
    }

    /* ================================================================
       4)  Top-level listeners
       ================================================================ */
    setupEventListeners() {

        /* --- media element ---------------------------------------- */
        this.video.addEventListener('loadstart',      () => this.onLoadStart());
        this.video.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.video.addEventListener('canplay',        () => this.onCanPlay());
        this.video.addEventListener('play',           () => this.onPlay());
        this.video.addEventListener('pause',          () => this.onPause());
        this.video.addEventListener('ended',          () => this.onEnded());
        this.video.addEventListener('timeupdate',     () => this.onTimeUpdate());
        this.video.addEventListener('progress',       () => this.onProgress());
        this.video.addEventListener('volumechange',   () => this.onVolumeChange());
        this.video.addEventListener('ratechange',     () => this.onRateChange());
        this.video.addEventListener('error',          (e)=> this.onError(e));

        /* --- clickable buttons ------------------------------------ */
        this.bigPlayBtn   .addEventListener('click', ()=> this.togglePlayPause());
        this.playPauseBtn .addEventListener('click', ()=> this.togglePlayPause());
        this.volumeBtn    .addEventListener('click', ()=> this.toggleMute());
        this.fullscreenBtn.addEventListener('click', ()=> this.toggleFullscreen());
        this.speedBtn     .addEventListener('click', ()=> this.toggleSpeedMenu());
        this.qualityBtn   .addEventListener('click', ()=> this.toggleQualityMenu());
        this.castBtn      .addEventListener('click', ()=> this.initiateCast());

        /* --- progress bar ----------------------------------------- */
        if (this.progressBar) {
            this.progressBar.addEventListener('click',    (e)=> this.seekFromEvent(e));
            this.progressBar.addEventListener('mousemove',(e)=> this.updateProgressThumb(e));
        }

        /* --- volume slider ---------------------------------------- */
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('click',    (e)=> this.setVolumeFromEvent(e));
            this.volumeSlider.addEventListener('mousemove',(e)=> this.updateVolumeThumb(e));
        }

        /* --- popup menu items ------------------------------------- */
        this.setupMenuEvents();

        /* --- container overlay ------------------------------------ */
        this.container.addEventListener('mousemove',()=>this.showControls());
        this.container.addEventListener('mouseleave',()=>this.hideControls());
        this.container.addEventListener('click',     (e)=>this.handleContainerClick(e));

        /* --- window ----------------------------------------------- */
        window  .addEventListener('resize',           ()=> this.handleResize());
        document.addEventListener('fullscreenchange', ()=> this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', ()=> this.onFullscreenChange());
    }

    setupMenuEvents() {
        /* Quality items */
        this.qualityMenu.querySelectorAll('.quality-option').forEach(opt=>{
            opt.addEventListener('click', ()=> this.changeQuality(opt.dataset.quality));
        });
        /* Speed items */
        this.speedMenu.querySelectorAll('.speed-option').forEach(opt=>{
            opt.addEventListener('click', ()=> this.changePlaybackRate(parseFloat(opt.dataset.speed)));
        });
        /* close when clicking elsewhere */
        document.addEventListener('click', (e)=>{
            if (!this.qualityBtn.contains(e.target) && !this.qualityMenu.contains(e.target))
                this.hideQualityMenu();
            if (!this.speedBtn  .contains(e.target) && !this.speedMenu  .contains(e.target))
                this.hideSpeedMenu();
        });
    }

    /* ================================================================
       5)  Loading video
       ================================================================ */
    loadVideoFromURL() {
        const id = new URLSearchParams(window.location.search).get('id');
        if (!id) {
            this.showError('No video specified'); return;
        }
        this.loadVideo(id);
    }

    async loadVideo(id) {
        try {
            this.showLoading();
            const data = await window.videoDatabase.getVideo(id);
            if (!data) throw new Error('Video not found');

            this.videoData = data;
            /* update source */
            this.container.querySelector('#video-source').src = data.catbox_video_url;
            /* update meta/title */
            this.updatePageMetadata(data);
            /* reload media element */
            this.video.load();
            /* initial volume */
            this.video.volume = this.currentVolume;
            /* load related */
            this.loadRelatedVideos(data.category, data.tags);

        } catch(err) {
            console.error(err);
            this.showError(err.message || 'Failed to load video');
        }
    }

    updatePageMetadata(v){
        document.title = `${v.title} – Xshiver`;
        document.getElementById('video-title').textContent = document.title;
        document.getElementById('video-description').content = v.description;
        document.getElementById('og-title').content        = v.title;
        document.getElementById('og-description').content  = v.description;
        document.getElementById('og-video').content        = v.catbox_video_url;
        document.getElementById('og-thumbnail').content    = v.catbox_thumbnail_url;

        if (this.videoTitle) this.videoTitle.textContent = v.title;

        /* info section */
        const views  = document.getElementById('video-views');
        const upDate = document.getElementById('upload-date');
        const durTxt = document.getElementById('video-duration');
        const rateTx = document.getElementById('rating-text');

        if (views)  views.textContent  = `${v.view_count.toLocaleString()} views`;
        if (upDate) upDate.textContent = new Date(v.upload_date).toLocaleDateString();
        if (durTxt) durTxt.textContent = this.formatTime(v.duration);
        if (rateTx) rateTx.textContent = `${v.rating}/5`;

        this.updateRatingStars(v.rating);
        this.updateVideoTags(v.tags);

        /* schema.org */
        const schema = {
            "@context":"https://schema.org","@type":"VideoObject",
            name:v.title,description:v.description,thumbnailUrl:v.catbox_thumbnail_url,
            uploadDate:v.upload_date,duration:`PT${v.duration}S`,contentUrl:v.catbox_video_url,
            embedUrl:window.location.href,interactionCount:v.view_count
        };
        document.getElementById('video-schema').textContent = JSON.stringify(schema);
    }

    /* helper */
    updateRatingStars(r){
        const c = document.getElementById('rating-stars');
        if (!c) return;
        c.querySelectorAll('.star').forEach((s,i)=>{ s.textContent = i<Math.floor(r) ? '★' : '☆'; });
    }
    updateVideoTags(tags){
        const box = document.getElementById('video-tags');
        if (!box) return;
        box.innerHTML='';
        tags.forEach(t=>{
            const a=document.createElement('a');
            a.className='video-tag'; a.href='#'; a.textContent=`#${t}`;
            box.appendChild(a);
        });
    }

    /* ================================================================
       6)  Media event callbacks
       ================================================================ */
    onLoadStart(){ this.showLoading(); }
    onLoadedMetadata(){
        this.duration = this.video.duration;
        this.updateDurationDisplay();
        this.initializeProgress();
    }
    onCanPlay(){
        this.hideLoading();
        if (this.options.autoplay){
            this.play().catch(()=>{ /* autoplay blocked */});
        }
    }
    onPlay(){
        this.isPlaying = true;
        this.updatePlayPauseButton();
        this.hideBigPlayButton();
        this.startProgressUpdates();
        this.trackEvent('video_play');
    }
    onPause(){
        this.isPlaying = false;
        this.updatePlayPauseButton();
        this.showBigPlayButton();
        this.stopProgressUpdates();
        this.trackEvent('video_pause');
    }
    onEnded(){
        this.isPlaying=false;
        this.updatePlayPauseButton();
        this.showBigPlayButton();
        this.stopProgressUpdates();
        this.trackEvent('video_complete');
        this.handleVideoEnd();
    }
    onTimeUpdate(){
        this.currentTime = this.video.currentTime;
        this.updateProgressBar();
        this.updateCurrentTimeDisplay();
        this.trackMilestones();
    }
    onProgress(){ this.updateBufferProgress(); }
    onVolumeChange(){
        this.currentVolume = this.video.volume;
        this.isMuted       = this.video.muted;
        this.updateVolumeDisplay();
        this.updateVolumeButton();
    }
    onRateChange(){
        this.playbackRate = this.video.playbackRate;
        this.updateSpeedDisplay();
    }
    onError(e){ console.error(e); this.showError('Cannot play media'); }

    /* ================================================================
       7)  Basic controls
       ================================================================ */
    async play(){ await this.video.play(); }
    pause(){ this.video.pause(); }
    togglePlayPause(){ this.isPlaying ? this.pause() : this.play(); }

    seek(t){ if (t>=0 && t<=this.duration) this.video.currentTime = t; }
    seekFromEvent(e){
        const rect=this.progressBar.getBoundingClientRect();
        this.seek(((e.clientX-rect.left)/rect.width)*this.duration);
    }

    /* ------------------ volume ------------------ */
    setVolume(v){ this.video.volume = Math.max(0,Math.min(1,v)); }
    setVolumeFromEvent(e){
        const rect=this.volumeSlider.getBoundingClientRect();
        const vol=(e.clientX-rect.left)/rect.width;
        this.setVolume(vol);
        if (this.video.muted && vol>0) this.video.muted=false;
    }
    toggleMute(){ this.video.muted = !this.video.muted; }

    /* ------------------ rate / quality ----------- */
    changePlaybackRate(r){
        this.video.playbackRate = r;
        this.hideSpeedMenu();
        this.updateSpeedMenuActive(r);
    }
    changeQuality(q){
        this.currentQuality = q;
        this.hideQualityMenu();
        this.updateQualityDisplay(q);
        this.updateQualityMenuActive(q);
        if (window.adaptiveStreaming) window.adaptiveStreaming.changeQuality(q);
    }

    /* ------------------ fullscreen --------------- */
    async toggleFullscreen(){ this.isFullscreen ? this.exitFullscreen() : this.enterFullscreen(); }
    async enterFullscreen(){
        const el=this.container;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    }
    async exitFullscreen(){
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
        else if (document.msExitFullscreen) await document.msExitFullscreen();
    }
    onFullscreenChange(){
        this.isFullscreen = !!(document.fullscreenElement||
                               document.webkitFullscreenElement||
                               document.mozFullScreenElement||
                               document.msFullscreenElement);
        this.updateFullscreenButton();
        this.trackEvent(this.isFullscreen?'fullscreen_enter':'fullscreen_exit');
    }

    /* ------------------ theater ------------------ */
    toggleTheaterMode(){
        this.isTheaterMode=!this.isTheaterMode;
        this.container.classList.toggle('theater-mode', this.isTheaterMode);
        document.body.style.overflow = this.isTheaterMode ? 'hidden' : '';
        this.trackEvent(this.isTheaterMode ? 'theater_enter' : 'theater_exit');
    }

    /* ================================================================
       8)  UI helpers
       ================================================================ */
    updatePlayPauseButton(){
        const playI = this.playPauseBtn.querySelector('.play-icon');
        const pauseI= this.playPauseBtn.querySelector('.pause-icon');
        playI .classList.toggle('hidden', this.isPlaying);
        pauseI.classList.toggle('hidden', !this.isPlaying);
    }
    updateVolumeButton(){
        const hi=this.volumeBtn.querySelector('.volume-high');
        const mu=this.volumeBtn.querySelector('.volume-muted');
        const mute = this.isMuted || this.currentVolume===0;
        hi.classList.toggle('hidden', mute);
        mu.classList.toggle('hidden', !mute);
    }
    updateFullscreenButton(){
        const exp=this.fullscreenBtn.querySelector('.expand-icon');
        const cmp=this.fullscreenBtn.querySelector('.compress-icon');
        exp.classList.toggle('hidden', this.isFullscreen);
        cmp.classList.toggle('hidden', !this.isFullscreen);
    }
    updateProgressBar(){
        if (!this.progressFilled||!this.duration) return;
        this.progressFilled.style.width = `${(this.currentTime/this.duration)*100}%`;
    }
    updateBufferProgress(){
        if (!this.progressBuffer||!this.video.buffered.length) return;
        const end=this.video.buffered.end(this.video.buffered.length-1);
        this.progressBuffer.style.width = `${(end/this.duration)*100}%`;
    }
    updateProgressThumb(e){
        if (!this.progressThumb) return;
        const rect=this.progressBar.getBoundingClientRect();
        const pct=((e.clientX-rect.left)/rect.width)*100;
        this.progressThumb.style.left = `${Math.max(0,Math.min(100,pct))}%`;
    }
    updateVolumeDisplay(){
        if (this.volumeFilled)
            this.volumeFilled.style.width = `${(this.isMuted?0:this.currentVolume)*100}%`;
    }
    updateVolumeThumb(e){
        if (!this.volumeThumb) return;
        const rect=this.volumeSlider.getBoundingClientRect();
        const pct=((e.clientX-rect.left)/rect.width)*100;
        this.volumeThumb.style.left = `${Math.max(0,Math.min(100,pct))}%`;
    }
    updateCurrentTimeDisplay(){
        if (this.currentTimeDisplay)
            this.currentTimeDisplay.textContent = this.formatTime(this.currentTime);
    }
    updateDurationDisplay(){
        if (this.durationDisplay)
            this.durationDisplay.textContent = this.formatTime(this.duration);
    }
    updateSpeedDisplay(){
        if (this.speedText) this.speedText.textContent = `${this.playbackRate}x`;
    }
    updateQualityDisplay(q){
        if (this.currentQualityDisplay)
            this.currentQualityDisplay.textContent = q==='auto'?'Auto':q.toUpperCase();
    }
    updateSpeedMenuActive(r){
        this.speedMenu.querySelectorAll('.speed-option').forEach(o=>{
            o.classList.toggle('active', parseFloat(o.dataset.speed)===r);
        });
    }
    updateQualityMenuActive(q){
        this.qualityMenu.querySelectorAll('.quality-option').forEach(o=>{
            o.classList.toggle('active', o.dataset.quality===q);
        });
    }

    /* --- controls overlay visibility ----------------------------- */
    showControls(){
        this.controlsOverlay.classList.add('show');
        this.clearControlsTimeout();
        if (this.isPlaying) this.setControlsTimeout();
    }
    hideControls(){
        if (!this.isPlaying) return;
        this.controlsOverlay.classList.remove('show');
        this.clearControlsTimeout();
    }
    setControlsTimeout(){
        this.controlsTimeout = setTimeout(()=>this.hideControls(),3000);
    }
    clearControlsTimeout(){
        clearTimeout(this.controlsTimeout);
        this.controlsTimeout=null;
    }

    showBigPlayButton(){ this.bigPlayBtn.classList.remove('hidden'); }
    hideBigPlayButton(){ this.bigPlayBtn.classList.add('hidden'); }

    /* --- popup menus --------------------------------------------- */
    toggleSpeedMenu(){ this.speedMenu.classList.toggle('hidden'); this.hideQualityMenu(); }
    toggleQualityMenu(){ this.qualityMenu.classList.toggle('hidden'); this.hideSpeedMenu(); }
    hideSpeedMenu(){ this.speedMenu.classList.add('hidden'); }
    hideQualityMenu(){ this.qualityMenu.classList.add('hidden'); }

    /* --- loading / error ----------------------------------------- */
    showLoading(){ this.loadingOverlay.classList.remove('hidden'); }
    hideLoading(){ this.loadingOverlay.classList.add('hidden'); }
    showError(msg){
        this.hideLoading();
        const o=document.createElement('div');
        o.className='video-error-overlay';
        o.innerHTML=`
         <div class="error-content">
           <div class="error-icon">⚠️</div>
           <h3>Error Loading Video</h3>
           <p>${msg}</p>
           <button class="retry-btn" onclick="location.reload()">Retry</button>
         </div>`;
        this.container.appendChild(o);
    }

    /* ================================================================
       9)  Progress helpers
       ================================================================ */
    initializeProgress(){
        this.updateProgressBar();
        this.updateBufferProgress();
    }
    startProgressUpdates(){
        if (this.progressUpdateInterval) return;
        this.progressUpdateInterval = setInterval(()=>{
            if (this.isPlaying) this.onTimeUpdate();
        },100);
    }
    stopProgressUpdates(){
        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval=null;
    }

    /* ================================================================
       10)  Keyboards  &  Touch
       ================================================================ */
    setupKeyboardShortcuts(){
        document.addEventListener('keydown',(e)=>{
            if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
            switch(e.code){
                case 'Space': case 'KeyK': e.preventDefault(); this.togglePlayPause(); break;
                case 'KeyF':  e.preventDefault(); this.toggleFullscreen(); break;
                case 'KeyT':  e.preventDefault(); this.toggleTheaterMode(); break;
                case 'KeyM':  e.preventDefault(); this.toggleMute(); break;
                case 'ArrowLeft':  e.preventDefault(); this.seek(this.currentTime-10); break;
                case 'ArrowRight': e.preventDefault(); this.seek(this.currentTime+10); break;
                case 'ArrowUp':    e.preventDefault(); this.setVolume(this.currentVolume+0.1); break;
                case 'ArrowDown':  e.preventDefault(); this.setVolume(this.currentVolume-0.1); break;
                default:
                    if (/^(Digit|Numpad)[0-9]$/.test(e.code)){
                        e.preventDefault();
                        const n=parseInt(e.code.replace(/\D/g,''),10);
                        this.seek(this.duration*(n/10));
                    }
            }
        });
    }

    setupTouchControls(){
        let sx=0,sy=0,startTime=0,adjVol=false;
        this.video.addEventListener('touchstart',(e)=>{
            const t=e.touches[0];
            sx=t.clientX; sy=t.clientY; startTime=this.currentTime;
            adjVol = sx < this.container.offsetWidth*0.5;
        },{passive:true});

        this.video.addEventListener('touchmove',(e)=>{
            const t=e.touches[0]; const dx=t.clientX-sx; const dy=t.clientY-sy;
            if (Math.abs(dy) > Math.abs(dx) && adjVol){
                const d=-dy/200; this.setVolume(this.currentVolume+d);
            } else {
                const dt=(dx/this.container.offsetWidth)*60;
                this.seek(Math.max(0,Math.min(this.duration,startTime+dt)));
            }
            e.preventDefault();
        },{passive:false});

        /* double-tap play/pause */
        let last=0;
        this.video.addEventListener('touchend',()=>{
            const now = Date.now();
            if (now-last<500) this.togglePlayPause();
            last = now;
        });
    }

    /* ================================================================
       11)  Adaptive & Cast
       ================================================================ */
    setupAdaptiveStreaming(){
        if (window.AdaptiveStreaming)
            this.adaptiveStreaming = new window.AdaptiveStreaming(this);
    }
    initiateCast(){
        if (window.ChromecastSupport)
            window.ChromecastSupport.initiateCast(this.videoData);
        else console.log('Chromecast not available');
    }

    /* ================================================================
       12)  Resize / end-of-video helpers
       ================================================================ */
    handleContainerClick(e){
        if (e.target===this.video || e.target===this.container) this.togglePlayPause();
    }
    handleResize(){ if (window.innerWidth<=768){ this.hideQualityMenu(); this.hideSpeedMenu(); } }

    handleVideoEnd(){
        setTimeout(()=>{
            if (this.hasRelatedVideos()) this.showNextVideoSuggestion();
            else this.showReplayOption();
        },2000);
    }
    hasRelatedVideos(){
        return document.querySelectorAll('.related-video-card:not(.placeholder)').length>0;
    }
    showNextVideoSuggestion(){ /* custom UX */ }
    showReplayOption(){
        const btn=document.createElement('button');
        btn.className='replay-btn';
        btn.innerHTML=`<svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <path d="M4 2v6l-2-2-2 2 4 4 4-4-2-2-2 2V2z"/>
                          <path d="M20 18.5A8.5 8.5 0 1 1 11.5 2c3.92 0 7.24 2.65 8.23 6.25"/>
                       </svg><span>Replay</span>`;
        btn.style.cssText=`position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                           background:rgba(74,144,226,.9);color:#fff;border:none;
                           border-radius:8px;padding:16px 24px;font-size:16px;
                           display:flex;align-items:center;gap:8px;cursor:pointer;z-index:20`;
        btn.onclick=()=>{ this.seek(0); this.play(); btn.remove(); };
        this.container.appendChild(btn);
    }

    /* ================================================================
       13)  Related videos
       ================================================================ */
    async loadRelatedVideos(cat,tags){
        try{
            const vids = await window.videoDatabase.getRelatedVideos(cat,tags,10);
            this.displayRelatedVideos(vids);
        }catch(e){ console.error(e); }
    }
    displayRelatedVideos(arr){
        const box=document.getElementById('related-videos'); if (!box) return;
        box.innerHTML='';
        arr.forEach(v=> box.appendChild(this.createRelatedCard(v)));
    }
    createRelatedCard(v){
        const c=document.createElement('div');
        c.className='related-video-card';
        c.onclick=()=>{ window.location.href=`video.html?id=${v.id}`; };
        c.innerHTML=`
          <div class="related-thumbnail">
             <img src="${v.catbox_thumbnail_url}" alt="${v.title}" loading="lazy">
             <span class="related-duration">${this.formatTime(v.duration)}</span>
          </div>
          <div class="related-info">
             <h4 class="related-title">${v.title}</h4>
             <p  class="related-views">${v.view_count.toLocaleString()} views</p>
          </div>`;
        return c;
    }

    /* ================================================================
       14)  Analytics
       ================================================================ */
    trackEvent(ev,data={}){
        if (typeof gtag!=='undefined'){
            gtag('event',ev,{
                video_id:this.videoData?.id,video_title:this.videoData?.title,
                video_duration:this.duration,current_time:this.currentTime,...data
            });
        }
        console.log('📊',ev,data);
        this.storeAnalyticsEvent(ev,data);
    }
    storeAnalyticsEvent(ev,data){
        const list=JSON.parse(localStorage.getItem('xshiver_analytics')||'[]');
        list.push({event:ev,data,timestamp:new Date().toISOString(),
                   videoId:this.videoData?.id,sessionId:this.getSessionId()});
        if (list.length>100) list.splice(0,list.length-100);
        localStorage.setItem('xshiver_analytics',JSON.stringify(list));
    }
    getSessionId(){
        let id=sessionStorage.getItem('xshiver_session_id');
        if (!id){ id='xs_'+Math.random().toString(36).substr(2,9)+'_'+Date.now();
                  sessionStorage.setItem('xshiver_session_id',id);}
        return id;
    }
    trackMilestones(){
        const pct=(this.currentTime/this.duration)*100;
        [25,50,75,95].forEach(m=>{
            if (pct>=m && !this.milestones[m]){
                this.milestones[m]=true;
                this.trackEvent('video_progress',{milestone:m});
            }
        });
    }

    /* ================================================================
       15)  Utility
       ================================================================ */
    formatTime(sec){
        if (isNaN(sec)) return '0:00';
        const m=Math.floor(sec/60); const s=Math.floor(sec%60).toString().padStart(2,'0');
        return `${m}:${s}`;
    }

    /* ================================================================
       16)  Destroy
       ================================================================ */
    destroy(){
        this.stopProgressUpdates();
        this.clearControlsTimeout();
        /* more clean-up if needed */
        console.log('🗑️ Video player destroyed');
    }
}

/* ------------------------------------------------------------------ */
/* 3)  Page-level helpers (bookmark / share / toast etc.)             */
/* ------------------------------------------------------------------ */
function goBack(){
    if (document.referrer && document.referrer.includes(window.location.hostname))
        history.back(); else window.location.href='../../index.html';
}

function closeShareModal(){ document.getElementById('share-modal').classList.remove('active'); }

function shareToTwitter(){
    const url=encodeURIComponent(window.location.href);
    const txt=encodeURIComponent(document.getElementById('current-video-title').textContent);
    window.open(`https://twitter.com/intent/tweet?text=${txt}&url=${url}`,
                '_blank','width=600,height=400');
}
function shareToFacebook(){
    const url=encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`,
                '_blank','width=600,height=400');
}
function shareToReddit(){
    const url=encodeURIComponent(window.location.href);
    const title=encodeURIComponent(document.getElementById('current-video-title').textContent);
    window.open(`https://reddit.com/submit?title=${title}&url=${url}`,
                '_blank','width=800,height=600');
}
function copyVideoLink(){
    const input=document.getElementById('video-link');
    input.value=window.location.href; input.select(); document.execCommand('copy');
    const btn=event.target.closest('.share-btn');
    const span=btn.querySelector('span:last-child'); const txt=span.textContent;
    span.textContent='Copied!'; setTimeout(()=>span.textContent=txt,2000);
}

/* ---------- bookmarks -------------------------------------------- */
function toggleBookmark(v){
    const store=JSON.parse(localStorage.getItem('xshiver_bookmarks')||'{}');
    if (store[v.id]){ delete store[v.id]; showToast('Bookmark removed','info'); }
    else {
        store[v.id]={id:v.id,title:v.title,thumbnail:v.catbox_thumbnail_url,
                     duration:v.duration,bookmarkedAt:new Date().toISOString()};
        showToast('Video bookmarked!','success');
    }
    localStorage.setItem('xshiver_bookmarks',JSON.stringify(store));
    updateBookmarkButton();
}
function updateBookmarkButton(){
    const btn=document.getElementById('bookmark-btn');
    if (!btn||!window.xshiverPlayer?.videoData) return;
    const store=JSON.parse(localStorage.getItem('xshiver_bookmarks')||'{}');
    const marked=!!store[window.xshiverPlayer.videoData.id];
    btn.style.color = marked ? '#ffd700' : '';
    btn.title = marked ? 'Remove Bookmark' : 'Bookmark Video';
}

/* ---------- toast ------------------------------------------------- */
function showToast(msg,type='info'){
    const t=document.createElement('div');
    t.className=`toast toast-${type}`; t.textContent=msg;
    document.body.appendChild(t); setTimeout(()=>t.classList.add('show'),100);
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); },3000);
}

/* ------------------------------------------------------------------ */
/* 4)  Page initialisation                                           */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded',()=>{
    const wait=()=>{
        if (window.ageVerification.isVerified()){
            window.xshiverPlayer = new XshiverVideoPlayer('xshiver-player');
            setupVideoPageActions();
        } else setTimeout(wait,100);
    };
    wait();
});

function setupVideoPageActions(){
    /* bookmark */
    const bm=document.getElementById('bookmark-btn');
    if (bm) { bm.addEventListener('click',()=>toggleBookmark(window.xshiverPlayer.videoData));
              updateBookmarkButton(); }

    /* share modal */
    const sh=document.getElementById('share-btn');
    if (sh) sh.addEventListener('click',()=>document.getElementById('share-modal').classList.add('active'));

    /* theater mode */
    const th=document.getElementById('theater-mode-btn');
    if (th) th.addEventListener('click',()=>window.xshiverPlayer.toggleTheaterMode());
}

/* ------------------------------------------------------------------ */
/*  End of file                                                      */
/* ------------------------------------------------------------------ */
