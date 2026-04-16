const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('WebSocket подключён:', socket.id);
});

socket.on('taskAdded', (task) => {
    console.log('Задача от другого клиента:', task);
    showToast('Новая задача: ' + task.text);
    if (currentPage === 'home') {
        loadNotes();
    }
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 10px; right: 10px;
        background: #4285f4; color: white; padding: 1rem;
        border-radius: 5px; z-index: 1000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
let currentPage = 'home';

function setActiveButton(activeId) {
    [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

function loadHomePage() {
    currentPage = 'home';
    contentDiv.innerHTML = `
        <div class="home-content">
            <h2 class="is-center">Добавить заметку</h2>
            <form id="note-form" style="display: flex; flex-direction: column; gap: 1rem; max-width: 500px; margin: 0 auto;">
                <input type="text" id="note-input" placeholder="Введите текст заметки" required style="padding: 8px;">
                
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                    <input type="checkbox" id="enable-reminder-checkbox"> Добавить напоминание
                </label>
                
                <div id="reminder-fields" style="display: none; gap: 0.5rem; flex-wrap: wrap;">
                    <input type="datetime-local" id="reminder-time" style="flex: 1; padding: 8px;">
                </div>
                
                <button type="submit" style="padding: 10px; background: #4285f4; color: white; border: none; border-radius: 5px; cursor: pointer;">Добавить заметку</button>
            </form>
            
            <h2 class="is-center" style="margin-top: 2rem;">Список заметок</h2>
            <ul id="notes-list" style="list-style: none; padding-left: 0; max-width: 600px; margin: 0 auto;"></ul>
        </div>
    `;
    initNotes();
}

function loadAboutPage() {
    currentPage = 'about';
    contentDiv.innerHTML = `
        <div class="about-content">
            <h2 class="is-center">О приложении</h2>
            <p class="is-center"><strong>Версия:</strong> 2.0.0</p>
            <p>Приложение для заметок с напоминаниями</p>
            <p>Поддерживает push-уведомления и откладывание на 5 минут</p>
        </div>
    `;
}

function loadNotes() {
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (notes.length === 0) {
        notesList.innerHTML = '<li class="is-center">Нет заметок. Добавьте первую!</li>';
        return;
    }
    notesList.innerHTML = notes.map((note, index) => {
        let reminderInfo = '';
        if (note.reminder) {
            const reminderDate = new Date(note.reminder);
            reminderInfo = '<br><small>Напоминание: ' + reminderDate.toLocaleString() + '</small>';
        }
        return `
            <li style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; padding: 0.5rem; background: #f5f5f5; border-radius: 8px;">
                <div style="flex: 1;">
                    <strong>${escapeHtml(note.text)}</strong>
                    ${reminderInfo}
                    <br><small>Создано: ${note.datetime || 'не указано'}</small>
                </div>
                <button class="delete-btn" data-index="${index}" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 0.25rem 0.75rem; cursor: pointer;">X Удалить</button>
            </li>
        `;
    }).join('');
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteNote(parseInt(btn.dataset.index)));
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const newNote = {
        id: Date.now(),
        text: text,
        datetime: new Date().toLocaleString('ru-RU'),
        reminder: null
    };
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();

    if (socket && socket.connected) {
        socket.emit('newTask', { text: text });
    }
}

function addReminderNote(text, reminderTimestamp) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const newNote = {
        id: Date.now(),
        text: text,
        datetime: new Date().toLocaleString('ru-RU'),
        reminder: reminderTimestamp
    };
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();

    if (socket && socket.connected) {
        socket.emit('newReminder', {
            id: newNote.id,
            text: text,
            reminderTime: reminderTimestamp
        });
    }
    showToast('Напоминание запланировано на ' + new Date(reminderTimestamp).toLocaleString());
}

function deleteNote(index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (index >= 0 && index < notes.length) {
        const deletedNote = notes[index];
        notes.splice(index, 1);
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();
        
        if (deletedNote.reminder && socket && socket.connected) {
            socket.emit('deleteReminder', { id: deletedNote.id });
        }
    }
}

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const checkbox = document.getElementById('enable-reminder-checkbox');
    const reminderFields = document.getElementById('reminder-fields');
    const reminderTime = document.getElementById('reminder-time');
    
    if (checkbox && reminderFields) {
        checkbox.addEventListener('change', (e) => {
            reminderFields.style.display = e.target.checked ? 'flex' : 'none';
        });
    }
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) {
                alert('Введите текст заметки');
                return;
            }
            
            const isReminderEnabled = checkbox && checkbox.checked;
            
            if (isReminderEnabled && reminderTime && reminderTime.value) {
                const reminderTimestamp = new Date(reminderTime.value).getTime();
                const minTime = Date.now() + 10000;
                if (reminderTimestamp <= minTime) {
                    alert('Время напоминания должно быть хотя бы через 10 секунд от текущего момента');
                    return;
                }
                addReminderNote(text, reminderTimestamp);
                reminderTime.value = '';
            } else {
                addNote(text);
            }
            
            input.value = '';
            if (checkbox) checkbox.checked = false;
            if (reminderFields) reminderFields.style.display = 'none';
        });
    }
    
    loadNotes();
}

