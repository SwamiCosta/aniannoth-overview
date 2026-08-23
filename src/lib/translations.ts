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
  filter_items: { en: 'Items', pt: 'Itens' },
  filter_factions: { en: 'Factions', pt: 'Facções' },
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

  auth_signing_in: { en: 'Signing in…', pt: 'Entrando…' },
  auth_login: { en: 'Sign in as admin', pt: 'Entrar como admin' },
  auth_logout: { en: 'Sign out', pt: 'Sair' },
  auth_admin_badge: { en: 'Admin', pt: 'Admin' },
  auth_session_expired: {
    en: 'Your session expired — signed out. Please sign in again.',
    pt: 'Sua sessão expirou — você foi desconectado. Faça login novamente.',
  },

  map_edit_mode_on: { en: 'Editing pins — click the map to add one', pt: 'Editando pins — clique no mapa para adicionar' },
  map_edit_mode_enter: { en: 'Edit pins', pt: 'Editar pins' },
  map_edit_mode_exit: { en: 'Done editing', pt: 'Concluir edição' },
  map_pin_search_placeholder: { en: 'Search entities…', pt: 'Buscar entidades…' },
  map_pin_no_matches: { en: 'No matching entities', pt: 'Nenhuma entidade encontrada' },
  map_pin_cancel: { en: 'Cancel', pt: 'Cancelar' },
  map_pin_delete_confirm: { en: 'Delete this pin?', pt: 'Excluir este pin?' },
  map_pin_create_title: { en: 'New pin', pt: 'Novo pin' },
  map_pin_edit_title: { en: 'Edit pin', pt: 'Editar pin' },
  map_pin_name_label: { en: 'Pin name', pt: 'Nome do pin' },
  map_pin_name_placeholder: { en: 'Leave blank to use the linked entity\'s name', pt: 'Deixe em branco para usar o nome da entidade vinculada' },
  map_pin_era_scope_label: { en: 'Show this pin in', pt: 'Mostrar este pin em' },
  map_pin_era_scope_all: { en: 'All eras', pt: 'Todas as eras' },
  map_pin_era_scope_current: { en: 'This era only', pt: 'Somente esta era' },
  map_pin_entity_label: { en: 'Linked entity (optional)', pt: 'Entidade vinculada (opcional)' },
  map_pin_change_entity: { en: 'Change', pt: 'Trocar' },
  map_pin_delete: { en: 'Delete', pt: 'Excluir' },
  map_pin_create: { en: 'Create', pt: 'Criar' },
  map_pin_save: { en: 'Save', pt: 'Salvar' },

  hidden_content_title: { en: 'A riddle blocks your way', pt: 'Um enigma bloqueia seu caminho' },
  hidden_content_password_placeholder: { en: 'Answer…', pt: 'Resposta…' },
  hidden_content_submit: { en: 'Submit', pt: 'Enviar' },
  hidden_content_submitting: { en: 'Checking…', pt: 'Verificando…' },
  hidden_content_wrong_password: { en: 'That is not the answer.', pt: 'Essa não é a resposta.' },
  hidden_content_load_error: { en: 'Could not load the riddle.', pt: 'Não foi possível carregar o enigma.' },
  hidden_content_locked_link: { en: 'Locked content', pt: 'Conteúdo bloqueado' },
} as const

export type TranslationKey = keyof typeof TRANSLATIONS

export function translate(key: TranslationKey, language: Language): string {
  return TRANSLATIONS[key][language]
}
