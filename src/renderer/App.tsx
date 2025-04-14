import { useEffect, useState } from 'react';
import Solution from './components/main/solution';
import { interviewApi } from './api/interviewApi';
import { base64ToBlob } from './lib/helpers/base64toBlob';
import LoginPage from './components/main/login';
import { authApi } from './api/authApi';
import CircularLoader from './components/main/circular-loader';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [solutionText, setSolutionText] = useState('');

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
      // console.log(data);
      setSolutionText(data);
    } catch (e) {
      console.log('error', e);
    }
  };

  const authenticate = async () => {
    setIsLoading(true);
    try {
      await authApi.authenticate();
      setIsAuthenticated(true);
    } catch (e) {
      setIsAuthenticated(false);
      window.electronAPI.resize(300, 280);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    window.electronAPI.onCaptureSS(async () => {
      const screenshot: any = await captureScreenShot();
      await uploadAndGetSolution(screenshot);
    });

    authenticate();
  }, []);

  if (isLoading) {
    return <CircularLoader />;
  }
  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} />;
  }
  return (
    <div className="h-full w-full p-4">
      <Solution solution={solutionText} />
    </div>
  );
}
