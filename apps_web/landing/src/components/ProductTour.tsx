import React, { useState } from 'react';
import { tourSections } from '../data/tourSections';

// Icon mapping for tour sections
const iconMap: Record<string, React.ReactNode> = {
  HomeIcon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l8-5 8 5M5 10v10a1 1 0 001 1h3m10-11l2 3m-2-3v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  CalendarIcon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  ListIcon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  ChartIcon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  DocumentIcon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  UsersIcon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20h12a6 6 0 00-6-6 6 6 0 00-6 6z" />
    </svg>
  ),
  BoxIcon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 015.646 5.646 9 9 0 0120.354 15.354z" />
    </svg>
  ),
  MenuIcon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
};

export default function ProductTour() {
  const [activeSection, setActiveSection] = useState(0);
  const currentSection = tourSections[activeSection];

  return (
    <section id="product-tour" className="py-20 bg-dark-900 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 text-sm font-medium text-cyan-400 bg-cyan-900/30 rounded-full mb-4">
            Explora la interfície
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tour Interactiu de Funcionalitats</h2>
          <p className="text-lg text-gray-400">
            Descobreix les principals funcions de la nostra aplicació i com pot transformar la teva gestió d'esdeveniments.
          </p>
        </div>

        {/* Main tour container */}
        <div className="max-w-6xl mx-auto">
          {/* Desktop: Two-column layout */}
          <div className="hidden lg:grid lg:grid-cols-[300px_1fr] gap-8">
            {/* Left sidebar navigation */}
            <div className="space-y-3">
              {tourSections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(index)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-300 flex items-center gap-3 ${
                    activeSection === index
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-white shadow-lg shadow-cyan-500/20'
                      : 'bg-dark-800 border border-dark-700 text-gray-400 hover:border-dark-600 hover:text-gray-300'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 ${
                      activeSection === index ? 'text-cyan-400' : 'text-gray-500'
                    }`}
                  >
                    {iconMap[section.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${activeSection === index ? 'text-white' : ''}`}>
                      {section.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Right content area */}
            <div className="backdrop-blur-sm bg-dark-800/50 border border-dark-700 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 transition-all duration-500">
              {/* Image section */}
              <div className="relative bg-dark-900 h-80 overflow-hidden">
                <img
                  src={`/images/${currentSection.image}`}
                  alt={currentSection.title}
                  className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/desktop-dashboard.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
              </div>

              {/* Content section */}
              <div className="p-8">
                <h3 className="text-3xl font-bold text-white mb-3">{currentSection.title}</h3>
                <p className="text-lg text-gray-300 mb-6">{currentSection.description}</p>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wider">
                    Funcionalitats principals
                  </h4>
                  <ul className="space-y-2">
                    {currentSection.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs mt-0.5">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Navigation dots */}
                <div className="flex items-center justify-between pt-4 border-t border-dark-700">
                  <div className="flex gap-2">
                    {tourSections.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSection(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === activeSection ? 'bg-cyan-500 w-8' : 'bg-dark-600 w-2 hover:bg-dark-500'
                        }`}
                        aria-label={`Go to section ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    {activeSection + 1} / {tourSections.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Stacked accordion layout */}
          <div className="lg:hidden space-y-4">
            {tourSections.map((section, index) => (
              <div
                key={section.id}
                className={`rounded-xl overflow-hidden border transition-all duration-300 ${
                  activeSection === index
                    ? 'border-cyan-500/50 bg-dark-800'
                    : 'border-dark-700 bg-dark-800/50'
                }`}
              >
                {/* Accordion header */}
                <button
                  onClick={() => setActiveSection(index)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-dark-700/50 transition-colors"
                >
                  <div className={`flex-shrink-0 w-6 h-6 ${activeSection === index ? 'text-cyan-400' : 'text-gray-500'}`}>
                    {iconMap[section.icon]}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white text-sm">{section.title}</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      activeSection === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {/* Accordion content */}
                {activeSection === index && (
                  <div className="border-t border-dark-700 p-4 space-y-4">
                    <img
                      src={`/images/${section.image}`}
                      alt={section.title}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/desktop-dashboard.png';
                      }}
                    />
                    <p className="text-gray-300 text-sm">{section.description}</p>
                    <div>
                      <h4 className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">
                        Funcionalitats principals
                      </h4>
                      <ul className="space-y-1.5">
                        {section.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-300 text-xs">
                            <span className="flex-shrink-0 text-cyan-400 mt-0.5">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
