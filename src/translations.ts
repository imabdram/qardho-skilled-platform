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
    hero_badge: 'Somali Skilled Marketplace',
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
    hero_badge: 'Sookha Xirfadlayaasha Qardho',
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
    hero_badge: 'سوق المهارات في قرضو',
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
    filter_availability: 'التاحية',
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

    // Footer
    footer_copyright: '© 2026 حرف قرضو. ربط المهارات المهنية الصومالية بالصناعة المحلية.',
  },
};
