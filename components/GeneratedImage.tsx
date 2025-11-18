'use client';

interface GeneratedImageProps {
  imageData: string;
  onReset: () => void;
}

export function GeneratedImage({ imageData, onReset }: GeneratedImageProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="w-full max-w-md p-2 bg-white border border-gray-200">
        <img src={imageData || "/placeholder.svg"} alt="Generated speculative drawing" className="w-full h-auto object-contain" />
      </div>
      <div className="flex space-x-4">
        <a 
          href={imageData} 
          download="speculative-drawing.png"
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-center text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:ring-primary-300 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-center text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 11a9 9 0 0114.65-4.65l-2.12 2.12" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13a9 9 0 01-14.65 4.65l2.12-2.12" />
          </svg>
          Create Another
        </button>
      </div>
    </div>
  );
}
