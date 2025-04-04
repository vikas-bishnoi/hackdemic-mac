import { useEffect } from 'react';
import Solution from './components/main/solution';
import { interviewApi } from './api/interviewApi';

export default function App() {
  const captureScreenShot = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          minWidth: 1920, // Or your screen's actual width
          maxWidth: 3840, // For 4K
          minHeight: 1080,
          maxHeight: 2160,
          minFrameRate: 30, // Smooth
          maxFrameRate: 60, // Highest allowed
        },
      },
    });

    const video = document.createElement('video');
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();

        // Wait for one frame to render
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const dataURL = canvas.toDataURL('image/png');

          stream.getTracks().forEach((track) => track.stop());

          resolve(dataURL); // returns screenshot
        }, 100);
      };
    });
  };

  const getSolution = async (imageData: string) => {
    try {
      const response = await interviewApi.getSolution({ image: imageData });
    } catch (e) {
      console.log('error', e);
    }
  };

  useEffect(() => {
    window.electronAPI.onCaptureSS(async () => {
      const screenshot = await captureScreenShot();
      // Send to main process to save
      window.electronAPI.saveScreenshot(screenshot);
    });

    window.electronAPI.onProcessImageData(async (data: string) => {
      await getSolution(data);
    });
  }, []);
  return (
    <div className="h-full w-full p-4">
      <Solution />
    </div>
  );
}
