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
            <form id="note-form" class="row is-center">
                <input class="col-9" type="text" id="note-input" placeholder="Введите текст заметки" required>
                <button class="col-3 button primary" type="submit">Добавить</button>
            </form>
            <ul id="notes-list" style="list-style: none; padding-left: 0;"></ul>
        </div>
    `;
    initNotes();
}

function loadAboutPage() {
    currentPage = 'about';
    contentDiv.innerHTML = `
        <div class="about-content">
            <h2 class="is-center">О приложении</h2>
            <p class="is-center"><strong>Версия:</strong> 1.0.0</p>
            <p>Это приложение для заметок</p>
            <p>Оно классное и многое умеет</p>
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
    notesList.innerHTML = notes.map((note, index) => `
        <li style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; padding: 0.5rem; background: #f5f5f5; border-radius: 8px;">
            <span style="flex: 1;">${escapeHtml(note)}</span>
            <button class="delete-btn" data-index="${index}" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 0.25rem 0.75rem; cursor: pointer;">✕ Удалить</button>
        </li>
    `).join('');
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteNote(parseInt(btn.dataset.index)));
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push(text);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();

    if (socket && socket.connected) {
        socket.emit('newTask', { text: text });
    }
}

function deleteNote(index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (index >= 0 && index < notes.length) {
        notes.splice(index, 1);
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();
    }
}

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                addNote(text);
                input.value = '';
            }
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