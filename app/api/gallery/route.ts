import { NextResponse } from 'next/server';

// In-memory storage for generated images
// In production, you'd use a database like Supabase or Postgres
let galleryImages: Array<{
  id: string;
  url: string;
  timestamp: number;
}> = [];

export async function GET() {
  return NextResponse.json({ images: galleryImages.sort((a, b) => b.timestamp - a.timestamp) });
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const newImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      timestamp: Date.now(),
    };

    galleryImages.push(newImage);
    
    // Keep only last 100 images in memory
    if (galleryImages.length > 100) {
      galleryImages = galleryImages.slice(-100);
    }

    return NextResponse.json({ success: true, image: newImage });
  } catch (error) {
    console.error('[v0] Error saving to gallery:', error);
    return NextResponse.json(
      { error: 'Failed to save image to gallery' },
      { status: 500 }
    );
  }
}
