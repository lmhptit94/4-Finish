
export interface VideoGenerationState {
  isGenerating: boolean;
  status: string;
  videoUrl: string | null;
  error: string | null;
  progress: number;
}

export interface UploadedImageData {
  base64: string;
  mimeType: string;
}
