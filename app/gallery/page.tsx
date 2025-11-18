'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  timestamp: number;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGallery() {
      try {
        const response = await fetch('/api/gallery');
        if (!response.ok) throw new Error('Failed to load gallery');
        const data = await response.json();
        setImages(data.images || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load gallery');
      } finally {
        setIsLoading(false);
      }
    }

    loadGallery();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to generator</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-700">
            gallery
          </h1>
          <p className="text-gray-600 mt-2">
            Your generated speculative drawings
          </p>
        </header>

        <main>
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {!isLoading && !error && images.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No images yet</p>
              <p className="text-gray-400 mt-2">Generate your first speculative drawing to see it here</p>
            </div>
          )}

          {!isLoading && !error && images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div 
                  key={image.id} 
                  className="bg-white border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                >
                  <img 
                    src={image.url || "/placeholder.svg"} 
                    alt="Generated drawing" 
                    className="w-full h-auto object-contain"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(image.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
