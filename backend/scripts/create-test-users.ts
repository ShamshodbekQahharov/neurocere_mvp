import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function createTestUsers() {
  // Doktor yaratish
  const { data: doctorAuth, error: doctorError } = 
    await supabase.auth.admin.createUser({
      email: 'doctor@test.com',
      password: 'test123',
      email_confirm: true
    })

  if (doctorError) {
    console.log('Doktor allaqachon bor yoki xato:', 
                doctorError.message)
  } else {
    await supabase.from('users').upsert({
      id: doctorAuth.user.id,
      email: 'doctor@test.com',
      full_name: 'Dr. Alisher Karimov',
      role: 'doctor'
    })
    console.log('✅ Doktor yaratildi')
  }

  // Ota-ona yaratish
  const { data: parentAuth, error: parentError } = 
    await supabase.auth.admin.createUser({
      email: 'parent@test.com',
      password: 'test123',
      email_confirm: true
    })

  if (parentError) {
    console.log('Ota-ona allaqachon bor yoki xato:', 
                parentError.message)
  } else {
    await supabase.from('users').upsert({
      id: parentAuth.user.id,
      email: 'parent@test.com',
      full_name: 'Malika Yusupova',
      role: 'parent'
    })
    console.log('✅ Ota-ona yaratildi')
  }

  console.log('Tayyor!')
  process.exit(0)
}

createTestUsers()
