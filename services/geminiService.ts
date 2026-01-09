
import { GoogleGenAI } from "@google/genai";
import { UploadedImageData } from "../types";

export const checkApiKey = async (): Promise<boolean> => {
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    return await (window as any).aistudio.hasSelectedApiKey();
  }
  return false;
};

export const openApiKeySelector = async (): Promise<void> => {
  if (typeof (window as any).aistudio?.openSelectKey === 'function') {
    await (window as any).aistudio.openSelectKey();
  } else {
    alert("API Key selection is only available in the AI Studio environment.");
  }
};

const SYSTEM_CONSTRAINTS = `
OUTPUT FORMAT (MANDATORY):
- Aspect Ratio: 9:16 (vertical)
- Portrait orientation ONLY
- No horizontal or square output

CRITICAL CONSTRAINTS:
- Do NOT add, remove, replace, or modify ANY objects.
- Do NOT move, rotate, resize, or animate any objects.
- All furniture, decor, lighting, textures, materials, and layout MUST remain IDENTICAL to the original image.
- No new elements, no disappearing elements, no deformation.

ONLY allowed motion:
- Camera movement ONLY.
- No object motion of any kind.

CAMERA RULES:
- First-person perspective
- Slow cinematic push-in
- Camera starts FAR from the room entrance
- Camera moves forward smoothly toward the center of the room
- Straight forward motion only
- No pan, no tilt, no roll
- Stable, realistic dolly movement
`;

export const generateCinematicVideo = async (
  imageData: UploadedImageData,
  mood: string,
  onStatusUpdate: (status: string, progress: number) => void
): Promise<string> => {
  // Create a new instance right before the call as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const fullPrompt = `${SYSTEM_CONSTRAINTS}
  
  Generate a cinematic vertical video (9:16) from the uploaded image.
  The scene must remain EXACTLY the same as the original image.
  
  Camera movement: A slow, smooth forward dolly shot from a distant first-person viewpoint, gradually approaching the room interior.
  Mood/Style: ${mood || 'Luxury real estate style, clean and professional'}
  `;

  onStatusUpdate("Initializing video generation...", 10);

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: fullPrompt,
      image: {
        imageBytes: imageData.base64,
        mimeType: imageData.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '9:16'
      }
    });

    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      // Video generation can take minutes, let's provide realistic feedback
      const progress = Math.min(10 + (pollCount * 5), 95);
      onStatusUpdate(`Processing video frames... (${pollCount * 10}s elapsed)`, progress);
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        operation = await ai.operations.getVideosOperation({ operation: operation });
      } catch (err: any) {
        if (err.message?.includes("Requested entity was not found")) {
          throw new Error("API_KEY_EXPIRED");
        }
        throw err;
      }
    }

    onStatusUpdate("Finalizing video file...", 98);
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed - no output received.");

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  } catch (error: any) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};
