import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function documentShell(title, body) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { margin: 18mm; }
      body { font-family: Helvetica, Arial, sans-serif; color: #181C1E; margin: 0; }
      h1 { color: #A04100; font-size: 22px; margin: 0 0 4px; }
      h2 { font-size: 15px; margin: 18px 0 8px; }
      p, td, th, li { font-size: 12px; line-height: 1.45; }
      .muted { color: #5A4136; }
      .brand { font-size: 12px; font-weight: 700; color: #A04100; letter-spacing: 0.4px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #E8DDD6; padding: 8px 6px; text-align: left; vertical-align: top; }
      th { color: #5A4136; font-size: 10px; letter-spacing: 0.4px; }
      .meta { margin: 0 0 16px; }
    </style>
  </head>
  <body>
    <div class="brand">UFITNESS</div>
    ${body}
    <p class="muted">Generated for campus use. Numbers are student estimates, not medical advice.</p>
  </body>
</html>`;
}

export async function exportHtmlPdf(title, html) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return { printed: true };
  }
  const file = await Print.printToFileAsync({ html });
  if (await isAvailableAsync()) {
    await shareAsync(file.uri, {
      UTI: 'com.adobe.pdf',
      mimeType: 'application/pdf',
      dialogTitle: title,
    });
  } else {
    await Print.printAsync({ uri: file.uri });
  }
  return file;
}

export function mealPlanHtml({ studentName, budget, weeklyCost, days, grocery }) {
  const dayRows = days
    .map(
      (day) => `<tr>
        <td><strong>${escapeHtml(day.label)}</strong></td>
        <td>${escapeHtml(day.breakfast.name)}<br/><span class="muted">${escapeHtml(day.breakfast.calories)} kcal · R${escapeHtml(day.breakfast.cost)}</span></td>
        <td>${escapeHtml(day.lunch.name)}<br/><span class="muted">${escapeHtml(day.lunch.calories)} kcal · R${escapeHtml(day.lunch.cost)}</span></td>
        <td>${escapeHtml(day.dinner.name)}<br/><span class="muted">${escapeHtml(day.dinner.calories)} kcal · R${escapeHtml(day.dinner.cost)}</span></td>
      </tr>`
    )
    .join('');

  const groceryRows = (grocery || [])
    .map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>R${escapeHtml(item.price)}</td></tr>`)
    .join('');

  return documentShell(
    'UFitness meal plan',
    `<h1>Weekly meal plan</h1>
     <p class="meta muted">${escapeHtml(studentName || 'Student')} · Weekly food budget R${escapeHtml(budget)} · Estimated cost R${escapeHtml(weeklyCost)}</p>
     <h2>Meals</h2>
     <table>
       <thead><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th></tr></thead>
       <tbody>${dayRows}</tbody>
     </table>
     <h2>Grocery list</h2>
     <table>
       <thead><tr><th>Item</th><th>Est. price</th></tr></thead>
       <tbody>${groceryRows}</tbody>
     </table>`
  );
}

export function shoppingListHtml({ studentName, budget, items, total }) {
  const rows = (items || [])
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.category || '')}</td>
        <td>${escapeHtml(item.unit || '')}</td>
        <td>R${escapeHtml(item.price)}</td>
      </tr>`
    )
    .join('');

  return documentShell(
    'UFitness shopping list',
    `<h1>Shopping list</h1>
     <p class="meta muted">${escapeHtml(studentName || 'Student')} · Budget R${escapeHtml(budget)} · List total R${escapeHtml(total)}</p>
     <table>
       <thead><tr><th>Item</th><th>Category</th><th>Unit</th><th>Est. price</th></tr></thead>
       <tbody>${rows}</tbody>
     </table>`
  );
}
