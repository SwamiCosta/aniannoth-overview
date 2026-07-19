import type { Language } from '@/context/LanguageContext'

const TRANSLATIONS = {
  nav_explore: { en: 'Explore', pt: 'Explorar' },
  nav_characters: { en: 'Characters', pt: 'Personagens' },
  nav_places: { en: 'Places', pt: 'Lugares' },
  nav_items: { en: 'Items', pt: 'Itens' },
  nav_lore: { en: 'Lore', pt: 'Lore' },

  filter_all: { en: 'All', pt: 'Todos' },
  filter_characters: { en: 'Characters', pt: 'Personagens' },
  filter_lore: { en: 'Lore', pt: 'Lore' },
  sidebar_no_entities: { en: 'No entities found.', pt: 'Nenhuma entidade encontrada.' },
  sidebar_expand: { en: 'Expand sidebar', pt: 'Expandir menu lateral' },
  sidebar_collapse: { en: 'Collapse sidebar', pt: 'Colapsar menu lateral' },

  map_no_maps_available: { en: 'No maps available', pt: 'Nenhum mapa disponível' },
  map_no_map_selected: { en: 'No map selected', pt: 'Nenhum mapa selecionado' },
  map_no_image_available: { en: 'No map image available', pt: 'Nenhuma imagem de mapa disponível' },
  map_reset_toast: {
    en: 'Map unavailable for this era. Redirected to default.',
    pt: 'Mapa indisponível para esta era. Redirecionado para o padrão.',
  },

  timeline_label: { en: 'timeline', pt: 'linha do tempo' },
} as const

export type TranslationKey = keyof typeof TRANSLATIONS

export function translate(key: TranslationKey, language: Language): string {
  return TRANSLATIONS[key][language]
}
