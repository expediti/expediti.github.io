fetch('videos.json')
  .then(res => res.json())
  .then(data => {
    const grid = document.getElementById('videoGrid');

    data.forEach(video => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${video.thumbnail}" alt="Thumbnail">
        <h3>${video.title}</h3>
      `;
      card.onclick = () => playVideo(video.url);
      grid.appendChild(card);
    });
  });

function playVideo(url) {
  const container = document.getElementById('playerContainer');
  container.style.display = 'flex';
  document.getElementById('my-video').src = url;
  fluidPlayer("my-video", { layoutControls: { fillToContainer: true } });
}

document.getElementById('playerContainer').onclick = function(e) {
  if (e.target === this) {
    this.style.display = 'none';
    const video = document.getElementById('my-video');
    video.pause();
    video.src = '';
  }
};
