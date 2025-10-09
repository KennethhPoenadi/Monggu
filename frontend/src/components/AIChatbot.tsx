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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-5/6 mx-4 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">🤖 AI Chat Companion</h3>
            <p className="text-sm opacity-90">Your friendly conversation partner</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ingredients Input */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Ingredients (optional)
          </label>
          <input
            type="text"
            value={availableIngredients}
            onChange={(e) => setAvailableIngredients(e.target.value)}
            placeholder="e.g. tomatoes, chicken, rice..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.isUser
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                  
                  {/* Show suggested recipes if any */}
                  {msg.suggestedRecipes && msg.suggestedRecipes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold">Recipe Suggestions: ({msg.suggestedRecipes.length} found)</p>
                      {msg.suggestedRecipes.map((recipe, idx) => {
                        console.log(`🍽️ Rendering recipe ${idx}:`, recipe);
                        return (
                          <div key={idx} className="bg-green-50 p-3 rounded-lg text-xs border border-green-200">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-green-800">{recipe.title}</p>
                              {recipe.match_percentage && (
                                <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {recipe.match_percentage}% match
                                </span>
                              )}
                            </div>
                            <p className="text-green-700 mb-2">{recipe.description}</p>
                            <div className="flex flex-wrap gap-2 text-green-600 mb-2">
                              <span>⏱️ {recipe.prep_time} min</span>
                              <span>📊 {recipe.difficulty}</span>
                              {recipe.cuisine && <span>🍽️ {recipe.cuisine}</span>}
                            </div>
                            <p className="text-green-600 italic text-xs">{recipe.match_reason}</p>
                            {recipe.special_note && (
                              <div className="mt-2 p-2 bg-yellow-100 border-l-4 border-yellow-400 rounded">
                                <p className="text-yellow-800 text-xs">💡 {recipe.special_note}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loadingChat && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Chat about anything - recipes, life, tech, whatever!"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              disabled={loadingChat}
            />
            <button
              onClick={sendMessage}
              disabled={loadingChat || !currentMessage.trim()}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;