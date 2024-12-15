let currentDate = new Date();
let selectedTask = null;
let selectedColor = '#ff9999';
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    fetch('/logout', { method: 'POST' })
        .then(() => {
            window.location.href = '/';
        })
        .catch(error => console.error('Error logging out:', error));
});
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    const calendar = document.querySelector('.calendar');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const currentMonthElement = document.getElementById('currentMonth');

    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));

    function changeMonth(delta) {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
        createCalendar();
        loadTasks();
    }

    function createCalendar() {
        calendar.innerHTML = '';
        currentMonthElement.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        updateSelectedColorIndicator();
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendar.appendChild(createEmptyDay());
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
            const dayElement = createDayElement(dayDate);
            calendar.appendChild(dayElement);
        }
    }

    function createEmptyDay() {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'day empty';
        return emptyDay;
    }

    function createDayElement(date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.dataset.date = date.toISOString().split('T')[0];
        dayElement.innerHTML = `
        <div class="day-header">
            <div class="date">${date.getDate()}</div>
            <div class="weekday">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
        </div>
        <div class="tasks"></div>
        <div class="new-task">
            <input type="text" placeholder="Новая задача">
  
        </div>
        <div class="color-picker">
            <div class="color-option" data-color="#ff9999"></div>
            <div class="color-option" data-color="#99ff99"></div>
            <div class="color-option" data-color="#9999ff"></div>
            <div class="color-option" data-color="#ffff99"></div>
        </div>
    `;

        const input = dayElement.querySelector('.new-task input');
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                addTask(event.target.value, date.toISOString().split('T')[0]);
                event.target.value = '';
            }
        });

        // Добавляем обработчики событий для перетаскивания
        dayElement.addEventListener('dragover', dragOver);
        dayElement.addEventListener('dragleave', dragLeave);
        dayElement.addEventListener('drop', drop);

        // Добавляем обработчик для выбора цвета
        const colorOptions = dayElement.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.style.backgroundColor = option.dataset.color;
            option.addEventListener('click', () => setColor(option.dataset.color));
        });

        return dayElement;
    }


    createCalendar();
    loadTasks();
    initTaskModal();

});

function loadTasks() {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    fetch(`/api/tasks?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(tasks => {
            console.log('Loaded tasks:', tasks);
            document.querySelectorAll('.tasks').forEach(container => container.innerHTML = '');
            tasks.forEach(task => addTaskToDOM(task));
        })
        .catch(error => {
            console.error('Error loading tasks:', error);
            if (error.message === 'Unauthorized') {
                checkAuthentication();
            }
        });
}


function addTask(text, date) {
    const task = {
        title: text,
        text: '',
        date: date,
        completed: false,
        color: selectedColor
    };

    fetch('/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(savedTask => {
            console.log('Task saved:', savedTask);
            addTaskToDOM(savedTask);
        })
        .catch(error => {
            console.error('Error adding task:', error);
            if (error.message === 'Unauthorized') {
                checkAuthentication();
            } else {
                alert('Не удалось добавить задачу. Пожалуйста, попробуйте снова.');
            }
        });
}
function formatTime(time) {
    return time ? time.substring(0, 5) : '';
}

function addTaskToDOM(task) {
    const dayElement = document.querySelector(`.day[data-date="${task.date}"]`);
    if (dayElement) {
        const tasksContainer = dayElement.querySelector('.tasks');
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        taskElement.classList.toggle('completed', task.completed);
        taskElement.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span>${task.title}</span>
            <span class="task-time">
        ${task.startTime ? formatTime(task.startTime) : ''}${task.startTime && task.endTime ? ' - ' : ''}${task.endTime ? formatTime(task.endTime) : ''}
    </span>
    `;
        taskElement.style.backgroundColor = task.color;
        taskElement.dataset.id = task.id;

        // Делаем элемент перетаскиваемым
        taskElement.draggable = true;

        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id, checkbox.checked));

        taskElement.addEventListener('dblclick', (e) => {
            if (e.target !== checkbox) {
                fetchTaskDetails(task.id);
            }
        });

        // Добавляем обработчики событий для перетаскивания
        taskElement.addEventListener('dragstart', dragStart);
        taskElement.addEventListener('dragend', dragEnd);

        tasksContainer.appendChild(taskElement);
    }
}
function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.target.classList.add('dragging');
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function dragOver(e) {
    e.preventDefault();
    const dayElement = e.target.closest('.day');
    if (dayElement) {
        dayElement.classList.add('drag-over');
    }
}

function dragLeave(e) {
    const dayElement = e.target.closest('.day');
    if (dayElement) {
        dayElement.classList.remove('drag-over');
    }
}

