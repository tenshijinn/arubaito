import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Square, Play, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoRecorderProps {
  onVideoReady: (videoBlob: Blob) => void;
  maxDurationMinutes?: number;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ 
  onVideoReady,
  maxDurationMinutes = 5 
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const maxDurationMs = maxDurationMinutes * 60 * 1000;

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestPermissions = async () => {
    setIsInitializing(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
      }
      
      toast({
        title: "Camera Ready",
        description: "You can now start recording your video CV",
      });
    } catch (error) {
      console.error('Permission error:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera and microphone access to record your video CV",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    
    try {
      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = URL.createObjectURL(blob);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1000;
          if (newTime >= maxDurationMs) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording Failed",
        description: "Unable to start recording. Please try again.",
        variant: "destructive",
      });
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
      
      stopStream();
    }
  };

  const resetRecording = async () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setHasPermission(false);
    
    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = '';
      videoPreviewRef.current.srcObject = null;
    }
  };

  const confirmRecording = () => {
    if (recordedBlob) {
      onVideoReady(recordedBlob);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted={isRecording || !recordedBlob}
              controls={!!recordedBlob}
              className="w-full h-full object-cover"
            />
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
              </div>
            )}

            {/* Instructions Overlay */}
            {!hasPermission && !recordedBlob && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center space-y-2">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Record a video introducing yourself<br />and your Web3 experience
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recording Time Limit */}
          <p className="text-xs text-muted-foreground text-center">
            Maximum recording time: {maxDurationMinutes} minutes
          </p>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            {!hasPermission && !recordedBlob && (
              <Button
                onClick={requestPermissions}
                disabled={isInitializing}
                className="gap-2"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    Enable Camera
                  </>
                )}
              </Button>
            )}

            {hasPermission && !recordedBlob && !isRecording && (
              <Button onClick={startRecording} className="gap-2">
                <Play className="w-4 h-4" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button onClick={stopRecording} variant="destructive" className="gap-2">
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>
            )}

            {recordedBlob && (
              <>
                <Button onClick={resetRecording} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Record Again
                </Button>
                <Button onClick={confirmRecording} className="gap-2">
                  Use This Recording
                </Button>
              </>
            )}
          </div>

          {/* Guidance Text */}
          {(hasPermission || isRecording) && !recordedBlob && (
            <div className="text-sm text-muted-foreground space-y-1 text-center">
              <p className="font-medium">Tips for a great video CV:</p>
              <ul className="text-xs space-y-1">
                <li>• Introduce yourself and your background</li>
                <li>• Highlight your Web3 experience and projects</li>
                <li>• Mention your skills and role expertise</li>
                <li>• Keep it concise and professional</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
