(() => {
  'use strict';

  const DATA_URL = 'data/core-reviews.json?v=1.1';
  const VALID_STATUSES = new Set(['complete', 'in_review', 'overdue', 'not_reviewed']);

  const statusMeta = {
    complete: { label: 'Review Complete', mark: '✓', css: 'core-status-complete' },
    in_review: { label: 'In Review', mark: '•', css: 'core-status-in-review' },
    overdue: { label: 'Review Overdue', mark: '•', css: 'core-status-overdue' },
    not_reviewed: { label: 'Not Reviewed', mark: '○', css: 'core-status-not-reviewed' }
  };

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const formatDate = value => {
    if (!value || value === 'To be established') return value || 'Not recorded';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  };

  const getSectionNumber = screen => {
    const raw = screen.querySelector('.section-heading .num')?.textContent || '';
    const match = raw.match(/(?:section\s*)?(\d+(?:\.\d+)+)/i);
    return match?.[1] || null;
  };

  function openCoreReview(record, sectionNumber) {
    const sheet = document.querySelector('#sheet');
    const title = document.querySelector('#sheet-title');
    const body = document.querySelector('#sheet-body');
    if (!sheet || !title || !body) return;

    const status = VALID_STATUSES.has(record.status) ? record.status : 'not_reviewed';
    const meta = statusMeta[status];
    const authorities = Array.isArray(record.authorities) && record.authorities.length
      ? `<ul class="core-review-authorities">${record.authorities.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : 'None recorded';

    title.textContent = 'CORE Review Details';
    body.innerHTML = `
      <article class="core-review-detail">
        <div class="core-review-summary ${meta.css}">
          <strong><span class="core-status-mark">${meta.mark}</span>${escapeHtml(meta.label)}</strong>
        </div>
        <dl class="core-review-grid">
          <div class="core-review-row"><dt>Section</dt><dd>${escapeHtml(sectionNumber)}</dd></div>
          <div class="core-review-row"><dt>Last Reviewed</dt><dd>${escapeHtml(formatDate(record.reviewDate))}</dd></div>
          <div class="core-review-row"><dt>Reviewed By</dt><dd>${escapeHtml(record.reviewedBy || 'Not recorded')}</dd></div>
          <div class="core-review-row"><dt>Review Record</dt><dd>${escapeHtml(record.reviewId || 'Not assigned')}</dd></div>
          <div class="core-review-row"><dt>Supporting Authorities</dt><dd>${authorities}</dd></div>
          <div class="core-review-row"><dt>Notes</dt><dd>${escapeHtml(record.notes || 'No notes recorded.')}</dd></div>
          <div class="core-review-row"><dt>Next Review</dt><dd>${escapeHtml(formatDate(record.nextReview))}</dd></div>
        </dl>
        <p class="core-review-footer">Maintained by CORE — Compliance &amp; Operational Review Engine.</p>
      </article>`;
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
  }

  function installReviewMarker(screen, sectionNumber, record) {
    const pager = screen.querySelector('.local-pager');
    if (!pager || pager.querySelector('.core-review-trigger')) return;

    const status = VALID_STATUSES.has(record.status) ? record.status : 'not_reviewed';
    const meta = statusMeta[status];
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = `core-review-trigger ${meta.css}`;
    trigger.setAttribute('aria-label', `Open ${meta.label} details for Section ${sectionNumber}`);
    trigger.innerHTML = `
      <span class="core-id">${escapeHtml(record.reviewId || 'CORE REVIEW')}</span>
      <span class="core-state"><span class="core-status-mark">${meta.mark}</span>${escapeHtml(meta.label)}</span>`;
    trigger.addEventListener('click', () => openCoreReview(record, sectionNumber));

    const pagerLinks = [...pager.children];
    if (pagerLinks.length >= 2) pager.insertBefore(trigger, pagerLinks[1]);
    else pager.appendChild(trigger);
    pager.classList.add('has-core-review');
  }

  async function initialize() {
    let payload;
    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      payload = await response.json();
    } catch (error) {
      console.warn('CORE review data was not loaded. ORE continues without review markers.', error);
      return;
    }

    const reviews = payload?.reviews || {};
    document.querySelectorAll('.screen.section-reader').forEach(screen => {
      const sectionNumber = getSectionNumber(screen);
      const record = sectionNumber ? reviews[sectionNumber] : null;
      if (record) installReviewMarker(screen, sectionNumber, record);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(initialize, 0), { once: true });
  } else {
    window.setTimeout(initialize, 0);
  }
})();
