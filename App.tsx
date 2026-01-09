
import React, { useState, useEffect, useCallback } from 'react';
import { VideoGenerationState, UploadedImageData } from './types';
import { 
  checkApiKey, 
  openApiKeySelector, 
  generateCinematicVideo 
} from './services/geminiService';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [image, setImage] = useState<UploadedImageData | null>(null);
  const [mood, setMood] = useState('');
  const [genState, setGenState] = useState<VideoGenerationState>({
    isGenerating: false,
    status: '',
    videoUrl: null,
    error: null,
    progress: 0
  });

  useEffect(() => {
    const init = async () => {
      const selected = await checkApiKey();
      setHasKey(selected);
    };
    init();
  }, []);

  const handleKeySelect = async () => {
    await openApiKeySelector();
    setHasKey(true); // Proceed as per guidelines to mitigate race conditions
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage({ base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const startGeneration = useCallback(async () => {
    if (!image) return;

    setGenState({
      isGenerating: true,
      status: 'Starting...',
      videoUrl: null,
      error: null,
      progress: 0
    });

    try {
      const url = await generateCinematicVideo(image, mood, (status, progress) => {
        setGenState(prev => ({ ...prev, status, progress }));
      });
      setGenState({
        isGenerating: false,
        status: 'Completed',
        videoUrl: url,
        error: null,
        progress: 100
      });
    } catch (err: any) {
      if (err.message === "API_KEY_EXPIRED") {
        setHasKey(false);
        setGenState(prev => ({ 
          ...prev, 
          isGenerating: false, 
          error: "API Session Expired. Please re-select your key." 
        }));
      } else {
        setGenState(prev => ({ 
          ...prev, 
          isGenerating: false, 
          error: err.message || "An unexpected error occurred." 
        }));
      }
    }
  }, [image, mood]);

  if (hasKey === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
          <h1 className="text-3xl font-bold mb-4 tracking-tight">Cinematic Dolly Creator</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            To generate high-quality 1080p videos, you need to select a valid API key from a paid Google Cloud project.
          </p>
          <button 
            onClick={handleKeySelect}
            className="w-full bg-white text-black font-semibold py-4 px-8 rounded-xl hover:bg-zinc-200 transition-all transform active:scale-95"
          >
            Select API Key
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block mt-6 text-sm text-zinc-500 hover:text-white underline underline-offset-4"
          >
            Learn about billing & API keys
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter">CINEMATIC DOLLY</h1>
          <p className="text-zinc-500 font-medium">IMAGE TO VERTICAL CINEMATIC MOTION</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setHasKey(false)}
            className="text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            Change API Key
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Configuration */}
        <div className="space-y-8">
          <section className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white text-black text-xs flex items-center justify-center font-bold">1</span>
              Upload Interior Image
            </h2>
            <div className="relative group">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`
                border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all
                ${image ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-600'}
              `}>
                {image ? (
                  <div className="w-full h-full relative group">
                    <img 
                      src={`data:${image.mimeType};base64,${image.base64}`} 
                      className="max-h-[300px] w-full object-contain rounded-lg shadow-lg" 
                      alt="Source"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                      <span className="text-sm font-medium">Click to replace</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-zinc-500">Drop your photo here or click to browse</p>
                  </>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              Note: Vertical/Portrait images (9:16) work best for this camera path.
            </p>
          </section>

          <section className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white text-black text-xs flex items-center justify-center font-bold">2</span>
              Set Mood (Optional)
            </h2>
            <textarea 
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="e.g. Golden hour lighting, warm atmosphere, luxury real estate presentation..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all min-h-[100px]"
            />
          </section>

          <button
            onClick={startGeneration}
            disabled={!image || genState.isGenerating}
            className={`
              w-full py-5 px-8 rounded-2xl font-bold text-lg transition-all transform active:scale-95 flex items-center justify-center gap-3
              ${!image || genState.isGenerating 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.6)] text-white'}
            `}
          >
            {genState.isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>GENERATING...</span>
              </>
            ) : (
              'GENERATE CINEMATIC DOLLY'
            )}
          </button>

          {genState.error && (
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm">
              <p className="font-semibold mb-1">Error</p>
              {genState.error}
            </div>
          )}
        </div>

        {/* Right: Results / Processing */}
        <div className="relative">
          <div className="sticky top-10 flex flex-col items-center">
            {genState.isGenerating ? (
              <div className="w-full max-w-[400px] aspect-[9/16] bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-10 text-center shadow-2xl overflow-hidden relative">
                {image && (
                  <img 
                    src={`data:${image.mimeType};base64,${image.base64}`}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110"
                    alt="Loading backdrop"
                  />
                )}
                <div className="relative z-10 w-full">
                  <div className="mb-6">
                    <div className="w-20 h-20 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">Creating Cinema</h3>
                  <p className="text-zinc-500 text-sm mb-8">{genState.status}</p>
                  
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-1000 ease-out"
                      style={{ width: `${genState.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                    <span>Inception</span>
                    <span>Result</span>
                  </div>
                </div>
              </div>
            ) : genState.videoUrl ? (
              <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="aspect-[9/16] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden mb-6 group relative">
                  <video 
                    src={genState.videoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Generated Video
                  </div>
                </div>
                <div className="flex gap-4">
                  <a 
                    href={genState.videoUrl} 
                    download="cinematic_dolly.mp4"
                    className="flex-1 bg-white text-black font-bold py-4 rounded-xl text-center hover:bg-zinc-200 transition-colors"
                  >
                    DOWNLOAD
                  </a>
                  <button 
                    onClick={() => setGenState(prev => ({ ...prev, videoUrl: null }))}
                    className="bg-zinc-900 border border-zinc-800 text-white font-bold py-4 px-8 rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    RESET
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[400px] aspect-[9/16] bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-12 text-center text-zinc-700">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">Your generated video will appear here</p>
                <p className="text-xs mt-2 text-zinc-800">Maintain full scene composition with slow 9:16 push-in camera motion</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-24 pt-12 border-t border-zinc-900 text-zinc-600 text-xs flex flex-col md:flex-row justify-between gap-6 pb-12">
        <div className="space-y-2">
          <p>© 2024 Cinematic Dolly Engine</p>
          <p>Powered by Veo 3.1 Fast Generate Preview</p>
        </div>
        <div className="max-w-md">
          <p className="leading-relaxed">
            This tool strictly maintains the original scene geometry and lighting. 
            The only permitted movement is a first-person dolly shot (push-in). 
            Objects will remain static to ensure a high-fidelity architectural showcase.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
