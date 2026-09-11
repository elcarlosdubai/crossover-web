const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, count, error } = await supabase
    .from('noticias')
    .select('*', { count: 'exact' })
    .not('etiquetas', 'cs', '{"SYSTEM_SLIDE"}')
    .order('created_at', { ascending: false })
    .range(0, 9);
  
  console.log("Count:", count);
  console.log("Data length:", data ? data.length : 0);
  if(data) data.forEach(d => console.log(d.titulo));
}
run();
