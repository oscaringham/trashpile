const track = document.getElementById('slidesTrack');
const nextButton = document.querySelector('.next-btn');
const skipButton = document.querySelector('.skip-btn');
const dots = Array.from(document.querySelectorAll('.pagination .dot'));
const newsletterCards = Array.from(document.querySelectorAll('.newsletter-card'));

let currentIndex = 0;
const totalSlides = 5;
const finalSlideIndex = totalSlides - 1;

function setSlide(index) {
  currentIndex = Math.max(0, Math.min(index, totalSlides - 1));
  track.style.transform = `translateX(-${currentIndex * 100}vw)`;

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });

  if (nextButton) {
    nextButton.textContent = currentIndex === finalSlideIndex ? 'Start exploring' : 'Next';
  }
}

function goNext() {
  setSlide(currentIndex + 1);
}

function goLast() {
  setSlide(finalSlideIndex);
}

nextButton?.addEventListener('click', goNext);
skipButton?.addEventListener('click', goLast);

newsletterCards.forEach((card) => {
  card.addEventListener('click', () => {
    const selected = card.classList.toggle('is-selected');
    card.setAttribute('aria-pressed', String(selected));
  });
});

let touchStartX = 0;
let touchStartY = 0;
let touchDeltaX = 0;
let touchDeltaY = 0;

track.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
  touchDeltaX = 0;
  touchDeltaY = 0;
}, { passive: true });

track.addEventListener('touchmove', (event) => {
  touchDeltaX = event.changedTouches[0].clientX - touchStartX;
  touchDeltaY = event.changedTouches[0].clientY - touchStartY;
}, { passive: true });

track.addEventListener('touchend', () => {
  const threshold = 45;
  const isHorizontalSwipe = Math.abs(touchDeltaX) > Math.abs(touchDeltaY);

  if (isHorizontalSwipe && touchDeltaX < -threshold) {
    goNext();
  } else if (isHorizontalSwipe && touchDeltaX > threshold) {
    setSlide(currentIndex - 1);
  }

  touchStartX = 0;
  touchStartY = 0;
  touchDeltaX = 0;
  touchDeltaY = 0;
}, { passive: true });

setSlide(0);
