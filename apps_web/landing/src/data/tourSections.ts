/**
 * Product Tour Sections Data
 * Extracted and structured from ESQUEMA_UI_DESKTOP.md
 */

export interface TourSection {
  id: string;
  title: string;
  description: string;
  features: string[];
  icon: string;
  image: string;
}

export const tourSections: TourSection[] = [
  {
    id: 'welcome-screen',
    title: 'Pantalla de Benvinguda',
    description: 'Comença el teu projecte des de zero o obre un document existent en tan sols un clic.',
    features: [
      'Crear nous documents buits',
      'Obrir fitxers .gep o .json existents',
      'Accés ràpid a fitxers recents',
      'Interfície intuïtiva i simple',
    ],
    icon: 'HomeIcon',
    image: '01_PantallaInici_fosc.png',
  },
  {
    id: 'calendar-view',
    title: 'Vista de Calendari',
    description: 'Visualitza tots els teus esdeveniments en un calendari integrat, amb sincronització amb Google Calendar.',
    features: [
      'Calendari multivista (Mes, Setmana, Agenda, 2, 4 o 6 Mesos)',
      'Sincronització amb Google Calendar (beta)',
      'Crear esdeveniments amb un simple clic',
      'Navegar ràpidament entre dates',
    ],
    icon: 'CalendarIcon',
    image: '02_vistaCalendari_fosc.png',
  },
  {
    id: 'events-list',
    title: 'Llista d\'Esdeveniments',
    description: 'Gestiona tots els teus bolos en una vista completa amb controls avançats de filtratge i ordenació.',
    features: [
      'Filtres avançats (lloc, persona, estat, data)',
      'Ordenació dinàmica i cerca global',
      'Targetes d\'assignacions amb estat visual',
      'Exporta a PDF i CSV instantàniament',
    ],
    icon: 'ListIcon',
    image: '03_llistaEvents_fosc.png',
  },
  {
    id: 'summaries',
    title: 'Resums i Informes',
    description: 'Genera informes intel·ligents basats en les dades entrades.',
    features: [
      'Informes per esdeveniment, data o persona',
      'Opcions d\'ordenació flexible',
      'Exportació a CSV i PDF',
      'Anàlisi instantània de dades',
    ],
    icon: 'ChartIcon',
    image: '04_resums_fosc.png',
  },
  {
    id: 'technical-sheets',
    title: 'Fitxes de Bolo',
    description: 'Crea fitxes tècniques amb horaris, contactes, material, necessitats específiques, entre altres.',
    features: [
      'Generació automàtica de fitxes de bolo',
      'Detalls d\'horaris i Personal Tècnic',
      'Visualització d\'estoc disponible',
      'Exportació directa a PDF',
    ],
    icon: 'DocumentIcon',
    image: '21_fitxesdebolo_fosc.png',
  },
  {
    id: 'people-management',
    title: 'Gestió de Personal',
    description: 'Mantén una base de dades de personal amb tota la informació de contacte i especialitzacions.',
    features: [
      'Afegir, editar i eliminar contactes',
      'Associar rols especialitzats (tècnic, artístic, etc)',
      'Cerques i filtres per rol',
      'Importa / Exporta la teva xarxa de contactes',
    ],
    icon: 'UsersIcon',
    image: '31_persones_fosc.png',
  },
  {
    id: 'material-management',
    title: 'Gestor de Material',
    description: 'Controla l\'inventari i la demanda de material per a cada esdeveniment amb precisió.',
    features: [
      'Inventari per categories o per nom',
      'Estoc en temps real i detecció de demanda',
      'Centre de control avançat',
      'Importa / Exporta l\'inventari i exporta informes',
    ],
    icon: 'BoxIcon',
    image: '41_material_fosc.png',
  },
  {
    id: 'menu-bar',
    title: 'Barra de Menú Superior',
    description: 'Accés complet a totes les funcions de l\'aplicació amb accions ràpides i integrades.',
    features: [
      'Menú Arxiu: Guardar, Importar, Exportar, Configuració de Google Calendar',
      'Menú Edita: Desfer, Refer, Tallar, Copiar, Enganxar',
      'Accions ràpides: Zoom, Pantalla completa, Temes',
      'Accés a còpies de seguretat i registres de l\’aplicació.',
    ],
    icon: 'MenuIcon',
    image: 'desktop-dashboard.png',
  },
];
