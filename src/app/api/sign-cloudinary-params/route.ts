import { v2 as cloudinary } from "cloudinary";
import { checkAuth } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: 'fjpovhwl',
  api_key: '869213681911433',
  api_secret: process.env.CLOUDINARY_URL?.split(':')[2].split('@')[0] || ''
});

export async function POST(request: Request) {
  try {
    await checkAuth(); // Proteger la ruta

    const body = await request.json();
    const { paramsToSign } = body;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      cloudinary.config().api_secret as string
    );

    return NextResponse.json({ signature });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
