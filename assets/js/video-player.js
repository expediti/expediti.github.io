/**
 * Bootstrap logic for video.html
 * – Reads ?id= (or ?v=)     – Loads video data     – Hands it to XshiverVideoPlayer
 */

(function () {
    /* ---------- helpers ---------- */

    const qs   = id => document.getElementById(id);
    const num  = x => x>=1e6 ? (x/1e6).toFixed(1)+'M' : x>=1e3 ? (x/1e3).toFixed(1)+'K' : x;
    const time = s => { const m=Math.floor(s/60), sec=Math.floor(s%60);
                        return `${m}:${sec.toString().padStart(2,'0')}`; };

    function getVideoId() {
        const p = new URLSearchParams(window.location.search);
        return p.get('id') || p.get('v');                // accept both
    }

    /* ---------- main ---------- */

    document.addEventListener('DOMContentLoaded', () => {
        const id = getVideoId();
        if (!id) { showError('No video ID in URL'); return; }

        waitForDB().then(() => initPlayer(id))
                   .catch(err => showError(err.message));
    });

    function waitForDB() {
        return new Promise((res, rej) => {
            let t=0, iv=setInterval(()=>{
                if (window.videoDatabase && window.videoDatabase.isInitialized){clearInterval(iv);res();}
                else if (++t>100){clearInterval(iv);rej(new Error('Video DB failed to initialise'));}},100);
        });
    }

    async function initPlayer(id) {
        const data = await (window.videoDatabase.getVideo
                            ? window.videoDatabase.getVideo(id)
                            : (window.videoDatabase.videos||[]).find(v=>v.id==id));

        if (!data)        { showError(`Video ${id} not found`); return; }

        // meta + UI
        docMeta(data);
        uiFill(data);

        // instantiate custom player and load src
        window.xshiverPlayer = new XshiverVideoPlayer('xshiver-player');
        window.xshiverPlayer.loadVideo(id);              // uses existing method
    }

    /* ---------- meta / UI ---------- */

    function docMeta(v) {
        document.title                        = `${v.title} – Xshiver`;
        qs('video-title').textContent         = document.title;
        qs('video-description').content       = v.description;

        qs('og-title').content      = v.title;
        qs('og-description').content= v.description;
        qs('og-video').content      = v.catbox_video_url;
        qs('og-thumbnail').content  = v.catbox_thumbnail_url;

        // schema.org
        qs('video-schema').textContent = JSON.stringify({
            '@context':'https://schema.org','@type':'VideoObject',
            name:v.title,description:v.description,
            thumbnailUrl:v.catbox_thumbnail_url,
            uploadDate:v.upload_date,duration:`PT${v.duration}S`,
            contentUrl:v.catbox_video_url,embedUrl:window.location.href
        });
    }

    function uiFill(v) {
        qs('current-video-title').textContent = v.title;
        qs('video-views').textContent         = `${num(v.view_count)} views`;
        qs('upload-date').textContent         = new Date(v.upload_date).toLocaleDateString();
        qs('video-duration').textContent      = time(v.duration);
        qs('rating-text').textContent         = `${v.rating}/5`;

        // description & tags
        qs('video-description-text').textContent = v.description || '';
        const tags = qs('video-tags');
        tags.innerHTML = (v.tags||[]).map(t=>`<span class="video-tag">#${t}</span>`).join(' ');
    }

    function showError(msg) {
        qs('current-video-title').textContent      = 'Error';
        qs('video-description-text').textContent   = msg;
        const load = qs('video-loading');
        if (load) load.innerHTML = `<p style="color:red">${msg}</p>`;
    }
})();
