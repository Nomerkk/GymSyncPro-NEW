import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";

interface CameraSelfieProps {
  onCapture: (imageData: string) => void;
  capturedImage: string | null;
}

export default function CameraSelfie({ onCapture, capturedImage }: CameraSelfieProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      setError("");
      
      // Simple constraints for better compatibility
      const constraints = {
        video: {
          facingMode: "user"
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError("Tidak bisa buka kamera. Gunakan tombol 'Ambil Foto' di bawah sebagai alternatif.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFromVideo = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        onCapture(imageData);
        stopCamera();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        onCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    onCapture("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    // Auto-start camera on mount
    if (!capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, []);

  if (capturedImage) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={capturedImage}
            alt="Selfie preview"
            className="w-full h-auto object-contain mx-auto"
            style={{ maxHeight: "400px" }}
          />
          <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-2 shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <Button
          type="button"
          onClick={retakePhoto}
          variant="outline"
          className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
          data-testid="button-retake-photo"
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Ambil Ulang Foto
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stream ? (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
              style={{ maxHeight: "400px", transform: "scaleX(-1)" }}
            />
          </div>
          <Button
            type="button"
            onClick={captureFromVideo}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            data-testid="button-capture-photo"
          >
            <Camera className="h-5 w-5 mr-2" />
            Ambil Foto
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Ambil foto selfie untuk registrasi
            </p>
            {error && (
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-4">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-camera-file"
          />
          
          <div className="space-y-2">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              data-testid="button-take-selfie"
            >
              <Camera className="h-5 w-5 mr-2" />
              Ambil Foto Selfie
            </Button>
            
            {!error && (
              <Button
                type="button"
                onClick={startCamera}
                variant="outline"
                className="w-full"
                data-testid="button-retry-camera"
              >
                Coba Buka Kamera Lagi
              </Button>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
