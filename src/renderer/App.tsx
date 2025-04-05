import { useEffect, useState } from 'react';
import Solution from './components/main/solution';
import { interviewApi } from './api/interviewApi';
import { base64ToBlob } from './lib/utils/base64toBlob';

export default function App() {
  const [solutionData, setSolutionData] = useState('');

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
          const imageData: Blob = base64ToBlob(dataURL);

          stream.getTracks().forEach((track) => track.stop());

          resolve(imageData); // returns screenshot
        }, 100);
      };
    });
  };

  const uploadAndGetSolution = async (imageData: Blob) => {
    try {
      const { data } = await interviewApi.getSolution({ image: imageData });
      setSolutionData('data');
    } catch (e) {
      console.log('error', e);
    }
  };

  useEffect(() => {
    window.electronAPI.onCaptureSS(async () => {
      const screenshot: any = await captureScreenShot();
      await uploadAndGetSolution(screenshot);
    });
  }, []);
  return (
    <div className="h-full w-full p-4">
      <Solution />
    </div>
  );
}
