// frontend-web/lib/permissions/resource-descriptions.ts

import type {
  PermissionResource,
  PermissionAction,
} from './constants'

export interface ResourceDescription {
  title: string
  description: string
  actions: Partial<Record<PermissionAction, string>>
}

export const RESOURCE_DESCRIPTIONS: Record<PermissionResource, ResourceDescription> = {
  team: {
    title: 'Equipos',
    description: 'Equipos del club. Con scope TEAMS, el permiso solo aplica a los equipos seleccionados.',
    actions: {
      view: 'Ver la lista y el detalle de los equipos.',
      create: 'Crear equipos nuevos en el club.',
      edit: 'Editar datos del equipo (nombre, categoría, temporada).',
      delete: 'Eliminar equipos del club (acción irreversible).',
    },
  },
  member: {
    title: 'Miembros',
    description: 'Miembros del club o de un equipo. Incluye aceptar solicitudes y expulsar miembros.',
    actions: {
      view: 'Ver la lista de miembros.',
      create: 'Añadir miembros (reales o fantasma) al club o equipo.',
      edit: 'Editar la membresía (equipos asignados, resetear contraseña).',
      delete: 'Expulsar miembros o rechazar solicitudes.',
    },
  },
  invitation: {
    title: 'Invitaciones',
    description: 'Invitaciones para unirse a un equipo o club.',
    actions: {
      create: 'Generar enlaces o códigos de invitación.',
      delete: 'Revocar invitaciones pendientes.',
    },
  },
  membership_role: {
    title: 'Roles asignados',
    description: 'Asignación de roles a un miembro: añadir o quitar roles, cambiar su scope y sus equipos.',
    actions: {
      create: 'Añadir un rol a un miembro.',
      edit: 'Cambiar el scope o los equipos de un rol ya asignado.',
      delete: 'Quitar un rol a un miembro.',
    },
  },
  payment: {
    title: 'Pagos',
    description: 'Pagos y cuotas de los miembros.',
    actions: {
      view: 'Ver pagos.',
      create: 'Registrar pagos.',
      edit: 'Editar pagos existentes.',
      delete: 'Eliminar pagos.',
    },
  },
  session: {
    title: 'Sesiones de entrenamiento',
    description: 'Entrenamientos del equipo.',
    actions: {
      view: 'Ver la lista y detalle de sesiones.',
      create: 'Crear nuevas sesiones.',
      edit: 'Editar sesiones existentes.',
      delete: 'Eliminar sesiones.',
    },
  },
  match: {
    title: 'Partidos',
    description: 'Partidos del equipo.',
    actions: {
      view: 'Ver la lista y detalle de partidos.',
      create: 'Crear nuevos partidos.',
      edit: 'Editar partidos existentes.',
      delete: 'Eliminar partidos.',
    },
  },
  attendance: {
    title: 'Asistencia',
    description: 'Registro de asistencia a entrenamientos y partidos.',
    actions: {
      view: 'Ver la asistencia.',
      create: 'Registrar asistencia.',
      edit: 'Editar asistencia.',
      delete: 'Eliminar registros de asistencia.',
    },
  },
  season: {
    title: 'Planificación',
    description: 'Planificación de temporadas y objetivos.',
    actions: {
      view: 'Ver la planificación.',
      create: 'Crear planes de temporada.',
      edit: 'Editar planes de temporada.',
      delete: 'Eliminar planes de temporada.',
    },
  },
  event: {
    title: 'Calendario',
    description: 'Eventos genéricos del calendario (reuniones, torneos, etc.).',
    actions: {
      view: 'Ver el calendario.',
      create: 'Crear eventos en el calendario.',
      edit: 'Editar eventos del calendario.',
      delete: 'Eliminar eventos del calendario.',
    },
  },
  library: {
    title: 'Biblioteca',
    description: 'Biblioteca de recursos del club (documentos, vídeos, etc.).',
    actions: {
      view: 'Ver la biblioteca.',
      create: 'Añadir recursos a la biblioteca.',
      edit: 'Editar recursos existentes.',
      delete: 'Eliminar recursos.',
    },
  },
  document: {
    title: 'Playbook',
    description: 'Documentos de playbook (se muestran como "Playbook" en la UI).',
    actions: {
      view: 'Ver playbooks.',
      create: 'Crear playbooks.',
      edit: 'Editar playbooks.',
      delete: 'Eliminar playbooks.',
    },
  },
  club_settings: {
    title: 'Configuración del club',
    description: 'Configuración general del club: nombre, datos de contacto y recordatorios de pago.',
    actions: {
      view: 'Ver la configuración del club.',
      edit: 'Editar la configuración y los recordatorios del club.',
    },
  },
  club_branding: {
    title: 'Branding del club',
    description: 'Personalización visual del club (logo).',
    actions: {
      view: 'Ver el logo del club.',
      edit: 'Subir o eliminar el logo del club.',
    },
  },
  stats: {
    title: 'Estadísticas',
    description: 'Estadísticas deportivas de jugadores, equipos y partidos.',
    actions: {
      view: 'Ver estadísticas.',
      create: 'Crear sesiones de estadísticas.',
      edit: 'Editar estadísticas.',
      delete: 'Eliminar estadísticas.',
    },
  },
  role_admin: {
    title: 'Administración de roles',
    description: 'Administración de los roles del club y sus permisos.',
    actions: {
      view: 'Ver la lista de roles del club.',
      create: 'Crear roles nuevos.',
      edit: 'Editar los permisos de un rol.',
      delete: 'Eliminar roles del club.',
    },
  },
  player_profile: {
    title: 'Perfil de jugador',
    description: 'Perfil deportivo del jugador: posición, dorsal y datos básicos.',
    actions: {
      view: 'Ver el perfil deportivo de un jugador.',
      edit: 'Editar el perfil deportivo de un jugador.',
    },
  },
  stats_config: {
    title: 'Configuración de estadísticas',
    description: 'Configuración de qué métricas se registran y cómo se calculan.',
    actions: {
      view: 'Ver la configuración de estadísticas.',
      edit: 'Editar la configuración de estadísticas.',
    },
  },
  user_data: {
    title: 'Datos de usuario',
    description: 'Datos personales del usuario: email, username, teléfono.',
    actions: {
      view: 'Ver los datos personales de otros usuarios.',
    },
  },
  ghost_edit: {
    title: 'Edición de fantasmas',
    description: 'Perfil de jugadores fantasma (creados sin cuenta real).',
    actions: {
      edit: 'Editar los datos de un jugador fantasma (nombre, email, notas).',
    },
  },
}