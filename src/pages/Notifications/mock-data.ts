import type { Notification } from '@/types/notification';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'MISSION',
    title: 'Nueva misión disponible',
    message: 'Se agregó "Rechaza un popote o bolsa de plástico" a Semana sin plásticos.',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    read: false,
  },
  {
    id: 'notif-2',
    type: 'AUDIT',
    title: 'Evidencia aprobada',
    message: 'Tu registro de reciclaje fue validado por un administrador.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: 'notif-3',
    type: 'ACHIEVEMENT',
    title: '¡Nueva insignia desbloqueada!',
    message: 'Obtuviste la insignia "Guardián del agua".',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    read: false,
  },
  {
    id: 'notif-4',
    type: 'SOCIAL',
    title: 'Nuevo seguidor',
    message: 'carlos.iteso ahora sigue tu actividad.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
];
