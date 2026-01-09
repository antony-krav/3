/**
 * @schedule "0 7 * * *"  # Каждый день в 07:00 UTC (10:00 МСК)
 */

// netlify/functions/send-reminders.js
const { createClient } = require('@supabase/supabase-js');
const { Telegraf } = require('telegraf');

// Ключи берутся из переменных окружения Netlify
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

exports.handler = async function(event, context) {
  console.log('🚀 Запуск функции уведомлений...');
  
  try {
    // Инициализация Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
    
    // Инициализация Telegram бота
    const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
    
    // 1. Находим растения, которые нужно полить сегодня
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`🔍 Ищу растения для полива на ${today}...`);
    
    const { data: plants, error } = await supabase
      .from('plants')
      .select(`
        *,
        users!inner(telegram_id, first_name),
        plant_species(name)
      `)
      .eq('next_watering', today);
    
    if (error) {
      console.error('❌ Ошибка Supabase:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    
    console.log(`🌱 Найдено растений к поливу: ${plants?.length || 0}`);
    
    // 2. Группируем растения по пользователям
    const usersPlants = {};
    
    plants?.forEach(plant => {
      const userId = plant.users?.telegram_id;
      if (!userId) return;
      
      if (!usersPlants[userId]) {
        usersPlants[userId] = {
          telegram_id: userId,
          first_name: plant.users?.first_name || 'Друг',
          plants: []
        };
      }
      
      usersPlants[userId].plants.push({
        name: plant.custom_name,
        species: plant.plant_species?.name || 'растение',
        days_since: Math.floor((new Date() - new Date(plant.last_watered)) / (1000 * 60 * 60 * 24))
      });
    });
    
    console.log(`👥 Пользователей для уведомлений: ${Object.keys(usersPlants).length}`);
    
    // 3. Отправляем уведомления
    let sentCount = 0;
    let errorCount = 0;
    
    for (const userId in usersPlants) {
      const userData = usersPlants[userId];
      
      try {
        // Формируем сообщение
        let message = `🌿 Привет, ${userData.first_name}!\n\n`;
        message += `Сегодня нужно полить ${userData.plants.length} растений:\n\n`;
        
        userData.plants.forEach((plant, index) => {
          message += `${index + 1}. *${plant.name}* (${plant.species})\n`;
          message += `   Не поливали: ${plant.days_since} дней\n\n`;
        });
        
        message += `\n💧 Откройте приложение, чтобы отметить полив!`;
        
        // Отправляем сообщение
        await bot.telegram.sendMessage(userId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
        
        sentCount++;
        console.log(`✅ Уведомление отправлено пользователю ${userId}`);
        
        // Пауза между сообщениями чтобы не спамить
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Ошибка отправки пользователю ${userId}:`, error.message);
      }
    }
    
    // 4. Возвращаем результат
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Уведомления отправлены',
        stats: {
          total_plants: plants?.length || 0,
          total_users: Object.keys(usersPlants).length,
          notifications_sent: sentCount,
          errors: errorCount
        }
      })
    };
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};