homeBtn.addEventListener('click', () => {
    setActiveButton('home-btn');
    loadHomePage();
});

aboutBtn.addEventListener('click', () => {
    setActiveButton('about-btn');
    loadAboutPage();
});

loadHomePage();

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const VAPID_PUBLIC_KEY = 'BNOoBuo5bQcUHnwof6s7mzCZJBXYZaB7ViyHb5LRPhBGUtf8GHI-f7YEa1KGwsoysnEi-b8ZGTY5SA5XTBp8EQQ';

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        await fetch('http://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        console.log('Подписка на push отправлена');
    } catch (err) {
        console.error('Ошибка подписки на push:', err);
    }
}

async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await fetch('http://localhost:3001/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
            console.log('Отписка выполнена');
        }
    } catch (err) {
        console.error('Ошибка отписки:', err);
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker зарегистрирован');
            
            const enableBtn = document.getElementById('enable-push');
            const disableBtn = document.getElementById('disable-push');
            
            if (enableBtn && disableBtn) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                }
                
                enableBtn.addEventListener('click', async () => {
                    if (Notification.permission === 'denied') {
                        alert('Уведомления запрещены. Разрешите их в настройках браузера.');
                        return;
                    }
                    if (Notification.permission === 'default') {
                        const permission = await Notification.requestPermission();
                        if (permission !== 'granted') {
                            alert('Необходимо разрешить уведомления.');
                            return;
                        }
                    }
                    await subscribeToPush();
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                });
                
                disableBtn.addEventListener('click', async () => {
                    await unsubscribeFromPush();
                    disableBtn.style.display = 'none';
                    enableBtn.style.display = 'inline-block';
                });
            }
        } catch (err) {
            console.error('Ошибка регистрации ServiceWorker:', err);
        }
    });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        const message = event.data;
        console.log('Получено сообщение от SW:', message);
        
        if (message.type === 'SNOOZE_REMINDER') {
            const reminderId = message.reminderId;
            const reminderText = message.reminderText;
            
            const notes = JSON.parse(localStorage.getItem('notes') || '[]');
            const noteIndex = notes.findIndex(note => note.id === reminderId);
            
            if (noteIndex !== -1) {
                const oldTime = notes[noteIndex].reminder;
                const newTime = Date.now() + (5 * 60 * 1000);
                notes[noteIndex].reminder = newTime;
                localStorage.setItem('notes', JSON.stringify(notes));
                
                console.log('Время напоминания обновлено:');
                console.log('  Было: ' + new Date(oldTime).toLocaleString());
                console.log('  Стало: ' + new Date(newTime).toLocaleString());
                
                if (currentPage === 'home') {
                    loadNotes();
                }
                
                showToast('Напоминание отложено на 5 минут. Новое время: ' + new Date(newTime).toLocaleString());
                
                if (socket && socket.connected) {
                    socket.emit('rescheduleReminder', {
                        id: reminderId,
                        text: reminderText,
                        reminderTime: newTime
                    });
                }
            } else {
                console.log('Заметка с id ' + reminderId + ' не найдена');
            }
        }
    });
}