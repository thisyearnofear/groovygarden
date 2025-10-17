import { Play, Square, RotateCcw, Check, CircleAlert } from "lucide-react";
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob) => void;
  maxDurationSeconds?: number;
  minDurationSeconds?: number;
}

export default function VideoRecorder({ 
  onVideoRecorded, 
  maxDurationSeconds = 10, 
  minDurationSeconds = 5 
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    initializeCamera();
    return () => {
      cleanup();
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' 
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissionGranted(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9' // Fallback will be handled by browser
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setIsPreviewing(true);
        
        // Create preview URL
        if (previewRef.current) {
          previewRef.current.src = URL.createObjectURL(blob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= maxDurationSeconds) {
            stopRecording();
          }
          return newTime;
        });
      }, 100);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setIsPreviewing(false);
    setRecordingTime(0);
    
    // Restart camera preview
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  };

  const confirmRecording = () => {
    if (recordedBlob) {
      if (recordingTime < minDurationSeconds) {
        setError(`Recording must be at least ${minDurationSeconds} seconds long.`);
        return;
      }
      onVideoRecorded(recordedBlob);
    }
  };

  const formatTime = (seconds: number) => {
    return seconds.toFixed(1) + 's';
  };

  if (!permissionGranted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <CircleAlert className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
          <p className="text-gray-600 mb-4">
            Please allow camera access to record your dance move.
          </p>
          <Button onClick={initializeCamera}>
            Grant Permission
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {error && (
        <Alert className="mb-4" variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          {/* Video Display */}
          <div className="relative mb-6 bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-96 object-cover ${isPreviewing ? 'hidden' : ''}`}
            />
            <video
              ref={previewRef}
              controls
              playsInline
              className={`w-full h-96 object-cover ${!isPreviewing ? 'hidden' : ''}`}
            />
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">REC</span>
              </div>
            )}
            
            {/* Timer */}
            {(isRecording || isPreviewing) && (
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full">
                <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 sm:space-x-4">
            {!isRecording && !isPreviewing && (
            <Button
            onClick={startRecording}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white min-h-[48px] px-6 text-base"
            >
            <Play className="w-5 h-5 mr-2" />
            Start Recording
            </Button>
            )}

            {isRecording && (
            <Button
            onClick={stopRecording}
            size="lg"
            variant="destructive"
              className="min-h-[48px] px-6 text-base"
            >
            <Square className="w-5 h-5 mr-2" />
              Stop Recording
              </Button>
            )}

            {isPreviewing && (
              <>
                <Button
                onClick={discardRecording}
                variant="outline"
                size="lg"
                  className="min-h-[48px] px-6 text-base"
                >
                <RotateCcw className="w-5 h-5 mr-2" />
                  Retake
                </Button>
                <Button
                onClick={confirmRecording}
                size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white min-h-[48px] px-6 text-base"
                >
                <Check className="w-5 h-5 mr-2" />
                  Use This Recording
                 </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {!isRecording && !isPreviewing && (
              <p>Record a dance move between {minDurationSeconds}-{maxDurationSeconds} seconds</p>
            )}
            {isRecording && (
              <p>Recording will automatically stop at {maxDurationSeconds} seconds</p>
            )}
            {isPreviewing && recordingTime < minDurationSeconds && (
              <p className="text-red-600">
                Recording is too short. Minimum {minDurationSeconds} seconds required.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}