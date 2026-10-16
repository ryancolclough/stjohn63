const menuButton = document.getElementById('menuBtn');
const mainNav = document.getElementById('mainNav');

if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

const lodgeAudio = document.getElementById('lodgeAudio');
const audioButton = document.querySelector('.audio-btn');
let lanternLit = false;

if (lodgeAudio && audioButton) {
  lodgeAudio.addEventListener('ended', () => {
    lanternLit = false;
    audioButton.textContent = '▶ Light the Lantern';
  });
}

function toggleAudio() {
  if (!lodgeAudio || !audioButton) return;

  if (!lanternLit) {
    lanternLit = true;
    audioButton.textContent = '❚❚ Dim the Lantern';
    const playAttempt = lodgeAudio.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        lanternLit = false;
        audioButton.textContent = '▶ Light the Lantern';
      });
    }
  } else {
    lanternLit = false;
    lodgeAudio.pause();
    audioButton.textContent = '▶ Light the Lantern';
  }
}
