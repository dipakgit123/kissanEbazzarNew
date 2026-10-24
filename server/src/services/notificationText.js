const messages = require('./notificationMessages.json');
const renderMessage = (key, language = 'en', args = {}) => {
  const index = { en: 0, mr: 1, hi: 2 }[String(language).split('-')[0]] || 0;
  const pair = messages[key]?.[index] || messages[key]?.[0];
  if (!pair) return null;
  const render = text => text.replace(/\{\{(\w+)\}\}/g, (_, name) => String(args[name] ?? '').slice(0, 120));
  return { title: render(pair[0]), body: render(pair[1]) };
};
module.exports = { renderMessage };
