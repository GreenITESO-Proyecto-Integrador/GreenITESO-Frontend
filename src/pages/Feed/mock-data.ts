import type { Post } from '@/types/feed';

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    author: { id: 'user-1', nickname: 'AnaVerde' },
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    content: '¡Completé mi meta de la semana rechazando popotes de plástico! 🌱',
    type: 'MISSION_COMPLETED',
  },
  {
    id: 'post-2',
    author: { id: 'user-2', nickname: 'carlos.iteso' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    content: 'Registré 2kg de reciclaje en el punto verde de la biblioteca.',
    type: 'ACTION_LOG',
  },
  {
    id: 'post-3',
    author: { id: 'user-3', nickname: 'sofia_eco' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    content: '¡Desbloqueé la insignia "Guardián del agua" por ahorrar 500 litros este mes!',
    type: 'ACHIEVEMENT',
  },
];
