// Assume fetchVideos, renderCategories, getUniqueCategories, and loadVideos are already defined

// Function to load videos into the video reel
function loadVideoReel(videos) {
    const reel = document.getElementById("video-reel");
    reel.innerHTML = "";
    const reelVideos = getRandomVideos(videos, 10); // Select 10 random videos
    reelVideos.forEach(video => {
        const videoLink = document.createElement("a");
        videoLink.href = `video.html?url=${encodeURIComponent(video.url)}&title=${encodeURIComponent(video.title)}&category=${encodeURIComponent(video.category)}&duration=${encodeURIComponent(video.duration)}`;
        videoLink.className = "video-card";
        videoLink.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}">
            <h4>${video.title}</h4>
            <small>${video.duration}</small>
        `;
        reel.appendChild(videoLink);
    });
}

// Function to get random videos
function getRandomVideos(videos, count) {
    const shuffled = [...videos].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Initialize the page
(async () => {
    const videos = await fetchVideos();
    renderCategories(getUniqueCategories(videos));
    loadVideos(videos);
    loadVideoReel(videos); // Load the video reel
})();
