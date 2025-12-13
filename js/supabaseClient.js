
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://uuhsjusmhmmjceujzoiw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHNqdXNtaG1tamNldWp6b2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDU0MTUsImV4cCI6MjA4MTE4MTQxNX0.zaOtLcZGoNV77AiLrbODv3gIamlHWh8QwbBdWeOfJLw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- КАСТОМНАЯ АВТОРИЗАЦИЯ ---

export async function loginUser(login, password) {
  // Ищем пользователя в таблице employees
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('login', login)
    .eq('password', password) // Сверяем пароль прямо в запросе
    .single();

  if (error || !data) {
    throw new Error('Неверный логин или пароль');
  }

  // Сохраняем в LocalStorage (наша сессия)
  localStorage.setItem('ax_user', JSON.stringify(data));
  return data;
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('ax_user');
  return userStr ? JSON.parse(userStr) : null;
}

export function logoutUser() {
  localStorage.removeItem('ax_user');
}

// --- РАБОТА С ДАННЫМИ ---

export async function getAllEmployees() {
  const { data } = await supabase.from('employees').select('*').order('full_name');
  return data || [];
}

export async function createEmployee(data) {
  return await supabase.from('employees').insert(data);
}

export async function deleteEmployee(id) {
  return await supabase.from('employees').delete().eq('id', id);
}

export async function getShiftTypes() {
  const { data } = await supabase.from('shifts').select('*').order('id');
  return data || [];
}

// Контент (старое)
export async function getMerchItems() {
  const { data } = await supabase.from('merch_items').select('*');
  return data || [];
}
export async function getVideos() {
  const { data } = await supabase.from('videos').select('*');
  return data || [];
}
export async function uploadFile(bucket, file) {
  const ext = file.name.split('.').pop();
  const path = `${Math.random()}.${ext}`;
  await supabase.storage.from(bucket).upload(path, file);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
export async function createMerchItem(title, url) {
  return await supabase.from('merch_items').insert({ title, image_url: url });
}
