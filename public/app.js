const authSection = document.querySelector('#auth-section');
const tasksSection = document.querySelector('#tasks-section');
const authForm = document.querySelector('#auth-form');

const authorName = document.querySelector('#author-name');
const authorLogin = document.querySelector('#author-login');

const taskList = document.querySelector('#task-list');
const runIdInput = document.querySelector('#run-id');
const message = document.querySelector('#message');

let token = null;
let loadVersion = 0;

function showMessage(text) {
    message.textContent = text;
}

async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        }
    });

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;

        try {
            const result = await response.json();
            errorMessage = result.error ?? errorMessage;
        } catch {}

        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function loadTasks() {
    const version = ++loadVersion;
    const runId = runIdInput.value;

    if(!/^[A-Za-z0-9_-]{1,64}$/.test(runId)) {
        showMessage('Некорректный runId');
        return;
    }

    try {
        const params = new URLSearchParams({ runId });

        const tasks = await apiRequest(`/api/tasks/?${params.toString()}`);

        if (version !== loadVersion || !token) {
            return;
        }

        renderTask(tasks);

        showMessage(`Загружено задач: ${tasks.length}`);
    } catch (error) {
        showMessage(error.message);
    }
}

function renderTask(tasks) {
    taskList.replaceChildren();

    for (const task of tasks) {
        const item = document.createElement('li');
        item.className = 'task-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.done;
        checkbox.setAttribute(
            'aria-label',
            `Выполнение задачи: ${task.title}`
        );

        checkbox.addEventListener('change', async () => {
            try {
                await updateTask(task.id, {done: checkbox.checked});

                await loadTasks();
            } catch (error) {
                checkbox.checked = task.done;
                showMessage(error.message);
            }
        });

        const title = document.createElement('span');
        title.textContent = task.title;
        title.className = task.done ? 'task-done' : '';

        const editButton = document.createElement('button');
        editButton.textContent = 'Изменить';

        editButton.addEventListener('click', async () => {
            const newTitle = prompt(
                'Новое название задачи:',
                task.title,
            );

            if (newTitle === null) return;

            try {
                await updateTask(task.id, {title: newTitle.trim()});

                await loadTasks();
            } catch (error) {
                showMessage(error.message);
            }
        });

        const deleteButon = document.createElement('button');
        deleteButon.textContent = 'Удалить';
        deleteButon.className = 'danger';

        deleteButon.addEventListener('click', async () => {
            if(!confirm(`Удалить задачу "${task.title}"?`)) {
                return;
            }

            try {
                await apiRequest(`/api/tasks/${task.id}/`, {
                    method: 'DELETE',
                });

                await loadTasks();
            } catch (error) {
                showMessage(error.message);
            }
        });

        item.append(checkbox, title, editButton, deleteButon);

        taskList.append(item);
    }
}

authForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    token = document.querySelector('#token').value;
    console.log('Authorization form submitted');
    try {
        const author = await apiRequest('/api/author/');

        authorName.textContent = author.fullName;
        authorLogin.textContent = author.login;

        authSection.hidden = true;
        tasksSection.hidden = false;

        document.querySelector('#token').value = '';

        await loadTasks();
    } catch (error) {
        token = null;
        showMessage(error.message);
    }
});

document.querySelector('#load-button').addEventListener('click', loadTasks);

document.querySelector('#logout-button').addEventListener(
    'click',
    () => {
        token = null;
        taskList.replaceChildren();

        tasksSection.hidden = true;
        authSection.hidden = false;

        showMessage('Вы вышли из приложения');
    }
);

async function updateTask(id, changes) {
    return apiRequest(`/api/tasks/${id}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
    });
}

document.querySelector('#create-task-form')
.addEventListener('submit', async (event) => {
    event.preventDefault();

    const titleInput = document.querySelector('#task-title');
    const title = titleInput.value.trim();
    const runId = runIdInput.value;

    if (title.length < 1 || title.length > 200) {
        showMessage('Название должно содержать от 1 до 200 символов');
        return;
    }

    if (!/^[A-Za-z0-9_-]{1,64}$/.test(runId)) {
        showMessage('Некорректный runId');
        return;
    }

    try {
        await apiRequest('/api/tasks/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                runId
            })
        });

        titleInput.value = '';
        await loadTasks();
    } catch (error) {
        showMessage(error.message);
    }
})