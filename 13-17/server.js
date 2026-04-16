const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
    publicKey: 'BNOoBuo5bQcUHnwof6s7mzCZJBXYZaB7ViyHb5LRPhBGUtf8GHI-f7YEa1KGwsoysnEi-b8ZGTY5SA5XTBp8EQQ',
    privateKey: 'NwW1NtaxeYxOTIP_JN00JikCmWZjgy-LFSUa7kvqzVA'
};

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

let subscriptions = [];
const reminders = new Map();

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

function sendPushNotification(subscription, payload) {
    webpush.sendNotification(subscription, payload).catch(err => {
        console.error('Push error:', err);
        if (err.statusCode === 410) {
            const index = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
            if (index !== -1) subscriptions.splice(index, 1);
        }
    });
}

function scheduleReminder(id, text, reminderTime) {
    const now = Date.now();
    let delay = reminderTime - now;
    
    if (delay <= 0) {
        console.log(`Напоминание ${id} уже в прошлом, отправляем сразу`);
        sendReminderNow(id, text);
        return;
    }
    
    console.log(`Напоминание ${id} запланировано через ${Math.round(delay / 1000)} секунд`);
    
    const timeoutId = setTimeout(() => {
        const currentTime = Date.now();
        if (currentTime >= reminderTime - 5000) {
            console.log(`Отправка напоминания ${id} в ${new Date(currentTime).toLocaleTimeString()}`);
            sendReminderNow(id, text);
        } else {
            console.log(`Время ещё не наступило, перепланирование ${id}`);
            clearTimeout(timeoutId);
            scheduleReminder(id, text, reminderTime);
        }
    }, Math.max(0, delay));
    
    reminders.set(id, { timeoutId, text, reminderTime });
}

function sendReminderNow(id, text) {
    const payload = JSON.stringify({
        title: 'Напоминание',
        body: text,
        reminderId: id,
        reminderText: text
    });
    
    subscriptions.forEach(sub => {
        sendPushNotification(sub, payload);
    });
    
    reminders.delete(id);
    console.log(`Напоминание ${id} отправлено, удалено из хранилища`);
}

io.on('connection', (socket) => {
    console.log('Клиент подключён:', socket.id);

    socket.on('newTask', (task) => {
        console.log('Новая задача:', task);
        io.emit('taskAdded', task);
        
        const payload = JSON.stringify({
            title: 'Новая задача',
            body: task.text
        });
        
        subscriptions.forEach(sub => {
            sendPushNotification(sub, payload);
        });
    });

    socket.on('newReminder', (reminder) => {
        const { id, text, reminderTime } = reminder;
        console.log(`Новое напоминание: ${text}, время: ${new Date(reminderTime).toLocaleString()}`);
        scheduleReminder(id, text, reminderTime);
    });

    socket.on('rescheduleReminder', (reminder) => {
        const { id, text, reminderTime } = reminder;
        console.log(`Перепланирование напоминания ${id} на ${new Date(reminderTime).toLocaleString()}`);
        
        if (reminders.has(id)) {
            const oldReminder = reminders.get(id);
            clearTimeout(oldReminder.timeoutId);
            reminders.delete(id);
        }
        
        scheduleReminder(id, text, reminderTime);
    });

    socket.on('deleteReminder', ({ id }) => {
        if (reminders.has(id)) {
            const reminder = reminders.get(id);
            clearTimeout(reminder.timeoutId);
            reminders.delete(id);
            console.log(`Напоминание ${id} удалено`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключён:', socket.id);
    });
});

app.post('/subscribe', (req, res) => {
    subscriptions.push(req.body);
    console.log('Подписка сохранена, всего:', subscriptions.length);
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log('Подписка удалена, осталось:', subscriptions.length);
    res.status(200).json({ message: 'Подписка удалена' });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});