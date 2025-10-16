import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Download, Play, Pause } from 'lucide-react';

const RecordingManager = ({ isRecording, onStartRecording, onStopRecording, recordedBlob }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setHasPermission(true);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Permission denied:', error);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await checkPermissions();
    }
    
    if (streamRef.current) {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onStopRecording(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      onStartRecording();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-${new Date().toISOString().split('T')[0]}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const playRecording = () => {
    if (recordedBlob && videoRef.current) {
      const url = URL.createObjectURL(recordedBlob);
      videoRef.current.src = url;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <VideoOff className="w-5 h-5" />
          <span>Camera/Microphone permission required for recording</span>
        </div>
        <button
          onClick={checkPermissions}
          className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
        >
          Grant Permission
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted={!recordedBlob}
          className="w-full max-w-md rounded-lg border"
          onEnded={() => setIsPlaying(false)}
        />
        
        {isRecording && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            REC
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <Video className="w-4 h-4" />
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <VideoOff className="w-4 h-4" />
            Stop Recording
          </button>
        )}

        {recordedBlob && (
          <>
            {!isPlaying ? (
              <button
                onClick={playRecording}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Play className="w-4 h-4" />
                Play
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            
            <button
              onClick={downloadRecording}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RecordingManager;