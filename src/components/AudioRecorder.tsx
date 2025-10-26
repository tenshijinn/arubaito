import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Play, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob) => void;
  maxDurationMinutes?: number;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onAudioReady,
  maxDurationMinutes = 5 
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
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
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        }
      });
      
      setStream(mediaStream);
      setHasPermission(true);
      
      toast({
        title: "Microphone Ready",
        description: "You can now start recording your introduction",
      });
    } catch (error) {
      console.error('Permission error:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record your introduction",
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

  const startRecording = async () => {
    if (!stream) return;

    chunksRef.current = [];
    
    try {
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        
        if (audioPreviewRef.current) {
          audioPreviewRef.current.src = URL.createObjectURL(blob);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1000;
          if (newTime >= maxDurationMs) {
            stopRecording();
            toast({
              title: "Recording Complete",
              description: `Maximum recording time of ${maxDurationMinutes} minutes reached.`,
            });
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
    
    if (audioPreviewRef.current) {
      audioPreviewRef.current.src = '';
    }
  };

  const confirmRecording = () => {
    if (recordedBlob) {
      onAudioReady(recordedBlob);
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
          {/* Audio Visualizer */}
          <div className="relative bg-muted rounded-lg overflow-hidden h-32 flex items-center justify-center">
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-8 bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-12 bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-16 bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="w-2 h-12 bg-primary animate-pulse" style={{ animationDelay: '450ms' }} />
                <div className="w-2 h-8 bg-primary animate-pulse" style={{ animationDelay: '600ms' }} />
              </div>
            )}
            
            {!hasPermission && !recordedBlob && !isRecording && (
              <Mic className="w-12 h-12 text-muted-foreground" />
            )}

            {recordedBlob && (
              <audio
                ref={audioPreviewRef}
                controls
                className="w-full px-4"
              />
            )}

            {/* Recording Timer */}
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

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
                    <Mic className="w-4 h-4" />
                    Enable Microphone
                  </>
                )}
              </Button>
            )}

            {hasPermission && !recordedBlob && !isRecording && (
              <Button 
                onClick={startRecording} 
                className="gap-2"
              >
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

        </div>
      </CardContent>
    </Card>
  );
};
