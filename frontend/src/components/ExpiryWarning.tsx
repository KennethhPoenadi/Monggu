import React, { useState } from 'react';
import AIChatbot from './AIChatbot';

interface ExpiryWarningProps {
  foodItems: string[];
  expiryDays: number;
}

const ExpiryWarning: React.FC<ExpiryWarningProps> = ({ foodItems, expiryDays }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || foodItems.length === 0) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 p-4 mb-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Food Expiring Soon!
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                <strong>{foodItems.join(', ')}</strong> will expire in {expiryDays} day{expiryDays !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Don't let them go to waste! Get recipe suggestions or consider donating.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🤖 Ask AI for Recipes
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-orange-400 hover:text-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* AI Chatbot Modal with expiry context */}
      <AIChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialIngredients={foodItems}
        context="expired"
      />
    </>
  );
};

export default ExpiryWarning;