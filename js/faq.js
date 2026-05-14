(function(){
  const sections = document.querySelectorAll('.accordion-section');
  sections.forEach(section => {
    const button = section.querySelector('.section-toggle');
    const symbol = button.querySelector('b');
    button.addEventListener('click', () => {
      const isOpen = section.classList.toggle('is-open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      symbol.textContent = isOpen ? '−' : '+';
    });
  });

  document.querySelectorAll('.question-link').forEach(button => {
    button.addEventListener('click', () => {
      const panel = button.closest('.section-panel');
      panel.querySelectorAll('.question-link').forEach(b => b.classList.remove('active'));
      panel.querySelectorAll('.answer').forEach(a => a.classList.remove('active'));
      button.classList.add('active');
      const answer = panel.querySelector('#answer-' + button.dataset.answer);
      if(answer) answer.classList.add('active');
    });
  });
})();
