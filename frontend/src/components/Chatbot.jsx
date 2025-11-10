import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Send, Bot, User } from 'lucide-react';

const Chatbot = ({ sessionId: propSessionId, hasOptimizationResult: propHasOptimizationResult }) => {
  const { t } = useTranslation();
  
  // localStorage에서 세션ID 가져오기 (포트폴리오 최적화 페이지에서 전달된 경우)
  const storedSessionId = localStorage.getItem('chatbotSessionId');
  const sessionId = propSessionId || storedSessionId;
  const hasOptimizationResult = propHasOptimizationResult || !!storedSessionId;
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: hasOptimizationResult 
        ? '안녕하세요! 최적화 결과에 대해 궁금한 점이 있으신가요?' 
        : '안녕하세요! 포트폴리오 최적화에 대해 무엇이든 물어보세요.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // 컴포넌트 언마운트 시 localStorage 정리
  useEffect(() => {
    return () => {
      if (storedSessionId) {
        localStorage.removeItem('chatbotSessionId');
      }
    };
  }, [storedSessionId]);
  
  // 추천 질문
  const suggestedQuestions = hasOptimizationResult ? [
    "예상 수익률이 이렇게 나온 이유는?",
    "왜 이런 비중으로 배분했나요?",
    "이 포트폴리오의 위험도는 어떤가요?",
    "더 안정적으로 만들려면 어떻게 해야 하나요?"
  ] : [
    "포트폴리오 최적화란 무엇인가요?",
    "주식을 어떻게 추가하나요?",
    "위험도는 무엇을 의미하나요?",
    "샤프 비율이란?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chatbot/chat', {
        message: input,
        sessionId: sessionId, // 최적화 결과 컨텍스트 전달
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response || '죄송합니다. 응답을 생성할 수 없습니다.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen p-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{t('chatbot')}</h1>
        <p className="text-gray-600 mt-2">AI 어시스턴트와 대화하세요</p>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 추천 질문 */}
          {messages.length === 1 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">💡 추천 질문:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(question);
                      setTimeout(() => handleSend(), 100);
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-lg transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex items-start space-x-2 max-w-3xl ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div
                  className={`px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-3xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div className="px-4 py-3 rounded-lg bg-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('askQuestion')}
              rows="2"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
