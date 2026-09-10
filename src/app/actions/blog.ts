"use server";

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { checkAuth } from '@/utils/supabase/server';

cloudinary.config({
  cloud_name: 'fjpovhwl',
  api_key: '869213681911433',
  api_secret: process.env.CLOUDINARY_URL?.split(':')[2].split('@')[0] || '' 
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImage(base64Image: string) {
  try {
    await checkAuth(); // Proteger la ruta
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'crossover_blog'
    });
    return { success: true, url: result.secure_url };
  } catch (error: any) {
    console.error("Cloudinary error:", error);
    return { success: false, error: error.message };
  }
}
