from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
import json
import os
from pydantic import BaseModel
from datetime import datetime
import asyncio
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import threading
import logging

router = APIRouter()

# Initialize AI model - using free Hugging Face model
MODEL_NAME = "microsoft/DialoGPT-small"  # Lighter, faster model
device = "cuda" if torch.cuda.is_available() else "cpu"

# Global model variables
tokenizer = None
model = None
chatbot_pipeline = None
model_lock = threading.Lock()

def initialize_ai_model():
    """Initialize AI model on first use - with better error handling"""
    global tokenizer, model, chatbot_pipeline
    
    if chatbot_pipeline is None:
        with model_lock:
            if chatbot_pipeline is None:  # Double check
                try:
                    print("🤖 Loading AI model... This might take a moment on first use")
                    
                    # Load tokenizer and model with better settings
                    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, padding_side='left')
                    model = AutoModelForCausalLM.from_pretrained(
                        MODEL_NAME,
                        torch_dtype=torch.float32,  # Use float32 for better compatibility
                        device_map="auto" if device == "cuda" else None
                    )
                    
                    # Add padding token if not exists
                    if tokenizer.pad_token is None:
                        tokenizer.pad_token = tokenizer.eos_token
                        model.config.pad_token_id = tokenizer.eos_token_id
                    
                    # Move to device
                    if device == "cuda":
                        model = model.cuda()
                    
                    print(f"✅ AI model loaded successfully on {device}")
                    print(f"📊 Model: {MODEL_NAME}")
                    
                    # Set as loaded
                    chatbot_pipeline = True  # Just mark as loaded
                    
                except Exception as e:
                    print(f"❌ Error loading AI model: {str(e)}")
                    print("📝 Will use enhanced fallback responses")
                    chatbot_pipeline = None
                    
    return chatbot_pipeline is not None

class ChatMessage(BaseModel):
    message: str
    ingredients: List[str] = []
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    suggested_recipes: List[Dict[str, Any]] = []
    conversation_id: str

# In-memory conversation storage (in production, use Redis or database)
conversation_history = {}

