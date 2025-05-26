  window.addEventListener('load', function () {
    const fallback = './img/radio/radio-place.webp';
    document.querySelectorAll('img').forEach(img => {
      img.onerror = function () {
        if (this.src !== fallback) {
          this.src = fallback;
        }
      };
    });
  });

