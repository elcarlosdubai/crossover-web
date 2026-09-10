import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: 'fjpovhwl',
  api_key: '869213681911433',
  api_secret: process.env.CLOUDINARY_URL?.split(':')[2].split('@')[0] || ''
});

export async function POST(request: Request) {
  const body = await request.json();
  const { paramsToSign } = body;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    cloudinary.config().api_secret as string
  );

  return Response.json({ signature });
}
