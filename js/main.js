
import { Calendar } from './calendar.js';
import { ScheduleManager } from './schedule.js';
import { initOneS } from './oneS.js';
import { 
  getCurrentUser, getAllProfiles, updateUserRole, supabase, 
  getMerchItems, getVideos, uploadFile, createMerchItem 
} from './supabaseClient.js';

let currentUser = null;

// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Loaded. Checking auth...');
  
  try {
    currentUser = await getCurrentUser();
  } catch (err) {
    console.error('Auth Check Failed:', err);
  }

  // Сначала инициализируем вкладки, чтобы UI работал сразу
  initTabs();

  if (currentUser) {
    console.log('User logged in:', currentUser.email);
    // Грузим данные
    try {
      await initApp();
    } catch (e) {
      console.error('App init error:', e);
    }
  } else {
    console.log('No user, redirecting to login...');
    window.location.href = 'login.html';
  }
});

function initTabs() {
  console.log('Initializing Tabs...');
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    // Удаляем старые слушатели (на всякий случай, через клонирование)
    const newTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(newTab, tab);
  });

  // Заново ищем (так как заменили DOM элементы)
  const freshTabs = document.querySelectorAll('.tab');
  
  freshTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault(); // На всякий случай
      const targetId = tab.getAttribute('data-tab'); // Используем getAttribute для надежности
      console.log('Tab Clicked:', targetId);

      // Снимаем активность
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      // Ставим активность
      tab.classList.add('active');
      const content = document.getElementById(targetId);
      if (content) {
        content.classList.add('active');
      } else {
        console.error('No content for tab:', targetId);
      }
    });
  });

  // Остальные кнопки...
  const btnMy = document.getElementById('viewMySched');
  const btnTeam = document.getElementById('viewTeamSched');
  
  if (btnMy) {
    btnMy.onclick = () => {
      document.getElementById('myScheduleView').style.display = 'block';
      document.getElementById('teamScheduleView').style.display = 'none';
      btnMy.classList.add('active');
      if(btnTeam) btnTeam.classList.remove('active');
    };
  }

  if (btnTeam) {
    btnTeam.onclick = () => {
      document.getElementById('myScheduleView').style.display = 'none';
      document.getElementById('teamScheduleView').style.display = 'block';
      btnTeam.classList.add('active');
      if(btnMy) btnMy.classList.remove('active');
    };
  }

  // Кнопка выхода
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      console.log('Logging out...');
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    };
  }

  // Загрузка мерча (только если есть кнопка)
  const btnUpload = document.getElementById('btnUploadMerch');
  const inputUpload = document.getElementById('uploadMerchInput');
  if (btnUpload && inputUpload) {
    btnUpload.onclick = () => inputUpload.click();
    inputUpload.onchange = handleMerchUpload;
  }
}

async function initApp() {
  // Заполняем шапку
  const headerInfo = document.getElementById('headerUserInfo');
  if (headerInfo) {
    headerInfo.style.display = 'flex';
    document.getElementById('headerName').textContent = currentUser.full_name || currentUser.email;
    
    const roles = { 'director': 'Директор', 'senior_seller': 'Старший', 'seller': 'Продавец' };
    document.getElementById('headerRole').textContent = roles[currentUser.role] || 'Сотрудник';
  }

  // Проверка прав админа
  const isAdmin = ['director', 'senior_seller'].includes(currentUser.role);
  
  if (isAdmin) {
    const adminTab = document.getElementById('adminTab');
    if (adminTab) adminTab.style.display = 'block';
    
    // Загружаем список сотрудников
    loadUsersTable();
    
    // Инициализируем Админский График
    const scheduleManager = new ScheduleManager('schedule-manager');
    await scheduleManager.init();
  } else {
    // Скрываем кнопку общего графика для обычных
    const teamBtn = document.getElementById('viewTeamSched');
    if (teamBtn) teamBtn.style.display = 'none';
  }

  // Личный календарь
  if (document.getElementById('calendar-wrapper')) {
    const calendar = new Calendar('calendar-wrapper');
  }

  // Контент
  loadContent();
  initOneS();
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

async function loadContent() {
  // Мерч
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

  // Видео
  const videoGrid = document.getElementById('videoGrid');
  if (videoGrid) {
    const videos = await getVideos();
    videoGrid.innerHTML = videos.length ? '' : '<p style="text-align:center;width:100%">Нет видео</p>';
    videos.forEach(v => {
      const el = document.createElement('div');
      el.className = 'card op-card';
      el.innerHTML = `<h3>${v.title}</h3><a href="${v.video_url}" target="_blank" class="btn btn-primary btn-sm">Смотреть</a>`;
      videoGrid.appendChild(el);
    });
  }
}

async function handleMerchUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const btn = document.getElementById('btnUploadMerch');
  const oldText = btn.textContent;
  btn.textContent = '...';
  btn.disabled = true;

  try {
    const url = await uploadFile('photos', file);
    const title = prompt('Название:', 'Фото');
    if (title) {
      await createMerchItem(title, url);
      alert('Готово');
      loadContent();
    }
  } catch (err) {
    alert('Ошибка: ' + err.message);
  } finally {
    btn.textContent = oldText;
    btn.disabled = false;
    e.target.value = '';
  }
}

async function loadUsersTable() {
  const tbody = document.querySelector('#usersTable tbody');
  if (!tbody) return;
  
  const profiles = await getAllProfiles();
  tbody.innerHTML = '';
  
  profiles.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.full_name || '...'}</td>
      <td>
        <select onchange="updateRole('${p.id}', this.value)" class="input-field" style="margin:0;padding:5px;">
          <option value="seller" ${p.role==='seller'?'selected':''}>Продавец</option>
          <option value="senior_seller" ${p.role==='senior_seller'?'selected':''}>Старший</option>
          <option value="director" ${p.role==='director'?'selected':''}>Директор</option>
        </select>
      </td>
      <td><button class="btn btn-sm" style="color:red">X</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Экспорт для HTML
window.updateRole = async (uid, role) => {
  const { error } = await updateUserRole(uid, role);
  if (error) alert(error.message);
  else alert('Роль изменена');
};
