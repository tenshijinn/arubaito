import { FaceDetection, Results } from '@mediapipe/face_detection';
import { Camera } from '@mediapipe/camera_utils';

export class FaceBlurProcessor {
  private faceDetection: FaceDetection | null = null;
  private camera: Camera | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoElement: HTMLVideoElement;
  private outputCanvas: HTMLCanvasElement;
  private outputCtx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private isProcessing = false;

  constructor(videoElement: HTMLVideoElement, outputCanvas: HTMLCanvasElement) {
    this.videoElement = videoElement;
    this.outputCanvas = outputCanvas;
    
    // Create hidden canvas for processing
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;

    const outputCtx = this.outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not get output canvas context');
    this.outputCtx = outputCtx;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize MediaPipe Face Detection
      this.faceDetection = new FaceDetection({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`;
        }
      });

      this.faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.5,
      });

      this.faceDetection.onResults((results: Results) => {
        this.processResults(results);
      });

      console.log('Face detection initialized');
    } catch (error) {
      console.error('Failed to initialize face detection:', error);
      throw error;
    }
  }

  private processResults(results: Results): void {
    if (!results.image) return;

    const { width, height } = results.image;
    this.canvas.width = width;
    this.canvas.height = height;
    this.outputCanvas.width = width;
    this.outputCanvas.height = height;

    // Draw the original image
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(results.image, 0, 0, width, height);

    // Blur detected faces
    if (results.detections && results.detections.length > 0) {
      results.detections.forEach((detection) => {
        const bbox = detection.boundingBox;
        if (!bbox) return;

        // Add padding to ensure full face coverage (15% on all sides)
        const padding = 0.15;
        const x = Math.max(0, bbox.xCenter - bbox.width * (0.5 + padding));
        const y = Math.max(0, bbox.yCenter - bbox.height * (0.5 + padding));
        const w = Math.min(width - x, bbox.width * (1 + padding * 2));
        const h = Math.min(height - y, bbox.height * (1 + padding * 2));

        // Extract face region
        const faceImageData = this.ctx.getImageData(x, y, w, h);

        // Apply blur
        this.ctx.filter = 'blur(25px)';
        this.ctx.drawImage(
          this.canvas,
          x, y, w, h,
          x, y, w, h
        );
        this.ctx.filter = 'none';
      });
    }

    // Copy processed frame to output canvas
    this.outputCtx.clearRect(0, 0, width, height);
    this.outputCtx.drawImage(this.canvas, 0, 0);
  }

  async startProcessing(): Promise<MediaStream> {
    if (!this.faceDetection) {
      throw new Error('Face detection not initialized');
    }

    this.isProcessing = true;

    // Initialize camera with MediaPipe
    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        if (this.faceDetection && this.isProcessing) {
          await this.faceDetection.send({ image: this.videoElement });
        }
      },
      width: 1280,
      height: 720,
    });

    await this.camera.start();

    // Create MediaStream from output canvas
    const stream = this.outputCanvas.captureStream(30); // 30 fps

    // Add audio track from original video stream
    const videoStream = this.videoElement.srcObject as MediaStream;
    if (videoStream) {
      const audioTracks = videoStream.getAudioTracks();
      audioTracks.forEach(track => stream.addTrack(track));
    }

    console.log('Face blur processing started');
    return stream;
  }

  stop(): void {
    this.isProcessing = false;
    
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log('Face blur processing stopped');
  }

  dispose(): void {
    this.stop();

    if (this.faceDetection) {
      this.faceDetection.close();
      this.faceDetection = null;
    }

    console.log('Face blur processor disposed');
  }
}
