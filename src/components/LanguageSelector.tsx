/**
 * =============================================================================
 * LANGUAGE SELECTOR
 * =============================================================================
 * DESCRIPCIÓ:
 * Component selector d'idioma per canviar entre català, castellà i anglès.
 *
 * ÍNDEX:
 * - COMPONENT PRINCIPAL: LanguageSelector amb menú desplegable d'idiomes.
 * - HANDLERS: changeLanguage per canviar idioma i persistir-lo.
 * =============================================================================
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector: React.FC = () => {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
        // Persist to localStorage manually if detector doesn't catch it immediately, though config handles it.
        localStorage.setItem('i18nextLng', lng);
    };

    const languages = [
        { code: 'ca', label: 'Català' },
        { code: 'es', label: 'Castellà' },
        { code: 'en', label: 'English' },
    ];

    const currentLang = languages.find(l => l.code === i18n.language) || languages.find(l => l.code === i18n.language.substring(0, 2)) || languages[0];

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-accent transition-colors"
                title={t('common.change_language_tooltip')}
            >
                <Globe size={16} className="text-secondary-foreground" />
                <span className="text-xs font-medium text-secondary-foreground uppercase">{currentLang.code}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 ring-1 ring-black ring-opacity-5">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`block w-full text-left px-4 py-2 text-sm ${i18n.language.startsWith(lang.code)
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
