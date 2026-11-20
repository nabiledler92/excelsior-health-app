(function () {
  const t = key => I18N.t(key);
  const cap = value => value.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');

  const STATUS_CLASS = {
    awaiting: '',
    scheduled: 'info',
    sealed: 'warn',
    dispatched: '',
    picked_up: '',
    in_transit: '',
    lab_received: '',
    analysed: '',
    results_ready: 'ok',
    rejected_sla: 'danger',
    rejected_seal: 'danger'
  };

  const PARAMS = [
    ['volume', 'ml', 1.5],
    ['concentration', 'milPerMl', 15],
    ['count', 'milTotal', 39],
    ['totalMotility', 'percent', 40],
    ['progressiveMotility', 'percent', 32],
    ['morphology', 'percent', 4],
    ['velocity', 'umPerS', 25]
  ];

  const STEPS = ['awaiting', 'scheduled', 'dispatched', 'picked_up', 'in_transit', 'lab_received', 'analysed', 'results_ready'];

  const EMIRATES = [
    ['Dubai', 'دبي'], ['Abu Dhabi', 'أبوظبي'], ['Sharjah', 'الشارقة'],
    ['Ajman', 'عجمان'], ['Ras Al Khaimah', 'رأس الخيمة'],
    ['Fujairah', 'الفجيرة'], ['Umm Al Quwain', 'أم القيوين']
  ];

  let role = 'patient';
  let screen = 'welcome';
  let selectedId = null;
  let previewSampleId = null;
  let labSelection = null;
  let learnReturn = 'welcome';
  let videoKey = 'journey';
  let videoReturn = 'welcome';
  let bookingIntent = false;
  let deliveryDraft = null;
  let profileReturn = 'profile';
  let loginReturn = 'welcome';
  let videoForm = null;
  let expandedGuide = null;
  let guideGesture = null;
  let guideWheel = { time: 0, amount: 0, used: false };
  let guideSwipeClickUntil = 0;
  let quizIndex = 0;
  let quizAnswers = [];
  let learning = { guides: [] };
  let chat = { messages: [], lastTopic: null };
  let showLearning = true;
  let exploredStage = 0;

  const view = document.getElementById('view');
  const notice = document.getElementById('notice');
  const langToggle = document.getElementById('langToggle');

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function showNotice(text) {
    const target = role === 'patient' ? document.getElementById('patientFeedback') : notice;
    target.hidden = false;
    target.textContent = text;
  }

  function icon(name) {
    const paths = {
      chat: '<path d="M20 11a8 8 0 0 1-8 8H5l-3 3v-11a9 9 0 0 1 18 0Z"/><path d="M7 10h8M7 14h5"/>',
      lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
      home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
      box: '<path d="M4 8l8-4 8 4v9l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v9"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
      arrowLeft: '<path d="M15 5l-7 7 7 7"/>',
      pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
      play: '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>',
      book: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h8M8 11h6"/>',
      check: '<path d="M5 12l4 4L19 6"/>',
      qr: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h3v3h-3zM19 19h2v2h-2z"/>',
      logout: '<path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4M9 12h9"/>'
    };
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || '') + '</svg>';
  }

  function qrSvg(seed) {
    const n = 21;
    const cell = 6;
    let hash = 0;
    for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    const cells = [];
    const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        let on = false;
        if (inFinder(r, c)) {
          const rr = r < 7 ? r : r - (n - 7);
          const cc = c < 7 ? c : c - (n - 7);
          on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
        } else {
          hash = (hash * 1664525 + 1013904223) >>> 0;
          on = (hash >>> 16) % 2 === 0;
        }
        if (on) cells.push('<rect x="' + (c * cell) + '" y="' + (r * cell) + '" width="' + cell + '" height="' + cell + '"/>');
      }
    }
    return '<svg class="qr" viewBox="0 0 ' + (n * cell) + ' ' + (n * cell) + '" xmlns="http://www.w3.org/2000/svg" aria-label="' + esc(seed) + '"><rect width="100%" height="100%" fill="#fff"/>' + cells.join('') + '</svg>';
  }

  function fmtTime(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString(I18N.current === 'ar' ? 'ar-AE' : 'en-AE', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' });
  }

  function fmtDate(iso) {
    return new Intl.DateTimeFormat(I18N.current === 'ar' ? 'ar-AE' : 'en-AE', {
      dateStyle: 'medium', timeZone: 'Asia/Dubai'
    }).format(new Date(iso));
  }

  function statusChip(sample) {
    return '<span class="chip ' + (STATUS_CLASS[sample.status] || '') + '">' + t('status' + cap(sample.status)) + '</span>';
  }

  function field(id, label, type, value, placeholder) {
    const attrs = type === 'number' ? ' min="0" max="30"' : '';
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<input id="' + id + '" type="' + type + '" value="' + esc(value || '') + '" placeholder="' + esc(placeholder || '') + '"' + attrs + '></div>';
  }

  function selectField(id, label, options, value) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' +
      options.map(([optionValue, optionLabel]) =>
        '<option value="' + esc(optionValue) + '"' + (optionValue === value ? ' selected' : '') + '>' + esc(optionLabel) + '</option>'
      ).join('') + '</select></div>';
  }

  function textArea(id, label, value, placeholder) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<textarea id="' + id + '" rows="3" placeholder="' + esc(placeholder || '') + '">' + esc(value || '') + '</textarea></div>';
  }

  function emirateOptions() {
    return EMIRATES.map(entry => [entry[0], I18N.current === 'ar' ? entry[1] : entry[0]]);
  }

  function formatAddress(profile) {
    if (!profile) return '';
    return [profile.addressLine1, profile.addressLine2, profile.city, profile.emirate, profile.postcode, profile.country]
      .filter(Boolean).join(', ');
  }

  function reachedStep(sample) {
    const index = STEPS.indexOf(sample.status);
    if (index !== -1) return index;
    if (sample.publishedAt || sample.status === 'results_ready') return 7;
    if (sample.labReceivedAt || sample.status === 'lab_received') return 5;
    if (sample.pickedUpAt || sample.status === 'picked_up') return 3;
    if (sample.collectedAt || sample.dispatchedAt || sample.status === 'dispatched') return 2;
    if (sample.delivery || sample.status === 'scheduled') return 1;
    return 0;
  }

  function timeline(sample) {
    const reached = sample.status === 'analysed' && role === 'patient' ? STEPS.indexOf('lab_received') : reachedStep(sample);
    const rejected = sample.status.indexOf('rejected') === 0;
    let html = '<ol class="timeline">';
    STEPS.forEach((step, index) => {
      let cls = '';
      if (role === 'patient' && ['awaiting', 'analysed'].includes(step)) return;
      if (index < reached) cls = 'done';
      else if (index === reached) cls = rejected ? 'done' : (index === STEPS.length - 1 ? 'done' : 'current');
      html += '<li class="' + cls + '"' + (cls === 'current' ? ' aria-current="step"' : '') +
        '>' + t('status' + cap(step)) + (() => {
          const at = ({ awaiting: sample.createdAt, scheduled: sample.delivery?.scheduledAt, dispatched: sample.dispatchedAt, picked_up: sample.pickedUpAt, lab_received: sample.labReceivedAt, results_ready: sample.publishedAt })[step];
          return at ? '<small class="handoff-time">' + fmtDate(at) + ' · ' + fmtTime(at) + '</small>' : '';
        })() + '</li>';
    });
    if (rejected) html += '<li class="bad">' + t('status' + cap(sample.status)) + '</li>';
    return html + '</ol>';
  }

  function slaBox(sample) {
    const info = Store.sla(sample);
    if (!info) return '';
    if (sample.labReceivedAt || ['lab_received', 'analysed', 'results_ready', 'rejected_sla', 'rejected_seal'].includes(sample.status)) return '';
    const cls = info.breached ? 'bad' : info.remaining < 15 * 60 * 1000 ? 'warn' : '';
    const text = info.breached ? t('breachedLabel') : t('countdownLabel') + ': ' + Store.fmtDuration(info.remaining);
    return '<div class="sla ' + cls + '" data-countdown="' + esc(sample.id) + '">' + icon('clock') + '<span>' + text + '</span></div>';
  }

  function labLateness(sample) {
    if (!sample.labReceivedAt || !sample.collectedAt) return 0;
    return Date.parse(sample.labReceivedAt) - Date.parse(sample.collectedAt);
  }

  function patientSamples(user) {
    if (!user) return [];
    return Store.data.samples.filter(sample => sample.patientId === user.id);
  }



  function gateScreen() {
    const user = Store.currentUser();
    if (!user) return ['welcome', 'overview', 'video', 'signup', 'login', 'learn', 'chat', 'care', 'quiz', 'quizResult'].indexOf(screen) !== -1 ? screen : 'welcome';
    if (!user.consent) return 'consent';
    if (!Store.profileComplete(user)) return 'profile';
    return ['home', 'overview', 'video', 'review', 'consultation', 'consultationDone', 'results', 'orders', 'prepare', 'learn', 'chat', 'care', 'quiz', 'quizResult', 'profile', 'order', 'delivery', 'sample', 'report'].indexOf(screen) !== -1 ? screen : 'home';
  }

  function go(next, id) {
    if (next !== 'quiz' && next !== 'quizResult') clearQuiz();
    if (screen === 'video' && next !== videoReturn) videoForm = null;
    const changed = screen !== next;
    screen = next;
    if (id) selectedId = id;
    render();
    if (changed) view.querySelector('.app-body')?.scrollTo(0, 0);
  }

  function screenMeta(current, user) {
    const map = {
      welcome: { title: '', sub: '', welcome: true },
      overview: { title: t('overviewTitle'), sub: t('overviewSub'), back: true },
      video: { title: t('video' + cap(videoKey) + 'Title'), sub: t('videoIntro'), back: true },
      review: { title: t('reviewBooking'), sub: t('reviewBookingSub'), back: true },
      consultation: { title: t('consultTitle'), sub: t('consultDemo'), back: true },
      consultationDone: { title: t('consultDone'), sub: t('consultDemo'), back: true },
      results: { title: t('navResults'), sub: t('reportListIntro') },
      prepare: { title: t('prepareTitle'), sub: '', back: true },
      signup: { title: t('signupTitle'), sub: t('signupSub'), back: true },
      login: { title: t('loginTitle'), sub: t('loginSub'), back: true },
      consent: { title: t('consentTitle'), sub: t('consentSub') },
      profile: {
        title: t('profileTitle'),
        sub: user && Store.profileComplete(user) ? t('profileEditSub') : t('profileSetupSub'),
        back: !!(user && Store.profileComplete(user))
      },
      home: {
        title: t('patientHome'),
        sub: t('homeSub')
      },
      orders: { title: t('navSamples'), sub: t('ordersSub') },
      learn: { title: t('learnTitle'), sub: user ? t('learnSub') : t('learnGuestSub'), back: true },
      chat: { title: t('chatTitle'), sub: t('chatSub'), back: true },
      care: { title: t('careTitle'), sub: t('careSub'), back: true },
      quiz: { title: t('checkTitle'), sub: t('checkSub'), back: true },
      quizResult: { title: t('checkTitle'), sub: '', back: true },
      order: { title: t('orderTitle'), sub: t('orderIntro'), back: true },
      delivery: { title: t('deliveryTitle'), sub: t('deliverySub'), back: true },
      sample: { title: t('trackSample'), sub: t('trackSampleSub'), back: true },
      report: { title: t('reportTitle'), sub: t('reportIntro'), back: true }
    };
    return map[current] || map.home;
  }

  function appHeader(meta) {
    return '<header class="app-header' + (meta.welcome ? ' welcome-header' : '') + '">' +
      '<div class="app-header-row">' +
        '<div class="app-brand"><div class="app-brand-text"><strong class="wordmark">' + t('brand') + '</strong><small class="brand-tagline">' + t('appTagline') + '</small></div></div>' +
        '<div class="app-header-tools"><button class="icon-btn" type="button" data-action="lang" aria-label="' + t('language') + '">' +
        (I18N.current === 'en' ? 'ع' : 'EN') + '</button>' +
        '<button class="header-session" type="button" data-action="exit-session" aria-label="' + t('privacySession') + '">' + icon('logout') + '</button>' + '</div>' +
      '</div>' +
      (meta.title || meta.back ? '<div class="app-heading">' +
        (meta.back ? '<button class="back-btn" type="button" data-action="back" aria-label="' + t('back') + '">' + icon('arrowLeft') + '</button>' : '') +
        (meta.title ? '<div><h1 tabindex="-1">' + esc(meta.title) + '</h1></div>' : '') +
      '</div>' : '') +
      (meta.sub ? '<p class="screen-sub">' + esc(meta.sub) + '</p>' : '') +
      '</header>';
  }

  function appNav(current, guest) {
    const active = current === 'care' ? 'learn' : current === 'report' ? 'results'
      : ['orders', 'sample', 'order', 'delivery', 'review', 'prepare', 'overview'].includes(current) ? 'home' : current;
    const items = guest
      ? [['welcome', 'navHome', 'home'], ['learn', 'navLearn', 'play'], ['chat', 'chatTitle', 'chat']]
      : [['home', 'navHome', 'home'], ['learn', 'navLearn', 'play'], ['chat', 'chatTitle', 'chat'], ['results', 'navResults', 'book'], ['profile', 'navProfile', 'user']];
    return '<nav class="app-nav">' + items.map(([key, label, glyph]) =>
      '<button type="button" class="nav-item ' + (active === key ? 'active' : '') + '" data-action="goto-' + key + '"' +
      (active === key ? ' aria-current="page"' : '') + '>' +
      icon(glyph) + '<span>' + t(label) + '</span></button>'
    ).join('') + '</nav>';
  }

  function patientButton(action, label, id, style = 'primary') {
    return '<button class="btn ' + style + ' block" type="button" data-action="' + action + '"' +
      (id ? ' data-id="' + esc(id) + '"' : '') + '>' + t(label) + '</button>';
  }

  function privacyDetails() {
    return '<details class="privacy-panel"><summary>' + t('privacyTitle') + '</summary>' +
      '<p>' + t('privacyCourier') + '</p><p>' + t('privacyLab') + '</p><p>' + t('privacyReport') +
      '</p><p class="hint">' + t('demoPrivacy') + '</p></details>';
  }

  function videoCard(key, featured = false) {
    const asset = SIRR_VIDEOS[key][I18N.current];
    return '<button class="video-card' + (featured ? ' featured' : '') + '" type="button" data-action="open-video" data-video="' + key + '">' +
      '<span class="video-art">' + icon(asset.src ? 'play' : 'book') + '<span>' + (asset.seconds ? new Intl.NumberFormat(I18N.current).format(Math.ceil(asset.seconds)) + ' ' + t('videoSeconds') : t('videoDuration')) + '</span></span>' +
      '<span class="video-copy"><small>' + t(asset.src ? 'videoWatch' : 'videoRead') + '</small><strong>' + t('video' + cap(key) + 'Title') +
      '</strong><span>' + t('video' + cap(key) + 'Sub') + '</span></span><span aria-hidden="true">›</span></button>';
  }

  function returnFromVideo() {
    go(videoReturn);
    (videoForm || []).forEach(saved => {
      const input = document.getElementById(saved.id);
      if (input) { input.value = saved.value; if (input.type === 'checkbox') input.checked = saved.checked; }
    });
    videoForm = null;
  }

  function videoScreen() {
    const asset = SIRR_VIDEOS[videoKey][I18N.current];
    const media = asset.src
      ? '<button class="guide-preview" type="button" data-action="play-guide" aria-label="' + esc(t('videoPlayDesktop')) + '">' +
        (asset.poster ? '<img src="' + esc(asset.poster) + '" alt="">' : '') +
        '<span>' + icon('play') + '<strong><span class="video-label-mobile">' + t('videoPlay') + '</span><span class="video-label-desktop">' + t('videoPlayDesktop') + '</span></strong></span></button>' +
        '<dialog class="guide-lightbox" aria-label="' + esc(t('video' + cap(videoKey) + 'Title')) + '">' +
        '<button class="guide-close" type="button" data-action="close-guide" aria-label="' + esc(t('videoClose')) + '">×</button>' +
        (videoReturn === 'learn' ? '<div class="guide-feed-heading"><strong data-feed-title aria-live="polite"></strong><small><span data-feed-count dir="ltr"></span> · ' + t('videoSwipe') + '</small></div>' +
          '<nav class="guide-feed-nav" aria-label="' + esc(t('videoNavigation')) + '"><button type="button" data-action="previous-guide" aria-label="' + esc(t('videoPrevious')) + '">↑</button><button type="button" data-action="next-guide" aria-label="' + esc(t('videoNext')) + '">↓</button></nav>' : '') +
        '<video class="guide-video" controls playsinline preload="metadata"' + (asset.poster ? ' poster="' + esc(asset.poster) + '"' : '') + ' aria-label="' + esc(t('video' + cap(videoKey) + 'Title')) + '"><source src="' + esc(asset.src) + '" type="video/mp4">' +
        (asset.captions ? '<track kind="captions" src="' + esc(asset.captions) + '" srclang="' + I18N.current + '" label="' + (I18N.current === 'ar' ? 'العربية' : 'English') + '" default>' : '') + '</video></dialog>'
      : '<div class="video-placeholder">' + icon('book') + '<strong>' + t('videoSoon') + '</strong><p>' + t('videoFallback') + '</p></div>';
    return '<div class="screen">' + (asset.src ? '<p class="hint">' + t('videoDraft') + '</p>' : '') + media + '<article class="form-card transcript"><span class="learn-meta">' + t('transcript') + '</span><h2>' +
      t('video' + cap(videoKey) + 'Title') + '</h2><p>' + t('video' + cap(videoKey) + 'Script') + '</p></article>' +
      '<button class="btn primary block" type="button" data-action="mark-guide"' + (learning.guides.includes(videoKey) ? ' disabled' : '') + '>' + t(learning.guides.includes(videoKey) ? 'alreadyRead' : 'markRead') + '</button>' + patientButton('video-back', 'backToJourney') + '</div>';
  }

  function playGuide() {
    const dialog = view.querySelector('.guide-lightbox');
    if (!dialog || expandedGuide) return;
    const video = dialog.querySelector('video');
    expandedGuide = { dialog, video, trigger: document.activeElement, nativeEntered: false, startKey: videoKey };
    guideWheel = { time: 0, amount: 0, used: false };
    updateGuideFeed();
    dialog.showModal();
    document.body.classList.add('guide-playing');
    dialog.querySelector('.guide-close').focus();
    // CSS keeps desktop playback contained and fills the viewport on mobile.
    // Native fullscreen remains an explicit choice in the video controls.
    video.play().catch(() => { /* Keep native controls available to retry. */ });
  }

  function guideSequence() {
    return Object.keys(SIRR_VIDEOS).filter(key => SIRR_VIDEOS[key][I18N.current]?.src);
  }

  function updateGuideFeed() {
    if (!expandedGuide || videoReturn !== 'learn') return;
    const { dialog } = expandedGuide;
    const sequence = guideSequence();
    const index = sequence.indexOf(videoKey);
    dialog.dataset.feed = '';
    dialog.querySelector('[data-feed-title]').textContent = t('video' + cap(videoKey) + 'Title');
    dialog.querySelector('[data-feed-count]').textContent = new Intl.NumberFormat(I18N.current).format(index + 1) + ' / ' + new Intl.NumberFormat(I18N.current).format(sequence.length);
    dialog.querySelector('[data-action="previous-guide"]').disabled = index <= 0;
    dialog.querySelector('[data-action="next-guide"]').disabled = index >= sequence.length - 1;
    if (document.activeElement?.disabled) dialog.querySelector('.guide-close').focus();
  }

  function changeGuide(step) {
    if (!expandedGuide || videoReturn !== 'learn') return;
    const sequence = guideSequence();
    const next = sequence[sequence.indexOf(videoKey) + step];
    if (!next) return;
    const { dialog, video } = expandedGuide;
    video.pause();
    videoKey = next;
    const asset = SIRR_VIDEOS[next][I18N.current];
    const title = t('video' + cap(next) + 'Title');
    dialog.setAttribute('aria-label', title);
    video.setAttribute('aria-label', title);
    video.poster = asset.poster || '';
    video.innerHTML = '<source src="' + esc(asset.src) + '" type="video/mp4">' +
      (asset.captions ? '<track kind="captions" src="' + esc(asset.captions) + '" srclang="' + I18N.current + '" label="' + (I18N.current === 'ar' ? 'العربية' : 'English') + '" default>' : '');
    video.load();
    updateGuideFeed();
    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      video.animate?.([{ transform: 'translateY(' + (step > 0 ? '6%' : '-6%') + ')', opacity: .7 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 180, easing: 'ease-out' });
    }
    video.play().catch(() => { /* Native controls remain available to retry. */ });
  }

  function closeGuide(restoreFocus = true) {
    if (!expandedGuide) return;
    const { dialog, video, trigger, startKey } = expandedGuide;
    expandedGuide = null;
    guideGesture = null;
    video.pause();
    if (document.fullscreenElement === video) document.exitFullscreen().catch(() => {});
    else if (video.webkitDisplayingFullscreen && video.webkitExitFullscreen) video.webkitExitFullscreen();
    dialog.close();
    document.body.classList.remove('guide-playing');
    if (restoreFocus && videoKey !== startKey) {
      render();
      view.querySelector('[data-action="play-guide"]')?.focus({ preventScroll: true });
    } else if (restoreFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
  }

  function journeySteps() {
    return '<ol class="service-steps">' + ['kit', 'collect', 'pickup', 'report'].map((key, i) =>
      '<li><span>' + (i + 1) + '</span><div><strong>' + t('step' + cap(key)) + '</strong><p>' + t('step' + cap(key) + 'Body') + '</p></div></li>').join('') + '</ol>';
  }

  function bookingProgress(step) {
    return '<ol class="booking-progress" aria-label="' + t('bookingProgress') + '">' + ['testStep', 'pickupStep', 'reviewStep'].map((key, i) =>
      '<li' + (i === step ? ' aria-current="step"' : '') + '><span>' + (i + 1) + '</span>' + t(key) + '</li>').join('') + '</ol>';
  }

  function overviewScreen() {
    return '<div class="screen">' + videoCard('journey', true) + '<section class="form-card">' + journeySteps() +
      '<p class="hint">' + t('serviceScope') + '</p></section>' + privacyDetails() +
      patientButton('start-booking', 'continueBooking') + '<p class="hint">' + t('noPayment') + '</p></div>';
  }

  function pathArt() {
    return '<svg class="path-art" viewBox="0 0 360 110" fill="none" aria-hidden="true"><path d="M30 75C80 75 65 30 125 30S175 80 230 80s45-45 100-45" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M30 75C80 75 65 30 125 30S175 80 230 80s45-45 100-45" stroke="#8eb9d8" stroke-width="2" stroke-dasharray="4 7"/><circle cx="34" cy="75" r="16" fill="#0b5fa5"/><path d="m27 75 5 5 9-10" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="125" cy="30" r="19" fill="#fff" stroke="#0b5fa5" stroke-width="2"/><circle cx="125" cy="30" r="7" fill="#0b5fa5"/><circle cx="230" cy="80" r="14" fill="#fff" stroke="#bfd6e8" stroke-width="2"/><path d="m325 24 3.7 7.5 8.3 1.2-6 5.9 1.4 8.3-7.4-3.9-7.4 3.9 1.4-8.3-6-5.9 8.3-1.2z" fill="#eab86a"/></svg>';
  }

  function learningCard() {
    if (!showLearning) return '';
    return '<section class="learning-card"><div class="learning-head"><span class="learning-symbol" aria-hidden="true">✦</span><div><strong>' + t('learningTitle') + '</strong><small>' + t(learning.guides.length ? 'learningDone' : 'learningStart') + '</small></div><button class="dismiss-learning" type="button" data-action="hide-learning" aria-label="' + t('hideLearning') + '">×</button></div><div class="learning-track" aria-label="' + learning.guides.length + ' / 4 ' + t('learningUnit') + '">' + Object.keys(SIRR_VIDEOS).map(key => '<span class="' + (learning.guides.includes(key) ? 'complete' : '') + '">' + (learning.guides.includes(key) ? icon('check') : '<span></span>') + '</span>').join('') + '</div><div class="learning-footer"><span>' + learning.guides.length + '/4 ' + t('learningUnit') + '</span><button class="link" type="button" data-action="goto-learn">' + t('navLearn') + '</button></div></section>';
  }

  function companionPanel() {
    return '<aside class="companion-panel"><div class="companion-logo">' + icon('shield') + '<strong>Sirr.</strong></div><p class="eyebrow">' + t('companionEyebrow') + '</p><h2>' + t('companionTitle').replace('\n', '<br>') + '</h2><p class="companion-intro">' + t('companionBody') + '</p><div class="companion-steps">' + ['One', 'Two', 'Three'].map((key, i) => '<div><span>' + icon(['book', 'check', 'shield'][i]) + '</span><div><strong>' + t('companion' + key) + '</strong><p>' + t('companion' + key + 'Body') + '</p></div></div>').join('') + '</div><div class="companion-footer">' + icon('lock') + '<span>' + t('prototypeLabel') + '</span></div></aside>';
  }

  function chatScreen() {
    const last = [...chat.messages].reverse().find(message => message.role === 'assistant');
    const suggestions = last?.followUps?.length ? last.followUps : chat.messages.length ? [] : ['starterTest', 'starterHome', 'starterPrivacy'];
    return '<div class="screen chat-screen"><div class="chat-concept"><span class="chat-spark" aria-hidden="true">✦</span><span>' + t('chatMode') + '</span>' + (chat.messages.length ? '<button type="button" data-action="chat-clear" aria-label="' + t('chatClear') + '" title="' + t('chatClear') + '">×</button>' : '') + '</div><p class="chat-privacy">' + icon('lock') + '<span>' + t('chatPrivacy') + '</span></p><div class="chat-scroll">' +
      (!chat.messages.length ? '<section class="chat-welcome"><span class="chat-emblem">✦</span><h2>' + t('chatWelcome') + '</h2><p>' + t('chatIntro') + '</p></section>' : '') +
      '<div class="chat-messages" role="log" aria-label="' + t('chatLabel') + '" aria-live="polite" aria-relevant="additions">' + chat.messages.map(message => '<article class="chat-message ' + message.role + (message.urgent ? ' urgent' : '') + '"><span class="chat-author">' + t(message.role === 'user' ? 'chatYou' : 'chatAssistant') + '</span><p dir="auto">' + esc(message.text) + '</p>' + (message.sources?.length ? '<div class="chat-sources"><span>' + t('chatSource') + '</span>' + message.sources.map(source => source.url ? '<a href="' + esc(source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(source.title) + '</a>' : '<span>' + esc(source.title) + '</span>').join('') + '</div>' : '') + '</article>').join('') + '</div>' +
      (suggestions.length ? '<div class="chat-suggestions">' + (chat.messages.length ? '<small>' + t('chatFollowup') + '</small>' : '') + suggestions.map(key => '<button type="button" data-action="chat-suggest" data-prompt="' + esc(key) + '">' + t(key) + '</button>').join('') + '</div>' : '') +
      '</div><div class="chat-compose"><label class="sr-only" for="chat-input">' + t('chatInput') + '</label><textarea id="chat-input" rows="2" maxlength="500" placeholder="' + t('chatPlaceholder') + '"></textarea><button type="button" data-action="chat-send" aria-label="' + t('chatSend') + '">' + icon('play') + '</button></div><p class="chat-boundary">' + t('chatBoundary') + '</p>' +
      '</div>';
  }

  function sendChat(text, keepFocus = false) {
    const question = String(text || '').trim();
    if (!question) return;
    if (question.length > 500) return showNotice(t('chatLong'));
    if (chat.messages.length >= 40) return showNotice(t('chatLimit'));
    const answer = SirrChat.reply(question, I18N.current, chat.lastTopic);
    chat.messages.push({role: 'user', text: question}, {role: 'assistant', ...answer});
    chat.lastTopic = answer.topic;
    render();
    // Reveal the new answer; keep the composer in normal flow on small screens.
    const scroll = view.querySelector('.chat-scroll');
    if (scroll) scroll.scrollTop = scroll.querySelector('.chat-message:last-child')?.offsetTop || 0;
    if (keepFocus) view.querySelector('#chat-input')?.focus({preventScroll:true});
  }

  function careScreen() {
    return '<div class="screen"><section class="journey-card"><span class="journey-icon">' + icon('user') + '</span><h2>' + t('careHeading') + '</h2><p>' + t('careBody') + '</p>' + patientButton('goto-chat', 'openJournal') + '</section><p class="demo-disclosure">' + t('careDemo') + '</p>' + videoCard('journey') + '</div>';
  }

  function welcomeScreen() {
    return '<div class="screen"><section class="welcome-card"><span class="eyebrow">' + t('welcomeEyebrow') + '</span><h2>' + t('welcomeHeadline').replace('\n', '<br>') + '</h2><p>' + t('welcomeBody') + '</p>' + pathArt() + patientButton('goto-quiz', 'startPrivate') + '<small class="quick-time">' + icon('lock') + t('quickTime') + '</small></section><div class="welcome-choices"><button type="button" data-action="goto-learn">' + icon('book') + '<span><strong>' + t('welcomeLearn') + '</strong><small>' + t('videoOptional') + '</small></span></button><button type="button" data-action="goto-overview">' + icon('box') + '<span><strong>' + t('bookHome') + '</strong><small>' + t('journeyMini') + '</small></span></button></div><p class="prototype-note">' + t('prototypeLabel') + '</p>' + privacyDetails() + '</div>';
  }

  function signupScreen() {
    return loginScreen();
  }

  function loginScreen() {
    return '<div class="screen"><section class="journey-card"><span class="journey-icon">' + icon('shield') + '</span><h2>' + t('demoAccess') + '</h2><p>' + t('demoAccessBody') + '</p>' + patientButton('demo-login', 'demoStart') + '<p class="hint">' + t('demoBooking') + '</p></section>' + privacyDetails() + '</div>';
  }

  function consentScreen() {
    const items = [
      ['consentCollection', 'collection'],
      ['consentCourier', 'courier'],
      ['consentLab', 'lab'],
      ['consentData', 'data']
    ];
    return '<div class="screen">' +
      '<div class="form-card">' +
      items.map(([label, key]) =>
        '<label class="consent-item">' + icon('shield') + '<span>' + t(label) + '</span>' +
        '<input type="checkbox" data-consent="' + key + '"></label>'
      ).join('') +
      '<button class="btn primary block" type="button" data-action="consent">' + t('consentAgree') + '</button>' +
      '<p class="hint">' + t('consentNote') + '</p>' + privacyDetails() +
      '<button class="link quiet" type="button" data-action="logout">' + t('logout') + '</button>' +
      '</div></div>';
  }

  function profileScreen(user, setup) {
    const profile = user.profile || {};
    return '<div class="screen">' +
      '<div class="form-card">' +
        field('pf-name', t('fullNameLabel'), 'text', profile.fullName || user.name, '') +
        field('pf-phone', t('phoneLabel'), 'tel', profile.phone || user.phone, '') +
        field('pf-email', t('emailLabel'), 'email', profile.email || user.email, '') +
        '<div class="divider"></div>' +
        textArea('pf-a1', t('addressLine1'), profile.addressLine1, '') +
        field('pf-city', t('cityLabel'), 'text', profile.city, '') +
        selectField('pf-emirate', t('emirateLabel'), emirateOptions(), profile.emirate || 'Dubai') +
        '<details class="privacy-panel"><summary>' + t('optionalDetails') + '</summary>' +
        field('pf-a2', t('addressLine2'), 'text', profile.addressLine2, '') +
        field('pf-postcode', t('postcodeLabel'), 'text', profile.postcode, '') +
        field('pf-country', t('countryLabel'), 'text', profile.country || 'United Arab Emirates', '') +
        field('pf-notes', t('deliveryNotesLabel'), 'text', profile.deliveryNotes, '') +
        '</details><button class="btn primary block" type="button" data-action="save-profile">' + t(setup ? 'saveProfile' : 'saveChanges') + '</button>' +
        '<p class="hint">' + t('profileNote') + '</p>' +
        '<div class="profile-links">' +
        '<button class="link quiet" type="button" data-action="logout">' + t('logout') + '</button>' +
        '<button class="link quiet" type="button" data-action="reset">' + t('resetBtn') + '</button>' +
        '</div>' +
      '</div>' + privacyDetails() + '</div>';
  }

  function patientHistory(user) {
    return patientSamples(user).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  function homeTracker(sample) {
    const rejected = sample.status.startsWith('rejected');
    let current = ({ awaiting: 0, scheduled: 1, dispatched: 2, picked_up: 2, in_transit: 2, lab_received: 3, analysed: 3, results_ready: 4 })[sample.status];
    if (rejected) current = sample.labReceivedAt ? 3 : sample.collectedAt ? 2 : 1;
    if (current == null) current = 0;
    return '<div class="home-progress"><span class="sub-label">' + t('homeJourney') + '</span><ol aria-label="' + t('homeJourney') + '">' +
      ['journeyBook', 'journeyPrepare', 'journeyPickup', 'journeyLab', 'journeyReport'].map((key, index) => {
        const done = index < current || sample.status === 'results_ready';
        const active = index === current;
        return '<li class="' + (done ? 'done ' : '') + (active ? 'current ' : '') + (active && rejected ? 'stopped' : '') + '"' + (active ? ' aria-current="step"' : '') + '>' +
          '<span class="progress-dot" aria-hidden="true">' + (active && rejected ? '!' : done ? icon('check') : index + 1) + '</span>' +
          '<span>' + t(key) + '</span><span class="sr-only"> · ' + t(active && rejected ? 'journeyStopped' : done ? 'journeyDone' : active ? 'journeyCurrent' : rejected ? 'journeyNotReached' : 'journeyNext') + '</span></li>';
      }).join('') + '</ol>' + (rejected ? '<p class="progress-recovery">' + t('journeyRecovery') + '</p>' : '') + '</div>';
  }

  function homeScreen() {
    const history = patientHistory(Store.currentUser());
    const sample = history.find(item => item.id === previewSampleId) || history.find(item => ['awaiting', 'scheduled'].includes(item.status)) ||
      history.find(item => !['rejected_sla', 'rejected_seal', 'results_ready'].includes(item.status)) || history[0];
    const actions = {
      awaiting: ['goto-delivery', 'choosePickup', 'awaitingNext'],
      scheduled: ['goto-prepare', 'prepareTitle', 'scheduledNext'],
      lab_received: ['open-sample', 'trackSample', 'reviewNext'],
      analysed: ['open-sample', 'reviewPending', 'reviewPendingBody'],
      results_ready: ['open-report', 'openReport', 'resultsNext'],
      rejected_sla: ['open-sample', 'seeWhatHappened', 'lateNext'],
      rejected_seal: ['open-sample', 'seeWhatHappened', 'sealNext']
    };
    const [action, label, detail] = sample
      ? actions[sample.status] || ['open-sample', 'trackSample', 'trackingNext']
      : ['goto-overview', 'bookHome', 'bookingNext'];
    return '<div class="screen"><div class="home-welcome"><span class="eyebrow">' + t('nextAction') + '</span><h2>' + t('greeting') + '</h2></div><section class="journey-card">' +
      (sample ? '' : '<span class="journey-icon">' + icon('box') + '</span>') +
      '<h2>' + (sample ? t('status' + cap(sample.status)) : t('bookingTitle')) + '</h2><p>' + t(detail) + '</p>' +
      (sample ? homeTracker(sample) : '') + patientButton(action, label, sample && sample.id) + (sample ? patientStatus(sample) : '') +
      '</section>' + learningCard() + '<div class="patient-links">' +
      '<button class="action-tile" type="button" data-action="goto-learn"><span class="tile-icon">' +
      icon('book') + '</span><strong>' + t('navLearn') + '</strong><span class="tile-arrow">›</span></button>' +
      '<button class="action-tile" type="button" data-action="goto-orders"><span class="tile-icon">' +
      icon('box') + '</span><strong>' + t('navSamples') + '</strong><span class="tile-arrow">›</span></button>' +
      '<button class="action-tile" type="button" data-action="goto-chat"><span class="tile-icon">' + icon('chat') + '</span><strong>' + t('chatTitle') + '</strong></button></div>' + (sample ? patientButton('goto-overview', 'bookHome', null, 'soft') : '') + privacyDetails() + '</div>';
  }

  function resultsScreen(user) {
    const reports = patientHistory(user).filter(sample => sample.status === 'results_ready');
    return '<div class="screen">' + (reports.length ? reports.map(sample =>
      '<button class="action-tile" type="button" data-action="open-report" data-id="' + esc(sample.id) + '">' +
      '<span class="tile-icon">' + icon('book') + '</span><span><strong>' + t('reportTitle') +
      '</strong><small>' + fmtDate(sample.publishedAt || sample.createdAt) + '</small></span>' +
      '<span class="tile-arrow" aria-hidden="true">›</span></button>').join('')
      : '<div class="empty-card"><strong>' + t('noReports') + '</strong><p>' + t('reportListIntro') + '</p></div>') +
      '</div>';
  }

  function ordersScreen() {
    let html = '<div class="screen">';
    const samples = patientHistory(Store.currentUser());
    if (!samples.length) html += '<div class="empty-card">' + icon('box') + '<strong>' + t('noSamples') + '</strong></div>';
    samples.forEach(sample => {
      html += '<button class="order-row" type="button" data-action="open-sample" data-id="' + esc(sample.id) + '">' +
        '<span class="order-row-icon">' + icon('box') + '</span>' +
        '<span class="order-row-main"><span class="mono">' + esc(sample.id) + '</span><small>' + fmtTime(sample.createdAt) + '</small></span>' +
        statusChip(sample) + '</button>';
    });
    return html + patientButton('goto-overview', 'bookHome') + '</div>';
  }

  function learnScreen(guest) {
    let html = '<div class="screen">' + SirrLearnVisual.render(exploredStage) + learningCard() + '<div class="section-intro"><h2>' + t('videoLibrary') + '</h2><p>' + t('videoOptional') + '</p></div>' +
      Object.keys(SIRR_VIDEOS).map(key => videoCard(key)).join('') +
      '<article class="quiz-entry">' +
        '<span class="quiz-entry-icon">' + icon('check') + '</span>' +
        '<div><span class="learn-meta">' + t('quizBadge') + '</span>' +
          '<h3>' + t('quizCardTitle') + '</h3>' +
          '<p>' + t('quizCardBody') + '</p>' +
          '<button class="btn primary" type="button" data-action="goto-quiz">' + t('quizCta') + '</button>' +
        '</div></article>';
    if (guest) {
      html += '<div class="trust-card learn-guest">' + icon('shield') +
        '<div><strong>' + t('learnGuestTitle') + '</strong><p>' + t('learnGuestBody') + '</p>' +
        '<div class="actions">' +
          '<button class="btn primary" type="button" data-action="goto-signup">' + t('demoStart') + '</button>' +
        '</div></div></div>';
    }
    html += '<section class="faq-section"><h3>' + t('quickAnswers') + '</h3>' + ['Privacy', 'Collection', 'Results'].map(key => '<details class="privacy-panel"><summary>' + t('faq' + key) + '</summary><p>' + t('faq' + key + 'Body') + '</p></details>').join('') + '</section>' + patientButton('goto-chat', 'openJournal', null, 'soft') + '<p class="hint">' + t('learningNote') + '</p></div>';
    return html;
  }

  function clearQuiz() {
    quizIndex = 0;
    quizAnswers = [];
  }

  function startQuiz() {
    clearQuiz();
    go('quiz');
  }

  function quizScreen() {
    const q = SirrJourney.questions[quizIndex];
    const last = quizIndex === SirrJourney.questions.length - 1;
    return '<div class="screen"><section class="quiz-card"><div class="quiz-progress"><span>' + t('quizStep') + ' ' + (quizIndex + 1) + ' / ' + SirrJourney.questions.length + '</span><span>' + icon(quizIndex === 0 ? 'shield' : 'lock') + '</span></div><div class="quiz-bar"><i style="width:' + (quizIndex / SirrJourney.questions.length * 100) + '%"></i></div><h2>' + t(q.title) + '</h2><p class="question-hint">' + t(q.hint) + '</p><div class="quiz-options">' + q.options.map(([label], i) => '<button class="quiz-option' + (quizAnswers[quizIndex] === i ? ' selected' : '') + '" type="button" data-action="quiz-answer" data-value="' + i + '" aria-pressed="' + (quizAnswers[quizIndex] === i) + '"><span class="option-circle">' + (quizAnswers[quizIndex] === i ? icon('check') : '') + '</span>' + t(label) + '</button>').join('') + '</div><button class="btn primary block" type="button" data-action="quiz-next"' + (quizAnswers[quizIndex] == null ? ' disabled' : '') + '>' + t(last ? 'checkFinish' : 'continueCheck') + '</button><button class="link quiet" type="button" data-action="quiz-back">' + t(quizIndex === 0 ? 'quizExit' : 'back') + '</button></section><div class="session-note">' + icon('lock') + '<p><strong>' + t('checkPrivate') + '</strong>' + t('checkPrivateBody') + '</p></div></div>';
  }

  function quizResultScreen() {
    const result = SirrJourney.route(quizAnswers);
    const key = cap(result.key);
    return '<div class="screen"><section class="quiz-card quiz-result' + (result.urgent ? ' urgent-result' : '') + '"><span class="result-emblem">' + icon(result.urgent ? 'shield' : 'check') + '</span><span class="eyebrow">' + t(result.urgent ? 'checkSafety' : 'nextAction') + '</span><h2>' + t('route' + key) + '</h2><p>' + t('route' + key + 'Body') + '</p><div class="route-reasons"><strong>' + t('reasonTitle') + '</strong><ul>' + result.reasons.map(reason => '<li>' + t(reason) + '</li>').join('') + '</ul><small>' + result.rule + ' · ' + t('ruleLabel') + '</small></div>' + (result.urgent ? '<p class="urgent-boundary">' + t('urgentBoundary') + '</p>' : patientButton(result.key === 'doctor' ? 'goto-care' : result.key === 'learn' ? 'goto-learn' : 'goto-overview', result.key === 'doctor' ? 'careTitle' : result.key === 'learn' ? 'welcomeLearn' : 'bookHome') + patientButton('goto-chat', 'openJournal', null, 'soft')) + '<button class="link" type="button" data-action="quiz-edit">' + t('editAnswers') + '</button></section><p class="hint">' + t('quizDisclaimer') + '</p></div>';
  }

  function orderScreen(user) {
    return '<div class="screen">' +
      bookingProgress(0) + '<div class="form-card"><h2>' + t('stepKit') + '</h2><p>' + t('kitDemo') + '</p>' +
        field('or-abstinence', t('abstinenceLabel'), 'number', '3', '') +
        '<div class="address-preview">' + icon('pin') + '<div><span>' + t('addressLabel') + '</span><strong>' + esc(formatAddress(user.profile)) + '</strong></div>' +
        '<button class="link" type="button" data-action="goto-profile">' + t('profileEditSub') + '</button></div>' +
        '<button class="btn primary block" type="button" data-action="order">' + t('orderBtn') + '</button>' +
        '<p class="hint">' + t('demoNote') + '</p>' +
      '</div></div>';
  }

  function deliveryScreen(sample, user) {
    const delivery = deliveryDraft && deliveryDraft.id === sample.id ? deliveryDraft : sample.delivery || {};
    const slots = [
      ['today', t('slotToday')],
      ['tomorrow-am', t('slotTomorrow')],
      ['tomorrow-pm', t('slotNext')]
    ];
    const selectedSlot = delivery.slot || 'today';
    return '<div class="screen">' +
      bookingProgress(1) + '<div class="form-card">' +
        textArea('dl-address', t('addressLabel'), delivery.address || formatAddress(user.profile), '') +
        '<div class="choice-group"><span class="choice-label">' + t('slotLabel') + '</span>' +
        slots.map(([value, label]) =>
          '<label class="choice"><input type="radio" name="slot" value="' + value + '"' + (value === selectedSlot ? ' checked' : '') + '><span>' + esc(label) + '</span></label>'
        ).join('') + '</div>' +


        field('dl-notes', t('deliveryNotes'), 'text', delivery.notes || '', '') +
        privacyDetails() + patientButton('review-delivery', 'reviewBooking', sample.id) +
      '</div></div>';
  }

  function reviewScreen(sample) {
    if (!deliveryDraft || deliveryDraft.id !== sample.id) return deliveryScreen(sample, Store.currentUser());
    return '<div class="screen">' + bookingProgress(2) + '<section class="form-card"><h2>' + t('reviewBooking') + '</h2>' +
      '<dl class="booking-summary"><dt>' + t('addressLabel') + '</dt><dd>' + esc(deliveryDraft.address) + '</dd><dt>' + t('slotLabel') + '</dt><dd>' +
      t({ today: 'slotToday', 'tomorrow-am': 'slotTomorrow', 'tomorrow-pm': 'slotNext' }[deliveryDraft.slot]) + '</dd>' +
      (deliveryDraft.notes ? '<dt>' + t('deliveryNotes') + '</dt><dd>' + esc(deliveryDraft.notes) + '</dd>' : '') + '</dl><p class="hint">' + t('kitDemo') + '</p>' +
      patientButton('arrange-delivery', 'confirmDelivery', sample.id) + patientButton('goto-delivery', 'changePickup', sample.id, 'soft') + '</section></div>';
  }

  function prepIllustration(kind) {
    const scenes = {
      window: '<rect x="25" y="20" width="84" height="64" rx="10" fill="white"/><path d="M25 38h84M45 13v15M88 13v15"/><path d="M40 51h12M66 51h12M40 65h12"/><circle cx="116" cy="66" r="23" fill="white"/><path d="M116 52v15l10 6"/>',
      guide: '<path d="M80 25C63 15 40 17 25 23v61c17-7 38-5 55 3 17-8 38-10 55-3V23c-15-6-38-8-55 2Z" fill="white"/><path d="M80 25v62M39 39h25M39 51h20M39 63h25M96 48l8 8 16-17"/>',
      seal: '<rect x="34" y="21" width="54" height="12" rx="4" fill="white"/><path d="M38 33l4 49h38l4-49" fill="white"/><rect x="44" y="46" width="34" height="23" rx="3" fill="#dceefc"/><path d="M50 51v13M56 51v13M65 51v13M71 51v13"/><circle cx="115" cy="57" r="22" fill="white"/><path d="M104 57l8 8 15-17"/>'
    };
    return '<svg viewBox="0 0 160 105" class="prep-illustration" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="150" height="95" rx="24" fill="#e8f3fa" stroke="none"/>' + scenes[kind] + '</svg>';
  }

  function prepareScreen(sample) {
    return '<div class="screen">' + videoCard('prepare') + '<section class="form-card"><p>' + t('kitDemo') + '</p><ol class="illustrated-prep">' +
      [['window', 'prepWindowTitle', 'prepWindow'], ['guide', 'prepGuideTitle', 'prepGuide'], ['seal', 'prepLabelTitle', 'prepLabel']].map(([kind, title, key], index) => '<li>' + prepIllustration(kind) + '<div><span class="learn-meta">' + t('prepStep') + ' ' + (index + 1) + '</span><h2>' + t(title) + '</h2><p>' + t(key) + '</p></div></li>').join('') +
      '</ol><p class="mono" dir="ltr">' + esc(sample.id) + '</p><label class="consent-item"><span>' + t('prepConfirm') +
      '</span><input id="prep-confirm" type="checkbox"></label><p class="hint">' + t('sealedNote') + '</p>' +
      patientButton('collect', 'sealedCta', sample.id) + '</section></div>';
  }

  function patientCareCopy(sample) {
    if (sample.status === 'analysed') return [t('reviewPending'), t('reviewPendingBody')];
    if (Store.sla(sample)?.breached) return [t('deliveryDelayed'), t('deliveryDelayedBody')];
    if (sample.status === 'dispatched') return [t('handoffNext'), t('handoffNextBody')];
    return [t('nothingToDo'), t('trackingReassurance')];
  }

  function patientStatus(sample) {
    const moving = ['dispatched', 'picked_up', 'in_transit'].includes(sample.status);
    const copy = patientCareCopy(sample);
    return moving ? '<div class="care-message" data-care="' + esc(sample.id) + '"><strong>' + copy[0] + '</strong><p>' + copy[1] + '</p></div>' +
      '<details class="privacy-panel"><summary>' + t('deliveryTiming') + '</summary><p>' + t('courierSimulated') + '</p>' + slaBox(sample) + '</details>' : '';
  }

  function consultationScreen(sample, done) {
    const appointment = sample.consultation;
    if (done && appointment) return '<div class="screen"><section class="journey-card">' + icon('check') + '<h2>' + t('consultDone') + '</h2><p>' +
      fmtDate(appointment.date) + ' · <bdi>' + esc(appointment.time) + '</bdi></p><p>' + t('consultConfirmation') + '</p>' +
      patientButton('open-report', 'openReport', sample.id) + '</section></div>';
    return '<div class="screen"><section class="form-card"><h2>' + t('consultChoose') + '</h2><p>' + t('consultPurpose') + '</p><p>' +
      fmtDate(new Date(Date.now() + 86400000).toISOString()) + '</p>' + selectField('consult-time', t('consultTime'), [['09:00', '09:00'], ['14:00', '14:00']], '09:00') +
      '<p class="hint">' + t('consultConfirmation') + '</p>' + patientButton('confirm-consultation', 'consultConfirm', sample.id) + '</section></div>';
  }

  function sampleScreen(sample) {
    const status = sample.status;
    let html = '<div class="screen">' +
      patientStatus(sample) + '<details class="privacy-panel"><summary>' + t('handoffCode') + '</summary><section class="id-card">' +
        '<span class="id-label">' + t('idTitle') + '</span>' +
        '<div class="id-row"><div><strong class="mono id-value">' + esc(sample.id) + '</strong>' +
        '<button class="link copy" type="button" data-action="copy-id" data-id="' + esc(sample.id) + '">' + t('copyId') + '</button></div>' +
        qrSvg(sample.id) + '</div>' +
        '<p class="hint">' + t('idNote') + '</p>' +
      '</section></details>' +
      '<section class="detail-card">' +
        '<div class="detail-top">' + statusChip(sample) + '<small>' + fmtDate(sample.createdAt) + '</small></div>';

    if (sample.delivery) {
      html += '<div class="detail-line">' + icon('pin') + '<div><span>' + t('scheduledFor') + '</span><strong>' + esc(sample.delivery.address.split('\n')[0]) + '</strong>' +
        '<small>' + t({ today: 'slotToday', 'tomorrow-am': 'slotTomorrow', 'tomorrow-pm': 'slotNext' }[sample.delivery.slot] || 'confirmDelivery') + '</small></div></div>';
    }
    if (status === 'analysed') html += '<div class="care-message"><strong>' + t('reviewPending') + '</strong><p>' + t('reviewPendingBody') + '</p></div>';
    if (status === 'dispatched') {
      html += '<p class="hint">' + t('courierSimulated') + '</p>' + patientButton('pickup-help', 'pickupHelp', null, 'soft');
    }
    if (status.indexOf('rejected') === 0) {
      html += '<div class="alert danger">' + t(status === 'rejected_sla' ? 'lateNext' : 'sealNext') + '</div>' +
        patientButton('goto-order', 'bookAgain');
    }
    html += '<div class="sub-label">' + t('timelineTitle') + '</div>' + timeline(sample);

    html += '<div class="actions">';
    if (status === 'awaiting') {
      html += '<button class="btn primary" type="button" data-action="goto-delivery" data-id="' + esc(sample.id) + '">' + t('arrangeDelivery') + '</button>';
    } else if (status === 'scheduled') {
      html += patientButton('goto-prepare', 'prepareTitle', sample.id) +
        patientButton('goto-delivery', 'changePickup', sample.id, 'soft');
    } else if (status === 'results_ready') {
      html += '<button class="btn primary" type="button" data-action="open-report" data-id="' + esc(sample.id) + '">' + t('openReport') + '</button>';
    } else if (status === 'lab_received' || status === 'analysed') {
      html += '<div class="alert">' + t('waitingLab') + '</div>';
    }
    html += '</div></section></div>';
    return html;
  }

  function reportScreen(sample) {
    const results = sample.results || {};
    let cards = '';
    PARAMS.forEach(([key, unitKey, ref]) => {
      const raw = results[key];
      const value = raw === '' || raw == null ? '-' : raw;
      let cls = 'chip';
      let label = t('informational');
      if (key !== 'velocity' && raw !== '' && raw != null) {
        const numeric = Number(raw);
        if (numeric < ref) { cls = 'chip warn'; label = t('below'); }
        else { cls = 'chip ok'; label = t('inRange'); }
      }
      cards += '<div class="result"><span>' + t(key) + '</span><strong>' + esc(value) + ' ' + t(unitKey) + '</strong>' +
        '<small>' + t('reference') + ' <bdi>≥ ' + ref + ' ' + t(unitKey) + '</bdi></small><div class="result-chip"><span class="' + cls + '">' + label + '</span></div>' +
        '<details class="measurement-help"><summary>' + t('measurementMeaning') + '<span class="sr-only">: ' + t(key) + '</span></summary><p>' + t('explain' + cap(key)) + '</p></details></div>';
    });
    return '<div class="screen">' +
      '<div class="report-card"><p class="hint">' + fmtDate(sample.publishedAt || sample.createdAt) + '</p>' +
      '<div class="review-stamp">' + icon('shield') + '<div><strong>' + t('reviewerStamp') + '</strong><small>' + t('reviewerDisclaimer') + '</small></div></div>' + (sample.review?.note ? '<p class="review-patient-note" lang="' + esc(sample.review.language || 'en') + '" dir="auto">' + esc(sample.review.note) + '</p>' : '') + '<h2>' + t('reportOverview') + '</h2><p>' + t('reportSummary') + '</p>' +
      '<details class="privacy-panel measurement-panel"><summary>' + t('measurements') +
      '</summary><p class="hint">' + t('referenceContext') + '</p><div class="results-grid">' + cards + '</div><a class="measurement-source" href="https://medlineplus.gov/lab-tests/semen-analysis/" target="_blank" rel="noopener noreferrer">' + t('measurementSource') + '</a></details>' +
      '<div class="safety"><strong>' + t('consultTitle') + '</strong><p>' + t('consultBody') + '</p>' +
      '<button class="btn primary" type="button" data-action="consult" data-id="' + esc(sample.id) + '">' + t('consultBtn') + '</button></div>' +
      '<p class="hint">' + t('disclaimer') + '</p></div>' + videoCard('results') + '</div>';
  }

  function renderPatient(user, current) {
    const meta = screenMeta(current, user);
    const ownedSample = id => {
      const sample = id ? Store.get(id) : null;
      return sample && user && sample.patientId === user.id ? sample : null;
    };
    let body;
    if (current === 'chat') {
      body = chatScreen();
    } else if (current === 'care') {
      body = careScreen();
    } else if (current === 'video') {
      body = videoScreen();
    } else if (current === 'overview') {
      body = overviewScreen();
    } else if (!user) {
      body = current === 'welcome' ? welcomeScreen()
        : current === 'learn' ? learnScreen(true)
        : current === 'quiz' ? quizScreen()
        : current === 'quizResult' ? quizResultScreen()
        : current === 'login' ? loginScreen() : signupScreen();
    } else if (current === 'consent') {
      body = consentScreen();
    } else if (current === 'profile') {
      body = profileScreen(user, !Store.profileComplete(user));
    } else if (current === 'order') {
      body = orderScreen(user);
    } else if (current === 'delivery') {
      const sample = ownedSample(selectedId);
      body = sample ? deliveryScreen(sample, user) : homeScreen();
    } else if (current === 'review') {
      const sample = ownedSample(selectedId);
      body = sample ? reviewScreen(sample) : homeScreen();
    } else if (current === 'consultation' || current === 'consultationDone') {
      const sample = ownedSample(selectedId);
      body = sample && sample.status === 'results_ready' ? consultationScreen(sample, current === 'consultationDone') : resultsScreen(user);
    } else if (current === 'sample') {
      const sample = ownedSample(selectedId);
      body = sample ? sampleScreen(sample) : ordersScreen();
    } else if (current === 'report') {
      const sample = ownedSample(selectedId);
      body = sample && sample.status === 'results_ready' ? reportScreen(sample) : ordersScreen();
    } else if (current === 'results') {
      body = resultsScreen(user);
    } else if (current === 'prepare') {
      const sample = ownedSample(selectedId);
      body = sample && sample.status === 'scheduled' ? prepareScreen(sample) : homeScreen();
    } else if (current === 'orders') {
      body = ordersScreen();
    } else if (current === 'learn') {
      body = learnScreen();
    } else if (current === 'quiz') {
      body = quizScreen();
    } else if (current === 'quizResult') {
      body = quizResultScreen();
    } else {
      body = homeScreen();
    }
    const nav = user && user.consent && Store.profileComplete(user)
      ? appNav(current)
      : !user && ['learn', 'chat', 'care', 'quiz', 'quizResult'].indexOf(current) !== -1 ? appNav(current, true) : '';
    return companionPanel() + '<div class="app-shell">' + appHeader(meta) +
      '<div class="app-body"><div id="patientFeedback" class="patient-feedback" role="status" hidden></div>' + body + '</div>' + nav + '</div>';
  }

  function renderDispatch() {
    let html = '<div class="page-head"><h1>' + t('dispatchTitle') + '</h1><p>' + t('dispatchIntro') + '</p></div><div class="grid">';
    const active = Store.data.samples.filter(s => ['dispatched', 'picked_up', 'in_transit'].indexOf(s.status) !== -1);
    if (!active.length) html += '<section class="card wide"><p class="empty">' + t('noDispatches') + '</p></section>';
    active.forEach(sample => {
      html += '<section class="card"><div class="sample-top"><span class="sample-id">' + esc(sample.id) + '</span>' + statusChip(sample) + '</div>' +
        '<div class="meta">' + t('partner') + ': <b>' + esc(sample.partner) + '</b> · ' + t('rider') + ': <b>' + esc(sample.rider) + '</b></div>' +
        slaBox(sample) + '<div class="actions">';
      if (sample.status === 'dispatched') html += '<button class="btn" type="button" data-action="pick-up" data-id="' + sample.id + '">' + t('assignRider') + '</button>';
      if (sample.status === 'picked_up') html += '<button class="btn" type="button" data-action="en-route" data-id="' + sample.id + '">' + t('statusInTransit') + '</button>';
      if (sample.status === 'in_transit') html += '<button class="btn" type="button" data-action="hand-lab" data-id="' + sample.id + '">' + t('handToLab') + '</button>';
      html += '</div></section>';
    });
    return html + '</div>';
  }

  function resultForm(sample) {
    let fields = '';
    PARAMS.forEach(([key]) => {
      fields += '<div class="field"><label for="p-' + key + '">' + t(key) + '</label>' +
        '<input id="p-' + key + '" type="number" step="any" min="0" placeholder="0"></div>';
    });
    return '<div class="divider"></div><h2>' + t('resultsTitle') + '</h2><p>' + t('resultsIntro') + '</p>' +
      '<button class="btn secondary" type="button" data-action="fill-demo-results">' + t('fillDemoResults') + '</button><div class="results-grid">' + fields + '</div>' +
      '<div class="actions"><button class="btn" type="button" data-action="publish" data-id="' + sample.id + '">' + t('submitReview') + '</button></div>';
  }

  function renderLab() {
    let html = '<div class="page-head"><h1>' + t('labTitle') + '</h1><p>' + t('labIntro') + '</p></div><div class="grid">';

    html += '<section class="card"><h2>' + t('scanTitle') + '</h2>' +
      '<div class="field"><label for="scanId">' + t('scanLabel') + '</label>' +
      '<input id="scanId" type="text" placeholder="' + t('scanPlaceholder') + '" autocomplete="off"></div>' +
      '<div class="actions"><button class="btn" type="button" data-action="lookup">' + t('scanBtn') + '</button></div>';

    if (labSelection) {
      const sample = Store.get(labSelection);
      if (!sample) labSelection = null;
      else {
        const late = labLateness(sample);
        html += '<div class="divider"></div><div class="sample-top"><span class="sample-id">' + esc(sample.id) + '</span>' + statusChip(sample) + '</div>' +
          '<div class="meta">' + t('collected') + ': <b>' + fmtTime(sample.collectedAt) + '</b> · ' +
          t('statusLabReceived') + ': <b>' + fmtTime(sample.labReceivedAt) + '</b></div>' +
          '<div class="sla ' + (late > 3600000 ? 'bad' : '') + '">' +
          (late > 3600000 ? t('breachedLabel') : t('countdownLabel') + ': ' + Store.fmtDuration(3600000 - late)) + '</div>';
        if (sample.status.indexOf('rejected') === 0) {
          html += '<p class="meta" style="margin-top:10px">' + t('rejectionNote') + ': ' + t('status' + cap(sample.status)) + '</p>';
        } else if (['analysed', 'results_ready'].includes(sample.status)) {
          html += '<p class="care-message">' + t(sample.status === 'analysed' ? 'reviewSaved' : 'reviewerStamp') + '</p>';
        } else if (sample.status !== 'lab_received') {
          html += '<p class="hint">' + t('reviewLocked') + '</p>';
        } else if (!sample.accepted) {
          html += '<div class="actions"><button class="btn" type="button" data-action="accept" data-id="' + sample.id + '">' + t('acceptSample') + '</button>' +
            '<button class="btn danger" type="button" data-action="reject-sla" data-id="' + sample.id + '">' + t('rejectSla') + '</button>' +
            '<button class="btn danger" type="button" data-action="reject-seal" data-id="' + sample.id + '">' + t('rejectSeal') + '</button></div>';
        } else {
          html += '<span class="chip ok">' + t('statusLabReceived') + '</span>' + resultForm(sample);
        }
      }
    }
    html += '</section>';

    html += '<section class="card wide"><h2>' + t('labQueueTitle') + '</h2>';
    const queue = Store.data.samples.filter(s => ['lab_received', 'analysed', 'results_ready'].indexOf(s.status) !== -1 || s.status.indexOf('rejected') === 0);
    if (!queue.length) html += '<p class="empty">' + t('noLabQueue') + '</p>';
    queue.forEach(sample => {
      html += '<div class="sample"><div class="sample-top"><span class="sample-id">' + esc(sample.id) + '</span>' + statusChip(sample) + '</div>' +
        '<div class="meta">' + t('collected') + ': <b>' + fmtTime(sample.collectedAt) + '</b> · ' +
        t('statusLabReceived') + ': <b>' + fmtTime(sample.labReceivedAt) + '</b></div>' +
        '<div class="actions"><button class="btn secondary" type="button" data-action="select" data-id="' + sample.id + '">' + t('scanBtn') + '</button></div></div>';
    });
    html += '</section></div>';
    return html;
  }

  function renderClinician() {
    const pending = Store.data.samples.filter(sample => sample.status === 'analysed' && sample.results);
    const released = Store.data.samples.filter(sample => sample.status === 'results_ready');
    const exceptions = Store.data.samples.filter(sample => sample.status.startsWith('rejected'));
    return '<div class="page-head"><span class="eyebrow">' + t('prototypeLabel') + '</span><h1>' + t('clinicianTitle') + '</h1><p>' + t('clinicianIntro') + '</p></div><div class="care-stats">' + [[pending.length, 'reviewQueue'], [released.length, 'releasedCount'], [exceptions.length, 'exceptionCount']].map(([n, label]) => '<div><strong>' + n + '</strong><span>' + t(label) + '</span></div>').join('') + '</div><div class="grid">' + (pending.length ? pending.map(sample => '<section class="card review-case"><div class="sample-top"><span class="sample-id">' + esc(sample.id) + '</span><span class="chip info">' + t('reviewQueue') + '</span></div><p class="hint">' + t('reviewerDisclaimer') + '</p><div class="review-measurements">' + PARAMS.map(([key, unit]) => '<div><span>' + t(key) + '</span><strong>' + esc(sample.results[key]) + ' ' + t(unit) + '</strong></div>').join('') + '</div>' + textArea('review-note-' + sample.id, t('reviewNote'), sample.review?.note || t('reviewNoteDefault'), '') + '<button class="btn primary block" type="button" data-action="approve-report" data-id="' + esc(sample.id) + '">' + t('approveReport') + '</button></section>').join('') : '<section class="card wide"><p>' + t('reviewEmpty') + '</p></section>') + '</div><section class="card care-audit"><h2>' + t('releasedCount') + '</h2>' + released.map(sample => '<div class="audit-row"><strong class="mono">' + esc(sample.id) + '</strong><span>' + fmtDate(sample.publishedAt) + '</span><span class="chip ok">' + t('reviewerStamp') + '</span></div>').join('') + '</section>';
  }

  function render() {
    closeGuide(false);
    const user = Store.currentUser();
    const current = gateScreen();
    if (current !== 'quiz' && current !== 'quizResult') clearQuiz();
    screen = current;

    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
    langToggle.textContent = I18N.current === 'en' ? 'العربية' : 'English';
    document.querySelectorAll('.tab').forEach(tab => {
      const active = tab.dataset.role === role;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    const latest = role === 'patient' ? null : Store.data.notices[0];
    notice.hidden = !latest;
    if (latest) notice.textContent = latest.text;

    view.innerHTML = role === 'patient' ? renderPatient(user, current) : role === 'dispatch' ? renderDispatch() : role === 'clinician' ? renderClinician() : renderLab();

    const scanId = document.getElementById('scanId');
    if (scanId) scanId.onkeydown = event => { if (event.key === 'Enter') lookupSample(); };
  }

  function lookupSample() {
    const input = document.getElementById('scanId');
    if (!input) return;
    const found = Store.get(input.value.trim().toUpperCase());
    if (found) {
      labSelection = found.id;
      render();
    } else {
      showNotice(t('notFound'));
    }
  }

  function publish(sample) {
    if (role !== 'lab' || sample.status !== 'lab_received' || !sample.accepted || !sample.sealOk || labLateness(sample) > 3600000) return showNotice(t('reviewLocked'));
    const results = {};
    for (const [key] of PARAMS) {
      const raw = document.getElementById('p-' + key)?.value.trim();
      const number = Number(raw);
      if (!raw || !Number.isFinite(number) || number < 0 || (['totalMotility', 'progressiveMotility', 'morphology'].includes(key) && number > 100)) return showNotice(t('reviewError'));
      results[key] = raw;
    }
    if (Number(results.progressiveMotility) > Number(results.totalMotility)) return showNotice(t('reviewError'));
    Store.update(sample.id, { results, review: { status: 'pending', submittedAt: new Date().toISOString() } });
    Store.transition(sample.id, 'analysed', 'noticeReview');
    labSelection = null;
    render();
    showNotice(t('submittedReview'));
  }

  function value(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  }

  function doSignup() {
    const name = value('su-name');
    const email = value('su-email');
    const phone = value('su-phone');
    const password = value('su-password');
    if (!name || !email || !phone || !password) return showNotice(t('errRequired'));
    if (!/^\S+@\S+\.\S+$/.test(email)) return showNotice(t('errEmail'));
    if (password.length < 6) return showNotice(t('errPasswordShort'));
    const result = Store.signup({ name, email, phone, password });
    if (!result.ok) return showNotice(t('errEmailExists'));
    Store.login(email, password);
    screen = bookingIntent ? 'order' : 'home';
    render();
    showNotice(t('accountCreated'));
  }

  function doLogin() {
    const result = Store.login(value('li-email'), value('li-password'));
    if (!result.ok) return showNotice(t('errInvalidLogin'));
    screen = bookingIntent ? 'order' : 'home';
    render();
    showNotice(t('signedIn'));
  }

  function demoLogin() {
    const result = Store.login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);
    if (!result.ok) return showNotice(t('errInvalidLogin'));
    screen = bookingIntent ? 'order' : 'home';
    selectedId = null;
    render();
    showNotice(t('demoSignedIn'));
  }

  function doConsent() {
    const boxes = Array.from(document.querySelectorAll('[data-consent]'));
    if (!boxes.length || boxes.some(box => !box.checked)) return showNotice(t('errConsent'));
    Store.saveConsent({
      collection: true,
      courier: true,
      lab: true,
      data: true
    });
    screen = bookingIntent ? 'order' : 'home';
    render();
  }

  function doProfile(setup) {
    const profile = {
      fullName: value('pf-name'),
      phone: value('pf-phone'),
      email: value('pf-email'),
      addressLine1: value('pf-a1'),
      addressLine2: value('pf-a2'),
      city: value('pf-city'),
      emirate: value('pf-emirate'),
      postcode: value('pf-postcode'),
      country: value('pf-country'),
      deliveryNotes: value('pf-notes')
    };
    if (!profile.fullName || !profile.phone || !profile.addressLine1 || !profile.city || !profile.emirate) {
      return showNotice(t('errRequired'));
    }
    Store.updateProfile(profile);
    if (setup) screen = bookingIntent ? 'order' : 'home';
    else screen = profileReturn;
    render();
    showNotice(t('profileSaved'));
  }

  function doOrder() {
    const abstinence = value('or-abstinence');
    if (abstinence === '' || !Number.isFinite(Number(abstinence)) || Number(abstinence) < 0 || Number(abstinence) > 30) return showNotice(t('intakeRequired'));
    previewSampleId = null;
    const sample = Store.createSample({
      abstinence: value('or-abstinence') || '3',
      consent: true
    });
    selectedId = sample.id;
    bookingIntent = false;
    deliveryDraft = null;
    screen = 'delivery';
    render();
  }

  function reviewDelivery(id) {
    const sample = Store.get(id);
    if (!sample || sample.patientId !== Store.currentUser()?.id || !['awaiting', 'scheduled'].includes(sample.status)) return;
    const address = value('dl-address');
    if (!address) return showNotice(t('errRequired'));
    const slot = document.querySelector('input[name="slot"]:checked');
    deliveryDraft = { id, address, slot: slot ? slot.value : 'today', notes: value('dl-notes') };
    go('review', id);
  }

  function doDelivery(id) {
    const sample = Store.get(id);
    if (!sample || sample.patientId !== Store.currentUser()?.id || !['awaiting', 'scheduled'].includes(sample.status)) return;
    if (!deliveryDraft || deliveryDraft.id !== id) return go('delivery', id);
    Store.arrangeDelivery(id, { address: deliveryDraft.address, slot: deliveryDraft.slot, partner: 'Demo courier', notes: deliveryDraft.notes });
    deliveryDraft = null;
    go('sample', id);
    showNotice(t('deliveryConfirmed'));
  }

  function doCollect(id) {
    const sample = Store.get(id);
    if (!sample || sample.status !== 'scheduled' || sample.patientId !== Store.currentUser()?.id) return;
    if (!document.getElementById('prep-confirm')?.checked) return showNotice(t('prepRequired'));
    if (!sample.delivery) {
      screen = 'delivery';
      render();
      return showNotice(t('errRequired'));
    }
    Store.update(id, { collectedAt: new Date().toISOString(), sealOk: true });
    Store.dispatch(id);
    Store.notify(t('noticeCollected'), id);
    go('sample', id);
  }

  function copyId(id) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(() => showNotice(t('copied'))).catch(() => showNotice(id));
    } else {
      showNotice(id);
    }
  }

  function handleAction(action, el) {
    const id = el.dataset.id || selectedId;
    const sample = id ? Store.get(id) : null;
    const user = Store.currentUser();

    if (action === 'exit-session') {
      learning = { guides: [] };
      chat = { messages: [], lastTopic: null };
      showLearning = true;
      clearQuiz();
      Store.logout();
      bookingIntent = false;
      previewSampleId = selectedId = null;
      go('welcome');
    } else if (action === 'explore-stage') {
      const stage = Number(el.dataset.stage);
      if (!Number.isInteger(stage) || stage < 0 || stage >= SirrLearnVisual.stages.length) return;
      const scrollTop = view.querySelector('.app-body')?.scrollTop || 0;
      exploredStage = stage;
      render();
      const body = view.querySelector('.app-body');
      if (body) body.scrollTop = scrollTop;
      view.querySelector('[data-action="explore-stage"][data-stage="' + stage + '"]')?.focus({ preventScroll: true });
    } else if (action === 'explore-question') {
      const question = t('visual' + SirrLearnVisual.stages[exploredStage] + 'Question');
      go('chat');
      sendChat(question);
    } else if (action === 'hide-learning') {
      showLearning = false;
      render();
    } else if (action === 'mark-guide') {
      if (!learning.guides.includes(videoKey)) learning.guides.push(videoKey);
      render();
      showNotice(t('learningNotice'));
    } else if (action === 'chat-send') {
      sendChat(value('chat-input'), true);
    } else if (action === 'chat-suggest') {
      sendChat(t(el.dataset.prompt));
    } else if (action === 'chat-clear') {
      chat = { messages: [], lastTopic: null };
      render();
    } else if (action === 'fill-demo-results') {
      if (role !== 'lab') return;
      const fixture = demoSamples()[1].results;
      PARAMS.forEach(([key]) => { const input = document.getElementById('p-' + key); if (input) input.value = fixture[key]; });
    } else if (action === 'approve-report') {
      if (role !== 'clinician' || !sample || sample.status !== 'analysed') return;
      const note = value('review-note-' + sample.id);
      if (!note) return showNotice(t('reviewNoNote'));
      if (!Store.approveReport(sample.id, note, I18N.current)) return;
      render();
      showNotice(t('reviewNotice'));
    } else if (action === 'play-guide') {
      playGuide();
    } else if (action === 'next-guide' || action === 'previous-guide') {
      changeGuide(action === 'next-guide' ? 1 : -1);
    } else if (action === 'close-guide') {
      closeGuide();
    } else if (action === 'open-video') {
      if (!SIRR_VIDEOS[el.dataset.video]) return;
      videoKey = el.dataset.video;
      videoReturn = screen;
      videoForm = Array.from(view.querySelectorAll('input[id], textarea[id], select[id]')).map(input => ({ id: input.id, value: input.value, checked: input.checked }));
      go('video');
    } else if (action === 'video-back') {
      returnFromVideo();
    } else if (action === 'goto-overview') {
      go('overview');
    } else if (action === 'start-booking') {
      bookingIntent = true;
      go(user ? 'order' : 'signup');
    } else if (action === 'review-delivery') {
      reviewDelivery(id);
    } else if (action === 'confirm-consultation') {
      if (!sample || sample.patientId !== user?.id || sample.status !== 'results_ready') return;
      const time = value('consult-time');
      if (!['09:00', '14:00'].includes(time)) return;
      Store.update(id, { consultation: { date: new Date(Date.now() + 86400000).toISOString(), time, simulated: true } });
      go('consultationDone', id);
    } else if (action === 'lang') {
      I18N.toggle();
      render();
    } else if (action === 'goto-signup') {
      bookingIntent = true;
      go('signup');
    } else if (action === 'goto-login') {
      loginReturn = ['welcome', 'overview', 'signup', 'learn'].includes(screen) ? screen : 'welcome';
      go('login');
    } else if (action === 'goto-welcome') {
      go(user ? 'home' : 'welcome');
    } else if (action === 'goto-home') {
      go('home');
    } else if (action === 'goto-results') {
      go('results');
    } else if (action === 'goto-prepare') {
      go('prepare', id);
    } else if (action === 'pickup-help') {
      showNotice(t('pickupHelpDemo'));
    } else if (action === 'goto-chat') {
      go('chat');
    } else if (action === 'goto-care') {
      go('care');
    } else if (action === 'goto-orders') {
      go('orders');
    } else if (action === 'goto-learn') {
      learnReturn = user ? 'home' : screen;
      go('learn');
    } else if (action === 'goto-quiz') {
      startQuiz();
    } else if (action === 'quiz-answer') {
      const choice = Number(el.dataset.value);
      if (!SirrJourney.questions[quizIndex].options[choice]) return;
      quizAnswers[quizIndex] = choice;
      render();
    } else if (action === 'quiz-next') {
      if (quizAnswers[quizIndex] == null) return;
      if (SirrJourney.route(quizAnswers).urgent || quizIndex === SirrJourney.questions.length - 1) go('quizResult');
      else { quizIndex += 1; render(); }
    } else if (action === 'quiz-edit') {
      quizIndex = 0;
      go('quiz');
    } else if (action === 'quiz-back') {
      if (quizIndex === 0) go('learn');
      else { quizIndex -= 1; render(); }
    } else if (action === 'quiz-restart') {
      startQuiz();
    } else if (action === 'goto-profile') {
      profileReturn = screen === 'order' ? 'order' : 'profile';
      go('profile');
    } else if (action === 'goto-order') {
      go('order');
    } else if (action === 'goto-delivery') {
      go('delivery', id);
    } else if (action === 'open-sample') {
      go('sample', id);
    } else if (action === 'open-report') {
      go('report', id);
    } else if (action === 'back') {
      if (screen === 'video') returnFromVideo();
      else if (screen === 'review') go('delivery', selectedId);
      else if (screen === 'consultation' || screen === 'consultationDone') go('report', selectedId);
      else if (screen === 'login') go(loginReturn);
      else if (screen === 'signup') go('overview');
      else if (screen === 'overview') go(user ? 'home' : 'welcome');
      else if (screen === 'quiz' || screen === 'quizResult' || screen === 'chat' || screen === 'care') go('learn');
      else if (!user && screen === 'learn') go(learnReturn);
      else if (screen === 'prepare' || screen === 'delivery') go('sample', selectedId);
      else if (screen === 'report') go('results');
      else go('home');
    } else if (action === 'signup') {
      doSignup();
    } else if (action === 'login') {
      doLogin();
    } else if (action === 'demo-login') {
      demoLogin();
    } else if (action === 'consent') {
      doConsent();
    } else if (action === 'save-profile') {
      doProfile(!!(user && !Store.profileComplete(user)));
    } else if (action === 'logout') {
      learning = { guides: [] };
      chat = { messages: [], lastTopic: null };
      showLearning = true;
      previewSampleId = null;
      Store.logout();
      bookingIntent = false;
      deliveryDraft = null;
      selectedId = null;
      go('welcome');
    } else if (action === 'order') {
      doOrder();
    } else if (action === 'arrange-delivery') {
      doDelivery(id);
    } else if (action === 'collect') {
      doCollect(id);
    } else if (action === 'copy-id') {
      copyId(id);
    } else if (action === 'pick-up') {
      Store.transition(id, 'picked_up', 'noticePicked');
      render();
    } else if (action === 'en-route') {
      Store.transition(id, 'in_transit');
      render();
    } else if (action === 'hand-lab') {
      Store.transition(id, 'lab_received', 'noticeHanded');
      render();
    } else if (action === 'lookup') {
      lookupSample();
    } else if (action === 'select') {
      labSelection = id;
      render();
    } else if (action === 'accept') {
      if (role !== 'lab' || !sample || sample.status !== 'lab_received' || !sample.sealOk || !sample.collectedAt || !sample.labReceivedAt || labLateness(sample) < 0 || labLateness(sample) > 3600000) return showNotice(t('reviewLocked'));
      Store.update(id, { accepted: true });
      Store.notify(t('noticeAccepted'), id);
      render();
    } else if (action === 'reject-sla') {
      if (role !== 'lab' || !sample || sample.status !== 'lab_received') return;
      Store.transition(id, 'rejected_sla', 'noticeRejectedSla');
      labSelection = null;
      render();
    } else if (action === 'reject-seal') {
      if (role !== 'lab' || !sample || sample.status !== 'lab_received') return;
      Store.update(id, { sealOk: false });
      Store.transition(id, 'rejected_seal', 'noticeRejectedSeal');
      labSelection = null;
      render();
    } else if (action === 'publish') {
      if (sample) publish(sample);
    } else if (action === 'consult') {
      go(sample?.consultation ? 'consultationDone' : 'consultation', id);
    } else if (action === 'reset') {
      learning = { guides: [] };
      chat = { messages: [], lastTopic: null };
      showLearning = true;
      bookingIntent = false;
      deliveryDraft = null;
      previewSampleId = null;
      Store.reset();
      screen = 'login';
      selectedId = null;
      labSelection = null;
      render();
    }
  }

  function openDemoScenario(kind) {
    if (!['welcome', 'prepare', 'transit', 'report', 'review', 'late', 'seal'].includes(kind)) return;
    clearQuiz();
    bookingIntent = false;
    deliveryDraft = null;
    videoForm = null;
    selectedId = null;
    previewSampleId = null;
    labSelection = null;
    role = 'patient';
    if (kind === 'welcome') {
      learning = { guides: [] };
      chat = { messages: [], lastTopic: null };
      showLearning = true;
      Store.logout();
      screen = 'welcome';
    } else {
      const sample = Store.loadDemoScenario(kind);
      if (!sample) return;
      selectedId = sample.id;
      previewSampleId = sample.id;
      screen = kind === 'prepare' ? 'prepare' : kind === 'report' ? 'report' : kind === 'transit' ? 'home' : 'sample';
    }
    document.querySelector('.demo-controls').open = false;
    render();
    showNotice(t('scenarioOpened') + ' ' + t('scenario' + cap(kind)));
    view.querySelector('h1[tabindex]')?.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-scenario]').forEach(button => {
    button.addEventListener('click', () => openDemoScenario(button.dataset.scenario));
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      clearQuiz();
      role = tab.dataset.role;
      document.querySelector('.demo-controls').open = false;
      if (role === 'patient') screen = 'home';
      render();
    });
  });

  langToggle.addEventListener('click', () => {
    I18N.toggle();
    render();
  });

  view.addEventListener('click', event => {
    if (Date.now() < guideSwipeClickUntil && event.target.matches('.guide-video')) {
      event.preventDefault();
      return;
    }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const before = screen;
    handleAction(button.dataset.action, button);
    if (before !== screen) view.querySelector('h1[tabindex]')?.focus({ preventScroll: true });
  });

  view.addEventListener('cancel', event => {
    if (!event.target.matches('.guide-lightbox')) return;
    event.preventDefault();
    closeGuide();
  }, true);

  view.addEventListener('ended', event => {
    if (event.target === expandedGuide?.video && videoReturn !== 'learn') closeGuide();
  }, true);

  view.addEventListener('pointerdown', event => {
    guideGesture = null;
    if (!expandedGuide || videoReturn !== 'learn' || !event.isPrimary || event.button !== 0 || event.target.closest('button')) return;
    const bounds = expandedGuide.video.getBoundingClientRect();
    // Leave the native time scrubber, volume and caption controls alone.
    if (event.clientY >= bounds.bottom - 88) return;
    guideGesture = { id: event.pointerId, x: event.clientX, y: event.clientY, time: Date.now() };
  }, true);

  view.addEventListener('pointerup', event => {
    const gesture = guideGesture;
    guideGesture = null;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (Math.abs(dy) < 64 || Math.abs(dy) < Math.abs(dx) * 1.5 || Date.now() - gesture.time > 1200) return;
    event.preventDefault();
    guideSwipeClickUntil = Date.now() + 400;
    changeGuide(dy < 0 ? 1 : -1);
  }, true);

  view.addEventListener('pointercancel', () => { guideGesture = null; }, true);

  view.addEventListener('wheel', event => {
    if (!expandedGuide || videoReturn !== 'learn' || !event.target.closest('.guide-lightbox') || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    const now = Date.now();
    if (now - guideWheel.time > 220) guideWheel = { time: now, amount: 0, used: false };
    guideWheel.time = now;
    if (guideWheel.used) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
    if (Math.sign(delta) !== Math.sign(guideWheel.amount)) guideWheel.amount = 0;
    guideWheel.amount += delta;
    if (Math.abs(guideWheel.amount) < 90) return;
    guideWheel.used = true;
    changeGuide(guideWheel.amount > 0 ? 1 : -1);
  }, { passive: false });

  view.addEventListener('keydown', event => {
    if (event.target.id === 'chat-input' && event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); sendChat(event.target.value, true); return; }
    if (!expandedGuide || videoReturn !== 'learn') return;
    const next = event.key === 'PageDown' || (event.key === 'ArrowDown' && !event.target.matches('video'));
    const previous = event.key === 'PageUp' || (event.key === 'ArrowUp' && !event.target.matches('video'));
    if (!next && !previous) return;
    event.preventDefault();
    changeGuide(next ? 1 : -1);
  });

  window.addEventListener('fullscreenchange', () => {
    if (!expandedGuide) return;
    if (document.fullscreenElement === expandedGuide.video) expandedGuide.nativeEntered = true;
    else if (expandedGuide.nativeEntered) closeGuide();
  });

  view.addEventListener('webkitendfullscreen', event => {
    if (event.target === expandedGuide?.video) closeGuide();
  }, true);

  window.addEventListener('storage', event => {
    if (event.key === Store.KEY) {
      Store.data = Store.read();
      render();
    }
  });

  setInterval(() => {
    document.querySelectorAll('[data-care]').forEach(el => {
      const sample = Store.get(el.dataset.care);
      if (!sample) return;
      const copy = patientCareCopy(sample);
      el.querySelector('strong').textContent = copy[0];
      el.querySelector('p').textContent = copy[1];
    });
    document.querySelectorAll('[data-countdown]').forEach(el => {
      const sample = Store.get(el.dataset.countdown);
      const info = sample && Store.sla(sample);
      if (!info) return;
      const span = el.querySelector('span');
      const text = info.breached ? t('breachedLabel') : t('countdownLabel') + ': ' + Store.fmtDuration(info.remaining);
      if (span) span.textContent = text;
      else el.textContent = text;
      el.classList.toggle('bad', info.breached);
      el.classList.toggle('warn', !info.breached && info.remaining < 15 * 60 * 1000);
    });
  }, 1000);

  Store.init();
  screen = Store.currentUser() ? 'home' : 'welcome';
  render();
})();