@router.post("/chat", response_model=Dict[str, Any])
async def chat_with_ai(chat_message: ChatMessage) -> Dict[str, Any]:
    """
    Real AI chatbot that can chat about anything using OpenAI GPT
    """
    try:
        # Initialize conversation if needed
        conv_id = chat_message.conversation_id or f"conv_{datetime.now().timestamp()}"
        
        if conv_id not in conversation_history:
            conversation_history[conv_id] = []
        
        # Add user message to history
        conversation_history[conv_id].append({
            "role": "user",
            "content": chat_message.message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Generate AI response using real model or enhanced fallback
        ai_response = await generate_ai_response(
            message=chat_message.message,
            ingredients=chat_message.ingredients,
            conversation_history=conversation_history[conv_id]
        )
        
        # ALWAYS validate response quality before sending
        if not is_response_quality_good(ai_response["response"], chat_message.message):
            print("🔄 Response quality check failed, generating better response...")
            ai_response = await generate_better_response(
                message=chat_message.message,
                ingredients=chat_message.ingredients,
                conversation_history=conversation_history[conv_id]
            )
        
        # Add AI response to history
        conversation_history[conv_id].append({
            "role": "assistant", 
            "content": ai_response["response"],
            "timestamp": datetime.now().isoformat()
        })
        
        # Generate recipe suggestions if cooking-related and has ingredients
        recipe_suggestions = []
        if is_cooking_related(chat_message.message) and chat_message.ingredients:
            recipe_suggestions = await generate_recipe_suggestions(
                ingredients=chat_message.ingredients,
                user_message=chat_message.message
            )
        
        return {
            "response": ai_response["response"],
            "suggested_recipes": recipe_suggestions,
            "conversation_id": conv_id,
            "message_count": len(conversation_history[conv_id])
        }
        
    except Exception as e:
        print(f"❌ Error in chat_with_ai: {str(e)}")
        import traceback
        print(f"📊 Full traceback: {traceback.format_exc()}")
        
        # Return friendly error message
        return {
            "response": "Maaf, saya sedang mengalami gangguan teknis. Bisa coba lagi dalam beberapa saat? 😅",
            "suggested_recipes": [],
            "conversation_id": chat_message.conversation_id or "error",
            "error": True
        }

async def generate_ai_response(
    message: str, 
    ingredients: List[str], 
    conversation_history: List[Dict]
) -> Dict[str, Any]:
    """
    Generate real AI response using Hugging Face Transformers (FREE!)
    """
    try:
        # Initialize model if needed
        model_available = initialize_ai_model()
        
        if not model_available or tokenizer is None or model is None:
            print("⚠️ AI model not available, using enhanced smart fallback")
            return await smart_fallback_response(message, ingredients, conversation_history)
        
        # Build conversation for DialoGPT
        conversation_text = build_dialogpt_input(message, ingredients, conversation_history)
        
        # Generate response using the model
        try:
            with torch.no_grad():  # Save memory
                # Tokenize input
                inputs = tokenizer.encode(conversation_text + tokenizer.eos_token, return_tensors="pt")
                
                # Move to device if needed
                if device == "cuda" and torch.cuda.is_available():
                    inputs = inputs.cuda()
                
                # Generate response
                outputs = model.generate(
                    inputs,
                    max_length=inputs.shape[1] + 50,  # Shorter responses for better quality
                    num_return_sequences=1,
                    temperature=0.8,
                    top_p=0.9,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                    repetition_penalty=1.1,
                    no_repeat_ngram_size=3
                )
                
                # Decode response
                response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
                
                # Extract just the new part (after the input)
                input_text = tokenizer.decode(inputs[0], skip_special_tokens=True)
                ai_response = response_text[len(input_text):].strip()
                
                # Clean up and validate response
                ai_response = clean_ai_response(ai_response, message)
                
                if len(ai_response) < 5 or is_bad_response(ai_response):
                    print("🔄 Generated response too short/bad, using smart fallback")
                    return await smart_fallback_response(message, ingredients, conversation_history)
                
                return {
                    "response": ai_response,
                    "model_used": MODEL_NAME,
                    "tokens_used": len(outputs[0])
                }
                
        except Exception as model_error:
            print(f"Model generation error: {str(model_error)}")
            return await smart_fallback_response(message, ingredients, conversation_history)
            
    except Exception as e:
        print(f"Error in AI response generation: {str(e)}")
        return await smart_fallback_response(message, ingredients, conversation_history)

def build_dialogpt_input(message: str, ingredients: List[str], conversation_history: List[Dict]) -> str:
    """
    Build input specifically for DialoGPT model
    """
    # Start with recent conversation (DialoGPT works better with conversation flow)
    conversation_parts = []
    
    # Add recent history (last 4 messages for context)
    if conversation_history:
        recent_msgs = conversation_history[-4:]
        for msg in recent_msgs:
            if msg["role"] == "user":
                conversation_parts.append(f"User: {msg['content']}")
            elif msg["role"] == "assistant":
                conversation_parts.append(f"Bot: {msg['content']}")
    
    # Add current message
    current_input = f"User: {message}"
    if ingredients:
        current_input += f" (ingredients: {', '.join(ingredients[:3])})"
    
    conversation_parts.append(current_input)
    conversation_parts.append("Bot:")
    
    return " ".join(conversation_parts)

def clean_ai_response(response: str, original_message: str) -> str:
    """
    Clean up AI response text with better filtering
    """
    if not response:
        return ""
    
    # Remove common artifacts
    response = response.strip()
    response = response.replace('<|endoftext|>', '')
    response = response.replace('<pad>', '')
    response = response.replace('<unk>', '')
    response = response.replace('Bot:', '')
    response = response.replace('User:', '')
    
    # Remove repetitive patterns
    lines = response.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line and line not in cleaned_lines and len(line) > 2:
            cleaned_lines.append(line)
    
    if cleaned_lines:
        response = ' '.join(cleaned_lines)
    
    # Ensure reasonable length
    if len(response) > 200:
        # Find last complete sentence within limit
        sentences = response.split('. ')
        result = ""
        for sentence in sentences:
            if len(result + sentence + '. ') <= 200:
                result += sentence + '. '
            else:
                break
        if result:
            response = result.strip()
    
    return response.strip()

def is_bad_response(response: str) -> bool:
    """
    Check if response is bad/unusable
    """
    if not response or len(response.strip()) < 5:
        return True
    
    # Check for common bad patterns
    bad_patterns = [
        "i don't know",
        "i can't",
        "sorry, i don't understand",
        "what do you mean",
        "i'm not sure"
    ]
    
    response_lower = response.lower()
    for pattern in bad_patterns:
        if pattern in response_lower:
            return True
    
    # Check for repetitive words
    words = response.split()
    if len(words) > 3:
        unique_words = set(words)
        if len(unique_words) / len(words) < 0.5:  # Too repetitive
            return True
    
    return False

def build_conversation_context(message: str, ingredients: List[str], conversation_history: List[Dict]) -> str:
    """
    Build conversation context for the AI model
    """
    context_parts = []
    
    # System persona
    context_parts.append("You are a friendly, helpful AI assistant that can chat about anything!")
    context_parts.append("You speak naturally, mix Indonesian and English, and love helping people.")
    context_parts.append("You're especially passionate about cooking and food, but can discuss any topic.")
    
    # Add ingredient context if available
    if ingredients:
        context_parts.append(f"Available ingredients: {', '.join(ingredients)}")
    
    # Add recent conversation history (last 3-4 exchanges to keep context manageable)
    if conversation_history:
        recent_msgs = conversation_history[-6:]  # Last 6 messages (3 exchanges)
        for msg in recent_msgs:
            if msg["role"] == "user":
                context_parts.append(f"User: {msg['content']}")
            elif msg["role"] == "assistant":
                context_parts.append(f"Assistant: {msg['content']}")
    
    return "\n".join(context_parts)

def clean_ai_response(response: str) -> str:
    """
    Clean up AI response text
    """
    # Remove common unwanted patterns
    response = response.strip()
    
    # Remove repetitive patterns
    lines = response.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line and line not in cleaned_lines:  # Remove duplicates
            cleaned_lines.append(line)
    
    response = '\n'.join(cleaned_lines)
    
    # Remove weird artifacts
    response = response.replace('<|endoftext|>', '')
    response = response.replace('<pad>', '')
    response = response.replace('<unk>', '')
    
    # Ensure response isn't too long
    if len(response) > 300:
        # Find last complete sentence within limit
        sentences = response.split('. ')
        result = ""
        for sentence in sentences:
            if len(result + sentence + '. ') <= 300:
                result += sentence + '. '
            else:
                break
        response = result.strip()
    
    return response

async def smart_fallback_response(
    message: str, 
    ingredients: List[str], 
    conversation_history: List[Dict]
) -> Dict[str, Any]:
    """
    Smart fallback response when AI model is unavailable
    """
    # Analyze conversation context for better fallback
    context = analyze_message_context(message, ingredients, conversation_history)
    
    # Generate contextual response based on analysis
    response = generate_contextual_fallback(message, ingredients, context)
    
    return {
        "response": response,
        "model_used": "smart_fallback",
        "tokens_used": 0
    }

def analyze_message_context(message: str, ingredients: List[str], history: List[Dict]) -> Dict[str, Any]:
    """
    Analyze message context for smarter fallback responses
    """
    message_lower = message.lower()
    
    # Check conversation flow
    recent_topics = []
    if history:
        recent_msgs = history[-4:]
        for msg in recent_msgs:
            if "cooking" in msg["content"].lower() or "recipe" in msg["content"].lower():
                recent_topics.append("cooking")
            if any(word in msg["content"].lower() for word in ["feeling", "mood", "sad", "happy", "excited"]):
                recent_topics.append("emotional")
    
    return {
        "is_greeting": any(word in message_lower for word in ["halo", "hai", "hello", "hi", "hey", "selamat"]),
        "is_question": "?" in message or any(word in message_lower for word in ["apa", "bagaimana", "kenapa", "how", "what", "why", "where", "when"]),
        "is_cooking_related": any(word in message_lower for word in ["masak", "cook", "recipe", "resep", "makan", "food", "makanan"]),
        "is_emotional": any(word in message_lower for word in ["sedih", "sad", "happy", "senang", "excited", "bored", "bosan"]),
        "is_thanks": any(word in message_lower for word in ["thanks", "terima kasih", "thank you", "makasih"]),
        "recent_topics": recent_topics,
        "message_length": len(message.split()),
        "has_ingredients": len(ingredients) > 0
    }

def generate_contextual_fallback(message: str, ingredients: List[str], context: Dict[str, Any]) -> str:
    """
    Generate smart contextual fallback responses - MUCH BETTER!
    """
    import random
    
    message_lower = message.lower()
    
    # Detect specific conversation patterns for NATURAL responses
    
    # Steps/instructions requests - MOST IMPORTANT!
    if any(word in message_lower for word in ["step", "steps", "langkah", "cara", "how to", "gimana", "bagaimana", "instruction"]):
        if ingredients:
            main_ing = ingredients[0]
            response = f"Perfect! Here's how to make something delicious with {main_ing}:\n\n"
            response += f"🔥 **Easy {main_ing.title()} Recipe Steps:**\n"
            response += f"1. **Prep** (2 min): Wash and chop {main_ing} into bite-sized pieces\n"
            response += f"2. **Heat** (1 min): Heat 2 tbsp oil in a large pan over medium-high heat\n"
            response += f"3. **Cook** (3-4 min): Add {main_ing} to the pan, let it sear without stirring\n"
            if len(ingredients) > 1:
                response += f"4. **Add** (2 min): Toss in {ingredients[1]}, stir everything together\n"
                response += f"5. **Season** (1 min): Add salt, pepper, and any spices you like\n"
                response += f"6. **Finish** (2 min): Cook until everything is tender and flavorful\n"
            else:
                response += f"4. **Season** (1 min): Add salt, pepper, garlic powder, or your favorite spices\n"
                response += f"5. **Finish** (3 min): Stir and cook until {main_ing} is tender and golden\n"
            response += f"7. **Serve** (0 min): Plate it up and enjoy! 🍽️\n\n"
            response += f"💡 **Pro tip:** Don't overcrowd the pan - cook in batches if you have a lot!"
        else:
            response = "I'd love to give you detailed step-by-step instructions! What are you trying to make? Just tell me the dish or ingredients you're working with, and I'll break it down into super easy steps that anyone can follow! 👨‍🍳"
        return response
    
    # Questions about suggestions/recommendations
    if "suggestion" in message_lower or "recommend" in message_lower:
        if ingredients:
            return f"For your {', '.join(ingredients[:2])}, I'd suggest trying a quick stir-fry or maybe a fresh salad! Both are super versatile and you can really make them your own. What cooking style appeals to you more?"
        else:
            return "I love giving recommendations! Tell me what you're working with - ingredients, mood, or even just what you're craving - and I'll help brainstorm some ideas!"
    
    # Greeting responses - friendly and engaging
    if context["is_greeting"]:
        greetings = [
            "Hey there! Great to see you! I'm pumped to chat - what's going on in your world today? 😊",
            "Hello! Welcome to our little corner of the internet! What brings you here today?",
            "Hi! Lovely to meet you! I'm your friendly AI companion - ready to dive into whatever's on your mind! ✨"
        ]
        return random.choice(greetings)
    
    # Thanks responses - warm and encouraging
    if context["is_thanks"]:
        thanks_responses = [
            "Aww, you're so sweet! I genuinely love helping out. Feel free to bounce any ideas off me anytime! 🤗",
            "You're absolutely welcome! This is what I live for - connecting and helping however I can!",
            "My pleasure! Seriously, chatting with you made my day better too! What else is on your mind?"
        ]
        return random.choice(thanks_responses)
    
    # Cooking conversations - passionate and specific
    if context["is_cooking_related"]:
        if ingredients:
            cooking_responses = [
                f"Ooh, {', '.join(ingredients[:2])} - now we're talking! Those are some of my favorite ingredients to work with. Are you thinking comfort food vibes, something fresh and light, or maybe we go bold with spices? 🍳",
                f"Yes! I see {', '.join(ingredients[:2])} in the mix - that's like a blank canvas waiting for deliciousness! What's your energy level like? Quick 15-min meal or are we going full chef mode? 👨‍🍳",
                f"Love it! {', '.join(ingredients[:2])} have so much potential. I'm getting excited just thinking about the possibilities! Any particular flavors calling to you today?"
            ]
        else:
            cooking_responses = [
                "Food conversations are literally my favorite! There's something magical about turning simple ingredients into something amazing. What's your current kitchen situation - ingredients on hand or dreaming about what to make? 🍽️",
                "Yes, let's talk food! I get so energized talking about cooking. Are you planning something special or just thinking about your next meal? Tell me everything! �",
                "Oh, I LOVE where this is going! Food is such a beautiful way to express creativity. What's sparking your culinary curiosity right now?"
            ]
        return random.choice(cooking_responses)
    
    # Questions - engaged and curious
    if context["is_question"]:
        question_responses = [
            "Now that's the kind of question that gets my brain buzzing! I'm genuinely curious about your take on this. What got you thinking about this in the first place? 🤔",
            "Ooh, interesting question! I love how your mind works. There are definitely some cool angles to explore here. What's your instinct telling you?",
            "Great question! I'm already turning this over in my mind. Before I dive in, I'm curious - what's your experience been with this kind of thing? 💭"
        ]
        return random.choice(question_responses)
    
    # Emotional support - empathetic and caring
    if context["is_emotional"]:
        emotional_responses = [
            "Thank you for sharing that with me - it really means something that you'd open up. I'm here to listen, whether you want to dive deeper or just need someone to acknowledge what you're going through. 💜",
            "I really hear you. Sometimes it helps just to put feelings into words, you know? I'm here for whatever you need - venting, brainstorming, or just hanging out. 🤗",
            "I appreciate you being real with me about how you're feeling. That takes courage. Want to talk more about it, or would something else be more helpful right now? ✨"
        ]
        return random.choice(emotional_responses)
    
    # Follow-up on cooking topics
    if "cooking" in context["recent_topics"]:
        followup_responses = [
            "I'm still thinking about our cooking chat! It got me all inspired. Have you had any other food ideas floating around? Or maybe there's a technique you've been wanting to try? 🍳",
            "Our recipe brainstorming session has me excited! I love how food can be both creative and practical. What other culinary adventures are on your radar? 👨‍🍳"
        ]
        return random.choice(followup_responses)
    
    # Detect specific topics and respond accordingly
    if any(word in message_lower for word in ["bored", "boring", "nothing", "idk", "dunno"]):
        return "Ah, the classic 'not sure what to do' moment! I totally get that. Sometimes the best conversations start from nowhere special. What's one thing that's been on your mind lately - could be anything at all! Maybe we can find something fun to explore together? 🎯"
    
    if any(word in message_lower for word in ["busy", "stress", "tired", "exhausted"]):
        return "Sounds like you've got a lot on your plate right now! That can be overwhelming. Want to talk about what's keeping you busy, or would you prefer we chat about something completely different to give your mind a break? I'm good either way! 💪"
    
    if any(word in message_lower for word in ["weather", "cold", "hot", "rain", "sunny"]):
        return "Weather talk - the universal conversation starter! 😄 I find it fascinating how much weather affects our mood and plans. Is it influencing what you want to eat or do today? Sometimes the perfect weather calls for the perfect comfort food!"
    
    # Creative/hobby related
    if any(word in message_lower for word in ["creative", "art", "music", "hobby", "learn"]):
        return "I love creativity conversations! There's something so energizing about people pursuing what they're passionate about. What kind of creative stuff draws you in? I'm always fascinated by how people express themselves! ✨"
    
    # General conversational responses - engaging and specific
    general_responses = [
        "I'm really intrigued by what you're thinking about! There's always so much beneath the surface of any topic. What angle interests you most about this? 💭",
        "That catches my attention! I love how conversations can go in unexpected directions. What made this come to mind for you today?",
        "Interesting point! I find myself wanting to know more about your perspective on this. There's usually a story behind these kinds of thoughts - care to share? 😊",
        "Ooh, this has potential for a really good conversation! I'm curious about the bigger picture here. What's the context that's got you thinking about this? 🎯"
    ]
    
    return random.choice(general_responses)

def is_response_quality_good(response: str, original_message: str) -> bool:
    """
    Check if AI response is high quality and appropriate
    """
    if not response or len(response.strip()) < 10:
        return False
    
    response_lower = response.lower()
    message_lower = original_message.lower()
    
    # Check for generic/bad responses
    bad_indicators = [
        "i don't understand",
        "i'm not sure what you mean",
        "that's interesting! tell me more",
        "what made you think about this",
        "i'm curious about your perspective",
        "interesting question! i'm curious",
        "what's your instinct telling you"
    ]
    
    for indicator in bad_indicators:
        if indicator in response_lower:
            return False
    
    # Check if response is too generic for specific questions
    if "?" in original_message and len(response.split()) < 8:
        return False
    
    # Good quality indicators
    good_indicators = [
        "i love", "that's awesome", "great question", "i'm excited",
        "let me", "here's what", "you could", "try this",
        "my suggestion", "i'd recommend", "sounds like"
    ]
    
    has_good_indicator = any(indicator in response_lower for indicator in good_indicators)
    
    # Must have at least some substance
    return len(response.split()) >= 8 and (has_good_indicator or "cooking" in message_lower)

async def generate_better_response(
    message: str,
    ingredients: List[str], 
    conversation_history: List[Dict]
) -> Dict[str, Any]:
    """
    Generate a guaranteed good quality response with specific actionable content
    """
    message_lower = message.lower()
    
    # Detect if user is asking for steps/instructions
    if any(word in message_lower for word in ["step", "langkah", "cara", "how to", "gimana", "bagaimana"]):
        if ingredients:
            main_ingredient = ingredients[0]
            response = f"Here's a simple step-by-step recipe using {main_ingredient}:\n\n"
            response += f"🔥 **Quick {main_ingredient.title()} Stir-Fry Steps:**\n"
            response += f"1. Heat 2 tbsp oil in a pan over medium-high heat\n"
            response += f"2. Add {main_ingredient} and cook for 3-4 minutes\n"
            if len(ingredients) > 1:
                response += f"3. Add {', '.join(ingredients[1:3])} and stir for 2 minutes\n"
            response += f"4. Season with salt, pepper, and garlic (if available)\n"
            response += f"5. Cook for another 2-3 minutes until everything is tender\n"
            response += f"6. Taste and adjust seasoning\n"
            response += f"7. Serve hot and enjoy! 🍽️\n\n"
            response += f"💡 **Pro tip:** Don't overcrowd the pan - cook in batches if needed!"
        else:
            response = "I'd love to give you detailed steps! What dish are you trying to make? Once you tell me the recipe or ingredients you're working with, I can break it down into easy-to-follow steps! 👨‍🍳"
    
    # Recipe/cooking related questions
    elif any(word in message_lower for word in ["recipe", "resep", "cook", "masak", "bikin", "make"]):
        if ingredients:
            response = f"Perfect! With {', '.join(ingredients[:2])}, here's what I'd make:\n\n"
            response += f"🍳 **{ingredients[0].title()} Special:**\n"
            response += f"• Prep time: 15-20 minutes\n"
            response += f"• Difficulty: Easy\n"
            response += f"• Serves: 2-3 people\n\n"
            response += f"**What you'll do:**\n"
            response += f"1. Prep all ingredients (wash, chop as needed)\n"
            response += f"2. Heat oil in pan\n"
            response += f"3. Start with {ingredients[0]}, then add others\n"
            response += f"4. Season and cook until tender\n"
            response += f"5. Adjust flavors to taste\n\n"
            response += f"Want me to give you the detailed step-by-step? Just ask! 😊"
        else:
            response = "I'm excited to help you cook! What ingredients do you have on hand? Or is there a specific dish you're craving? Give me some details and I'll create a detailed recipe with step-by-step instructions! 🍽️"
    
    # Suggestion/recommendation requests
    elif any(word in message_lower for word in ["suggestion", "recommend", "idea", "saran", "usul"]):
        if ingredients:
            response = f"Great ingredients to work with! Here are my top suggestions for {', '.join(ingredients[:2])}:\n\n"
            response += f"🥘 **Option 1: Quick Stir-Fry**\n"
            response += f"- Fast, healthy, customizable\n"
            response += f"- Ready in 10-15 minutes\n\n"
            response += f"🍲 **Option 2: Comfort Soup**\n"
            response += f"- Warming, nutritious, filling\n"
            response += f"- Great for meal prep\n\n"
            response += f"🥗 **Option 3: Fresh Salad**\n"
            response += f"- Light, refreshing, no cooking required\n"
            response += f"- Perfect for hot days\n\n"
            response += f"Which one sounds good? I can give you the complete recipe with detailed steps! 👨‍🍳"
        else:
            response = "I'd love to suggest something perfect for you! What are you in the mood for?\n\n"
            response += f"• Quick 15-minute meal?\n"
            response += f"• Comfort food for a cozy evening?\n"
            response += f"• Healthy fresh option?\n"
            response += f"• Something new and exciting?\n\n"
            response += f"Also, what ingredients do you have available? That'll help me give you spot-on recommendations! ✨"
    
    # Greeting responses
    elif any(word in message_lower for word in ["hello", "hi", "hey", "halo", "hai"]):
        response = "Hey there! Welcome! 😊 I'm your cooking companion and I'm genuinely excited to help you create something delicious today!\n\n"
        response += f"Here's what I can help you with:\n"
        response += f"🍳 **Step-by-step recipes** - detailed instructions\n"
        response += f"🥘 **Recipe suggestions** - based on your ingredients\n"
        response += f"👨‍🍳 **Cooking tips** - techniques and tricks\n"
        response += f"🛒 **Ingredient substitutions** - when you're missing something\n"
        response += f"💬 **General chat** - about food, life, whatever!\n\n"
        response += f"What would you like to cook today? Or just tell me what's on your mind! 🌟"
    
    # Bored/nothing to do
    elif any(word in message_lower for word in ["bored", "nothing", "idk", "dunno", "bosan"]):
        response = "Ah, the classic 'what should I do' moment! 😄 Here are some fun ideas:\n\n"
        response += f"🍳 **Kitchen Adventure:**\n"
        response += f"- Look in your fridge and create something random\n"
        response += f"- Try a 5-ingredient challenge\n"
        response += f"- Make something you've never made before\n\n"
        response += f"💬 **Chat Ideas:**\n"
        response += f"- Tell me about your favorite comfort food\n"
        response += f"- Ask me for a random recipe\n"
        response += f"- Let's plan your next meal adventure\n\n"
        response += f"What sounds interesting to you? I'm here for whatever direction you want to go! 🎯"
    
    # Questions about anything
    elif "?" in message:
        if any(word in message_lower for word in ["cooking", "recipe", "food", "masak", "makan"]):
            response = f"Great cooking question! I love diving deep into food topics. 👨‍🍳\n\n"
            response += f"From my experience, the key things to consider are:\n"
            response += f"• **Ingredients** - working with what you have\n"
            response += f"• **Technique** - the right method for your ingredients\n"
            response += f"• **Timing** - when to add what for best results\n"
            response += f"• **Flavor balance** - making it taste amazing\n\n"
            response += f"What specific aspect would be most helpful? I can break down techniques, suggest ingredient combos, or give you detailed step-by-step instructions! 🍽️"
        else:
            response = f"That's a really thoughtful question! I enjoy exploring different perspectives on things. 🤔\n\n"
            response += f"To give you the most helpful answer, I'd love to know:\n"
            response += f"• What's your current situation with this?\n"
            response += f"• What outcome are you hoping for?\n"
            response += f"• Any specific constraints or preferences?\n\n"
            response += f"Once I understand the context better, I can give you a much more targeted and useful response! What details can you share? ✨"
    
    # Short messages - be more engaging
    elif len(message.split()) <= 3:
        if any(word in message_lower for word in ["ok", "yes", "ya", "iya", "sure"]):
            response = "Awesome! I love the enthusiasm! 🙌 What should we dive into next? I'm ready to help with whatever you have in mind - cooking projects, recipe ideas, or just chatting about whatever interests you!"
        else:
            response = f"Interesting point about '{message}'! I'm definitely curious to hear more. 💭\n\n"
            response += f"There's usually a good story or context behind these kinds of thoughts. What made this come to mind? I find that the background often makes conversations way more engaging!"
    
    # Default for longer messages
    else:
        response = f"Thanks for sharing all that detail! I really appreciate when people give me context to work with. 🤗\n\n"
        response += f"From what you've told me, it sounds like there are several interesting angles to explore. What stands out most to you about this situation?\n\n"
        response += f"I'm here to help think through whatever's on your mind - whether that's practical problem-solving, brainstorming ideas, or just having a good conversation about it! Where would you like to focus? ✨"
    
    return {
        "response": response,
        "model_used": "detailed_quality_ensured", 
        "tokens_used": 0
    }

# Removed old fallback function - now using smart_fallback_response

def is_cooking_related(message: str) -> bool:
    """
    Check if message is cooking/food related
    """
    cooking_keywords = [
        "masak", "cook", "recipe", "resep", "bikin", "make", "makan", "eat", 
        "food", "makanan", "dish", "meal", "breakfast", "lunch", "dinner",
        "sarapan", "makan siang", "makan malam", "cuisine", "ingredients",
        "bahan", "bumbu", "spices", "oven", "pan", "wok", "rebus", "goreng",
        "tumis", "bakar", "grill", "steam", "kukus"
    ]
    
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in cooking_keywords)

async def generate_recipe_suggestions(
    ingredients: List[str], 
    user_message: str
) -> List[Dict[str, Any]]:
    """
    Generate smart recipe suggestions based on ingredients and user message
    """
    if not ingredients:
        return []
    
    # Analyze ingredients to determine recipe possibilities
    recipe_analysis = analyze_ingredients_for_recipes(ingredients)
    user_intent = analyze_cooking_intent(user_message)
    
    # Generate recipes based on analysis
    recipes = []
    
    # Primary recipe suggestion
    primary_recipe = generate_primary_recipe_suggestion(ingredients, recipe_analysis, user_intent)
    if primary_recipe:
        recipes.append(primary_recipe)
    
    # Alternative recipe suggestions
    for cooking_style in recipe_analysis["cooking_styles"][:2]:
        alt_recipe = generate_alternative_recipe(ingredients, cooking_style, recipe_analysis)
        if alt_recipe:
            recipes.append(alt_recipe)
    
    return recipes[:3]  # Return max 3 suggestions

def analyze_ingredients_for_recipes(ingredients: List[str]) -> Dict[str, Any]:
    """
    Analyze ingredients to determine cooking possibilities
    """
    # Categorize ingredients
    categories = {
        "proteins": [],
        "vegetables": [], 
        "carbs": [],
        "dairy": [],
        "seasonings": [],
        "others": []
    }
    
    # Ingredient mapping
    ingredient_map = {
        "proteins": ["ayam", "chicken", "ikan", "fish", "daging", "beef", "pork", "babi", 
                    "telur", "egg", "tahu", "tofu", "tempe", "shrimp", "udang"],
        "vegetables": ["brokoli", "broccoli", "wortel", "carrot", "bayam", "spinach", 
                      "tomat", "tomato", "bawang", "onion", "cabai", "chili", "paprika",
                      "timun", "cucumber", "selada", "lettuce", "jagung", "corn"],
        "carbs": ["nasi", "rice", "mie", "noodle", "pasta", "kentang", "potato", 
                 "roti", "bread", "singkong", "cassava", "ubi", "sweet potato"],
        "dairy": ["susu", "milk", "keju", "cheese", "butter", "mentega", "cream", "krim"],
        "seasonings": ["garam", "salt", "lada", "pepper", "bawang putih", "garlic",
                      "jahe", "ginger", "kunyit", "turmeric", "ketumbar", "coriander"]
    }
    
    # Categorize each ingredient
    for ingredient in ingredients:
        categorized = False
        for category, keywords in ingredient_map.items():
            if any(keyword in ingredient.lower() for keyword in keywords):
                categories[category].append(ingredient)
                categorized = True
                break
        if not categorized:
            categories["others"].append(ingredient)
    
    # Determine possible cooking styles
    cooking_styles = []
    if categories["proteins"] and categories["vegetables"]:
        cooking_styles.extend(["Stir-Fry", "Curry", "Soup", "Salad"])
    if categories["carbs"]:
        cooking_styles.extend(["Fried Rice", "Noodle Dish", "Pasta"])
    if categories["proteins"] and categories["dairy"]:
        cooking_styles.extend(["Creamy Dish", "Baked Dish"])
    if len(categories["vegetables"]) >= 2:
        cooking_styles.append("Vegetable Medley")
    
    if not cooking_styles:
        cooking_styles = ["Simple Mix", "Creative Combination"]
    
    return {
        "categories": categories,
        "cooking_styles": cooking_styles,
        "complexity": determine_complexity(ingredients, categories),
        "cuisine_style": determine_cuisine_style(ingredients)
    }

def analyze_cooking_intent(message: str) -> Dict[str, Any]:
    """
    Analyze user's cooking intent from their message
    """
    message_lower = message.lower()
    
    # Detect cooking preferences
    quick_keywords = ["cepat", "quick", "fast", "simple", "mudah", "easy"]
    healthy_keywords = ["sehat", "healthy", "diet", "nutritious", "bergizi"]
    spicy_keywords = ["pedas", "spicy", "hot", "cabai", "chili"]
    
    return {
        "wants_quick": any(keyword in message_lower for keyword in quick_keywords),
        "wants_healthy": any(keyword in message_lower for keyword in healthy_keywords),
        "wants_spicy": any(keyword in message_lower for keyword in spicy_keywords),
        "meal_type": detect_meal_type(message_lower)
    }

def detect_meal_type(message_lower: str) -> str:
    """Detect what meal type user wants"""
    if any(word in message_lower for word in ["sarapan", "breakfast", "pagi"]):
        return "breakfast"
    elif any(word in message_lower for word in ["makan siang", "lunch", "siang"]):
        return "lunch" 
    elif any(word in message_lower for word in ["makan malam", "dinner", "malam"]):
        return "dinner"
    elif any(word in message_lower for word in ["snack", "camilan", "cemilan"]):
        return "snack"
    else:
        return "any"

def determine_complexity(ingredients: List[str], categories: Dict) -> str:
    """Determine recipe complexity based on ingredients"""
    total_ingredients = len(ingredients)
    category_count = sum(1 for cat_ingredients in categories.values() if cat_ingredients)
    
    if total_ingredients >= 6 and category_count >= 3:
        return "Advanced"
    elif total_ingredients >= 3 and category_count >= 2:
        return "Intermediate"
    else:
        return "Beginner"

def determine_cuisine_style(ingredients: List[str]) -> str:
    """Determine likely cuisine style based on ingredients"""
    asian_ingredients = ["ayam", "nasi", "mie", "tahu", "tempe", "bawang putih", "jahe", "cabai"]
    western_ingredients = ["cheese", "pasta", "bread", "butter", "cream"]
    
    asian_count = sum(1 for ing in ingredients if any(asian_ing in ing.lower() for asian_ing in asian_ingredients))
    western_count = sum(1 for ing in ingredients if any(western_ing in ing.lower() for western_ing in western_ingredients))
    
    if asian_count > western_count:
        return "Asian"
    elif western_count > asian_count:
        return "Western"
    else:
        return "Fusion"

def generate_primary_recipe_suggestion(
    ingredients: List[str], 
    recipe_analysis: Dict[str, Any], 
    user_intent: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate the primary recipe suggestion"""
    
    main_ingredient = ingredients[0] if ingredients else "Mixed Ingredients"
    cooking_style = recipe_analysis["cooking_styles"][0] if recipe_analysis["cooking_styles"] else "Simple Dish"
    
    # Generate recipe based on analysis
    recipe_name = generate_smart_recipe_name(main_ingredient, cooking_style, recipe_analysis, user_intent)
    description = generate_recipe_description(ingredients, cooking_style, recipe_analysis, user_intent)
    
    # Calculate match percentage based on ingredients and user intent
    match_percentage = calculate_smart_match_percentage(ingredients, recipe_analysis, user_intent)
    
    return {
        "title": recipe_name,
        "description": description,
        "prep_time": calculate_prep_time(ingredients, cooking_style, user_intent),
        "difficulty": recipe_analysis["complexity"],
        "cuisine": recipe_analysis["cuisine_style"],
        "match_percentage": match_percentage,
        "match_reason": generate_match_reason(ingredients, cooking_style, user_intent),
        "special_note": generate_special_note(user_intent, recipe_analysis)
    }

def generate_alternative_recipe(
    ingredients: List[str], 
    cooking_style: str, 
    recipe_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate alternative recipe suggestion"""
    
    main_ingredient = ingredients[0] if ingredients else "Mixed Ingredients"
    recipe_name = generate_smart_recipe_name(main_ingredient, cooking_style, recipe_analysis, {})
    description = generate_recipe_description(ingredients, cooking_style, recipe_analysis, {})
    
    return {
        "title": recipe_name,
        "description": description, 
        "prep_time": calculate_prep_time(ingredients, cooking_style, {}),
        "difficulty": recipe_analysis["complexity"],
        "cuisine": recipe_analysis["cuisine_style"],
        "match_percentage": calculate_smart_match_percentage(ingredients, recipe_analysis, {}) - 15,
        "match_reason": f"Alternative {cooking_style.lower()} option using your available ingredients",
        "special_note": f"Different cooking approach - {cooking_style.lower()} style"
    }

def generate_smart_recipe_name(
    main_ingredient: str, 
    cooking_style: str, 
    recipe_analysis: Dict[str, Any], 
    user_intent: Dict[str, Any]
) -> str:
    """Generate smart recipe names based on context"""
    
    cuisine = recipe_analysis.get("cuisine_style", "")
    
    # Indonesian style names
    if cuisine == "Asian":
        if cooking_style == "Stir-Fry":
            return f"Tumis {main_ingredient.title()}"
        elif cooking_style == "Soup":
            return f"Sup {main_ingredient.title()}"
        elif cooking_style == "Curry":
            return f"Gulai {main_ingredient.title()}"
        elif cooking_style == "Fried Rice":
            return f"Nasi Goreng {main_ingredient.title()}"
    
    # Quick recipe names if user wants fast cooking
    if user_intent.get("wants_quick", False):
        return f"Quick {cooking_style} {main_ingredient.title()}"
    
    # Healthy recipe names
    if user_intent.get("wants_healthy", False):
        return f"Healthy {cooking_style} {main_ingredient.title()}"
    
    # Default naming
    return f"{cooking_style} {main_ingredient.title()}"

def generate_recipe_description(
    ingredients: List[str], 
    cooking_style: str, 
    recipe_analysis: Dict[str, Any], 
    user_intent: Dict[str, Any]
) -> str:
    """Generate engaging recipe descriptions"""
    
    main_ingredient = ingredients[0] if ingredients else "your ingredients"
    
    # Base descriptions by cooking style
    base_descriptions = {
        "Stir-Fry": f"Quick and flavorful stir-fry featuring {main_ingredient} with perfectly seasoned vegetables",
        "Soup": f"Comforting and nourishing soup with {main_ingredient} and wholesome ingredients", 
        "Curry": f"Rich and aromatic curry using {main_ingredient} with traditional spices",
        "Fried Rice": f"Satisfying fried rice with {main_ingredient} and perfect seasoning",
        "Salad": f"Fresh and healthy salad featuring {main_ingredient} with crisp vegetables",
        "Pasta": f"Delicious pasta dish with {main_ingredient} and complementary flavors"
    }
    
    description = base_descriptions.get(cooking_style, f"Creative dish combining {main_ingredient} with your available ingredients")
    
    # Add user intent modifiers
    if user_intent.get("wants_quick", False):
        description += " - ready in minutes!"
    if user_intent.get("wants_healthy", False):
        description += " - packed with nutrition!"
    if user_intent.get("wants_spicy", False):
        description += " - with a spicy kick!"
    
    return description

def calculate_prep_time(ingredients: List[str], cooking_style: str, user_intent: Dict[str, Any]) -> int:
    """Calculate estimated preparation time"""
    
    # Base time by cooking style
    base_times = {
        "Stir-Fry": 15,
        "Soup": 25,
        "Curry": 30,
        "Fried Rice": 20,
        "Salad": 10,
        "Pasta": 20,
        "Simple Mix": 10
    }
    
    base_time = base_times.get(cooking_style, 20)
    
    # Adjust for number of ingredients
    if len(ingredients) > 5:
        base_time += 10
    elif len(ingredients) > 3:
        base_time += 5
    
    # Quick cooking adjustment
    if user_intent.get("wants_quick", False):
        base_time = max(10, base_time - 10)
    
    return base_time

def calculate_smart_match_percentage(
    ingredients: List[str], 
    recipe_analysis: Dict[str, Any], 
    user_intent: Dict[str, Any]
) -> int:
    """Calculate intelligent match percentage"""
    
    base_percentage = 75
    
    # Ingredient variety bonus
    categories_used = sum(1 for cat_ingredients in recipe_analysis["categories"].values() if cat_ingredients)
    base_percentage += categories_used * 5
    
    # User intent matching
    if user_intent.get("wants_quick", False) and recipe_analysis["complexity"] == "Beginner":
        base_percentage += 10
    if user_intent.get("wants_healthy", False) and len(recipe_analysis["categories"]["vegetables"]) >= 2:
        base_percentage += 10
    
    return min(98, base_percentage)  # Cap at 98%

def generate_match_reason(ingredients: List[str], cooking_style: str, user_intent: Dict[str, Any]) -> str:
    """Generate reason why this recipe matches"""
    
    reasons = []
    
    if len(ingredients) >= 3:
        reasons.append("great ingredient variety")
    if user_intent.get("wants_quick", False):
        reasons.append("quick cooking method")
    if user_intent.get("wants_healthy", False):
        reasons.append("nutritious combination")
    
    if not reasons:
        reasons = ["perfect use of your available ingredients"]
    
    return f"Recommended for {' and '.join(reasons)}"

def generate_special_note(user_intent: Dict[str, Any], recipe_analysis: Dict[str, Any]) -> str:
    """Generate special cooking notes"""
    
    notes = []
    
    if user_intent.get("wants_quick", False):
        notes.append("⏱️ Quick prep tip: prep all ingredients before starting to cook")
    
    if user_intent.get("wants_healthy", False):
        notes.append("🥗 Health tip: add extra vegetables for more nutrients")
    
    if user_intent.get("wants_spicy", False):
        notes.append("🌶️ Spice tip: adjust chili to your preference")
    
    if recipe_analysis["complexity"] == "Advanced":
        notes.append("👨‍🍳 Pro tip: take your time with each step for best results")
    
    return " | ".join(notes) if notes else "Enjoy your cooking adventure! 🍽️"

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check for AI service"""
    return {
        "status": "healthy",
        "service": "AI Chatbot",
        "version": "2.0",
        "capabilities": [
            "general_conversation",
            "recipe_suggestions", 
            "cooking_advice",
            "multi_language_support"
        ],
        "ai_model": MODEL_NAME if chatbot_pipeline else "smart_fallback"
    }

# Clear conversation endpoint
@router.delete("/conversation/{conversation_id}")
async def clear_conversation(conversation_id: str):
    """Clear a specific conversation history"""
    if conversation_id in conversation_history:
        del conversation_history[conversation_id]
        return {"message": "Conversation cleared successfully"}
    else:
        raise HTTPException(status_code=404, detail="Conversation not found")

# Get conversation stats
@router.get("/stats")
async def get_chat_stats():
    """Get chatbot usage statistics"""
    total_conversations = len(conversation_history)
    total_messages = sum(len(conv) for conv in conversation_history.values())
    
    return {
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "active_conversations": total_conversations,
        "average_messages_per_conversation": total_messages / max(1, total_conversations)
    }
