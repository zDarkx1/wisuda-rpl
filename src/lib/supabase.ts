import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Publishable Key is missing! Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Guest Types
export interface Guest {
  id: string;
  name: string;
  class_group: string;
  has_attended: boolean;
  attended_at?: Date | null;
  photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch all guests (for dropdown & admin list)
export async function getAllGuests(): Promise<Guest[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Guest[];
}

// Fetch unattending guests only (for main page dropdown)
export async function getUnattendedGuests(): Promise<Guest[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('has_attended', false)
    .order('name');

  if (error) throw error;
  return data as Guest[];
}

// Search guests by name filter (autocomplete for dropdown)
export async function searchGuests(query: string): Promise<Guest[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('has_attended', false)
    .or(`name.ilike.%${query}%`)
    .limit(20);

  if (error) throw error;
  return data as Guest[];
}

// Update guest attendance status
export async function updateGuestAttendance(guestId: string, photoUrl?: string) {
  const { data, error } = await supabase
    .from('guests')
    .update({
      has_attended: true,
      attended_at: new Date().toISOString(),
      ...(photoUrl && { photo_url: photoUrl })
    })
    .eq('id', guestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Reset guest attendance status (for delete photo feature)
export async function resetGuestAttendance(guestId: string) {
  const { data, error } = await supabase
    .from('guests')
    .update({
      has_attended: false,
      attended_at: null,
      photo_url: null
    })
    .eq('id', guestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Add new guest
export async function addGuest(name: string, classGroup: string) {
  const { data, error } = await supabase
    .from('guests')
    .insert([{ name, class_group: classGroup, has_attended: false }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete guest
export async function deleteGuest(guestId: string) {
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', guestId);

  if (error) throw error;
}

// Get statistics
export async function getGuestStatistics() {
  const { count: total, error: countError } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true });

  const { count: attendedCount, error: attendedError } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('has_attended', true);

  const { count: notAttendedCount, error: notAttendedError } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('has_attended', false);

  if (countError) throw countError;
  if (attendedError) throw attendedError;
  if (notAttendedError) throw notAttendedError;

  return {
    total: total || 0,
    attended: attendedCount || 0,
    not_attended: notAttendedCount || 0
  };
}
