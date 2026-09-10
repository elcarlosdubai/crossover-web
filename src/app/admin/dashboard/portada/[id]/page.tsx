export const dynamic = 'force-dynamic';
import React from "react";
import { createClient } from '@supabase/supabase-js';
import EditForm from "./EditForm";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function EditarSlide({ params }: { params: { id: string } }) {
  const { data: slide, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !slide) return <div>No encontrado</div>;

  return <EditForm initialData={slide} />;
}
