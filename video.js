document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentUrl = urlParams.get("url");
    const title = urlParams.get("title");
    const category = urlParams.get("category");
    const duration = urlParams.get("duration");

    const mainVideo = document.getElementById("main-video");
    const videoTitle = document.getElementById("video-title");
    const videoCategory = document.getElementById("video-category");
    const videoDuration = document.getElementById("video-duration");
    const suggestionList = document.getElementById("suggestion-list");

    // Set current video details
    if (currentUrl) {
        mainVideo.src = currentUrl;
        mainVideo.load();
        mainVideo.play();
    } else {
        videoTitle.textContent = "No video selected";
    }
    if (title) videoTitle.textContent = title;
    if (category) videoCategory.textContent = `Category: ${category}`;
    if (duration) videoDuration.textContent = `Duration: ${duration}`;

    // Fetch and display suggestions
    try {
        const response = await fetch("videos.json");
        if (!response.ok) throw new Error("Failed to load videos");
        const videos = await response.json();

        // Filter videos from the same category, excluding the current video
        const suggestions = videos.filter(video =>
            video.category === category && video.url !== currentUrl
        );

        // Populate suggestion list
        suggestionList.innerHTML = "";
        if (suggestions.length > 0) {
            suggestions.forEach(video => {
                const videoLink = document.createElement("a");
                videoLink.href = `video.html?url=${encodeURIComponent(video.url)}&title=${encodeURIComponent(video.title)}&category=${encodeURIComponent(video.category)}&duration=${encodeURIComponent(video.duration)}`;
                videoLink.className = "video-card";
                videoLink.innerHTML = `
                    <img src="${video.thumbnail}" alt="${video.title}">
                    <h4>${video.title}</h4>
                    <small>${video.duration}</small>
                `;
                suggestionList.appendChild(videoLink);
            });
        } else {
            suggestionList.innerHTML = "<p>No suggestions available</p>";
        }
    } catch (error) {
        console.error(error);
        suggestionList.innerHTML = "<p>Failed to load suggestions</p>";
    }
});
