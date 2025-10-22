import { supabase } from '../lib/supabase'

// 🔹 Lire les réservations bain/sauna
export async function getBainReservations(type: string) {
  const { data, error } = await supabase
    .from('reservation_bain_sauna')
    .select('date, start_time, end_time')
    .eq('type', type)
  if (error) throw error
  return data
}

// 🔹 Ajouter une réservation
export async function addBainReservation(type: string, date: string, start_time: string, end_time: string) {
  const { error } = await supabase.from('reservation_bain_sauna').insert({
    type, date, start_time, end_time
  })
  if (error) throw error
}
