import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Bot,
  BrainCircuit,
  Image as ImageIcon,
  Video,
  FileAudio,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  User,
  Loader2,
} from 'lucide-react';
import {
  sendChatMessage,
  generateIntelligentText,
  runHighThinking,
  analyzeImage,
  analyzeVideo,
  transcribeAudio,
  ChatMessage,
} from '../services/gemini';
import { floatTo16BitPCM, arrayBufferToBase64, LiveAudioPlayer } from '../services/liveAudio';

interface GeminiSuiteViewProps {
  initialSubTab?: 'voice' | 'chat' | 'multimodal' | 'thinking';
}

export const GeminiSuiteView: React.FC<GeminiSuiteViewProps> = ({
  initialSubTab = 'voice',
}) => {
  const [subTab, setSubTab] = useState<'voice' | 'chat' | 'multimodal' | 'thinking'>(initialSubTab);

  // 1. LIVE VOICE STATE
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('Ready to connect');
  const [voiceInterrupted, setVoiceInterrupted] = useState(false);
  const liveWsRef = useRef<WebSocket | null>(null);
  const livePlayerRef = useRef<LiveAudioPlayer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 2. CHATBOT STATE
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Greetings! I am the School Management ERP AI Advisor. I can assist you with timetable scheduling, fee policies, student attendance analysis, and institutional academic strategy. How can I help you today?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatModel, setChatModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // 3. MULTIMODAL VISION & AUDIO STATE
  const [multimodalType, setMultimodalType] = useState<'image' | 'video' | 'transcribe'>('image');
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/jpeg');
  const [multimodalPrompt, setMultimodalPrompt] = useState('Inspect this document or photo and extract student ID, grades, or receipt details.');
  const [multimodalResult, setMultimodalResult] = useState<string | null>(null);
  const [multimodalLoading, setMultimodalLoading] = useState(false);

  // Audio Recording for Transcribe
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 4. HIGH THINKING STATE
  const [thinkingPrompt, setThinkingPrompt] = useState(
    'Conduct a forensic audit of the fall semester tuition accounts receivable ($1,950 outstanding). Propose an optimized multi-tiered payment recovery schedule, identify at-risk students, and restructure the laboratory consumable budget for the STEM Wing.'
  );
  const [thinkingResult, setThinkingResult] = useState<string | null>(null);
  const [thinkingLoading, setThinkingLoading] = useState(false);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // LIVE VOICE TOGGLE
  const toggleLiveVoice = async () => {
    if (isVoiceActive) {
      stopLiveVoice();
    } else {
      startLiveVoice();
    }
  };

  const startLiveVoice = async () => {
    try {
      setVoiceStatus('Establishing live audio channel...');
      if (!livePlayerRef.current) {
        livePlayerRef.current = new LiveAudioPlayer();
      }

      // Open WebSocket to our server endpoint /ws/live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = async () => {
        setVoiceStatus('Microphone active · Streaming to gemini-3.8-live');
        setIsVoiceActive(true);

        // Capture Mic at 16kHz
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioCtx({ sampleRate: 16000 });
        audioContextRef.current = inputCtx;

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputChannel = e.inputBuffer.getChannelData(0);
            const pcmBuffer = floatTo16BitPCM(inputChannel);
            const base64Pcm = arrayBufferToBase64(pcmBuffer);
            ws.send(JSON.stringify({ audio: base64Pcm }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio' && msg.audio) {
            livePlayerRef.current?.playChunk(msg.audio);
          }
          if (msg.type === 'interrupted') {
            setVoiceInterrupted(true);
            livePlayerRef.current?.stopAll();
            setTimeout(() => setVoiceInterrupted(false), 1500);
          }
          if (msg.type === 'error') {
            setVoiceStatus(`Error: ${msg.message}`);
          }
        } catch (err) {
          console.error('Error handling live message:', err);
        }
      };

      ws.onclose = () => {
        setIsVoiceActive(false);
        setVoiceStatus('Live voice session ended');
      };
    } catch (err: any) {
      console.error('Error starting live voice:', err);
      setVoiceStatus(`Could not access microphone: ${err.message}`);
      setIsVoiceActive(false);
    }
  };

  const stopLiveVoice = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (liveWsRef.current) {
      liveWsRef.current.close();
      liveWsRef.current = null;
    }
    if (livePlayerRef.current) {
      livePlayerRef.current.stopAll();
    }
    setIsVoiceActive(false);
    setVoiceStatus('Disconnected');
  };

  // CHATBOT SEND
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await sendChatMessage(
        newHistory,
        'You are an authoritative, helpful, and cordial AI School Administrator and Academic Advisor for the School Management ERP Command Center. Assist administrators, teachers, and parents with scheduling, policies, student progress, financial forecasts, and operations.',
        chatModel
      );
      setChatMessages([...newHistory, { role: 'assistant', content: response.text }]);
    } catch (err: any) {
      setChatMessages([
        ...newHistory,
        { role: 'assistant', content: `Sorry, an error occurred: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // MULTIMODAL HANDLERS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunMultimodal = async () => {
    if (!uploadedBase64) return;
    setMultimodalLoading(true);
    setMultimodalResult(null);

    try {
      if (multimodalType === 'image') {
        const res = await analyzeImage(uploadedBase64, uploadedMimeType, multimodalPrompt);
        setMultimodalResult(res.text);
      } else if (multimodalType === 'video') {
        const res = await analyzeVideo(uploadedBase64, uploadedMimeType, multimodalPrompt);
        setMultimodalResult(res.text);
      } else if (multimodalType === 'transcribe') {
        const res = await transcribeAudio(uploadedBase64, uploadedMimeType);
        setMultimodalResult(res.text);
      }
    } catch (err: any) {
      setMultimodalResult(`Analysis error: ${err.message}`);
    } finally {
      setMultimodalLoading(false);
    }
  };

  // MICROPHONE RECORDING FOR TRANSCRIBE
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      audioRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedBase64(reader.result as string);
          setUploadedMimeType('audio/webm');
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
    } catch (err: any) {
      alert(`Microphone error: ${err.message}`);
    }
  };

  const stopAudioRecording = () => {
    if (audioRecorderRef.current && isRecordingAudio) {
      audioRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  // HIGH THINKING HANDLER
  const handleRunHighThinking = async () => {
    if (!thinkingPrompt.trim() || thinkingLoading) return;
    setThinkingLoading(true);
    setThinkingResult(null);

    try {
      const res = await runHighThinking(
        thinkingPrompt,
        'You are an elite educational strategist and deep reasoning intelligence for institutional school operations. Solve complex operational problems, structural timetable bottlenecks, forensic financial audits, and multi-year curriculum designs.'
      );
      setThinkingResult(res.text);
    } catch (err: any) {
      setThinkingResult(`Reasoning Error: ${err.message}`);
    } finally {
      setThinkingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Gemini AI Intelligence Suite
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time Live voice, conversational chat, Pro image/video perception, audio transcription, and High Thinking reasoning.
          </p>
        </div>
      </div>

      {/* Feature Sub-Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setSubTab('voice')}
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            subTab === 'voice'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Mic className="w-4 h-4 text-indigo-500" />
          <span>Live Voice (3.8-Live)</span>
        </button>

        <button
          onClick={() => setSubTab('chat')}
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            subTab === 'chat'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Bot className="w-4 h-4 text-indigo-500" />
          <span>Admin Chatbot</span>
        </button>

        <button
          onClick={() => setSubTab('multimodal')}
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            subTab === 'multimodal'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-indigo-500" />
          <span>Vision &amp; Transcribe</span>
        </button>

        <button
          onClick={() => setSubTab('thinking')}
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            subTab === 'thinking'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-indigo-500" />
          <span>High Thinking Mode</span>
        </button>
      </div>

      {/* 1. VOICE TAB (gemini-3.8-live) */}
      {subTab === 'voice' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xs text-center space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Live API · Model: gemini-3.8-live
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Real-Time Voice Administrative Assistant
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Speak naturally through your microphone and receive instantaneous low-latency spoken responses from Gemini.
            </p>
          </div>

          {/* Interactive Animated Waveform & Mic Circle */}
          <div className="py-6 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              {isVoiceActive && (
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
              )}
              <button
                onClick={toggleLiveVoice}
                className={`w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-xl transition-all relative z-10 ${
                  isVoiceActive
                    ? 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/30 scale-105'
                    : 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-indigo-500/30 hover:scale-105'
                }`}
              >
                {isVoiceActive ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                <span className="text-[11px] font-bold mt-1">
                  {isVoiceActive ? 'End Call' : 'Start Voice'}
                </span>
              </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isVoiceActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              ></span>
              <span>{voiceStatus}</span>
            </div>

            {voiceInterrupted && (
              <div className="text-[11px] font-bold text-amber-500 animate-bounce">
                Barge-in / User Interruption detected!
              </div>
            )}
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Voice Capabilities</span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
              <li>Bidi PCM audio stream at 16kHz input &amp; 24kHz synthesized output</li>
              <li>Natural interruption and barge-in handling supported</li>
              <li>Ask about student attendance, outstanding fees, and faculty rosters</li>
            </ul>
          </div>
        </div>
      )}

      {/* 2. CHATBOT TAB */}
      {subTab === 'chat' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[560px]">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  Multi-Turn Institutional Advisor
                </h2>
                <p className="text-[10px] text-slate-400">Persistent conversation thread with system instructions</p>
              </div>
            </div>

            {/* Model Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
              <button
                onClick={() => setChatModel('gemini-3.5-flash')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chatModel === 'gemini-3.5-flash'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                3.5-Flash (General)
              </button>
              <button
                onClick={() => setChatModel('gemini-3.1-pro-preview')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chatModel === 'gemini-3.1-pro-preview'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                3.1-Pro (Complex)
              </button>
              <button
                onClick={() => setChatModel('gemini-3.1-flash-lite')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chatModel === 'gemini-3.1-flash-lite'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                3.1-Lite (Fast)
              </button>
            </div>
          </div>

          {/* Messages Scrollable Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 font-bold">
                    U
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2 items-center text-xs text-slate-400 pl-10">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Gemini is generating response...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask anything about student rosters, fee policies, academic calendars, or institutional ops..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 3. MULTIMODAL VISION & TRANSCRIBE */}
      {subTab === 'multimodal' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <button
              onClick={() => {
                setMultimodalType('image');
                setUploadedBase64(null);
                setMultimodalResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                multimodalType === 'image'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Document &amp; Photo Analysis (gemini-3.1-pro-preview)
            </button>
            <button
              onClick={() => {
                setMultimodalType('video');
                setUploadedBase64(null);
                setMultimodalResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                multimodalType === 'video'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Video Understanding (gemini-3.1-pro-preview)
            </button>
            <button
              onClick={() => {
                setMultimodalType('transcribe');
                setUploadedBase64(null);
                setMultimodalResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                multimodalType === 'transcribe'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Audio Speech-to-Text (gemini-3.5-transcribe)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Input & Upload */}
            <div className="space-y-4 text-xs">
              {multimodalType === 'transcribe' ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                    <FileAudio className="w-8 h-8 text-indigo-500 mx-auto" />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Record from Microphone or Upload Audio
                      </div>
                      <p className="text-[11px] text-slate-400">Model: gemini-3.5-transcribe</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      {!isRecordingAudio ? (
                        <button
                          type="button"
                          onClick={startAudioRecording}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5"
                        >
                          <Mic className="w-4 h-4" />
                          <span>Record Voice Memo</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopAudioRecording}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 animate-pulse"
                        >
                          <MicOff className="w-4 h-4" />
                          <span>Stop Recording</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-center text-slate-400 text-[11px]">— or upload pre-recorded audio —</div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                    {multimodalType === 'image' ? (
                      <ImageIcon className="w-8 h-8 text-indigo-500 mx-auto" />
                    ) : (
                      <Video className="w-8 h-8 text-indigo-500 mx-auto" />
                    )}
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Upload {multimodalType === 'image' ? 'Document / Photo' : 'Video Clip'}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Model: gemini-3.1-pro-preview
                    </p>
                    <input
                      type="file"
                      accept={multimodalType === 'image' ? 'image/*' : 'video/*'}
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                    />
                  </div>

                  {uploadedBase64 && multimodalType === 'image' && (
                    <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={uploadedBase64} alt="Uploaded" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Prompt Instructions</label>
                    <textarea
                      rows={3}
                      value={multimodalPrompt}
                      onChange={(e) => setMultimodalPrompt(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleRunMultimodal}
                disabled={!uploadedBase64 || multimodalLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {multimodalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {multimodalLoading
                    ? 'Gemini Processing...'
                    : multimodalType === 'transcribe'
                    ? 'Transcribe Audio'
                    : 'Analyze with Gemini Pro'}
                </span>
              </button>
            </div>

            {/* Right: Output */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                Gemini Extraction &amp; Analysis Result
              </span>
              <div className="flex-1 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                {multimodalResult || (
                  <span className="text-slate-400 italic">
                    Upload an asset and click analyze to view structured extraction results here.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. HIGH THINKING TAB */}
      {subTab === 'thinking' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[11px] font-bold">
              <BrainCircuit className="w-3.5 h-3.5" />
              Thinking Level: ThinkingLevel.HIGH · Model: gemini-3.1-pro-preview
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Institutional Deep Reasoning &amp; Strategic Audit Engine
            </h2>
            <p className="text-xs text-slate-500">
              Allocates maximum reasoning tokens for multi-step timetable bottleneck resolution, forensic accounting reconciliations, and curriculum optimization.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Complex Institutional Query / Strategy Problem
            </label>
            <textarea
              rows={4}
              value={thinkingPrompt}
              onChange={(e) => setThinkingPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunHighThinking}
              disabled={thinkingLoading || !thinkingPrompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {thinkingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking at Level HIGH (Deep Reasoning)...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  <span>Run High Thinking Analysis</span>
                </>
              )}
            </button>
          </div>

          {thinkingResult && (
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Strategic Reasoning Synthesis
                </span>
                <span className="text-[10px] text-slate-400 font-mono">gemini-3.1-pro-preview</span>
              </div>
              <div className="text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                {thinkingResult}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
