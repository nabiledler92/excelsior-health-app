/* Lightweight adaptation of fertility-screening's signal / production / outflow
   visual metaphor. A schematic learning aid, never a patient-specific model. */
const SirrLearnVisual = (() => {
  const words = {
    en: {
      visualEyebrow: 'A LITTLE EXPLORING', visualTitle: 'Three parts of the picture.', visualIntro: 'Tap a station to see how the pieces connect.',
      visualSignal: 'Signals', visualProduction: 'Production', visualPathway: 'Pathway',
      visualSignalTitle: 'It starts with signals.', visualSignalBody: 'Hormones help coordinate the reproductive system. Hormone imbalances can be one part of a fertility concern.',
      visualSignalTakeaway: 'A clinician looks at your history and decides whether hormone tests would be useful.',
      visualProductionTitle: 'Sperm are made in the testicles.', visualProductionBody: 'Sperm production is another part of the picture. Some conditions can affect the number or shape of sperm.',
      visualProductionTakeaway: 'A semen analysis provides measurements. A questionnaire cannot replace the test.',
      visualPathwayTitle: 'There is a pathway out.', visualPathwayBody: 'Sperm travel through reproductive ducts. Blockages or transport problems can affect that journey, even when sperm are being made.',
      visualPathwayTakeaway: 'A clinician interprets test results alongside your history to understand the fuller picture.',
      visualTakeaway: 'What to remember', visualSchematic: 'Simplified illustration · not an anatomical model', visualSource: 'Source: NIH / NICHD — male infertility',
      visualQuestion: 'Take a question with you', visualQuestionAdded: 'Question added to your journal.',
      visualSignalQuestion: 'Would it be useful to discuss hormone testing in my assessment?', visualProductionQuestion: 'What can a semen analysis tell me, and what are its limits?', visualPathwayQuestion: 'How would a clinician check for a sperm transport concern?', visualSelection: 'Choose a part to explore', visualIllustration: 'Three connected stations represent hormone signals, sperm production and the reproductive pathway.',
    },
    ar: {
      visualEyebrow: 'قليل من الاستكشاف', visualTitle: 'ثلاثة أجزاء من الصورة.', visualIntro: 'اضغط على محطة لتعرف كيف ترتبط الأجزاء.',
      visualSignal: 'الإشارات', visualProduction: 'الإنتاج', visualPathway: 'المسار',
      visualSignalTitle: 'تبدأ بالإشارات.', visualSignalBody: 'تساعد الهرمونات على تنسيق عمل الجهاز التناسلي. وقد يكون اختلالها جزءاً من مخاوف الخصوبة.',
      visualSignalTakeaway: 'يراجع الطبيب تاريخك ليقرر إن كانت فحوصات الهرمونات مفيدة.',
      visualProductionTitle: 'تُنتج الحيوانات المنوية في الخصيتين.', visualProductionBody: 'إنتاج الحيوانات المنوية جزء آخر من الصورة. قد تؤثر بعض الحالات في عددها أو شكلها.',
      visualProductionTakeaway: 'يوفر تحليل السائل المنوي قياسات. لا يمكن لاستبيان أن يحل محل الفحص.',
      visualPathwayTitle: 'هناك مسار للخروج.', visualPathwayBody: 'تنتقل الحيوانات المنوية عبر قنوات تناسلية. وقد يؤثر انسداد أو مشكلة في النقل في هذا المسار حتى مع وجود إنتاج.',
      visualPathwayTakeaway: 'يفسّر الطبيب نتائج الفحوصات إلى جانب تاريخك لفهم الصورة الأشمل.',
      visualTakeaway: 'ما الذي تتذكره؟', visualSchematic: 'رسم مبسّط · ليس نموذجاً تشريحياً', visualSource: 'المصدر: المعاهد الوطنية للصحة / NICHD — عقم الرجال',
      visualQuestion: 'خذ سؤالاً معك', visualQuestionAdded: 'أُضيف السؤال إلى دفترك.',
      visualSignalQuestion: 'هل من المفيد مناقشة فحوصات الهرمونات في تقييمي؟', visualProductionQuestion: 'ماذا يوضح تحليل السائل المنوي وما حدوده؟', visualPathwayQuestion: 'كيف يتحقق الطبيب من مشكلة في نقل الحيوانات المنوية؟', visualSelection: 'اختر جزءاً لاستكشافه', visualIllustration: 'ثلاث محطات متصلة تمثل إشارات الهرمونات وإنتاج الحيوانات المنوية والمسار التناسلي.',
    }
  };
  Object.keys(words).forEach(lang => Object.assign(I18N[lang], words[lang]));
  const stages = ['Signal', 'Production', 'Pathway'];
  function station(index, active, x, y, drawing) {
    return '<g class="visual-station' + (active === index ? ' is-selected' : '') + '" transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse class="station-shadow" cx="51" cy="86" rx="52" ry="14" fill="#cadce9" opacity=".45"/>' +
      '<path d="M0 48 50 20 100 48 50 76Z" fill="#f5faff" stroke="#b8d2e5" stroke-width="1.5"/>' +
      '<path d="M0 48v18l50 28V76Z" fill="#c8dfef" stroke="#aac8dd" stroke-width="1.2"/>' +
      '<path d="M50 76v18l50-28V48Z" fill="#e1eff9" stroke="#aac8dd" stroke-width="1.2"/>' +
      '<path class="station-outline" d="M0 48 50 20 100 48v18L50 94 0 66Z" fill="none" stroke-width="2.5"/>' + drawing +
      '<circle cx="51" cy="87" r="10" class="station-badge"/><text x="51" y="91" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" font-weight="700" class="station-number">' + (index + 1) + '</text></g>';
  }
  function illustration(active) {
    const signal = '<path d="M29 34c-10-8-7-21 2-23-1-9 13-13 20-6 8-7 21-1 20 8 11 4 11 17 2 22-2 9-14 12-21 5-7 6-20 3-23-6Z" fill="#e9bdd0" stroke="#ad7894" stroke-width="1.5"/><path d="M51 6v33m-9-27c-8-3-12 7-7 11m5-4c10 0 9 12 4 13m14-21c9-1 13 7 8 12m-8-5c-6 2-7 12 0 14" stroke="#ad7894" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M51 43v9" stroke="#ac8197" stroke-width="2"/><circle cx="51" cy="55" r="4" fill="#e3b25e"/>';
    const production = '<ellipse cx="38" cy="35" rx="15" ry="23" transform="rotate(15 38 35)" fill="#f5d5aa" stroke="#b88b52" stroke-width="1.5"/><ellipse cx="67" cy="35" rx="15" ry="23" transform="rotate(-15 67 35)" fill="#f5d5aa" stroke="#b88b52" stroke-width="1.5"/><path d="M36 18c-14 10 10 10-3 18s7 10 0 16m30-34c14 10-10 10 3 18s-7 10 0 16" fill="none" stroke="#c09666" stroke-width="2" stroke-linecap="round"/><path d="M28 22c-8-7-2-17 9-18m40 18c8-7 2-17-9-18" fill="none" stroke="#a4bece" stroke-width="3" stroke-linecap="round"/>';
    const pathway = '<path d="M25 47V19c0-14 23-14 23 0v22c0 15 27 15 27 0V16" stroke="#89b9ba" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M25 47V19c0-14 23-14 23 0v22c0 15 27 15 27 0V16" stroke="#dcf0ed" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="48" cy="29" rx="3" ry="4" fill="#3e8685"/><path d="M48 33c-4 5 4 5 0 10" stroke="#3e8685" stroke-width="1.5" fill="none"/><path d="m68 17 7-8 7 8" stroke="#3e8685" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    const rtl = I18N.current === 'ar';
    const connectors = rtl ? 'M270 97c-30 0-28 32-60 32m-39 24c-30 0-25 32-60 32' : 'M80 97c30 0 28 32 60 32m39 24c30 0 25 32 60 32';
    return '<svg class="learn-model" viewBox="0 0 350 230" role="img" aria-label="' + I18N.t('visualIllustration') + '"><path d="' + connectors + '" fill="none" stroke="#9ab9ce" stroke-width="2.5" stroke-dasharray="3 6" stroke-linecap="round"/>' + station(0,active,rtl ? 233 : 15,18,signal) + station(1,active,124,70,production) + station(2,active,rtl ? 15 : 233,122,pathway) + '</svg>';
  }
  function render(active) {
    const t = key => I18N.t(key);
    const key = stages[active] || stages[0];
    return '<section class="learn-explorer" aria-labelledby="explorer-title"><div class="explorer-heading"><span class="eyebrow">' + t('visualEyebrow') + '</span><h2 id="explorer-title">' + t('visualTitle') + '</h2><p>' + t('visualIntro') + '</p></div>' + illustration(active) + '<div class="explorer-tabs" role="group" aria-label="' + t('visualSelection') + '">' + stages.map((stage,i) => '<button type="button" data-action="explore-stage" data-stage="' + i + '" aria-pressed="' + (active === i) + '" aria-controls="explorer-explanation"><span>' + (i+1) + '</span>' + t('visual'+stage) + '</button>').join('') + '</div><div id="explorer-explanation" class="explorer-explanation" aria-live="polite" aria-atomic="true"><h3>' + t('visual'+key+'Title') + '</h3><p>' + t('visual'+key+'Body') + '</p><div class="explorer-takeaway"><strong>' + t('visualTakeaway') + '</strong><p>' + t('visual'+key+'Takeaway') + '</p></div></div><button class="explorer-question" type="button" data-action="explore-question">' + t('visualQuestion') + '<span aria-hidden="true">+</span></button><div class="explorer-footnote"><span>' + t('visualSchematic') + '</span><a href="https://www.nichd.nih.gov/health/topics/infertility/conditioninfo/causes/causes-male" target="_blank" rel="noopener noreferrer">' + t('visualSource') + '</a></div></section>';
  }
  return { render, stages };
})();
