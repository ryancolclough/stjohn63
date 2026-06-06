// Subtle reveal animations. Safe to remove if you want CSS-only later.
    document.addEventListener('DOMContentLoaded', function(){
      const revealTargets = [
        '.section-title',
        '.home-officer-card',
        '.master-card',
        '.mini-card',
        '.archive-shell',
        '.preserve-card'
      ];

      const items = document.querySelectorAll(revealTargets.join(','));
      items.forEach((el, index) => {
        el.classList.add('reveal');

        // Current officer portraits should feel orderly, not chaotic:
        // same upward fade direction, with a gentle row-by-row stagger.
        if(el.classList.contains('home-officer-card')){
          el.style.transitionDelay = Math.min((index % 5) * 55, 220) + 'ms';
        } else {
          el.style.transitionDelay = Math.min((index % 4) * 60, 240) + 'ms';
        }
      });

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

      items.forEach(el => observer.observe(el));
    });
