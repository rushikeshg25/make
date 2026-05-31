import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
}

// Single-user personal app: no auth, sessions disabled. AsyncStorage is wired
// in only so supabase-js has a storage adapter on React Native.
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
