import fs from 'fs';

const enContent = fs.readFileSync('src/i18n/translations/en.ts', 'utf-8');
const ruContent = fs.readFileSync('src/i18n/translations/ru.ts', 'utf-8');

const re = /'([\w.]+)'\s*:\s*'([^']+)'/g;
const enKeys = {};
let m;
while ((m = re.exec(enContent)) !== null) enKeys[m[1]] = m[2];

const ruKeys = {};
const re2 = /'([\w.]+)'\s*:\s*'([^']+)'/g;
let m2;
while ((m2 = re2.exec(ruContent)) !== null) ruKeys[m2[1]] = m2[2];

const missing = Object.keys(enKeys).filter((k) => !ruKeys[k]);
console.log('en.ts keys:', Object.keys(enKeys).length);
console.log('ru.ts keys:', Object.keys(ruKeys).length);
console.log('Missing in ru.ts:', missing.length);

const dict = {
    Add: 'Добавить',
    Active: 'Активные',
    All: 'Все',
    Available: 'Доступные',
    Back: 'Назад',
    Budget: 'Бюджет',
    Cancel: 'Отмена',
    Clear: 'Очистить',
    Close: 'Закрыть',
    Config: 'Конфиг',
    Confirm: 'Подтвердить',
    Copy: 'Копировать',
    Cost: 'Стоимость',
    Create: 'Создать',
    Dashboard: 'Панель',
    Debate: 'Дебаты',
    Delete: 'Удалить',
    Disabled: 'Отключено',
    Edit: 'Редактировать',
    Empty: 'Пусто',
    Enabled: 'Включено',
    Error: 'Ошибка',
    Export: 'Экспорт',
    Filter: 'Фильтр',
    Health: 'Здоровье',
    History: 'История',
    Import: 'Импорт',
    Info: 'Информация',
    Latency: 'Задержка',
    Loading: 'Загрузка',
    Memory: 'Память',
    Monthly: 'Ежемесячно',
    Name: 'Имя',
    New: 'Новый',
    Next: 'Далее',
    No: 'Нет',
    None: 'Нет',
    Overview: 'Обзор',
    Pending: 'В ожидании',
    Provider: 'Провайдер',
    Remove: 'Удалить',
    Reset: 'Сброс',
    Route: 'Маршрут',
    Save: 'Сохранить',
    Search: 'Поиск',
    Select: 'Выбрать',
    Settings: 'Настройки',
    Show: 'Показать',
    Status: 'Статус',
    Submit: 'Отправить',
    Success: 'Успешно',
    Timeout: 'Таймаут',
    Today: 'Сегодня',
    Token: 'Токен',
    Total: 'Всего',
    Update: 'Обновить',
    Usage: 'Использование',
    Warning: 'Предупреждение',
    Yes: 'Да',
    Minute: 'Минута',
    Hour: 'Час',
    Day: 'День',
    Days: 'Дни',
    Week: 'Неделя',
    Month: 'Месяц',
    Templates: 'Шаблоны',
    Analytics: 'Аналитика',
    Sessions: 'Сессии',
    Session: 'Сессия',
    Key: 'Ключ',
    Keys: 'Ключи',
    Model: 'Модель',
    Models: 'Модели',
    Metrics: 'Метрики',
    Help: 'Помощь',
    Default: 'По умолчанию',
    Speed: 'Скорость',
    Chart: 'График',
    Trend: 'Тренд',
    Insight: 'Инсайт',
    Score: 'Оценка',
    Limit: 'Лимит',
    Quota: 'Квота',
    Average: 'Среднее',
    Max: 'Макс',
    Min: 'Мин',
    Notification: 'Уведомление',
    Strategy: 'Стратегия',
    Timer: 'Таймер',
    Countdown: 'Обратный отсчет',
};

function toRu(s) {
    return s
        .split(' ')
        .map((w) => dict[w] || w)
        .join(' ');
}

let buf = '';
for (const k of missing) {
    const v = toRu(enKeys[k]).replace(/'/g, "\\'");
    buf += "    '" + k + "': '" + v + "',\n";
}

const ip = ruContent.lastIndexOf('};');
fs.writeFileSync('src/i18n/translations/ru.ts', ruContent.slice(0, ip) + buf + '};\n', 'utf-8');
console.log('Added', missing.length, 'entries to ru.ts');

// verify
const vc = fs.readFileSync('src/i18n/translations/ru.ts', 'utf-8');
const vkeys = {};
const vr = /'([\w.]+)'\s*:\s*'([^']+)'/g;
let vm;
while ((vm = vr.exec(vc)) !== null) vkeys[vm[1]] = vm[2];
console.log('ru.ts now has', Object.keys(vkeys).length, 'keys');
const sm = Object.keys(enKeys).filter((k) => !vkeys[k]);
console.log('Still missing:', sm.length);
