const videoList = document.getElementById("video-list");
const searchInput = document.getElementById("search");

// Function to fetch videos from videos.json
async function fetchVideos() {
  try {
    const response = await fetch("videos.json");
    if (!response.ok) throw new Error("Failed to load videos");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Load videos into the video list
function loadVideos(videosToLoad) {
  videoList.innerHTML = "";
  videosToLoad.forEach(video => {
    const videoLink = document.createElement("a");
    videoLink.href = `video.html?url=${encodeURIComponent(video.url)}&title=${encodeURIComponent(video.title)}&category=${encodeURIComponent(video.category)}&duration=${encodeURIComponent(video.duration)}`;
    videoLink.className = "video-card";
    videoLink.innerHTML = `
      <img src="${video.thumbnail}" alt="${video.title}">
      <h4>${video.title}</h4>
      <small>${video.duration}</small>
    `;
    videoList.appendChild(videoLink);
  });
}

// Search functionality
searchInput.addEventListener("input", async (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const videos = await fetchVideos();
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm) ||
    video.category.toLowerCase().includes(searchTerm)
  );
  loadVideos(filteredVideos);
});





// Initialize the page with all videos
(async () => {
  const videos = await fetchVideos();
  loadVideos(videos);
})();
