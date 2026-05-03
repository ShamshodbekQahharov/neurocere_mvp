require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Query users table for parent@test.com
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'parent@test.com')
    .single();
  console.log('User record for parent@test.com:', user, userErr);

  // Then show parents for that user
  if (user) {
    const { data: parents, error: parErr } = await supabase
      .from('parents')
      .select('*')
      .eq('user_id', user.id);
    console.log('Parents for this user:', parents, parErr);
  }
})();
