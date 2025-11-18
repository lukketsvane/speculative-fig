'use client';

import { useState, useCallback } from 'react';
import { ImageUploader } from './ImageUploader';
import { Spinner } from './Spinner';
import { GeneratedImage } from './GeneratedImage';

export default function ImageGenerator() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setUploadedImage(dataUrl);
      
      try {
        // Convert file to base64
        const base64Data = dataUrl.split(',')[1];
        
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageData: base64Data,
            mimeType: file.type
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate image');
        }

        const data = await response.json();
        setGeneratedImage(`data:image/png;base64,${data.imageData}`);
      } catch (e) {
        console.error(e);
        setError('Failed to generate the drawing. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleReset = useCallback(() => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-700">
          speculative drawing
        </h1>
      </header>

      <main className="w-full max-w-2xl">
        <div className="bg-white p-6 sm:p-8 border border-gray-200">
          {!generatedImage && !isLoading && <ImageUploader onImageUpload={handleImageUpload} />}
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-6">
              {uploadedImage && (
                <div className="w-full max-w-md p-4 border-2 border-dashed border-gray-300">
                  <img src={uploadedImage || "/placeholder.svg"} alt="Uploaded preview" className="max-h-80 w-auto object-contain mx-auto" />
                </div>
              )}
              <Spinner />
            </div>
          )}

          {!isLoading && generatedImage && (
            <GeneratedImage imageData={generatedImage} onReset={handleReset} />
          )}

          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </div>
      </main>
    </div>
  );
}
