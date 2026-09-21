import { getRecipe } from '../data/recipes';
import { appendCommunityPost } from '../../community/persist';

export async function shareMealToCommunity(meal, author) {
  const recipe = getRecipe(meal?.recipeId);
  const steps = (recipe?.steps || []).map((step) => String(step).trim()).filter(Boolean);
  const youtubeId = recipe?.video?.youtubeId;
  if (!steps.length || !youtubeId) {
    throw new Error('This plate needs cook steps and a cook-along video before it can go on Community.');
  }

  const protein = meal?.tags?.some((tag) => /protein/i.test(tag.label));
  await appendCommunityPost({
    id: `meal-${meal.recipeId}-${Date.now()}`,
    author: author || 'You',
    text: `Shared from the meal planner: ${meal.title}`,
    likes: 0,
    comments: [],
    recipe: {
      title: meal.title,
      goal: protein ? 'High-protein' : 'Post-workout',
      ingredients: (recipe.portions || []).map((item) => item.label),
      steps,
      youtubeId,
      youtubeTitle: recipe.video?.title || meal.title,
    },
  });
}
