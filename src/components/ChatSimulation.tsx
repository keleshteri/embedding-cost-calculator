import React, { useState, useEffect, useRef } from 'react';

const ChatSimulation: React.FC = () => {
  const [messages, setMessages] = useState<Array<{
    role: string;
    content: string;
    tokens: number;
    cost: number;
    embeddingCost?: number;
  }>>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState<string>('text-embedding-3-small');
  const [includeEmbeddings, setIncludeEmbeddings] = useState<boolean>(true);
  const [tokenCounts, setTokenCounts] = useState({
    totalInput: 0,
    totalOutput: 0,
    totalEmbedding: 0,
    currentSession: 0
  });
  const [costs, setCosts] = useState({
    inputCost: 0,
    outputCost: 0,
    embeddingCost: 0,
    totalCost: 0,
    sessionHistory: [] as Array<{
      timestamp: string;
      inputTokens: number;
      outputTokens: number;
      embeddingTokens?: number;
      inputCost: number;
      outputCost: number;
      embeddingCost?: number;
      totalCost: number;
    }>
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Model pricing data (per 1M tokens)
  const modelPricing: {[key: string]: [number, number]} = {
    // Format: [input price, output price]
    'gpt-4-1106': [10.00, 30.00],
    'gpt-4o': [5.00, 15.00],
    'gpt-4o-mini': [0.15, 0.60], 
    'gpt-3.5-turbo': [0.50, 1.50],
    'o1-mini': [1.10, 4.40],
    'o1': [15.00, 60.00],
    'claude-3.5-sonnet': [3.00, 15.00],
    'claude-3.7-sonnet': [3.50, 18.00]
  };
  
  // Embedding model pricing data (per 1M tokens)
  const embeddingModelPricing: {[key: string]: number} = {
    'text-embedding-3-small': 0.02,
    'text-embedding-3-large': 0.13,
    'text-embedding-ada-002': 0.10
  };

  // Simple token estimation based on character count
  const estimateTokens = (text: string): number => {
    if (!text) return 0;
    const charCount = text.length;
    return Math.ceil(charCount / 4); // Very approximate estimation
  };

  // Calculate cost based on token count and model
  const calculateCost = (inputTokens: number, outputTokens: number, includeEmbedding: boolean = true) => {
    const [inputPrice, outputPrice] = modelPricing[selectedModel];
    const embeddingPrice = embeddingModelPricing[selectedEmbeddingModel];
    
    const inputCost = (inputTokens / 1000000) * inputPrice;
    const outputCost = (outputTokens / 1000000) * outputPrice;
    
    // Only calculate embedding cost for user queries (input)
    const embeddingCost = includeEmbedding && includeEmbeddings ? (inputTokens / 1000000) * embeddingPrice : 0;
    
    return {
      inputCost,
      outputCost,
      embeddingCost,
      totalCost: inputCost + outputCost + embeddingCost
    };
  };

  // Generate AI response
  const generateResponse = async (userMessage: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Example AI responses based on user input
    const responses = [
      "I can help you with that! What specific information are you looking for?",
      "Based on your query, here are some relevant properties that match your criteria...",
      "That's an interesting question. Let me analyze the data and provide you with a detailed response.",
      "I found several properties that match your search criteria. Would you like me to sort them by price or location?",
      "The data suggests that properties in that area have increased in value by approximately 12% over the last year.",
      "I've analyzed your request and found 3 properties that match all your criteria and 7 more that match most of them.",
      "Looking at historical data, the best time to list properties in that neighborhood is usually early spring.",
      "Based on your preferences, I would recommend focusing your search on these specific neighborhoods."
    ];
    
    // Select a random response
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Estimate tokens
    const inputTokens = estimateTokens(userMessage);
    const outputTokens = estimateTokens(randomResponse);
    
    // Calculate costs - don't include embedding cost for AI response
    const { inputCost, outputCost, totalCost } = calculateCost(inputTokens, outputTokens, false);
    
    // Update token counts
    setTokenCounts(prev => ({
      totalInput: prev.totalInput + inputTokens,
      totalOutput: prev.totalOutput + outputTokens,
      totalEmbedding: prev.totalEmbedding,
      currentSession: prev.currentSession + inputTokens + outputTokens
    }));
    
    setCosts(prev => ({
      inputCost: prev.inputCost + inputCost,
      outputCost: prev.outputCost + outputCost,
      embeddingCost: prev.embeddingCost,
      totalCost: prev.totalCost + totalCost,
      sessionHistory: [...prev.sessionHistory, {
        timestamp: new Date().toISOString(),
        inputTokens,
        outputTokens,
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost
      }]
    }));
    
    // Add message to chat
    setMessages(prev => [
      ...prev, 
      { 
        role: 'assistant', 
        content: randomResponse,
        tokens: outputTokens,
        cost: outputCost
      }
    ]);
    
    setIsLoading(false);
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userTokens = estimateTokens(inputMessage);
    const { inputCost, embeddingCost, totalCost } = calculateCost(userTokens, 0, true);
    
    // Update token counts with embedding tokens if enabled
    setTokenCounts(prev => ({
      ...prev,
      totalEmbedding: includeEmbeddings ? prev.totalEmbedding + userTokens : prev.totalEmbedding
    }));
    
    // Update costs with embedding cost
    setCosts(prev => ({
      ...prev,
      inputCost: prev.inputCost + inputCost,
      embeddingCost: prev.embeddingCost + (includeEmbeddings ? embeddingCost : 0),
      totalCost: prev.totalCost + totalCost,
      sessionHistory: [...prev.sessionHistory, {
        timestamp: new Date().toISOString(),
        inputTokens: userTokens,
        outputTokens: 0,
        embeddingTokens: includeEmbeddings ? userTokens : 0,
        inputCost,
        outputCost: 0,
        embeddingCost: includeEmbeddings ? embeddingCost : 0,
        totalCost
      }]
    }));
    
    setMessages(prev => [
      ...prev, 
      { 
        role: 'user', 
        content: inputMessage,
        tokens: userTokens,
        cost: inputCost,
        embeddingCost: includeEmbeddings ? embeddingCost : 0
      }
    ]);
    
    generateResponse(inputMessage);
    setInputMessage('');
  };

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <div>
            <div className="text-sm font-medium mb-1">Chat Model:</div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="gpt-4-1106">GPT-4-1106</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o-mini</option>
              <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
              <option value="o1-mini">o1-mini</option>
              <option value="o1">o1</option>
              <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
            </select>
            <div className="text-xs text-gray-600 mt-1">
              Price: ${modelPricing[selectedModel][0]} input / ${modelPricing[selectedModel][1]} output per 1M tokens
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <div className="text-sm font-medium">Embedding Model:</div>
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={includeEmbeddings}
                  onChange={() => setIncludeEmbeddings(!includeEmbeddings)}
                  className="mr-1"
                />
                Include embedding costs
              </label>
            </div>
            <select
              value={selectedEmbeddingModel}
              onChange={(e) => setSelectedEmbeddingModel(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              disabled={!includeEmbeddings}
            >
              <option value="text-embedding-3-small">text-embedding-3-small</option>
              <option value="text-embedding-3-large">text-embedding-3-large</option>
              <option value="text-embedding-ada-002">text-embedding-ada-002</option>
            </select>
            <div className="text-xs text-gray-600 mt-1">
              Price: ${embeddingModelPricing[selectedEmbeddingModel]} per 1M tokens
            </div>
          </div>
        </div>
      
        <div className="flex flex-1 overflow-hidden mt-4">
          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div 
                    className={`inline-block p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg ${
                      message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.tokens} tokens (${message.cost.toFixed(6)})
                    {message.role === 'user' && includeEmbeddings && message.embeddingCost !== undefined && (
                      <span> + ${message.embeddingCost.toFixed(6)} embedding</span>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left mb-4">
                  <div className="inline-block p-3 rounded-lg bg-gray-200">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t">
              <div className="flex">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className="bg-blue-500 text-white p-2 rounded-r-lg disabled:bg-blue-300"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
          
          {/* Cost dashboard */}
          <div className="w-64 bg-gray-50 p-4 border-l overflow-y-auto">
            <h2 className="font-bold mb-4">Token & Cost Tracking</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Current Session</h3>
              <div className="bg-white p-3 rounded shadow-sm mb-2">
                <div className="flex justify-between mb-1">
                  <span>Input Tokens:</span>
                  <span>{tokenCounts.totalInput}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Output Tokens:</span>
                  <span>{tokenCounts.totalOutput}</span>
                </div>
                {includeEmbeddings && (
                  <div className="flex justify-between mb-1">
                    <span>Embedding Tokens:</span>
                    <span>{tokenCounts.totalEmbedding}</span>
                  </div>
                )}
                <div className="flex justify-between mb-1">
                  <span>Total Tokens:</span>
                  <span>{tokenCounts.currentSession}</span>
                </div>
                <div className="border-t pt-1 mt-1">
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span>${costs.totalCost.toFixed(6)}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-white p-2 rounded shadow-sm text-center">
                  <div className="text-xs text-gray-500">Input Cost</div>
                  <div className="font-semibold">${costs.inputCost.toFixed(6)}</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm text-center">
                  <div className="text-xs text-gray-500">Output Cost</div>
                  <div className="font-semibold">${costs.outputCost.toFixed(6)}</div>
                </div>
              </div>
              
              {includeEmbeddings && (
                <div className="bg-white p-2 rounded shadow-sm text-center mb-2">
                  <div className="text-xs text-gray-500">Embedding Cost</div>
                  <div className="font-semibold">${costs.embeddingCost.toFixed(6)}</div>
                  <div className="text-xs text-gray-500">{selectedEmbeddingModel}</div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Cost History</h3>
              <div className="text-xs">
                {costs.sessionHistory.length > 0 ? (
                  <div className="bg-white p-3 rounded shadow-sm overflow-y-auto max-h-40">
                    {costs.sessionHistory.map((entry, index) => (
                      <div key={index} className="mb-2 pb-2 border-b border-gray-100 last:border-0">
                        <div className="flex justify-between">
                          <span>Message {index + 1}:</span>
                          <span>${entry.totalCost.toFixed(6)}</span>
                        </div>
                        <div className="text-gray-500">
                          In: {entry.inputTokens} | Out: {entry.outputTokens}
                          {includeEmbeddings && entry.embeddingTokens !== undefined && entry.embeddingTokens > 0 && (
                            <> | Emb: {entry.embeddingTokens}</>
                          )}
                        </div>
                        {includeEmbeddings && entry.embeddingCost !== undefined && entry.embeddingCost > 0 && (
                          <div className="text-gray-500">
                            Embedding: ${entry.embeddingCost.toFixed(6)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center">No history yet</div>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-gray-500">
                <p className="mb-1">* Token counts are approximate</p>
                <p>* Costs calculated using May 2025 pricing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSimulation;