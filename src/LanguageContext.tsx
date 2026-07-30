import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TRANSLATIONS } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('qardho-language') as Language;
    return saved && ['EN', 'SO', 'AR'].includes(saved) ? saved : 'EN';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('qardho-language', lang);
  };

  useEffect(() => {
    const langCode = language === 'SO' ? 'so' : language === 'AR' ? 'ar' : 'en';
    const isRtl = language === 'AR';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = langCode;
    document.documentElement.setAttribute('data-lang', language);
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.EN[key] || fallback || key;
  };

  const dir = language === 'AR' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
