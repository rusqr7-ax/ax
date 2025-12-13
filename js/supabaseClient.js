
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://uuhsjusmhmmjceujzoiw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHNqdXNtaG1tamNldWp6b2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDU0MTUsImV4cCI6MjA4MTE4MTQxNX0.zaOtLcZGoNV77AiLrbODv3gIamlHWh8QwbBdWeOfJLw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // ÐŸÐ¾Ð´Ð³Ñ€ÑƒÐ¶Ð°ÐµÐ¼ Ñ€Ð¾Ð»ÑŒ Ð¸Ð· profiles
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

// Ð¤ÑƒÐ½ÐºÑ†Ð¸Ñ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ Ñ€Ð¾Ð»Ð¸ (Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð´Ð»Ñ Ð°Ð´Ð¼Ð¸Ð½Ð°, Ð·Ð°Ñ‰Ð¸Ñ‰ÐµÐ½Ð¾ RLS)
export async function updateUserRole(userId, newRole) {
  return await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
}

// --- ÐÀÁÎÒÀ Ñ ÊÎÍÒÅÍÒÎÌ ---

// Ïîëó÷èòü ìåð÷ (ôîòî)
export async function getMerchItems() {
  const { data } = await supabase.from('merch_items').select('*').order('created_at', { ascending: false });
  return data || [];
}

// Ïîëó÷èòü âèäåî-èíñòðóêöèè
export async function getVideos() {
  const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
  return data || [];
}

// Çàãðóçêà ôàéëà â Storage (bucket: photos/videos/docs)
export async function uploadFile(bucket, file) {
  const fileExt = file.name.split('.').pop();
  const fileName = \\.\\;
  const filePath = \\\;

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file);
  
  if (error) throw error;
  
  // Ïîëó÷àåì ïóáëè÷íóþ ññûëêó
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}

// Ñîçäàòü çàïèñü î ìåð÷å
export async function createMerchItem(title, imageUrl) {
  return await supabase.from('merch_items').insert({ title, image_url: imageUrl });
}

