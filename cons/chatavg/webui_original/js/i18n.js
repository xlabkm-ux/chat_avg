import { state } from './state.js';

export const I18N = {
  ru: {
    new_chat:"Новый чат", chat:"Чат", setup:"Настройки",
    status_online:"Подключено", status_offline:"Нет связи", status_connecting:"Подключение...",
    chat_title:"ИИ чат", placeholder:"Введите сообщение...",
    welcome_title:"Добро пожаловать!", welcome_subtitle:"Я Chat AVG — локальный ИИ-ассистент. Задайте мне вопрос или загрузите документ для анализа.",
    hint_code:"💡 Помоги разобраться", hint_text:"✍️ Напиши текст", hint_doc:"📄 Анализ документа", hint_translate:"🌐 Переведи",
    drop_files:"Перетащите файлы сюда",
    setup_title:"Настройки", lang_section:"Язык интерфейса", user_profile:"Профиль пользователя",
    system_prompt_label:"Системный промпт", system_prompt_placeholder:"Инструкции для модели...",
    gen_params:"Параметры генерации",
    hint_temperature:"Креативность ответов", hint_top_p:"Ядерная выборка", hint_top_k:"Количество кандидатов",
    hint_min_p:"Минимальная вероятность", hint_repeat_penalty:"Штраф за повторения", hint_max_tokens:"Макс. длина ответа",
    max_tokens_label:"Макс. токенов", optional:"(опционально)", save_btn:"Сохранить настройки",
    copy:"Копировать", copied:"Скопировано!", thinking:"Размышление",
    doc_too_large:"⚠️ Документы (~{tokens} токенов) превышают контекстное окно ({ctx}). Увеличьте параметр -c в start_offline.cmd до {recommend}.",
    max_docs:"Максимум 10 документов", saved:"Настройки сохранены!",
    error_server:"Ошибка: не удалось связаться с сервером.",
    stats_time:"Время: {s}с", stats_tokens:"Токены: {t}", stats_speed:"Скорость: {ts} т/с",
    prompt_explain_code:"Проконсультируй меня: ", prompt_write_text:"Напиши краткий текст на тему: ",
    prompt_analyze_doc:"Проанализируй загруженный документ и дай краткое изложение.", prompt_translate:"Переведи следующий текст на английский: "
  },
  en: {
    new_chat:"New Chat", chat:"Chat", setup:"Settings",
    status_online:"Connected", status_offline:"Disconnected", status_connecting:"Connecting...",
    chat_title:"AI Chat", placeholder:"Type a message...",
    welcome_title:"Welcome!", welcome_subtitle:"I'm Chat AVG — a local AI assistant. Ask me a question or upload a document for analysis.",
    hint_code:"💡 Help me understand", hint_text:"✍️ Write text", hint_doc:"📄 Analyze document", hint_translate:"🌐 Translate",
    drop_files:"Drop files here",
    setup_title:"Settings", lang_section:"Interface Language", user_profile:"User Profile",
    system_prompt_label:"System Prompt", system_prompt_placeholder:"Instructions for the model...",
    gen_params:"Generation Parameters",
    hint_temperature:"Response creativity", hint_top_p:"Nucleus sampling", hint_top_k:"Number of candidates",
    hint_min_p:"Minimum probability", hint_repeat_penalty:"Repetition penalty", hint_max_tokens:"Max response length",
    max_tokens_label:"Max Tokens", optional:"(optional)", save_btn:"Save Settings",
    copy:"Copy", copied:"Copied!", thinking:"Thinking",
    doc_too_large:"⚠️ Documents (~{tokens} tokens) exceed context window ({ctx}). Increase -c parameter in start_offline.cmd to {recommend}.",
    max_docs:"Maximum 10 documents", saved:"Settings saved!",
    error_server:"Error: could not connect to the server.",
    stats_time:"Time: {s}s", stats_tokens:"Tokens: {t}", stats_speed:"Speed: {ts} t/s",
    prompt_explain_code:"Explain how this code works: ", prompt_write_text:"Write a short text about: ",
    prompt_analyze_doc:"Analyze the uploaded document and provide a summary.", prompt_translate:"Translate the following text to Russian: "
  }
};

export function t(key, replacements) {
  let s = I18N[state.lang]?.[key] || I18N.en[key] || key;
  if (replacements) Object.entries(replacements).forEach(([k,v]) => s = s.replace(`{${k}}`, v));
  return s;
}

export function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.documentElement.lang = state.lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
}
