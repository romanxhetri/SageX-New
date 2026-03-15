import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const AIShoppingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Greetings, Explorer! I am the SageX Shopping Intelligence. How can I assist your galactic acquisitions today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the SageX Shopping Assistant, a futuristic AI for a galactic e-commerce platform. 
        Help the user find products, explain tech specs, or just chat about the universe. 
        Keep it professional, helpful, and slightly futuristic.
        User says: ${userMsg}`,
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || 'My neural links are flickering. Could you repeat that?' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Connection to the neural grid lost. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00f2ff, #0072ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(0, 242, 255, 0.4)',
          zIndex: 5000,
          transition: 'all 0.3s'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(10deg)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
      >
        {isOpen ? '✕' : '🤖'}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          width: '380px',
          height: '500px',
          background: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(0, 242, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 5000,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{ padding: '20px', background: 'rgba(0, 242, 255, 0.1)', borderBottom: '1px solid rgba(0, 242, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', background: '#00f2ff', borderRadius: '50%', boxShadow: '0 0 10px #00f2ff' }} />
            <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px' }}>SAGEX INTELLIGENCE</span>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                background: msg.role === 'user' ? '#00f2ff' : 'rgba(255, 255, 255, 0.05)',
                color: msg.role === 'user' ? 'black' : 'white',
                fontSize: '0.9rem',
                lineHeight: 1.4
              }}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                AI is processing...
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Ask anything..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: 'white',
                  outline: 'none'
                }}
              />
              <button 
                onClick={handleSend}
                style={{
                  background: '#00f2ff',
                  color: 'black',
                  border: 'none',
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AIShoppingAssistant;
