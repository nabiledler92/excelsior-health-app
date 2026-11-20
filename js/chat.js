/* Ask Sirr POC: a local conversational knowledge demo. No LLM, API calls,
   analytics or stored chat. Replace reply() with an API adapter in a future build. */
const SirrChat = (() => {
  const copy = {
    en: {
      chatTitle: 'Ask Sirr', chatSub: 'A little understanding, one question at a time.', chatMode: 'AI concept · no LLM connected',
      chatWelcome: 'What’s on your mind?', chatIntro: 'Explore fertility assessments, collection, results and privacy. Ask in your own words, or try a question below.',
      chatPrivacy: 'Only in this tab · clears on reload or exit · nothing sent to an AI service.',
      chatPlaceholder: 'Ask about fertility or your assessment…', chatInput: 'Your question', chatSend: 'Send question', chatClear: 'Start a new conversation', chatBoundary: 'General education only. No diagnosis, result interpretation or treatment advice.',
      chatYou: 'You', chatAssistant: 'Sirr', chatSource: 'Background source', chatFollowup: 'Keep exploring', chatLong: 'Please keep your question under 500 characters.', chatLimit: 'Start a new conversation to keep exploring. This demo keeps up to 20 questions in memory.', chatLabel: 'Conversation',
      openJournal: 'Ask Sirr', journalTitle: 'Ask Sirr', navJournal: 'Ask Sirr', careHeading: 'Start with a little understanding.', careBody: 'Ask general questions about assessment, then take your personal concerns to a qualified clinician.', faqPrivacyBody: 'Yes. The check-in, guides and Ask Sirr are available without signing in. Demo booking uses fictional contact and pickup details stored in this browser.',
      starterTest: 'What does a semen test measure?', starterHome: 'Can I collect at home?', starterPrivacy: 'Who sees my results?', starterPrepare: 'How do I prepare?', starterDoctor: 'What should I ask a clinician?', starterHormones: 'How do hormones fit in?',
      visualQuestion: 'Ask Sirr about this', visualSignalQuestion: 'How do hormones fit into fertility?', visualProductionQuestion: 'What can a semen analysis tell me?', visualPathwayQuestion: 'How can the sperm pathway affect fertility?',
    },
    ar: {
      chatTitle: 'اسأل سِرّ', chatSub: 'قليل من الفهم، سؤالاً بعد سؤال.', chatMode: 'تصوّر للذكاء الاصطناعي · دون اتصال بنموذج',
      chatWelcome: 'ما الذي يشغل بالك؟', chatIntro: 'تعرّف على التقييم وجمع العينة والنتائج والخصوصية. اكتب سؤالك أو اختر سؤالاً أدناه.',
      chatPrivacy: 'في هذا التبويب فقط · تُمسح عند التحميل أو الخروج · لا تُرسل لأي خدمة ذكاء اصطناعي.',
      chatPlaceholder: 'اسأل عن الخصوبة أو التقييم…', chatInput: 'سؤالك', chatSend: 'إرسال السؤال', chatClear: 'بدء محادثة جديدة', chatBoundary: 'معلومات عامة فقط. لا تشخيص أو تفسير نتائج أو نصائح علاجية.', chatYou: 'أنت', chatAssistant: 'سِرّ', chatSource: 'المصدر المرجعي', chatFollowup: 'تابع الاستكشاف', chatLong: 'يرجى ألا يتجاوز السؤال ٥٠٠ حرف.', chatLimit: 'ابدأ محادثة جديدة للمتابعة. يحتفظ العرض بما يصل إلى ٢٠ سؤالاً في الذاكرة.', chatLabel: 'المحادثة',
      openJournal: 'اسأل سِرّ', journalTitle: 'اسأل سِرّ', navJournal: 'اسأل سِرّ', careHeading: 'ابدأ بقليل من المعرفة.', careBody: 'اسأل أسئلة عامة عن التقييم، ثم ناقش مخاوفك الشخصية مع طبيب مؤهل.', faqPrivacyBody: 'نعم. التأمل والأدلة واسأل سِرّ متاحة دون تسجيل. يستخدم الحجز التجريبي بيانات اتصال واستلام وهمية مخزنة في هذا المتصفح.',
      starterTest: 'ماذا يقيس تحليل السائل المنوي؟', starterHome: 'هل يمكن جمع العينة في المنزل؟', starterPrivacy: 'من يرى نتائجي؟', starterPrepare: 'كيف أستعد للفحص؟', starterDoctor: 'ماذا أسأل الطبيب؟', starterHormones: 'ما دور الهرمونات؟',
      visualQuestion: 'اسأل سِرّ عن هذا', visualSignalQuestion: 'ما علاقة الهرمونات بالخصوبة؟', visualProductionQuestion: 'ماذا يوضح تحليل السائل المنوي؟', visualPathwayQuestion: 'كيف يؤثر مسار الحيوانات المنوية في الخصوبة؟',
    }
  };
  Object.keys(copy).forEach(lang => Object.assign(I18N[lang], copy[lang]));
  const sources = {
    test: { title: 'MedlinePlus · Semen analysis', url: 'https://medlineplus.gov/lab-tests/semen-analysis/' },
    biology: { title: 'NIH / NICHD · Male infertility', url: 'https://www.nichd.nih.gov/health/topics/infertility/conditioninfo/causes/causes-male' },
    symptoms: { title: 'NHS · Testicle pain', url: 'https://www.nhs.uk/symptoms/testicle-pain/' },
    demo: { title: 'Sirr prototype · demo behavior', url: null }
  };
  const topics = [
    {id:'privacy', keywords:['privacy','private','who sees','who can see','employer','wife know','share','data','save','stored','خصوصية','خصوص','يرى','يشاهد','بيانات','حفظ','هل تعرف زوجتي','مشاركة'], source:'demo',
      en:'In this prototype, chat is kept only in this tab’s memory. It is not added to your booking, sent to an AI service or shared with anyone. Fictional booking and sample records use browser storage. A real service would need to explain its own access and sharing rules.',
      ar:'في هذا النموذج تبقى المحادثة في ذاكرة هذا التبويب فقط. لا تُضاف للحجز ولا تُرسل لخدمة ذكاء اصطناعي أو لأي شخص. تُحفظ سجلات الحجز والعينات الوهمية في المتصفح. على الخدمة الحقيقية توضيح قواعد الوصول والمشاركة الخاصة بها.', follow:['starterTest','starterHome']},
    {id:'preparation', keywords:['prepare','preparation','before','abstain','abstinence','days','timing','instructions','استعد','الاستعداد','قبل الفحص','امتناع','ايام','تعليمات'], source:'test',
      en:'Follow your lab’s instructions for timing, container and transport. Report incomplete collection. This demo’s checklist is a preview, not a personal protocol.',
      ar:'اتبع تعليمات مختبرك. اسأل عن التوقيت والوعاء المعتمد والنقل قبل الجمع، وأبلغ المختبر إن لم تكتمل العينة. قائمة هذا العرض معاينة وليست تعليماتك الشخصية.', follow:['starterHome','starterDoctor']},
    {id:'home', keywords:['home','kit','collect','collection','sample','condom','belief','religio','halal','منزل','المنزلي','عينة','العينة','جمع','معتقد','ديني','حلال'], source:'test',
      en:'Home collection differs from a home self-test. Ask your provider which option is suitable; many self-tests provide less information than full lab analysis.',
      ar:'جمع العينة في المنزل يختلف عن الفحص الذاتي المنزلي. قد يوفر التحليل المخبري الكامل معلومات أكثر. اسأل مقدم الرعاية عن ملاءمة الجمع المنزلي والخيارات المعتمدة. الاستلام في سِرّ محاكاة.', follow:['starterPrepare','starterPrivacy']},
    {id:'measurements', keywords:['motility','morphology','concentration','volume','count','movement','shape','moving','الحركة','حركة','الشكل','شكل','تركيز','حجم','عدد'], source:'test',
      en:'Concentration means sperm per millilitre; total count covers the sample. Motility describes movement; morphology describes shape. A clinician interprets the measurements together.',
      ar:'التركيز هو عدد الحيوانات المنوية في الملليلتر، والعدد الكلي يخص العينة كلها. الحركة تصف التنقل، والمورفولوجيا تصف الشكل. يفسّر الطبيب هذه القياسات معاً.', follow:['starterTest','starterDoctor']},
    {id:'hormones', keywords:['hormone','hormonal','testosterone','signal','الهرمون','هرمونات','هرموني','تستوستيرون','اشارات'], source:'biology',
      en:'Hormones help coordinate the reproductive system. Hormone imbalances can be one part of a fertility concern. A clinician can decide whether hormone testing is appropriate; this chat cannot recommend medication changes.',
      ar:'تساعد الهرمونات على تنسيق الجهاز التناسلي. وقد يكون اختلالها جزءاً من مخاوف الخصوبة. يقرر الطبيب ملاءمة الفحوصات، ولا توصي هذه المحادثة بتغيير الأدوية.', follow:['starterTest','starterDoctor']},
    {id:'pathway', keywords:['pathway','duct','blockage','transport','vasectomy','مسار','قنوات','انسداد','نقل الحيوانات','قطع القناة'], source:'biology',
      en:'Sperm travel through reproductive ducts. Blockages or transport problems can affect that journey even when sperm are being produced. A clinician considers your history and examination alongside any test results.',
      ar:'تنتقل الحيوانات المنوية عبر قنوات تناسلية. قد يؤثر الانسداد أو مشكلات النقل في المسار حتى مع وجود إنتاج. ينظر الطبيب إلى التاريخ والفحص والنتائج معاً.', follow:['starterTest','starterDoctor']},
    {id:'doctor', keywords:['doctor','clinician','consult','appointment','ask a','ask my','next step','طبيب','الطبيب','استشارة','موعد','خطوة','ماذا اسال'], source:'demo',
      en:'Useful questions include: “What assessment is appropriate for me?”, “How should I prepare?” and “How will my results be explained?” Take your personal history and concerns to a qualified clinician. This demo cannot book or contact one.',
      ar:'من الأسئلة المفيدة: «ما التقييم المناسب لي؟» و«كيف أستعد؟» و«كيف تُشرح نتائجي؟». ناقش تاريخك ومخاوفك مع طبيب مؤهل. لا يحجز هذا العرض موعداً ولا يتواصل مع طبيب.', follow:['starterPrepare','starterPrivacy']},
    {id:'test', keywords:['test','analysis','assessment','fertility','sperm','semen','result','فحص','تحليل','تقييم','خصوبة','السائل','المنوي','نتيجة','نتائج'], source:'test',
      en:'A semen analysis measures volume, sperm concentration, movement and shape. A clinician puts these measurements in context; one result is not a fertility verdict.',
      ar:'يقيس تحليل السائل المنوي خصائص مثل الحجم والتركيز والحركة والشكل. يدعم تقييم الخصوبة، لكن نتيجة واحدة ليست حكماً على الخصوبة. يشرح الطبيب القياسات في سياقها.', follow:['starterHome','starterPrepare']},
  ];
  function normalize(text) { return String(text).normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[’']/g,''); }
  function reply(text, language='en', lastTopic=null) {
    const lang = language === 'ar' ? 'ar' : 'en';
    const q = normalize(text);
    const emergency = /(?:sudden|severe|acute|unbearable).{0,60}(?:testic|scrot|pain)|(?:testic|scrot).{0,60}(?:sudden|severe|acute)|الم.{0,35}(?:مفاج|شديد)|(?:مفاج|شديد).{0,35}(?:خصي|الم)/.test(q);
    const lump = /\blump\b|\bswelling\b|كتلة|تورم/.test(q);
    if (emergency || lump) return {
      topic:'safety', urgent:true, sources:[sources.symptoms], followUps:[],
      text:lang==='ar' ? (emergency ? 'إذا كان لديك ألم مفاجئ وشديد في الخصية فاطلب الطوارئ الآن. لا تنتظر فحص الخصوبة أو رداً من المحادثة. لا يستطيع هذا العرض الاتصال بالطوارئ.' : 'الكتلة الجديدة أو التورم يحتاجان إلى تقييم طبي عاجل. إذا كان الألم مفاجئاً أو شديداً فاطلب الطوارئ الآن. لا تنتظر فحص الخصوبة.') : (emergency ? 'If you have sudden, severe testicular pain, seek emergency care now. Do not wait for a fertility test or a chat reply. This demo cannot contact emergency services.' : 'A new lump or swelling needs urgent medical assessment. If pain is sudden or severe, seek emergency care now. Do not wait for a fertility test.')
    };
    if (/am i (?:in)?fertile|diagnos|\d+(?:\.\d+)?\s*(?:%|million|مليون)|my (?:sperm )?(?:count|motility|morphology) is|is my (?:semen |sperm )?(?:result|report|count).*normal|هل.*نتيج.*طبيعي|(?:اوقف|جرعة|وصف دواء|هل انا عقيم|تشخيص)|(?:stop|start|dose|prescrib).{0,35}(?:medic|drug|testosterone|steroid|tablet)/.test(q)) return {
      topic:'boundary', sources:[], followUps:['starterTest','starterDoctor'], text:lang==='ar' ? 'يمكنني شرح المصطلحات العامة، لكن لا يمكنني تفسير أرقامك أو تشخيص الخصوبة أو اقتراح علاج أو تغيير دواء. ناقش التقرير الكامل وتاريخك مع طبيب مؤهل.' : 'I can explain general terms, but I cannot interpret your numbers, diagnose fertility, recommend treatment or change medication. Discuss your complete report and history with a qualified clinician.'
    };
    let best = null, score = 0;
    for (const topic of topics) {
      const n = topic.keywords.reduce((total, word) => total + (q.includes(normalize(word)) ? 1 + Math.min(word.length / 20, .5) : 0), 0);
      const weighted = topic.id === 'test' ? n * .3 : n;
      if (weighted > score) { score=weighted; best=topic; }
    }
    const continuation = /^(tell me more|more|why|how|what does that mean|what about that|yes|المزيد|اشرح اكثر|لماذا|كيف|نعم)[?.!\s]*$/.test(q);
    if (continuation) best=topics.find(topic=>topic.id===lastTopic)||best;
    if (!best) return {topic:null,sources:[],followUps:['starterTest','starterHome','starterPrivacy'],text:lang==='ar' ? 'هذا التصوّر يغطي مجموعة صغيرة من موضوعات الخصوبة. جرّب السؤال عن التقييم أو جمع العينة أو القياسات أو الخصوصية. الأسئلة الشخصية أو غير المغطاة تحتاج إلى طبيب مؤهل.' : 'This concept demo covers a small set of fertility topics. Try asking about assessments, sample collection, measurement terms or privacy. Personal or unsupported questions need a qualified clinician.'};
    const follow = continuation ? (lang === 'ar' ? 'يمكنك طرح هذا السؤال على طبيبك: «' + I18N.ar[best.follow[0]] + '». أو اختر موضوعاً أدناه للمتابعة.' : 'A useful follow-up for your clinician is: “' + I18N.en[best.follow[0]] + '” Or choose a topic below to explore another part of the journey.') : best[lang];
    return {topic:best.id,text:follow,sources:continuation ? [] : [sources[best.source]],followUps:best.follow};
  }
  return { reply };
})();
