
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://uuhsjusmhmmjceujzoiw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHNqdXNtaG1tamNldWp6b2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDU0MTUsImV4cCI6MjA4MTE4MTQxNX0.zaOtLcZGoNV77AiLrbODv3gIamlHWh8QwbBdWeOfJLw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // РџРѕРґРіСЂСѓР¶Р°РµРј СЂРѕР»СЊ РёР· profiles
  const { data } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  return { ...user, ...data };
}

export async function getUserProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function getAllProfiles() {
  const { data } = await supabase.from('profiles').select('*').order('full_name');
  return data || [];
}

export async function getShiftTypes() {
  const { data } = await supabase.from('shifts').select('*').order('id');
  return data || [];
}

// Р¤СѓРЅРєС†РёСЏ РѕР±РЅРѕРІР»РµРЅРёСЏ СЂРѕР»Рё (С‚РѕР»СЊРєРѕ РґР»СЏ Р°РґРјРёРЅР°, Р·Р°С‰РёС‰РµРЅРѕ RLS)
export async function updateUserRole(userId, newRole) {
  return await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
}

// --- РАБОТА С КОНТЕНТОМ ---

// Получить мерч (фото)
export async function getMerchItems() {
  const { data } = await supabase.from('merch_items').select('*').order('created_at', { ascending: false });
  return data || [];
}

// Получить видео-инструкции
export async function getVideos() {
  const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
  return data || [];
}

// Загрузка файла в Storage (bucket: photos/videos/docs)
export async function uploadFile(bucket, file) {
  const fileExt = file.name.split('.').pop();
  const fileName = \\.\\;
  const filePath = \\\;

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file);
  
  if (error) throw error;
  
  // Получаем публичную ссылку
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}

// Создать запись о мерче
export async function createMerchItem(title, imageUrl) {
  return await supabase.from('merch_items').insert({ title, image_url: imageUrl });
}