function drop(e) {
    e.preventDefault();
    const dayElement = e.target.closest('.day');
    if (dayElement) {
        dayElement.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text');
        const newDate = dayElement.dataset.date;
        updateTaskDate(taskId, newDate);
    }
}
function updateTaskDate(taskId, newDate) {
    fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: newDate }),
    })
        .then(response => response.json())
        .then(updatedTask => {
            console.log('Task date updated:', updatedTask);
            // Удаляем задачу из старого дня
            const oldTaskElement = document.querySelector(`.task[data-id="${taskId}"]`);
            if (oldTaskElement) {
                oldTaskElement.remove();
            }
            // Добавляем задачу в новый день
            addTaskToDOM(updatedTask);
        })
        .catch(error => console.error('Error updating task date:', error));
}
function fetchTaskDetails(taskId) {
    fetch(`/api/tasks/${taskId}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(task => {
            console.log('Fetched task details:', task);
            openTaskModal(task);
        })
        .catch(error => {
            console.error('Error fetching task details:', error);
            if (error.message === 'Unauthorized') {
                checkAuthentication();
            } else {
                alert('Не удалось загрузить детали задачи. Пожалуйста, попробуйте снова.');
            }
        });
}

function setColor(color) {
    selectedColor = color;
    updateSelectedColorIndicator();
}

function updateSelectedColorIndicator() {
    document.querySelectorAll('.color-option').forEach(option => {
        if (option.dataset.color === selectedColor) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

function initTaskModal() {
    const modal = document.getElementById('taskModal');
    const closeBtn = modal.querySelector('.close');
    const editBtn = document.getElementById('editTask');
    const saveBtn = document.getElementById('saveTask');
    const deleteBtn = document.getElementById('deleteTask');
    const taskText = document.getElementById('taskText');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
        selectedTask = null; // Сбрасываем выбранную задачу при закрытии
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            selectedTask = null; // Сбрасываем выбранную задачу при закрытии
        }
    };

    editBtn.onclick = () => {
        taskText.readOnly = false;
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        document.getElementById('taskStartTime').disabled = false; // Разрешаем редактирование времени
        document.getElementById('taskEndTime').disabled = false; // Разрешаем редактирование времени
    };

    saveBtn.onclick = () => {
        if (selectedTask) {
            const newText = document.getElementById('taskText').value;
            const newStartTime = document.getElementById('taskStartTime').value;
            const newEndTime = document.getElementById('taskEndTime').value;
            updateTask(selectedTask.id, newText, newStartTime, newEndTime);
            document.getElementById('taskText').readOnly = true;
            document.getElementById('editTask').style.display = 'inline-block';
            document.getElementById('saveTask').style.display = 'none';
        }
    };

    deleteBtn.onclick = () => {
        if (selectedTask) {
            deleteTask(selectedTask.id);
            modal.style.display = 'none';
            selectedTask = null; // Сбрасываем выбранную задачу после удаления
        }
    };
}

function openTaskModal(task) {
    selectedTask = task;
    const modal = document.getElementById('taskModal');
    document.getElementById('taskDate').textContent = `Дата: ${task.date}`;
    document.getElementById('taskTitle').textContent = task.title;
    document.getElementById('taskText').value = task.text || '';
    document.getElementById('taskStartTime').value = task.startTime || '';
    document.getElementById('taskEndTime').value = task.endTime || '';
    document.getElementById('taskText').readOnly = true;
    document.getElementById('editTask').style.display = 'inline-block';
    document.getElementById('saveTask').style.display = 'none';
    modal.style.display = 'block';
}
function updateTask(id, newText, newStartTime, newEndTime) {
    const updatedTask = {
        ...selectedTask,
        text: newText,
        startTime: newStartTime,
        endTime: newEndTime
    };

    fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask),
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(updatedTask => {
            console.log('Task updated:', updatedTask);
            selectedTask = updatedTask;
            document.getElementById('taskText').value = updatedTask.text;
            document.getElementById('taskStartTime').value = updatedTask.startTime || '';
            document.getElementById('taskEndTime').value = updatedTask.endTime || '';

            // Обновляем элемент задачи в DOM
            const taskElement = document.querySelector(`.task[data-id="${id}"]`);
            if (taskElement) {
                taskElement.querySelector('span').textContent = updatedTask.title;
                taskElement.querySelector('.task-time').innerHTML = `
                    ${formatTime(updatedTask.startTime)} - ${formatTime(updatedTask.endTime)}
                `;
            }
        })
        .catch(error => {
            console.error('Error updating task:', error);
            if (error.message === 'Unauthorized') {
                checkAuthentication();
            }
        });
}


function deleteTask(id) {
    fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Network response was not ok');
            }
            const taskElement = document.querySelector(`.task[data-id="${id}"]`);
            if (taskElement) {
                taskElement.remove();
            }
        })
        .catch(error => {
            console.error('Error deleting task:', error);
            if (error.message === 'Unauthorized') {
                checkAuthentication();
            }
        });
}

function toggleTaskCompletion(id, completed) {
    fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: completed }),
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(updatedTask => {
            const taskElement = document.querySelector(`.task[data-id="${id}"]`);
            if (taskElement) {
                taskElement.classList.toggle('completed', updatedTask.completed);
            }
        })
        .catch(error => {
            console.error('Error updating task completion:', error);
            if (error.message === 'Unauthorized') {
                checkAuthentication();
            }
        });
}

function checkAuthentication() {
    fetch('/api/user')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                document.getElementById('user-name').textContent = `${data.name}`;
                document.getElementById('login-btn').style.display = 'none';
                document.getElementById('logout-btn').style.display = 'inline-block';
                loadTasks();
            } else {
                document.getElementById('user-name').textContent = '';
                document.getElementById('login-btn').style.display = 'inline-block';
                document.getElementById('logout-btn').style.display = 'none';
                document.querySelector('.calendar').innerHTML = '<p>Пожалуйста, войдите в систему для просмотра задач.</p>';
            }
        })
        .catch(error => console.error('Error checking authentication:', error));
}