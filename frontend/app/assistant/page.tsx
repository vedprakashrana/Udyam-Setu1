'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  BookOpen, 
  FileText, 
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../services/apiClient';

interface Citation {
  source: string;
  section: string;
  confidence: string;
}

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  citations?: Citation[];
  suggested_actions?: string[];
  createdAt: string;
}

export default function AssistantPage() {
  const { currentLang, setLanguage, currentOption, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeCitationModal, setActiveCitationModal] = useState<Citation | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize ONCE per conversation - NO duplicate messages on render
  useEffect(() => {
    const initConvId = 'conv_' + Math.random().toString(36).substring(2, 11);
    setConversationId(initConvId);

    const welcomeMsg: Message = {
      id: 'welcome-init-1',
      role: 'assistant',
      content: currentLang === 'en' 
        ? "Hello! I am UDYAM-SETU — your rural enterprise and financial planning assistant. You can ask about business ideas, local market competition, loan eligibility, MoSJE schemes, operational risks, and financial structuring."
        : "नमस्ते! मैं UDYAM-SETU हूँ — आपका ग्रामीण व्यवसाय एवं वित्तीय योजना सलाहकार। आप मुझसे बिजनेस आइडिया, लोकल मार्केट कॉम्पिटिशन, लोन पात्रता, MoSJE सरकारी योजनाओं, रिस्क और फाइनेंशियल प्लानिंग के बारे में पूछ सकते हैं।",
      citations: [
        { source: 'MoSJE Scheme Guidelines 2024 (NBCFDC Policy)', section: 'Section 4.1 - Eligibility & Margin Contribution', confidence: 'Verified' }
      ],
      suggested_actions: currentLang === 'en' ? [
        'I have ₹1 Lakh margin for Dairy business',
        'What are the key risks in poultry farming?',
        'Compare Dairy and Tailoring business'
      ] : [
        'मेरे पास डेयरी के लिए ₹1 लाख मार्जिन है',
        'पोल्ट्री फार्मिंग में क्या जोखिम हैं?',
        'डेयरी और टेलरिंग बिजनेस की तुलना करें'
      ],
      createdAt: new Date().toISOString()
    };

    setMessages([welcomeMsg]);
  }, [currentLang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Speech Recognition Hook (Voice-In)
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is supported in modern Chrome & Edge browsers.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = currentOption.speechCode || 'hi-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      sendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Text-To-Speech Audio Synth (Voice-Out) for the EXACT message
  const speakText = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#>`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = currentOption.speechCode || 'hi-IN';
    utterance.rate = 0.95;
    
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Helper function to render bold/italic inline text cleanly without raw markdown symbols
  const formatInline = (text: string) => {
    // Splits by **bold** or *italic*
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={index} className="italic text-slate-700">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  // Helper function to parse markdown lines into clean UI headers, lists, and paragraphs
  const renderFormattedMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        return <div key={idx} className="h-2" />;
      }

      // Heading 3: ### Title
      if (trimmedLine.startsWith('### ')) {
        const titleText = trimmedLine.replace(/^###\s+/, '').replace(/\*\*/g, '');
        return (
          <div key={idx} className="font-bold text-sm sm:text-base text-emerald-950 border-b border-slate-200/80 pb-1.5 mb-2 mt-1 flex items-center gap-1.5">
            <span>{titleText}</span>
          </div>
        );
      }

      // Bullet points: - item
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        const itemText = trimmedLine.replace(/^[-*]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2 pl-2 my-1">
            <span className="text-emerald-700 font-bold text-xs mt-0.5">•</span>
            <span className="flex-1 text-xs sm:text-sm leading-relaxed text-slate-800">
              {formatInline(itemText)}
            </span>
          </div>
        );
      }

      // Numbered lists: 1. item
      const numMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 pl-1 my-1.5">
            <span className="font-bold text-emerald-800 text-xs px-1.5 py-0.5 bg-emerald-50 rounded-md shrink-0">
              {numMatch[1]}
            </span>
            <span className="flex-1 text-xs sm:text-sm leading-relaxed text-slate-800">
              {formatInline(numMatch[2])}
            </span>
          </div>
        );
      }

      // Standard Paragraph
      return (
        <p key={idx} className="text-xs sm:text-sm leading-relaxed my-0.5 text-slate-800">
          {formatInline(line)}
        </p>
      );
    });
  };

  const handleResetChat = () => {

    window.speechSynthesis?.cancel();
    const newConvId = 'conv_' + Math.random().toString(36).substring(2, 11);
    setConversationId(newConvId);
    
    const welcomeMsg: Message = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: currentLang === 'en'
        ? "Hello! I am UDYAM-SETU — your rural enterprise and financial planning assistant. How can I help you today?"
        : "नमस्ते! मैं UDYAM-SETU हूँ — आपका ग्रामीण व्यवसाय एवं वित्तीय योजना सलाहकार। आज मैं आपकी क्या सहायता कर सकता हूँ?",
      citations: [
        { source: 'MoSJE Scheme Guidelines 2024 (NBCFDC Policy)', section: 'Section 4.1 - Eligibility & Margin Contribution', confidence: 'Verified' }
      ],
      suggested_actions: currentLang === 'en' ? [
        'I have ₹1 Lakh margin for Dairy business',
        'What are the key risks in poultry farming?',
        'Compare Dairy vs Tailoring'
      ] : [
        'मेरे पास डेयरी के लिए ₹1 लाख मार्जिन है',
        'पोल्ट्री फार्मिंग में मुख्य रिस्क क्या हैं?',
        'डेयरी और टेलरिंग की तुलना करें'
      ],
      createdAt: new Date().toISOString()
    };
    setMessages([welcomeMsg]);
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsgId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString()
    };

    // Functional update prevents state clobbering
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: trimmed,
          preferred_language: currentLang
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsgId = 'asst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newAssistantMsg: Message = {
          id: assistantMsgId,
          role: 'assistant',
          content: data.reply,
          citations: data.citations || [],
          suggested_actions: data.suggested_actions || [],
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, newAssistantMsg]);
      } else {
        throw new Error('API server returned error');
      }
    } catch (e: any) {
      console.error("AI chat error:", e);
      const isHi = currentLang === 'hi';
      const errorMsg: Message = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: isHi
          ? "⚠️ **लाइव AI सेवा से संपर्क नहीं हो पाया।** कृपया सुनिश्चित करें कि बैकएंड API सर्वर चालू है (`http://localhost:8000`) और पुनः प्रयास करें।"
          : "⚠️ **Could not connect to Live AI service.** Please ensure the backend API server is running (`http://localhost:8000`) and try again.",
        suggested_actions: isHi ? ['पुनः प्रयास करें', 'डेयरी लोन पात्रता', 'मंडी के ताज़ा भाव'] : ['Retry', 'Check Dairy Eligibility', 'View Mandi Prices'],
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col h-[85vh] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center flex-wrap gap-2">
                UDYAM-SETU Conversational AI Advisor
                <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded shadow-sm">ACTIVE MEMORY</span>
                <span className="text-[10px] bg-emerald-800 text-amber-300 border border-emerald-600 font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Gemini AI Active
                </span>
              </h2>
              <p className="text-[11px] text-emerald-200">Context-Aware Reasoning &amp; Exact Tool-Grounded Calculations</p>
            </div>
          </div>

          {/* Action Buttons: Language + New Chat */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetChat}
              title="Start New Conversation"
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-700 transition shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-700 transition shadow-sm"
              >
                <span>{currentOption.flag}</span>
                <span>{currentOption.nativeName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-900">
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100">
                    Select Language
                  </div>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                        currentLang === lang.code ? 'bg-emerald-50 text-emerald-900 font-extrabold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed relative group ${
                  m.role === 'user'
                    ? 'bg-emerald-800 text-white rounded-br-none shadow'
                    : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    {renderFormattedMessage(m.content)}
                  </div>
                  
                  {/* Text-to-Speech Button specifically for THIS message */}
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => speakText(m.content, m.id)}
                      title={`Audio Voice Output (${currentOption.nativeName})`}
                      className={`p-1.5 rounded-lg border shrink-0 transition ${
                        speakingMsgId === m.id 
                          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' 

                          : 'text-slate-500 hover:text-emerald-700 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      {speakingMsgId === m.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Citations Modal Trigger */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate"><b>Source:</b> {m.citations[0].source}</span>
                    </div>
                    <button
                      onClick={() => setActiveCitationModal(m.citations![0])}
                      className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded ml-2 shrink-0 transition"
                    >
                      Gazette
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Contextual Follow-Up Suggestions */}
              {m.suggested_actions && m.suggested_actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.suggested_actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(act)}
                      className="text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition shadow-sm"
                    >
                      {act}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 italic p-3 bg-slate-50 rounded-2xl w-fit border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce [animation-delay:0.4s]"></div>
              <span>UDYAM-SETU is analyzing calculations & local data...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice & Text Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <button
            onClick={toggleListening}
            title={isListening ? "Listening... Click to stop" : `Voice Input (${currentOption.nativeName})`}
            className={`p-2.5 rounded-xl font-bold transition flex items-center gap-1 text-xs ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-lg'
                : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-700" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Mic'}</span>
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder={`Type your question here (e.g. Mere paas ₹1 lakh hai...)...`}
            className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition disabled:opacity-50 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Gazette Modal */}
      {activeCitationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-slate-900 text-sm">Verified MoSJE Scheme Citation</h3>
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                VERIFIED
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800">Source Document:</span>
                <p className="text-slate-700 mt-0.5">{activeCitationModal.source}</p>
              </div>
              <div>
                <span className="font-bold text-slate-800">Clause / Section:</span>
                <p className="text-slate-700 mt-0.5">{activeCitationModal.section}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveCitationModal(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
