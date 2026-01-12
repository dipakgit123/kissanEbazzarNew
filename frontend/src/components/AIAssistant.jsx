import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AIAssistant = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI farming assistant. How can I help you with buying or selling animals today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickReplies = [
    "How to sell my cow?",
    "What's the best price for buffalo?",
    "How to check animal health?",
    "Market trends for goats",
    "Documentation needed",
    "Transportation options"
  ];

  const aiResponses = {
    "sell": "To sell your animal effectively:\n\n1. Take clear photos from multiple angles\n2. Mention breed, age, and health status\n3. Set a competitive price based on market rates\n4. Include location and contact details\n5. Be honest about any health issues\n\nWould you like help with any specific step?",
    "buy": "When buying animals, consider:\n\n1. Check animal's health and vaccination records\n2. Verify the seller's reputation\n3. Inspect the animal in person if possible\n4. Ask about feeding and care requirements\n5. Negotiate price based on market value\n\nWhat type of animal are you looking for?",
    "price": "Animal prices vary by breed, age, and health:\n\n🐄 Cows: ₹30,000 - ₹1,50,000\n🐃 Buffalo: ₹25,000 - ₹1,20,000\n🐐 Goats: ₹5,000 - ₹25,000\n🐂 Bulls: ₹20,000 - ₹80,000\n\nPrices depend on milk production, breed quality, and market demand. Would you like specific pricing for any breed?",
    "health": "To check animal health:\n\n1. Look for bright, alert eyes\n2. Check for clear breathing\n3. Examine coat condition\n4. Check for any lumps or injuries\n5. Ask for vaccination records\n6. Observe eating and drinking habits\n\nWould you like a detailed health checklist?",
    "market": "Current market trends:\n\n📈 High demand for high-milk producing breeds\n📈 Growing interest in organic farming\n📈 Export opportunities for certain breeds\n📉 Seasonal price fluctuations\n\nWhat specific market information do you need?",
    "documentation": "Required documents for selling:\n\n1. Animal ownership certificate\n2. Health certificate from vet\n3. Vaccination records\n4. Transport permit (if applicable)\n5. Identity proof\n6. Address proof\n\nFor buying, ensure you get all these documents from the seller.",
    "transport": "Animal transportation options:\n\n🚛 Professional livestock transporters\n🚚 Local transport services\n🚗 Personal vehicle (for small animals)\n✈️ Air transport (for valuable breeds)\n\nConsider distance, animal comfort, and legal requirements. Need help finding transporters in your area?"
  };

  const getAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('sell') || lowerMessage.includes('selling')) {
      return aiResponses.sell;
    } else if (lowerMessage.includes('buy') || lowerMessage.includes('buying') || lowerMessage.includes('purchase')) {
      return aiResponses.buy;
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('rate')) {
      return aiResponses.price;
    } else if (lowerMessage.includes('health') || lowerMessage.includes('sick') || lowerMessage.includes('disease')) {
      return aiResponses.health;
    } else if (lowerMessage.includes('market') || lowerMessage.includes('trend') || lowerMessage.includes('demand')) {
      return aiResponses.market;
    } else if (lowerMessage.includes('document') || lowerMessage.includes('paper') || lowerMessage.includes('certificate')) {
      return aiResponses.documentation;
    } else if (lowerMessage.includes('transport') || lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
      return aiResponses.transport;
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm here to help you with all your farming needs. Whether you're buying or selling animals, I can provide guidance on pricing, health checks, documentation, and market trends. What would you like to know?";
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I can help you with:\n\n• Selling animals effectively\n• Buying animals safely\n• Pricing guidance\n• Health checks\n• Market trends\n• Documentation requirements\n• Transportation options\n\nJust ask me anything about farming!";
    } else {
      return "I understand you're asking about farming. I can help with buying/selling animals, pricing, health checks, market trends, documentation, and transportation. Could you be more specific about what you need help with?";
    }
  };

  const handleSendMessage = (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: getAIResponse(message),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (reply) => {
    handleSendMessage(reply);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50">
        {/* Pulsing Ring Animation */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#15BB73] to-[#0FA568] animate-ping opacity-20"></div>
        )}
        
        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-12 h-12 rounded-full shadow-2xl transition-all duration-500 transform hover:scale-110 active:scale-95 animate-float ${
            isOpen 
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
              : 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] hover:from-[#0FA568] hover:to-[#15BB73] hover:shadow-3xl animate-pulse-glow'
          }`}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
          
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#15BB73] to-[#0FA568] opacity-30 blur-lg animate-pulse"></div>
          
          {/* Button Content */}
          <div className="relative flex items-center justify-center h-full">
            {isOpen ? (
              <svg className="w-5 h-5 text-white transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="relative">
                {/* Chat Icon */}
                <svg className="w-5 h-5 text-white transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                
                {/* Animated Dots */}
                <div className="absolute -top-1 -right-1 flex space-x-0.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
        </button>


        {/* Floating Particles Animation */}
        {!isOpen && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 left-2 w-1 h-1 bg-white/60 rounded-full animate-ping" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
            <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-white/40 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
            <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-white/30 rounded-full animate-ping" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Farming Assistant</h3>
                    <p className="text-sm text-white/80">Online now</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length === 1 && (
              <div className="p-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.slice(0, 4).map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs bg-gray-100 hover:bg-[#15BB73] hover:text-white px-3 py-1 rounded-full transition-colors duration-200"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about farming, animals, pricing..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
