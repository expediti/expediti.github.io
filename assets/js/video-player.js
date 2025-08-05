/**
 *  Xshiver Custom Video Player
 *  (full file – shortened comments but all functionality intact)
 */
class XshiverVideoPlayer{
    constructor(container, options={}){
        this.container = typeof container === 'string'
            ? document.getElementById(container)
            : container;

        this.video           = this.container.querySelector('#main-video');

        /* Default options */
        this.options = {
            autoplay:false,loop:false,muted:false,volume:0.8,
            playbackRates:[0.5,0.75,1,1.25,1.5,2],
            qualities:['auto','4k','1080p','720p','480p'],
            ...options
        };

        /* State */
        this.isPlaying=false;this.isMuted=false;
        this.isFullscreen=false;this.isTheaterMode=false;
        this.currentVolume=this.options.volume;
        this.currentTime=0;this.duration=0;this.playbackRate=1;
        this.currentQuality='auto';this.videoData=null;

        this.controlsTimeout=null;this.progressUpdateInterval=null;

        this.init();
    }

    /* ---------- Initialise ---------- */
    init(){
        this.bindElements();
        this.setupEventListeners();
        this.loadVideoFromURL();
        this.initializeControls();
        this.setupKeyboardShortcuts();
        this.setupTouchControls();
        this.setupAdaptiveStreaming();
    }

    bindElements(){
        /* Buttons */
        this.bigPlayBtn    = this.container.querySelector('#big-play-btn');
        this.playPauseBtn  = this.container.querySelector('#play-pause-btn');
        this.volumeBtn     = this.container.querySelector('#volume-btn');
        this.fullscreenBtn = this.container.querySelector('#fullscreen-btn');
        this.speedBtn      = this.container.querySelector('#speed-btn');
        this.qualityBtn    = this.container.querySelector('#quality-btn');
        this.castBtn       = this.container.querySelector('#cast-btn');

        /* Progress */
        this.progressBar   = this.container.querySelector('#progress-bar');
        this.progressFilled= this.container.querySelector('#progress-filled');
        this.progressBuffer= this.container.querySelector('#progress-buffer');
        this.progressThumb = this.container.querySelector('#progress-thumb');

        /* Volume */
        this.volumeSlider  = this.container.querySelector('#volume-slider');
        this.volumeFilled  = this.container.querySelector('#volume-filled');
        this.volumeThumb   = this.container.querySelector('#volume-thumb');

        /* Time */
        this.currentTimeDisplay = this.container.querySelector('#current-time');
        this.durationDisplay    = this.container.querySelector('#duration-time');

        /* Menus */
        this.qualityMenu = this.container.querySelector('#quality-menu');
        this.speedMenu   = this.container.querySelector('#speed-menu');

        /* Overlays */
        this.controlsOverlay = this.container.querySelector('#controls-overlay');
        this.loadingOverlay  = this.container.querySelector('#video-loading');

        /* Info */
        this.videoTitle           = document.getElementById('current-video-title');
        this.currentQualityDisplay= document.getElementById('current-quality');
        this.speedText            = document.getElementById('speed-text');
    }

    /* ---------- Event listeners & UI updates ---------- */
    setupEventListeners(){
        /* Video events */
        this.video.addEventListener('loadstart',      this.onLoadStart.bind(this));
        this.video.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
        this.video.addEventListener('canplay',        this.onCanPlay.bind(this));
        this.video.addEventListener('play',           this.onPlay.bind(this));
        this.video.addEventListener('pause',          this.onPause.bind(this));
        this.video.addEventListener('ended',          this.onEnded.bind(this));
        this.video.addEventListener('timeupdate',     this.onTimeUpdate.bind(this));
        this.video.addEventListener('progress',       this.onProgress.bind(this));
        this.video
