import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: number;
  message: string;
  isUser: boolean;
  timestamp: Date;
  suggestedRecipes?: {
    title: string;
    description: string;
    prep_time: number;
    difficulty: string;
    match_reason: string;
    cuisine?: string;
    match_percentage?: number;
    special_note?: string;
  }[];
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  initialIngredients?: string[];
  context?: 'expired' | 'general';
}

const AIChatbot: React.FC<AIChatbotProps> = ({ 
  isOpen, 
  onClose, 
  initialIngredients = [], 
  context = 'general' 
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [availableIngredients, setAvailableIngredients] = useState<string>(
    initialIngredients.join(', ')
  );
  const [loadingChat, setLoadingChat] = useState(false);
  const [conversationId] = useState<string>(() => `conversation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initialize chatbot with context-aware welcome message
  useEffect(() => {
    if (isOpen && chatMessages.length === 0) {
      let welcomeMessage = "";
      
      if (context === 'expired' && initialIngredients.length > 0) {
        welcomeMessage = `Hi! I see you have ${initialIngredients.join(', ')} that might be expiring soon. Don't let them go to waste! I can help you find delicious recipes to use them up. What would you like to make? 🍳`;
      } else if (initialIngredients.length > 0) {
        welcomeMessage = `Hello! I notice you have ${initialIngredients.join(', ')} available. I'm your friendly AI assistant! I can help with recipes, cooking tips, or we can chat about anything at all! What's on your mind? �`;
      } else {
        welcomeMessage = "Hey there! I'm your friendly AI companion! 🤖 I love chatting about cooking and recipes, but I'm also here for any conversation - tech, life advice, random thoughts, or whatever's on your mind! What would you like to talk about? ✨";
      }

      const welcome: ChatMessage = {
        id: Date.now(),
        message: welcomeMessage,
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages([welcome]);
    }
  }, [isOpen, context, initialIngredients, chatMessages.length]);

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      message: currentMessage,
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setLoadingChat(true);

    try {
      const ingredientsList = availableIngredients
        .split(',')
        .map(ingredient => ingredient.trim())
        .filter(ingredient => ingredient.length > 0);

      const response = await fetch('http://localhost:8000/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          ingredients: ingredientsList,
          conversation_id: conversationId
        }),
      });

      const data = await response.json();
      
      console.log('🤖 AI Response received:', data);
      console.log('📦 Recipe suggestions:', data.suggested_recipes);
      
      if (response.ok && data.response) {
        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          message: data.response,
          isUser: false,
          timestamp: new Date(),
          suggestedRecipes: data.suggested_recipes || []
        };
        
        console.log('✅ AI Message created:', aiMessage);
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        console.error('❌ Response not ok or no response:', response.status, data);
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // More detailed error handling
      let errorText = "Sorry, I'm having trouble responding right now. Please try again!";
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.message.includes('Failed to fetch')) {
          errorText = "Cannot connect to AI server. Please check if the backend is running on http://localhost:8000";
        }
      }
      
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        message: errorText,
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg h-5/6 mx-4 flex flex-col border border-slate-700/60 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white p-6 flex justify-between items-center border-b border-slate-600/50">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              🤖 AI Recipe Assistant
            </h3>
            <p className="text-sm opacity-90">Your culinary companion</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-all hover:rotate-90 duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ingredients Input */}
        <div className="p-4 border-b border-slate-700/60 bg-slate-800/80">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            🥕 Available Ingredients
            <span className="text-xs text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={availableIngredients}
            onChange={(e) => setAvailableIngredients(e.target.value)}
            placeholder="e.g. tomatoes, chicken, rice, garlic..."
            className="w-full p-3 border border-slate-600 rounded-xl bg-slate-700 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-400 transition-all text-sm"
          />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900 custom-scrollbar">
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-sm relative ${msg.isUser ? 'order-2' : 'order-1'}`}>
                  {/* Avatar */}
                  <div className={`flex items-end gap-2 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      msg.isUser 
                        ? 'bg-slate-600 text-white' 
                        : 'bg-slate-700 border border-slate-600'
                    }`}>
                      {msg.isUser ? '👤' : '🤖'}
                    </div>
                    
                    <div className={`px-4 py-3 rounded-2xl max-w-full ${
                      msg.isUser
                        ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-br-sm'
                        : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-xs mt-2 ${
                        msg.isUser ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Recipe Suggestions */}
                  {msg.suggestedRecipes && msg.suggestedRecipes.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                        <span className="bg-slate-600 text-white px-2 py-1 rounded-full text-xs">
                          {msg.suggestedRecipes.length}
                        </span>
                        Recipe Suggestions
                      </div>
                      {msg.suggestedRecipes.map((recipe, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-slate-500/50">
                          {/* Recipe Header */}
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-slate-100 text-base leading-tight pr-2">
                              {recipe.title}
                            </h4>
                            {recipe.match_percentage && (
                              <div className="flex items-center gap-1 bg-slate-600/30 text-slate-300 px-2 py-1 rounded-full text-xs font-semibold border border-slate-500/30">
                                <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                                {recipe.match_percentage}%
                              </div>
                            )}
                          </div>
                          
                          {/* Recipe Description */}
                          <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                            {recipe.description}
                          </p>
                          
                          {/* Recipe Info Pills */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="bg-slate-600/30 text-slate-300 px-2 py-1 rounded-lg text-xs font-medium border border-slate-500/30">
                              ⏱️ {recipe.prep_time} min
                            </span>
                            <span className="bg-slate-600/30 text-slate-300 px-2 py-1 rounded-lg text-xs font-medium border border-slate-500/30">
                              📊 {recipe.difficulty}
                            </span>
                            {recipe.cuisine && (
                              <span className="bg-slate-600/30 text-slate-300 px-2 py-1 rounded-lg text-xs font-medium border border-slate-500/30">
                                🍽️ {recipe.cuisine}
                              </span>
                            )}
                          </div>
                          
                          {/* Match Reason */}
                          <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3 mb-3">
                            <p className="text-slate-300 text-xs italic leading-relaxed">
                              💡 {recipe.match_reason}
                            </p>
                          </div>
                          
                          {/* Special Note */}
                          {recipe.special_note && (
                            <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-slate-300 text-sm">✨</span>
                                <p className="text-slate-300 text-xs leading-relaxed">
                                  {recipe.special_note}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading Animation */}
            {loadingChat && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm">
                    🤖
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-slate-700/60 bg-slate-800/80">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask for recipes, cooking tips, or anything else..."
                className="w-full p-3 pr-12 border border-slate-600 rounded-xl bg-slate-700 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-400 transition-all text-sm"
                disabled={loadingChat}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                💬
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={loadingChat || !currentMessage.trim()}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingChat ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setCurrentMessage("What can I make with leftover ingredients?")}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-all border border-slate-600"
            >
              🍳 Leftover recipes
            </button>
            <button
              onClick={() => setCurrentMessage("Give me a quick 15-minute recipe")}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-all border border-slate-600"
            >
              ⚡ Quick meals
            </button>
            <button
              onClick={() => setCurrentMessage("Healthy dinner ideas?")}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-all border border-slate-600"
            >
              🥗 Healthy options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;