// supabase-client.js - РАБОЧАЯ ВЕРСИЯ

// === ВАШИ ДАННЫЕ SUPABASE ===
// Замените на реальные значения!
const SUPABASE_URL = "https://goopawxoqziytbxdnriy.supabase.co";
const SUPABASE_KEY = "sb_publishable_8bngfypOUpPs66wzRywfNw_Q7-Soz64";

console.log('🚀 Начинаю инициализацию Supabase...');

// Функция для создания клиента
function initSupabase() {
    try {
        // ПРОВЕРКА 1: Библиотека загружена?
        if (typeof supabase === 'undefined') {
            console.error('❌ Библиотека Supabase не загрузилась!');
            console.log('Убедитесь, что подключен скрипт:');
            console.log('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
            createMockClient();
            return;
        }

        // ПРОВЕРКА 2: Данные вставлены?
        if (SUPABASE_URL.includes('ваш-') || SUPABASE_KEY.includes('ваш-')) {
            console.error('❌ Замените SUPABASE_URL и SUPABASE_KEY на ваши значения!');
            console.log('Где взять:');
            console.log('1. Откройте Supabase Dashboard');
            console.log('2. Ваш проект → Settings → API');
            console.log('3. Project URL → SUPABASE_URL');
            console.log('4. "anon" key → SUPABASE_KEY');
            createMockClient();
            return;
        }

        console.log('✅ Библиотека загружена, создаю клиент...');

        // СОЗДАЕМ КЛИЕНТ
        const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: false
            }
        });

        // Сохраняем в window для Alpine.js
        window.supabase = client;

        console.log('✅ Supabase клиент создан!');
        console.log('Теперь window.supabase:', typeof window.supabase.from);

        // Тестовый запрос
        testConnection();

    } catch (error) {
        console.error('❌ Неожиданная ошибка:', error);
        createMockClient();
    }
}

// Функция теста подключения
async function testConnection() {
    try {
        console.log('🔄 Тестирую подключение к базе данных...');

        const { data, error } = await window.supabase
            .from('plant_species')
            .select('*')
            .limit(2);

        if (error) {
            console.error('❌ Ошибка подключения к Supabase:', error);
            console.log('💡 Возможные причины:');
            console.log('1. Неправильный URL или ключ');
            console.log('2. Проблема с CORS (добавьте в Supabase: Settings → API → Site URL)');
            console.log('3. Таблица plant_species не создана');
        } else {
            console.log(`✅ Подключение успешно! Найдено растений: ${data.length}`);
            if (data.length > 0) {
                console.log('Первое растение:', data[0].name);
            }
        }
    } catch (err) {
        console.error('❌ Ошибка теста:', err);
    }
}

// Заглушка для разработки
function createMockClient() {
    console.warn('⚠️ Создаю заглушку Supabase для локальной разработки');

    window.supabase = {
        from: function (table) {
            console.log(`[ЗАГЛУШКА] Запрос к таблице: ${table}`);

            return {
                select: function () {
                    console.log(`[ЗАГЛУШКА] SELECT из ${table}`);

                    // Возвращаем тестовые данные
                    if (table === 'plant_species') {
                        return Promise.resolve({
                            data: [
                                { id: 1, name: 'Фикус Бенджамина', watering_days: 7, description: 'Тестовое растение 1' },
                                { id: 2, name: 'Кактус', watering_days: 14, description: 'Тестовое растение 2' },
                                { id: 3, name: 'Орхидея', watering_days: 5, description: 'Тестовое растение 3' }
                            ],
                            error: null
                        });
                    }

                    if (table === 'plants') {
                        return Promise.resolve({
                            data: [
                                {
                                    id: 1,
                                    user_id: 123456789,
                                    custom_name: 'Мой фикус',
                                    species_id: 1,
                                    watering_days: 7,
                                    last_watered: '2024-03-10',
                                    notes: 'Тестовое растение'
                                }
                            ],
                            error: null
                        });
                    }

                    return Promise.resolve({ data: [], error: null });
                },
                insert: function (data) {
                    console.log(`[ЗАГЛУШКА] INSERT в ${table}:`, data);
                    return Promise.resolve({
                        data: [{ id: Date.now(), ...data[0] }],
                        error: null
                    });
                },
                update: function (data) {
                    console.log(`[ЗАГЛУШКА] UPDATE в ${table}:`, data);
                    return Promise.resolve({ data: [], error: null });
                },
                delete: function () {
                    console.log(`[ЗАГЛУШКА] DELETE из ${table}`);
                    return Promise.resolve({ data: [], error: null });
                },
                eq: function (column, value) {
                    return {
                        select: function () {
                            console.log(`[ЗАГЛУШКА] SELECT из ${table} WHERE ${column} = ${value}`);
                            return Promise.resolve({ data: [], error: null });
                        }
                    };
                }
            };
        },
        auth: {}
    };

    console.log('✅ Заглушка создана. Приложение будет работать без реальной БД.');
}

// Запускаем инициализацию когда страница загрузится
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}

// Сигнализируем что Supabase готов
window.supabaseReady = true;
console.log('🏁 Supabase полностью готов к использованию');

// Также можно создать событие
const event = new Event('supabaseReady');
window.dispatchEvent(event);