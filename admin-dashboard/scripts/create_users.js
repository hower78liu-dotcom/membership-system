import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
// Use Service Role Key for admin operations if available, otherwise Anon Key (which might be restricted)
// In a real script for creating users, you typically need the SERVICE_ROLE_KEY to bypass email verification or create users directly.
// Since we only have ANON_KEY in .env usually, we will try to use signUp.
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY 

const supabase = createClient(supabaseUrl, supabaseKey)

async function createUsers() {
  console.log('Creating Admin User...')
  const { data: adminData, error: adminError } = await supabase.auth.signUp({
    email: 'admin_test_123@example.com',
    password: 'adminPassword123!',
    options: {
      data: {
        nickname: 'Super Admin',
        phone: '13800000000',
        role: 'admin' // Note: This depends on if your profiles table or RLS uses this metadata
      }
    }
  })

  if (adminError) {
    console.error('Error creating admin:', adminError.message)
  } else {
    console.log('Admin user created (check email for verification if enabled):', adminData.user?.email)
  }

  console.log('\nCreating Regular User...')
  const { data: userData, error: userError } = await supabase.auth.signUp({
    email: 'user_test_456@example.com',
    password: 'userPassword123!',
    options: {
      data: {
        nickname: 'Test User',
        phone: '13900000000',
        role: 'member'
      }
    }
  })

  if (userError) {
    console.error('Error creating user:', userError.message)
  } else {
    console.log('Regular user created (check email for verification if enabled):', userData.user?.email)
  }
}

createUsers()
