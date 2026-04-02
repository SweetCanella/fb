const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const list = document.getElementById('notes-list');

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (notes.length === 0) {
        list.innerHTML = '<li>Нет заметок. Добавьте первую!</li>';
        return;
    }
    
    list.innerHTML = notes.map((note, index) => `
        <li style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <span style="flex: 1;">${escapeHtml(note)}</span>
            <button class="delete-btn" data-index="${index}" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 0.25rem 0.75rem; cursor: pointer;">✕ Удалить</button>
        </li>
    `).join('');
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            deleteNote(index);
        });
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
}

function deleteNote(index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (index >= 0 && index < notes.length) {
        notes.splice(index, 1);
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        addNote(text);
        input.value = '';
    }
});

loadNotes();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker зарегистрирован: ' + registration.scope);
        } catch (err) {
            console.error('Ошибка регистрации ServiceWorker: ', err);
        }
    });
}