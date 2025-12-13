
import { Calendar } from './calendar.js';
import { ScheduleManager } from './schedule.js';
import { initOneS } from './oneS.js';
import { 
  getCurrentUser, logoutUser, getAllEmployees, createEmployee, deleteEmployee, 
  getMerchItems, getVideos, uploadFile, createMerchItem 
} from './supabaseClient.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initProfileMenu();

  currentUser = getCurrentUser(); // Теперь синхронно из localStorage

  if (currentUser) {
    await initApp();
  } else {
    window.location.href = 'login.html';
  }
});

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.onclick = (e) => {
      e.preventDefault();
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const content = document.getElementById(targetId);
      if (content) content.classList.add('active');
    };
  });
}

function initProfileMenu() {
  const btn = document.getElementById('profileBtn');
  const menu = document.getElementById('profileMenu');
  if (btn && menu) {
    btn.onclick = (e) => { e.stopPropagation(); menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; };
    document.addEventListener('click', () => menu.style.display = 'none');
    document.getElementById('logoutBtn').onclick = () => {
      logoutUser();
      window.location.href = 'login.html';
    };
  }
}

async function initApp() {
  document.getElementById('headerLogin').textContent = currentUser.login || currentUser.full_name;
  const roles = { 'director': 'Директор', 'senior_seller': 'Старший', 'seller': 'Продавец' };
  document.getElementById('headerRole').textContent = roles[currentUser.role] || 'Сотрудник';

  const isAdmin = ['director', 'senior_seller'].includes(currentUser.role);
  
  if (isAdmin) {
    document.getElementById('adminTab').style.display = 'block';
    loadUsersTable();
    const scheduleManager = new ScheduleManager('schedule-manager');
    await scheduleManager.init();
  } else {
    const teamBtn = document.getElementById('viewTeamSched');
    if (teamBtn) teamBtn.style.display = 'none';
  }

  if (document.getElementById('calendar-wrapper')) new Calendar('calendar-wrapper');
  loadContent();
  initOneS();
  
  const btnMy = document.getElementById('viewMySched');
  const btnTeam = document.getElementById('viewTeamSched');
  if(btnMy) btnMy.onclick = () => {
    document.getElementById('myScheduleView').style.display = 'block';
    document.getElementById('teamScheduleView').style.display = 'none';
    btnMy.classList.add('active');
    btnTeam.classList.remove('active');
  }
  if(btnTeam) btnTeam.onclick = () => {
    document.getElementById('myScheduleView').style.display = 'none';
    document.getElementById('teamScheduleView').style.display = 'block';
    btnTeam.classList.add('active');
    btnMy.classList.remove('active');
  }
  
  const btnUpload = document.getElementById('btnUploadMerch');
  if(btnUpload) {
     btnUpload.onclick = () => document.getElementById('uploadMerchInput').click();
     document.getElementById('uploadMerchInput').onchange = handleMerchUpload;
  }
  const btnCreate = document.getElementById('btnCreateUser');
  if(btnCreate) btnCreate.onclick = createUserHandler;
}

async function loadContent() {
  const merchGrid = document.getElementById('merchGrid');
  if (merchGrid) {
    const items = await getMerchItems();
    merchGrid.innerHTML = items.length ? '' : '<p style="text-align:center;width:100%">Нет фото</p>';
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'photo-card';
      el.style.backgroundImage = `url('${item.image_url}')`;
      el.innerHTML = `<div class="photo-title">${item.title}</div>`;
      merchGrid.appendChild(el);
    });
  }
}

async function handleMerchUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const btn = document.getElementById('btnUploadMerch');
  const oldText = btn.textContent;
  btn.textContent = '...'; btn.disabled = true;
  try {
    const url = await uploadFile('photos', file);
    const title = prompt('Название:', 'Фото');
    if (title) { await createMerchItem(title, url); loadContent(); }
  } catch (err) { alert(err.message); } 
  finally { btn.textContent = oldText; btn.disabled = false; e.target.value = ''; }
}

async function loadUsersTable() {
  const tbody = document.querySelector('#usersTable tbody');
  if (!tbody) return;
  const users = await getAllEmployees();
  tbody.innerHTML = '';
  
  // Только Директор может удалять
  const canDelete = currentUser.role === 'director';

  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <b>${u.full_name}</b><br>
        <small style="color:#888">Логин: ${u.login} | Пароль: ${u.password}</small>
      </td>
      <td>${u.role}</td>
      <td>
        ${canDelete ? `<button class="btn btn-sm" onclick="deleteUserHandler('${u.id}')" style="color:red">X</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteUserHandler = async (id) => {
  if (currentUser.role !== 'director') return alert('Только директор может удалять сотрудников');
  if(!confirm('Удалить сотрудника?')) return;
  const { error } = await deleteEmployee(id);
  if (error) alert(error.message);
  else loadUsersTable();
};

async function createUserHandler() {
  const login = document.getElementById('newUserEmail').value; // Используем поле email как логин
  const password = document.getElementById('newUserPass').value;
  const fullName = document.getElementById('newUserName').value;
  const role = document.getElementById('newUserRole').value;

  if (!login || !password || !fullName) return alert('Заполните все поля');
  
  const { error } = await createEmployee({ login, password, full_name: fullName, role });
  
  if (error) alert(error.message);
  else {
    alert('Сотрудник создан!');
    document.getElementById('modalUser').style.display = 'none';
    loadUsersTable();
  }
}
