// Video data for Xshiver streaming platform
// All video information is stored here - titles, thumbnails, and video URLs

const videos = [
    {
        id: "pixeldrain-1",
        title: "Beautiful Nature Documentary - Forest Landscapes",
        thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        videoUrl: "https://pixeldrain.com/api/file/LSevn5uJ",
        duration: "10:34",
        type: "mp4",
        embedCode: '<iframe src="https://pixeldrain.com/u/LSevn5uJ?embed" style="border: none; width: 100%; height: 100%; border-radius: 8px;" allowfullscreen></iframe>'
    },
    // ... rest of your video objects remain the same
    {
        id: "vimeo-1",
        title: "Vimeo Sample Video",
        thumbnail: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        vimeoEmbed: `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1089376422?h=b3600a2efd&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="video3"></iframe></div>`,
        duration: "8:45",
        type: "vimeo"
    },
    // ... rest of your video objects
];

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = videos;
}
