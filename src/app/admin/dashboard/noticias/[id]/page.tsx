import React from "react";
import { createClient } from '@supabase/supabase-js';
import EditForm from "./EditForm";
import Link from "next/link";
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function EditarNoticia({ params }: { params: { id: string } }) {
  const { data: noticia, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !noticia) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Noticia no encontrada</h1>
        <Link href="/admin/dashboard/noticias" className="text-blue-600 mt-4 block underline">Volver</Link>
      </div>
    );
  }

  return <EditForm initialData={noticia} />;
}
