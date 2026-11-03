import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'fjpovhwl',
  api_key: '869213681911433',
  api_secret: process.env.CLOUDINARY_URL?.split(':')[2].split('@')[0] || ''
});

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow enough time for image uploads

// Helper to extract clean full resolution images from WP content
function extractImagesFromContent(htmlContent: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const urls: string[] = [];
  let match;
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    let cleanUrl = match[1];
    cleanUrl = cleanUrl.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1');
    if (!urls.includes(cleanUrl)) {
      urls.push(cleanUrl);
    }
  }
  return urls;
}

// Upload a single remote image to Cloudinary and return optimized WebP secure_url
async function uploadToCloudinaryWebp(remoteUrl: string): Promise<string> {
  // If already hosted on Cloudinary, don't re-upload
  if (remoteUrl.includes('res.cloudinary.com')) {
    return remoteUrl;
  }
  try {
    const res = await cloudinary.uploader.upload(remoteUrl, {
      folder: 'crossover_migracion',
      format: 'webp',
      quality: 'auto',
      transformation: [
        { width: 1920, crop: 'limit' }
      ]
    });
    return res.secure_url;
  } catch (err: any) {
    console.error(`Failed to upload to Cloudinary: ${remoteUrl}`, err.message);
    // Fallback to original URL if upload fails so data is not lost
    return remoteUrl;
  }
}

// Helper for concurrency controlled batch upload
async function uploadBatchToCloudinary(urls: string[], concurrency = 4): Promise<string[]> {
  const results: string[] = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    const slice = urls.slice(i, i + concurrency);
    const uploadedSlice = await Promise.all(slice.map(url => uploadToCloudinaryWebp(url)));
    results.push(...uploadedSlice);
  }
  return results;
}

export async function POST(req: Request) {
  try {
    const { batchSize = 1, page = 1 } = await req.json();

    // 1. Fetch posts from WordPress API
    const wpUrl = `https://crossoverrd.com/wp-json/wp/v2/posts?per_page=${batchSize}&page=${page}&_embed=true`;
    const wpRes = await fetch(wpUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 CrossoverMigration/1.0' },
      cache: 'no-store'
    });

    if (!wpRes.ok) {
      return NextResponse.json({
        success: false,
        error: `Error al contactar WordPress API: HTTP ${wpRes.status}`
      }, { status: wpRes.status });
    }

    const posts = await wpRes.json();
    const migratedItems = [];
    const logs = [];

    for (const post of posts) {
      const wpTitle = post.title?.rendered || 'Sin Título';
      const wpSlug = post.slug || `post-${post.id}`;
      const wpDate = post.date || new Date().toISOString();
      const rawContent = post.content?.rendered || '';

      // Check if already migrated
      const { data: existing } = await supabase
        .from('noticias')
        .select('id, titulo, foto_portada, galeria_urls')
        .eq('slug', wpSlug)
        .maybeSingle();

      // If already migrated and already hosted on Cloudinary, skip
      if (existing && existing.foto_portada?.includes('res.cloudinary.com')) {
        logs.push(`⚠️ "${wpTitle}" ya está migrada en Cloudinary (omitida).`);
        continue;
      }

      logs.push(`📸 Procesando "${wpTitle}": Extrayendo fotos para subida a Cloudinary...`);

      // Extract portada
      let fotoPortadaOriginal = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
      
      // Extract gallery images from content
      const extractedImages = extractImagesFromContent(rawContent);

      if (!fotoPortadaOriginal && extractedImages.length > 0) {
        fotoPortadaOriginal = extractedImages[0];
      }

      // Filter gallery urls (avoid duplicate with portada) - Subir todas las fotos originales
      const galeriaOriginalUrls = extractedImages.filter(url => url !== fotoPortadaOriginal);

      // 1. Upload Portada to Cloudinary
      let fotoPortadaCloudinary = '';
      if (fotoPortadaOriginal) {
        fotoPortadaCloudinary = await uploadToCloudinaryWebp(fotoPortadaOriginal);
      }

      // 2. Upload Gallery Images in parallel chunks to Cloudinary
      let galeriaCloudinaryUrls: string[] = [];
      if (galeriaOriginalUrls.length > 0) {
        logs.push(`⏳ Subiendo y comprimiendo ${galeriaOriginalUrls.length} fotos a WebP en Cloudinary...`);
        galeriaCloudinaryUrls = await uploadBatchToCloudinary(galeriaOriginalUrls, 4);
      }

      // Clean HTML: Remove native WP gallery wrappers, figures, and loose gallery images
      let cleanHtml = rawContent
        .replace(/<div id=['"]gallery-[\s\S]*?<\/div>/gi, '')
        .replace(/<\/figure>|<\/div>/gi, '')
        .replace(/<figure[\s\S]*?<\/figure>/gi, '')
        .replace(/<figure[^>]*>/gi, '')
        .replace(/<img[^>]*>/gi, '')
        .replace(/<p>\s*<\/p>/gi, '')
        .trim();

      if (!cleanHtml || cleanHtml.length < 15 || cleanHtml.includes('gallery')) {
        cleanHtml = `<p>Galería fotográfica y momentos destacados del evento <strong>${wpTitle}</strong> del Colegio e Instituto Crossover.</p>`;
      }

      if (existing) {
        // Update existing record with Cloudinary assets
        const { error: updateError } = await supabase
          .from('noticias')
          .update({
            foto_portada: fotoPortadaCloudinary,
            galeria_urls: galeriaCloudinaryUrls,
            contenido_html: cleanHtml
          })
          .eq('id', existing.id);

        if (updateError) {
          logs.push(`❌ Error al actualizar "${wpTitle}": ${updateError.message}`);
        } else {
          logs.push(`🎉 ¡Actualizada a Cloudinary WebP!: "${wpTitle}" (${galeriaCloudinaryUrls.length} fotos optimizadas)`);
          migratedItems.push({
            id: existing.id,
            titulo: wpTitle,
            slug: wpSlug,
            foto_portada: fotoPortadaCloudinary,
            galeriaCount: galeriaCloudinaryUrls.length
          });
        }
      } else {
        // Insert new record with Cloudinary assets
        const { data: inserted, error: insertError } = await supabase
          .from('noticias')
          .insert({
            titulo: wpTitle,
            slug: wpSlug,
            foto_portada: fotoPortadaCloudinary,
            galeria_urls: galeriaCloudinaryUrls,
            contenido_html: cleanHtml,
            created_at: wpDate,
            etiquetas: ['MIGRACIÓN_WP', 'EVENTO']
          })
          .select()
          .single();

        if (insertError) {
          logs.push(`❌ Error al guardar "${wpTitle}": ${insertError.message}`);
        } else {
          logs.push(`✅ Migrada con éxito a Cloudinary WebP: "${wpTitle}" (${galeriaCloudinaryUrls.length} fotos optimizadas)`);
          migratedItems.push({
            id: inserted.id,
            titulo: inserted.titulo,
            slug: inserted.slug,
            foto_portada: inserted.foto_portada,
            galeriaCount: galeriaCloudinaryUrls.length
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      migratedCount: migratedItems.length,
      migratedItems,
      logs
    });

  } catch (error: any) {
    console.error('Error executing migration batch:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
