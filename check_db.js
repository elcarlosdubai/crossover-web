const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');
async function check() {
  const { data } = await supabase.from('noticias').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
}
check();
