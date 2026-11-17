import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'No Instagram token found' }, { status: 500 });
  }

  const igBusinessId = process.env.INSTAGRAM_BUSINESS_ID || '17841400951047032';

  try {
    const url = token.startsWith('EAA')
      ? `https://graph.facebook.com/v21.0/${igBusinessId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${token}`
      : `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${token}`;

    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Error fetching Instagram feed:', error);
    return NextResponse.json({ error: 'Failed to fetch Instagram feed' }, { status: 500 });
  }
}
