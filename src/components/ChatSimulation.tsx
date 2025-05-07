import React, { useState, useEffect, useRef } from 'react';

// Define interfaces for our simulation data
interface SimulatedProperty {
  id: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  address: string;
  price: number;
  features: string[];
  description: string;
  similarity: number;
}

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  details?: any;
  tokens?: number;
  cost?: number;
}

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
  
  // NEW: Process visualization
  const [showProcess, setShowProcess] = useState<boolean>(false);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [matchedProperties, setMatchedProperties] = useState<SimulatedProperty[]>([]);
  const [ragPrompt, setRagPrompt] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const processEndRef = useRef<HTMLDivElement | null>(null);

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

  // Sample properties database for simulation
  const propertiesDatabase: SimulatedProperty[] = [
    {
      id: 'prop1',
      type: 'Apartment',
      bedrooms: 2,
      bathrooms: 1,
      address: '42 Beach Rd, St Kilda',
      price: 450,
      features: ['near beach', 'pool', 'parking'],
      description: 'Cozy 2-bedroom apartment just steps from St Kilda beach. Features include a swimming pool, secure parking, and modern appliances.',
      similarity: 0.92
    },
    {
      id: 'prop2',
      type: 'Apartment',
      bedrooms: 2,
      bathrooms: 2,
      address: '15 Acland St, St Kilda',
      price: 520,
      features: ['renovated', 'near beach', 'balcony'],
      description: 'Newly renovated 2-bedroom apartment with large balcony offering partial ocean views. Walking distance to shops and cafes on Acland Street.',
      similarity: 0.87
    },
    {
      id: 'prop3',
      type: 'Apartment',
      bedrooms: 1,
      bathrooms: 1,
      address: '78 Carlisle St, St Kilda',
      price: 380,
      features: ['gym', 'parking', 'public transport'],
      description: 'Modern 1-bedroom apartment with access to building gym. Close to trams and trains for easy commute to CBD.',
      similarity: 0.68
    },
    {
      id: 'prop4',
      type: 'House',
      bedrooms: 3,
      bathrooms: 2,
      address: '22 Tennyson St, Elwood',
      price: 750,
      features: ['backyard', 'near beach', 'renovated kitchen'],
      description: 'Charming 3-bedroom house with backyard, perfect for entertaining. Recently renovated kitchen and bathrooms. Short walk to Elwood beach.',
      similarity: 0.55
    }
  ];

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

  // Simulate the RAG process and generate AI response
  const generateResponse = async (userMessage: string) => {
    setIsLoading(true);
    setShowProcess(true);
    
    // Reset process steps
    setProcessSteps([
      {
        id: 'embedding',
        title: 'Embedding Query',
        description: 'Converting query text into vector embeddings',
        status: 'waiting'
      },
      {
        id: 'search',
        title: 'Vector Database Search',
        description: 'Searching for relevant property matches',
        status: 'waiting'
      },
      {
        id: 'rank',
        title: 'Ranking Results',
        description: 'Sorting results by relevance score',
        status: 'waiting'
      },
      {
        id: 'prompt',
        title: 'Building RAG Prompt',
        description: 'Combining query with retrieved context',
        status: 'waiting'
      },
      {
        id: 'generate',
        title: 'Generating Response',
        description: 'Using LLM to create final answer',
        status: 'waiting'
      }
    ]);
    setMatchedProperties([]);
    
    // Tokens and costs
    const userTokens = estimateTokens(userMessage);
    
    // Step 1: Embedding Query
    setProcessSteps(steps => {
      const newSteps = [...steps];
      const step = newSteps.find(s => s.id === 'embedding');
      if (step) {
        step.status = 'processing';
        step.tokens = userTokens;
        step.cost = (userTokens / 1000000) * embeddingModelPricing[selectedEmbeddingModel];
        step.details = { model: selectedEmbeddingModel, dimensions: selectedEmbeddingModel === 'text-embedding-3-small' ? 1536 : 3072 };
      }
      return newSteps;
    });
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Complete Step 1
    setProcessSteps(steps => {
      const newSteps = [...steps];
      const step = newSteps.find(s => s.id === 'embedding');
      if (step) step.status = 'completed';
      return newSteps;
    });
    
    // Step 2: Vector Database Search
    setProcessSteps(steps => {
      const newSteps = [...steps];
      const step = newSteps.find(s => s.id === 'search');
      if (step) {
        step.status = 'processing';
        step.details = { 
          dbType: 'Vector DB (Pinecone)',
          namespace: 'properties',
          totalItems: 1452,
          searchParams: { 
            topK: 5,
            includeMetadata: true
          }
        };
      }
      return newSteps;
    });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Complete Step 2 and start Step 3
    setProcessSteps(steps => {
      const newSteps = [...steps];
      const searchStep = newSteps.find(s => s.id === 'search');
      if (searchStep) searchStep.status = 'completed';
      
      const rankStep = newSteps.find(s => s.id === 'rank');
      if (rankStep) {
        rankStep.status = 'processing';
        rankStep.details = { 
          scoreThreshold: 0.5,
          reRanker: 'Semantic',
          resultsFound: propertiesDatabase.length
        };
      }
      return newSteps;
    });
    
    // Simulate finding matches
    const filteredProperties = propertiesDatabase.filter(p => p.similarity > 0.5);
    setMatchedProperties(filteredProperties);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Complete Step 3 and start Step 4 (Building RAG Prompt)
    const contextString = filteredProperties.map(p => 
      `Property ID: ${p.id}
Type: ${p.type}
Bedrooms: ${p.bedrooms}
Bathrooms: ${p.bathrooms}
Address: ${p.address}
Weekly Rent: $${p.price}
Features: ${p.features.join(', ')}
Description: ${p.description}`
    ).join('\n\n');
    
    const fullPrompt = `User Query: ${userMessage}
    
CONTEXT INFORMATION:
${contextString}

Based on the user query and the provided property information, answer the user's question about available properties. If specific properties match their criteria, mention the details. If no properties exactly match, suggest close alternatives. Be helpful and informative.

Answer:`;
    
    setRagPrompt(fullPrompt);
    
    const promptTokens = estimateTokens(fullPrompt);
    
    setProcessSteps(steps => {
      const newSteps = [...steps];
      const rankStep = newSteps.find(s => s.id === 'rank');
      if (rankStep) rankStep.status = 'completed';
      
      const promptStep = newSteps.find(s => s.id === 'prompt');
      if (promptStep) {
        promptStep.status = 'processing';
        promptStep.tokens = promptTokens;
        promptStep.details = { 
          contextSize: contextString.length,
          properties: filteredProperties.length
        };
      }
      return newSteps;
    });
    
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Complete Step 4 and start Step 5 (Generate Response)
    setProcessSteps(steps => {
      const newSteps = [...steps];
      const promptStep = newSteps.find(s => s.id === 'prompt');
      if (promptStep) promptStep.status = 'completed';
      
      const generateStep = newSteps.find(s => s.id === 'generate');
      if (generateStep) {
        generateStep.status = 'processing';
        generateStep.details = { 
          model: selectedModel,
          temperature: 0.7,
          maxTokens: 800
        };
      }
      return newSteps;
    });
    
    // Generate response based on query and context
    let aiResponse = "";
    
    if (userMessage.toLowerCase().includes('beach') && userMessage.toLowerCase().includes('st kilda')) {
      aiResponse = `Based on your query, I found 2 properties in St Kilda near the beach that might interest you:

1. A 2-bedroom apartment at 42 Beach Rd ($450/week) with a pool and parking, just steps from St Kilda beach.

2. A renovated 2-bedroom apartment at 15 Acland St ($520/week) with a balcony and partial ocean views.

Both properties are within walking distance to the beach. Would you like more details about either of these options?`;
    } else if (userMessage.toLowerCase().includes('parking')) {
      aiResponse = `I found 2 properties with parking facilities that might suit your needs:

1. A 2-bedroom apartment at 42 Beach Rd in St Kilda ($450/week) with secure parking, a pool, and close proximity to the beach.

2. A 1-bedroom apartment at 78 Carlisle St in St Kilda ($380/week) with parking and access to a building gym.

Both offer convenient parking options. The Beach Rd property is more expensive but includes additional amenities like a pool and beach access.`;
    } else {
      aiResponse = `Based on your search criteria, I found several properties that might interest you:

1. A 2-bedroom apartment in St Kilda at 42 Beach Rd ($450/week) near the beach with pool and parking.

2. Another 2-bedroom in St Kilda on Acland St ($520/week) with a balcony and ocean views.

3. A more affordable 1-bedroom option on Carlisle St ($380/week) with gym access.

4. If you need more space, there's a 3-bedroom house in nearby Elwood ($750/week) with a backyard.

Would you like more specific information about any of these properties?`;
    }
    
    const outputTokens = estimateTokens(aiResponse);
    const { inputCost, outputCost, embeddingCost, totalCost } = calculateCost(promptTokens, outputTokens, true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Complete Step 5
    setProcessSteps(steps => {
      const newSteps = [...steps];
      const generateStep = newSteps.find(s => s.id === 'generate');
      if (generateStep) {
        generateStep.status = 'completed';
        generateStep.tokens = outputTokens;
        generateStep.cost = outputCost;
      }
      return newSteps;
    });
    
    // Update token counts
    setTokenCounts(prev => ({
      totalInput: prev.totalInput + promptTokens,
      totalOutput: prev.totalOutput + outputTokens,
      totalEmbedding: includeEmbeddings ? prev.totalEmbedding + userTokens : prev.totalEmbedding,
      currentSession: prev.currentSession + promptTokens + outputTokens + (includeEmbeddings ? userTokens : 0)
    }));
    
    // Update costs
    setCosts(prev => ({
      inputCost: prev.inputCost + inputCost,
      outputCost: prev.outputCost + outputCost,
      embeddingCost: prev.embeddingCost + embeddingCost,
      totalCost: prev.totalCost + totalCost,
      sessionHistory: [...prev.sessionHistory, {
        timestamp: new Date().toISOString(),
        inputTokens: promptTokens,
        outputTokens,
        embeddingTokens: userTokens,
        inputCost,
        outputCost,
        embeddingCost,
        totalCost
      }]
    }));
    
    // Add message to chat
    setMessages(prev => [
      ...prev, 
      { 
        role: 'assistant', 
        content: aiResponse,
        tokens: outputTokens,
        cost: outputCost
      }
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userTokens = estimateTokens(inputMessage);
    const { inputCost } = calculateCost(userTokens, 0, false);
    
    // Update messages
    setMessages(prev => [
      ...prev, 
      { 
        role: 'user', 
        content: inputMessage,
        tokens: userTokens,
        cost: inputCost
      }
    ]);
    
    generateResponse(inputMessage);
    setInputMessage('');
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    processEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [processSteps]);

  return (
    <div className="flex flex-col">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
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
                Include RAG workflow
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
      
        <div className="flex flex-1">
          {/* Chat area */}
          <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-2 border-b">
              <h3 className="font-medium text-sm">Property Search Assistant</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 max-h-[400px]">
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
            
            <div className="p-3 border-t">
              <div className="flex">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about properties (e.g., 'Find 2-bedroom apartments near the beach in St Kilda')"
                  className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <div className="w-64 bg-gray-50 p-4 border rounded-lg ml-4 overflow-y-auto">
            <h2 className="font-bold mb-4">Cost Tracking</h2>
            
            <div className="mb-4">
              <div className="bg-white p-3 rounded shadow-sm mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Input Tokens:</span>
                  <span className="text-sm">{tokenCounts.totalInput}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Output Tokens:</span>
                  <span className="text-sm">{tokenCounts.totalOutput}</span>
                </div>
                {includeEmbeddings && (
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Embedding Tokens:</span>
                    <span className="text-sm">{tokenCounts.totalEmbedding}</span>
                  </div>
                )}
                <div className="border-t pt-1 mt-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-sm">Total Cost:</span>
                    <span className="text-sm">${costs.totalCost.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* RAG Process Visualization */}
        {showProcess && includeEmbeddings && (
          <div className="mt-4 mb-4 bg-gray-50 p-4 border rounded-lg">
            <h3 className="font-bold mb-2">RAG Process Visualization</h3>
            
            <div className="space-y-4">
              {processSteps.map((step, index) => (
                <div key={step.id} className="border rounded-lg overflow-hidden bg-white">
                  <div className={`flex items-center justify-between p-3 ${
                    step.status === 'waiting' ? 'bg-gray-100' :
                    step.status === 'processing' ? 'bg-blue-50' :
                    step.status === 'completed' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-2 ${
                        step.status === 'waiting' ? 'bg-gray-300' :
                        step.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                        step.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                      } text-white font-bold`}>
                        {step.status === 'completed' ? '✓' : index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-xs text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {step.tokens && (
                        <div className="text-xs">
                          {step.tokens} tokens
                          {step.cost && <span> (${step.cost.toFixed(6)})</span>}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {step.status === 'waiting' ? 'Pending' :
                         step.status === 'processing' ? 'In progress...' :
                         step.status === 'completed' ? 'Completed' : 'Error'}
                      </div>
                    </div>
                  </div>
                  
                  {step.status === 'completed' && step.details && step.id === 'embedding' && (
                    <div className="p-3 text-sm">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Model: {step.details.model}</span>
                        <span>Dimensions: {step.details.dimensions}</span>
                      </div>
                      <div className="mt-2 overflow-x-auto">
                        <div className="text-xs text-gray-500">Vector representation (truncated):</div>
                        <div className="font-mono text-xs bg-gray-50 p-2 rounded">
                          [-0.024, 0.031, 0.017, ..., 0.045, -0.087, 0.022]
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step.status === 'completed' && step.id === 'search' && (
                    <div className="p-3 text-sm">
                      <div className="text-xs mb-1">
                        <span>Database: {step.details?.dbType}</span> | 
                        <span> Namespace: {step.details?.namespace}</span> | 
                        <span> Total items: {step.details?.totalItems}</span>
                      </div>
                    </div>
                  )}
                  
                  {step.status === 'completed' && step.id === 'rank' && matchedProperties.length > 0 && (
                    <div className="p-3">
                      <div className="text-xs mb-2">Top matches with similarity scores:</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="p-1 text-left border">Property</th>
                              <th className="p-1 text-left border">Type</th>
                              <th className="p-1 text-left border">Location</th>
                              <th className="p-1 text-right border">Price</th>
                              <th className="p-1 text-right border">Similarity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchedProperties.map(property => (
                              <tr key={property.id} className="hover:bg-blue-50">
                                <td className="p-1 border">{property.id}</td>
                                <td className="p-1 border">{property.bedrooms}BR {property.type}</td>
                                <td className="p-1 border">{property.address}</td>
                                <td className="p-1 text-right border">${property.price}/wk</td>
                                <td className="p-1 text-right border">
                                  <div className="flex items-center justify-end">
                                    <div 
                                      className="w-16 h-2 bg-gray-200 rounded-full mr-1 overflow-hidden"
                                      title={`${(property.similarity * 100).toFixed(1)}%`}
                                    >
                                      <div 
                                        className="h-full bg-green-500" 
                                        style={{width: `${property.similarity * 100}%`}}
                                      ></div>
                                    </div>
                                    <span>{(property.similarity * 100).toFixed(0)}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {step.status === 'completed' && step.id === 'prompt' && ragPrompt && (
                    <div className="p-3">
                      <div className="text-xs mb-2">
                        Generated RAG prompt with {step.details?.properties} properties ({step.tokens} tokens):
                      </div>
                      <div className="overflow-y-auto max-h-48">
                        <div className="font-mono text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">
                          {ragPrompt}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={processEndRef}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSimulation;