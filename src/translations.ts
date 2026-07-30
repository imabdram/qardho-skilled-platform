/**
 * Qardho Skilled Platform
 * Centralized i18n Translation Dictionary (English, Somali, Arabic)
 */

export type Language = 'EN' | 'SO' | 'AR';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  EN: {
    // Navigation
    nav_workers: 'Workers',
    nav_jobs: 'Jobs',
    nav_dashboard: 'Dashboard',
    nav_admin: 'Admin Portal',
    nav_signin: 'Sign In',
    nav_signup: 'Sign Up',
    nav_more: 'More',
    nav_about: 'About & Contact',
    nav_settings: 'Platform Settings',
    nav_profile: 'View Profile',
    nav_edit_profile: 'Edit Profile',
    nav_switch_employer: 'Switch to Employer',
    nav_switch_worker: 'Switch to Worker',
    nav_signout: 'Sign Out',
    nav_language: 'Language / Luqadda',

    // Hero / Landing
    hero_badge: 'Qardho, Karkar',
    hero_title: 'Connecting Somali Trade Skills & Local Industry',
    hero_subtitle: 'Find verified solar technicians, plumbers, electricians, tailors, and trade professionals in Qardho.',
    hero_browse_workers: 'Browse Skilled Workers',
    hero_post_job: 'Post a Job Offer',
    hero_stat_workers: 'Skilled Workers',
    hero_stat_jobs: 'Active Jobs',
    hero_stat_neighborhoods: 'Qardho Neighborhoods',
    hero_featured_title: 'Featured Skilled Workers in Qardho',
    hero_recent_jobs: 'Recent Job Openings',

    // Filtering & Search
    search_workers_placeholder: 'Search by worker name, skill, or bio...',
    search_jobs_placeholder: 'Search by job title, category, or description...',
    filter_all_neighborhoods: 'All Neighborhoods',
    filter_all_skills: 'All Skills',
    filter_availability: 'Availability',
    filter_all_availability: 'All Statuses',
    filter_available: 'Available Now',
    filter_busy: 'Busy',
    filter_unavailable: 'Unavailable',

    // Common Actions & Badges
    btn_apply: 'Apply Now',
    btn_connect: 'Hire Worker',
    btn_save: 'Save Changes',
    btn_cancel: 'Cancel',
    btn_close: 'Close',
    btn_view_details: 'View Details',
    badge_verified: 'Verified Worker',
    badge_unverified: 'Unverified',
    badge_active: 'Active',
    badge_open: 'Open',
    badge_completed: 'Completed',

    // Dashboard & Profile
    dash_title: 'Dashboard',
    dash_subtitle: 'Track your active work, job applications, and direct hire offers in Qardho.',
    dash_tab_applications: 'Applications',
    dash_tab_connections: 'Direct Offers',
    dash_tab_active: 'Active Work',
    dash_tab_completed: 'Completed Work',
    dash_no_records: 'No records found to display.',

    // Categories
    cat_plumbing: 'Plumbing',
    cat_electrical: 'Electrical Work',
    cat_solar: 'Solar Installation',
    cat_construction: 'Construction',
    cat_tailoring: 'Tailoring',
    cat_teaching: 'Teaching',
    cat_farming: 'Farming',
    cat_repair: 'General Repair',

    // Landing Page Sections
    landing_find_by_skill_title: 'Find help by skill',
    landing_find_by_skill_desc: 'Browse the trade areas represented by current worker profiles.',
    landing_worker_count_singular: 'worker',
    landing_worker_count_plural: 'workers',

    landing_steps_eyebrow: 'Simple steps',
    landing_steps_title: 'How Xirfad Qardho works',
    landing_steps_desc: 'Two clear paths for hiring local help or finding work nearby.',

    landing_for_employers_title: 'For people who need work done',
    landing_employer_step_1: 'Search by skill or location',
    landing_employer_step_2: 'Contact a suitable worker',
    landing_employer_step_3: 'Agree directly and complete the work',
    landing_find_workers_btn: 'Find Workers',

    landing_for_workers_title: 'For workers',
    landing_worker_step_1: 'Create a worker profile',
    landing_worker_step_2: 'Show skills, location, and price',
    landing_worker_step_3: 'Receive messages and apply for jobs',
    landing_join_worker_btn: 'Join as Worker',
    landing_open_dashboard_btn: 'Open Dashboard',

    landing_benefit_1_title: 'Local Worker Profiles',
    landing_benefit_1_desc: 'Review skills, area, bio, price, and availability when workers provide them.',
    landing_benefit_2_title: 'Direct Negotiation',
    landing_benefit_2_desc: 'Message workers or applicants directly and agree on scope, timing, and payment.',
    landing_benefit_3_title: 'Neighborhood-Specific Results',
    landing_benefit_3_desc: 'Find help around Kaambo, Qoryacad, Xorgoble, Xiingood, Xiddo, Sheerbi, and Waaciye.',

    landing_featured_workers_title: 'Featured Skilled Workers',
    landing_featured_workers_desc: 'A short preview of worker profiles currently available in the platform.',
    landing_view_all_workers: 'View all workers',
    landing_view_profile: 'View Profile',

    landing_available_jobs_title: 'Available Jobs in Qardho',
    landing_available_jobs_desc: 'Recent local job posts from employers in the platform.',
    landing_browse_all_jobs: 'Browse all jobs',
    landing_view_job: 'View Job',

    landing_cta_title: 'Ready to find skilled help in Qardho?',
    landing_cta_desc: 'Search local profiles or create a worker account so nearby employers can contact you.',
    landing_cta_find_workers: 'Find Skilled Workers',
    landing_cta_create_profile: 'Create Worker Profile',

    // Simplified Hero & Guest UX Keys
    hero_simple_title: 'Find Local Skilled Work or Hire Trusted Talent in Qardho',
    hero_simple_subtitle: 'Whether you have a trade skill or need work done, Qardho Skilled Platform connects you directly.',
    hero_card_worker_title: 'I am a Skilled Worker',
    hero_card_worker_desc: 'Showcase your trade skills, get hired by local employers, and build your reputation in Qardho.',
    hero_card_employer_title: 'I am an Employer',
    hero_card_employer_desc: 'Post job offers and hire verified local electricians, solar technicians, plumbers & builders.',
    guest_modal_title: 'Join Qardho Skilled Platform',
    guest_modal_desc: 'Sign in or create an account to proceed with your action.',
    guest_tab_home: 'Home',

    // Footer
    footer_copyright: '© 2026 Xirfad Qardho. Connecting Somali trade skills and local industry.',
  },

  SO: {
    // Navigation
    nav_workers: 'Xirfadlayaasha',
    nav_jobs: 'Shaqooyinka',
    nav_dashboard: 'Maamulka',
    nav_admin: 'Portal-ka Maamulaha',
    nav_signin: 'Gal Koontada',
    nav_signup: 'Samayso Koonto',
    nav_more: 'Dheeraad',
    nav_about: 'Nala Soo Xiriir',
    nav_settings: 'Hagaajinta Koontada',
    nav_profile: 'Eeg Profile-ka',
    nav_edit_profile: 'Wax ka baddal Profile',
    nav_switch_employer: 'U baddal Qabte Shaqo',
    nav_switch_worker: 'U baddal Xirfadlaha',
    nav_signout: 'Ka bax',
    nav_language: 'Luqadda / Language',

    // Hero / Landing
    hero_badge: 'Qardho, Karkar',
    hero_title: 'Wada Xiriirinta Xirfadaha Soomaaliyeed & Ganacsiga',
    hero_subtitle: 'Kala hel farsamoyaqaanada cadceedda, tuumbistayaasha, korontayga, harqaanlayaasha iyo xirfadlayaasha Qardho.',
    hero_browse_workers: 'Daawo Xirfadlayaasha',
    hero_post_job: 'Gali Shaqo Cusub',
    hero_stat_workers: 'Xirfadlayaasha',
    hero_stat_jobs: 'Shaqooyinka Furan',
    hero_stat_neighborhoods: 'Xaafadaha Qardho',
    hero_featured_title: 'Xirfadlayaasha Ugu Caansan Qardho',
    hero_recent_jobs: 'Shaqooyinkii Ugu Dambeeyay',

    // Filtering & Search
    search_workers_placeholder: 'Raadi magaca xirfadlaha, xirfadda, ama bio...',
    search_jobs_placeholder: 'Raadi magaca shaqada, nooca, ama qoraalka...',
    filter_all_neighborhoods: 'Dhammaan Xaafadaha',
    filter_all_skills: 'Dhammaan Xirfadaha',
    filter_availability: 'Heeganka',
    filter_all_availability: 'Dhammaan Xaaladaha',
    filter_available: 'Hada Waa Diyaar',
    filter_busy: 'Mashquul',
    filter_unavailable: 'Ma Diyaara',

    // Common Actions & Badges
    btn_apply: 'Arayso Shaqada',
    btn_connect: 'Shaqaalaysii',
    btn_save: 'Kaydi',
    btn_cancel: 'Kaniisado',
    btn_close: 'Xir',
    btn_view_details: 'Eeg Faahfaahinta',
    badge_verified: 'Xirfadla la Hubiyay',
    badge_unverified: 'La ma hubin',
    badge_active: 'Socota',
    badge_open: 'Furan',
    badge_completed: 'Dhamaatay',

    // Dashboard & Profile
    dash_title: 'Maamulka',
    dash_subtitle: 'Kala soco shaqooyinkaaga socda, araajida, iyo dalabyada tooska ah ee Qardho.',
    dash_tab_applications: 'Araajida',
    dash_tab_connections: 'Dalabyada Tooska ah',
    dash_tab_active: 'Shaqada Socota',
    dash_tab_completed: 'Shaqadii Dhamaatay',
    dash_no_records: 'Wax natiijo ah ma jiraan.',

    // Categories
    cat_plumbing: 'Tuumbooyinka',
    cat_electrical: 'Shaqada Korontada',
    cat_solar: 'Rakibidda Cadceedda',
    cat_construction: 'Dhismaha',
    cat_tailoring: 'Harqaanka',
    cat_teaching: 'Waxdhigista',
    cat_farming: 'Beeraha',
    cat_repair: 'Hagaajinta Guud',

    // Landing Page Sections
    landing_find_by_skill_title: 'Raadi caawimaad marka loo eego xirfadda',
    landing_find_by_skill_desc: 'Daawo qeybaha xirfadaha ee ku jira profiles-ka shaqaalaha deegaanka.',
    landing_worker_count_singular: 'shaqaale',
    landing_worker_count_plural: 'shaqaale',

    landing_steps_eyebrow: 'Tallaabooyin fudud',
    landing_steps_title: 'Sida ay u shaqayso Xirfad Qardho',
    landing_steps_desc: 'Kaalmo labo dariiq oo cad ah oo loogu talagalay shaqaalaysiinta ama helida shaqo deegaanka.',

    landing_for_employers_title: 'Dadka u baahan shaqo in loo qabto',
    landing_employer_step_1: 'Ka raadi xirfad ama goob',
    landing_employer_step_2: 'La xiriir shaqaale ku habboon',
    landing_employer_step_3: 'Si toos ah ku heshiiya oo dhameystira shaqada',
    landing_find_workers_btn: 'Raadi Shaqaale',

    landing_for_workers_title: 'Shaqaalaha iyo Xirfadlayaasha',
    landing_worker_step_1: 'Samayso profile-ka xirfadlaha',
    landing_worker_step_2: 'Muuji xirfadahaaga, goobta, iyo qiimaha',
    landing_worker_step_3: 'Hel fariimaha oo u arayso shaqooyinka',
    landing_join_worker_btn: 'Ku soo biir Shaqaale ahaan',
    landing_open_dashboard_btn: 'Fuur Maamulka',

    landing_benefit_1_title: 'Profile-yada Shaqaalaha Deegaanka',
    landing_benefit_1_desc: 'Angaanayso xirfadaha, xaafadda, taariikhda, qiimaha, iyo heeganka xirfadlaha.',
    landing_benefit_2_title: 'Wada-xaajood Toos ah',
    landing_benefit_2_desc: 'U dir fariin toos ah shaqaalaha ama codsadayaasha oo ku heshiiya baaxadda, waqtiga, iyo lacagta.',
    landing_benefit_3_title: 'Natiijooyinka Xaafadaha U Gaarka Ah',
    landing_benefit_3_desc: 'Hel caawimaad xaafadaha Kaambo, Qoryacad, Xorgoble, Xiingood, Xiddo, Sheerbi, iyo Waaciye.',

    landing_featured_workers_title: 'Xirfadlayaasha Caanka ah',
    landing_featured_workers_desc: 'Muuqal gaab oo ku saabsan profile-yada shaqaalaha haatan ku jira platform-ka.',
    landing_view_all_workers: 'Eeg dhammaan shaqaalaha',
    landing_view_profile: 'Eeg Profile-ka',

    landing_available_jobs_title: 'Shaqooyinka Madaanka ah ee Qardho',
    landing_available_jobs_desc: 'Shaqaalaysiimaha ugu dambeeyay ee laga soo dhigay platform-ka.',
    landing_browse_all_jobs: 'Daawo dhammaan shaqooyinka',
    landing_view_job: 'Eeg Shaqada',

    landing_cta_title: 'Diyaar ma u tahay inaad helat xirfadlayaal Qardho?',
    landing_cta_desc: 'Raadi profile-yada deegaanka ama samayso akownka shaqaalaha si dadka deegaanka ay ula soo xiriiraan.',
    landing_cta_find_workers: 'Raadi Xirfadlayaal',
    landing_cta_create_profile: 'Samayso Profile Shaqaale',

    // Simplified Hero & Guest UX Keys
    hero_simple_title: 'Hel Shaqo Xirfadeed ama Shaqaalaysii Xirfadlayaal Qardho',
    hero_simple_subtitle: 'Hadii aad xirfad leedahay ama aad shaqo u baahan tahay, platform-kani waa kuu diyaar.',
    hero_card_worker_title: 'Waxaan ahay Xirfadle',
    hero_card_worker_desc: 'Muuji xirfaddaada, hel shaqaalaysiin deegaanka ah, oo dhis magacaaga Qardho.',
    hero_card_employer_title: 'Waxaan ahay Qabte Shaqo',
    hero_card_employer_desc: 'Gali shaqooyin oo shaqaalaysii korontayga, tuumbistayaal, iyo dhisayaal la hubiyay.',
    guest_modal_title: 'Ku soo biir Xirfad Qardho',
    guest_modal_desc: 'Gal koontada ama samayso akown si aad u sii wadato.',
    guest_tab_home: 'Hoyga',

    // Footer
    footer_copyright: '© 2026 Xirfad Qardho. Isku xirka xirfadaha Soomaaliyeed iyo ganacsiga deegaanka.',
  },

  AR: {
    // Navigation
    nav_workers: 'المهنيون',
    nav_jobs: 'الوظائف',
    nav_dashboard: 'لوحة التحكم',
    nav_admin: 'بوابة الإدارة',
    nav_signin: 'تسجيل الدخول',
    nav_signup: 'إنشاء حساب',
    nav_more: 'المزيد',
    nav_about: 'معلومات والتواصل',
    nav_settings: 'إعدادات المنصة',
    nav_profile: 'عرض الملف الشخصي',
    nav_edit_profile: 'تعديل الملف الشخصي',
    nav_switch_employer: 'التحويل لحساب صاحب عمل',
    nav_switch_worker: 'التحويل لحساب مهني',
    nav_signout: 'تسجيل الخروج',
    nav_language: 'اللغة / Language',

    // Hero / Landing
    hero_badge: 'قرضو، كركار',
    hero_title: 'ربط المهارات الصومالية بالصناعة والأعمال المحلية',
    hero_subtitle: 'اعثر على فنيي الطاقة الشمسية، السباكين، الكهربائيين، الخياطين والمهنيين المعتمدين في قرضو.',
    hero_browse_workers: 'استعراض المهنيين',
    hero_post_job: 'نشر عرض عمل',
    hero_stat_workers: 'مهنيون متخصصون',
    hero_stat_jobs: 'وظائف متاحة',
    hero_stat_neighborhoods: 'أحياء قرضو',
    hero_featured_title: 'أبرز المهنيين المتميزين في قرضو',
    hero_recent_jobs: 'أحدث عروض العمل',

    // Filtering & Search
    search_workers_placeholder: 'البحث باسم المهني، المهارة، أو الوصف...',
    search_jobs_placeholder: 'البحث باسم الوظيفة، الفئة، أو التفاصيل...',
    filter_all_neighborhoods: 'جميع الأحياء',
    filter_all_skills: 'جميع المهارات',
    filter_availability: 'الإتاحة',
    filter_all_availability: 'جميع الحالات',
    filter_available: 'متاح الآن',
    filter_busy: 'مشغول',
    filter_unavailable: 'غير متاح',

    // Common Actions & Badges
    btn_apply: 'التقديم على الوظيفة',
    btn_connect: 'توظيف المهني',
    btn_save: 'حفظ التغييرات',
    btn_cancel: 'إلغاء',
    btn_close: 'إغلاق',
    btn_view_details: 'عرض التفاصيل',
    badge_verified: 'مهني موثق',
    badge_unverified: 'غير موثق',
    badge_active: 'جاري التنفيذ',
    badge_open: 'مفتوح',
    badge_completed: 'مكتمل',

    // Dashboard & Profile
    dash_title: 'لوحة التحكم',
    dash_subtitle: 'متابعة أعمالك الحالية، طلبات التقديم، وعروض التوظيف المباشرة في قرضو.',
    dash_tab_applications: 'طلبات التقديم',
    dash_tab_connections: 'العروض المباشرة',
    dash_tab_active: 'الأعمال الجارية',
    dash_tab_completed: 'الأعمال المكتملة',
    dash_no_records: 'لا توجد سجلات لعرضها.',

    // Categories
    cat_plumbing: 'السباكة',
    cat_electrical: 'الأعمال الكهربائية',
    cat_solar: 'تركيب الطاقة الشمسية',
    cat_construction: 'البناء والإعمار',
    cat_tailoring: 'الخياطة',
    cat_teaching: 'التدريس',
    cat_farming: 'الزراعة',
    cat_repair: 'الصيانة العامة',

    // Landing Page Sections
    landing_find_by_skill_title: 'البحث عن المساعدة حسب المهارة',
    landing_find_by_skill_desc: 'تصفح المجالات المهنية الممثلة في ملفات الشغل الحالية.',
    landing_worker_count_singular: 'عامل',
    landing_worker_count_plural: 'عمال',

    landing_steps_eyebrow: 'خطوات بسيطة',
    landing_steps_title: 'كيف تعمل منصة حرف قرضو',
    landing_steps_desc: 'مساران واضحان لتوظيف العمالة المحلية أو العثور على عمل قريب.',

    landing_for_employers_title: 'للأفراد والجهات التي تحتاج إلى تنفيذ أعمال',
    landing_employer_step_1: 'البحث حسب المهارة أو الموقع',
    landing_employer_step_2: 'التواصل مع المهني المناسب',
    landing_employer_step_3: 'الاتفاق المباشر وإنجاز العمل',
    landing_find_workers_btn: 'البحث عن مهنيين',

    landing_for_workers_title: 'للمهنيين والعمال',
    landing_worker_step_1: 'إنشاء ملف شخصي مهني',
    landing_worker_step_2: 'عرض المهارات، الموقع، والسعر',
    landing_worker_step_3: 'استقبال الرسائل والتقديم على الوظائف',
    landing_join_worker_btn: 'الانضمام كمهني',
    landing_open_dashboard_btn: 'فتح لوحة التحكم',

    landing_benefit_1_title: 'ملفات المهنيين المحليين',
    landing_benefit_1_desc: 'مراجعة المهارات، المنطقة، السيرة الذاتية، السعر، والإتاحة عند توفرها.',
    landing_benefit_2_title: 'التفاوض المباشر',
    landing_benefit_2_desc: 'مراسلة المهنيين أو المتقدمين مباشرة والاتفاق على نطاق العمل والتوقيت والدفع.',
    landing_benefit_3_title: 'نتائج مخصصة حسب الأحياء',
    landing_benefit_3_desc: 'اعثر على مساعدة في أحياء كامبو، قريعد، خورغوبلي، حينغود، حدو، شيربي، وواعيي.',

    landing_featured_workers_title: 'أبرز المهنيين المتميزين',
    landing_featured_workers_desc: 'معاينة قصيرة لملفات المهنيين المتاحين حالياً في المنصة.',
    landing_view_all_workers: 'عرض جميع المهنيين',
    landing_view_profile: 'عرض الملف الشخصي',

    landing_available_jobs_title: 'الوظائف المتاحة في قرضو',
    landing_available_jobs_desc: 'أحدث الوظائف المحلية المعلنة من أصحاب العمل في المنصة.',
    landing_browse_all_jobs: 'استعراض جميع الوظائف',
    landing_view_job: 'عرض الوظيفة',

    landing_cta_title: 'هل أنت جاهز للعثور على عمالة ماهرة في قرضو؟',
    landing_cta_desc: 'ابحث في الملفات الشخصية المحلية أو أنشئ حساب مهني ليتمكن أصحاب العمل القريبون من التواصل معك.',
    landing_cta_find_workers: 'البحث عن عمالة ماهرة',
    landing_cta_create_profile: 'إنشاء ملف شخصي لمهني',

    // Simplified Hero & Guest UX Keys
    hero_simple_title: 'اعثر على عمل مهني محلي أو وظّف كفاءات موثوقة في قرضو',
    hero_simple_subtitle: 'سواء كنت تمتلك مهارة حرفية أو تحتاج لإنجاز عمل، المنصة تصلك مباشرة.',
    hero_card_worker_title: 'أنا مهني صاحب حرفة',
    hero_card_worker_desc: 'اعرض مهاراتك الحرفية، احصل على عروض عمل محلياً، وابنِ سمعتك في قرضو.',
    hero_card_employer_title: 'أنا صاحب عمل',
    hero_card_employer_desc: 'انشر عروض عمل ووظّف فنيي طاقة شمسية، سباكين، كهربائيين وبنّائين موثقين.',
    guest_modal_title: 'انضم إلى منصة حرف قرضو',
    guest_modal_desc: 'سجل الدخول أو أنشئ حساباً لمتابعة إجرائك.',
    guest_tab_home: 'الرئيسية',

    // Footer
    footer_copyright: '© 2026 حرف قرضو. ربط المهارات المهنية الصومالية بالصناعة المحلية.',
  },
};

