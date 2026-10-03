import { appendCommunityPost } from '../../community/persist';

export async function shareWorkoutToCommunity({
  author,
  title = 'Workout complete',
  minutes = 0,
  moves = 0,
  streak = 0,
}) {
  await appendCommunityPost({
    id: `workout-${Date.now()}`,
    author: author || 'You',
    text: `Just finished on UFitness${
      streak > 0 ? ` · ${streak}-day streak` : ''
    }. ${moves} moves. Who's training next?`,
    likes: 0,
    comments: [],
    tags: ['Workout'],
    workoutStats: {
      title: title || 'Workout',
      durationMinutes: String(minutes),
      totalWeightKg: moves ? `${moves} moves` : undefined,
    },
  });
}
