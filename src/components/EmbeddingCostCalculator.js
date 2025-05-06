import React, { useState, useEffect, useCallback } from 'react';

// Simple GPT tokenizer implementation based on character count
// This is a very simplified approach as accurate tokenization requires a full tokenizer model
const estimateTokens = (text) => {
  if (!text) return 0;
  
  // Count characters
  const charCount = text.length;
  
  // GPT models average around 4 characters per token (very approximate)
  // This is still just an estimate - a true tokenizer would be more accurate
  const tokenEstimate = Math.ceil(charCount / 4);
  
  return tokenEstimate;
};

const EmbeddingCostCalculator = () => {
  // State variables
  const [tokenCount, setTokenCount] = useState(180);
  const [queryCount, setQueryCount] = useState(4000);
  const [selectedModel, setSelectedModel] = useState('text-embedding-3-small');
  const [sampleText, setSampleText] = useState('');
  const [sampleTokens, setSampleTokens] = useState(0);
  const [sampleChars, setSampleChars] = useState(0);
  const [activeTab, setActiveTab] = useState('calculator');
  const [modelType, setModelType] = useState('embedding');
  const [inputRatio, setInputRatio] = useState(20); // Default 20% input, 80% output
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [scenarioType, setScenarioType] = useState('property'); // 'property' or 'query'
  
  // Embedding model pricing data (per 1M tokens)
  const embeddingModelPricing = {
    'text-embedding-3-small': 0.02,
    'text-embedding-3-large': 0.13,
    'text-embedding-ada-002': 0.10
  };
  
  // Chat model pricing data (per 1M tokens)
  const chatModelPricing = {
    // Format: [input price, output price]
    'gpt-4-1106': [10.00, 30.00],
    'gpt-4o': [5.00, 15.00],
    'gpt-4o-mini': [0.15, 0.60],
    'gpt-3.5-turbo': [0.50, 1.50],
    'o1-mini': [1.10, 4.40],
    'o1': [15.00, 60.00],
    'claude-3.5-sonnet': [3.00, 15.00]
  };
  
  // Token counting for sample text
  const countTokens = useCallback((text) => {
    const chars = text.length;
    const tokens = estimateTokens(text);
    setSampleChars(chars);
    setSampleTokens(tokens);
    
    // Automatically update the token count in the calculator
    if (tokens > 0) {
      setTokenCount(tokens);
    }
  }, []);
  
  // Handle model type change
  const handleModelTypeChange = (type) => {
    setModelType(type);
    
    // Set appropriate default model when switching types
    if (type === 'embedding') {
      setSelectedModel('text-embedding-3-small');
    } else if (type === 'chat') {
      setSelectedModel('gpt-3.5-turbo');
    }
  };

  // Handle scenario type change
  const handleScenarioTypeChange = (type) => {
    setScenarioType(type);
  };

  // Handle text input change
  const handleTextChange = (e) => {
    const text = e.target.value;
    setSampleText(text);
    countTokens(text);
  };

  // Example property data
  const showExample = () => {
    let example;
    
    if (scenarioType === 'property') {
      example = `Basic Property Information:
Property type: "Apartment"
Bedrooms: 2
Bathrooms: 1
Parking: 1 (carports: 1, garages: 0)
Address: "11/39 Wellington St Kilda VIC 3182 AU"
Location coordinates: latitude: -37.856525, longitude: 144.985485
Rental price: $400 per week
For rent: true
Features: built-in robes, underground car space, storage cage, heating panels, evaporative cooling, lift access, enclosed terrace`;
    } else {
      example = `Show me 2-bedroom apartments near the beach with a pool under $500 per week in St Kilda area`;
    }
    
    setSampleText(example);
    countTokens(example);
  };
  
  // Clear the text area
  const clearText = () => {
    setSampleText('');
    setSampleTokens(0);
    setSampleChars(0);
  };
  
  // Update calculations when inputs change
  useEffect(() => {
    let totalTokensCalc;
    
    if (scenarioType === 'property') {
      // For property embedding, multiply token count by number of properties
      totalTokensCalc = tokenCount * queryCount;
    } else {
      // For query scenarios, we're just calculating the cost of queries
      totalTokensCalc = tokenCount * queryCount;
    }
    
    const millionTokens = totalTokensCalc / 1000000;
    
    let calculatedCost = 0;
    
    if (modelType === 'embedding') {
      const costPerModel = embeddingModelPricing[selectedModel];
      calculatedCost = millionTokens * costPerModel;
    } else if (modelType === 'chat') {
      // Use the input/output ratio from the slider
      const inputRatioDecimal = inputRatio / 100;
      const outputRatioDecimal = 1 - inputRatioDecimal;
      
      const inputTokens = millionTokens * inputRatioDecimal;
      const outputTokens = millionTokens * outputRatioDecimal;
      
      const [inputPrice, outputPrice] = chatModelPricing[selectedModel];
      calculatedCost = (inputTokens * inputPrice) + (outputTokens * outputPrice);
    }
    
    setTotalTokens(totalTokensCalc);
    setTotalCost(calculatedCost);
  }, [tokenCount, queryCount, selectedModel, modelType, scenarioType, embeddingModelPricing, chatModelPricing, inputRatio]);
  
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-2">AI Model Cost Calculator</h1>
      <h2 className="text-sm text-gray-600 text-center mb-6">Created by Mike Keleshter to help analyze tokens and calculate costs for OpenAI and Anthropic models</h2>
      <p className="text-sm text-gray-600 text-center mb-6">Supports both embedding models and chat/LLM models with up-to-date pricing (May 2025)</p>
      
      <div className="flex mb-4 border-b">
        <button 
          className={`px-4 py-2 ${activeTab === 'calculator' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-2`}
          onClick={() => setActiveTab('calculator')}
        >
          Cost Calculator
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'tokenizer' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg`}
          onClick={() => setActiveTab('tokenizer')}
        >
          Tokenizer
        </button>
      </div>
      
      {activeTab === 'calculator' && (
        <div className="mb-4">
          <div className="flex mb-4">
            <button 
              className={`px-4 py-2 ${modelType === 'embedding' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-l-lg`}
              onClick={() => handleModelTypeChange('embedding')}
            >
              Embedding Models
            </button>
            <button 
              className={`px-4 py-2 ${modelType === 'chat' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-r-lg`}
              onClick={() => handleModelTypeChange('chat')}
            >
              Chat Models
            </button>
          </div>
          
          <div className="flex mb-4">
            <button 
              className={`px-4 py-2 ${scenarioType === 'property' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-l-lg`}
              onClick={() => handleScenarioTypeChange('property')}
            >
              Property Data
            </button>
            <button 
              className={`px-4 py-2 ${scenarioType === 'query' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-r-lg`}
              onClick={() => handleScenarioTypeChange('query')}
            >
              Search Queries
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'tokenizer' ? (
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              What would you like to analyze?
            </label>
            <div className="flex mb-4">
              <button 
                className={`px-4 py-2 ${scenarioType === 'property' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-l-lg`}
                onClick={() => handleScenarioTypeChange('property')}
              >
                Property Data
              </button>
              <button 
                className={`px-4 py-2 ${scenarioType === 'query' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-r-lg`}
                onClick={() => handleScenarioTypeChange('query')}
              >
                Search Query
              </button>
            </div>
          </div>
        
          <div className="mb-2">
            <label className="block text-gray-700 font-medium mb-2">
              {scenarioType === 'property' 
                ? 'Paste your property data to count tokens:' 
                : 'Paste your search query to count tokens:'}
            </label>
            <textarea
              value={sampleText}
              onChange={handleTextChange}
              className="w-full p-3 border rounded h-64 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={scenarioType === 'property' 
                ? "Paste your property JSON or text here to count tokens..." 
                : "Paste your search query here to count tokens..."}
            />
          </div>
          
          <div className="flex mb-4">
            <button 
              onClick={clearText}
              className="px-4 py-2 bg-gray-200 rounded mr-2"
            >
              Clear
            </button>
            <button 
              onClick={showExample}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Show example
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold">{sampleTokens}</div>
              <div className="text-gray-600">Tokens</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold">{sampleChars}</div>
              <div className="text-gray-600">Characters</div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mt-4">
            <p><strong>Note:</strong> This is an approximate token count estimation. Actual tokenization varies by model.</p>
            <p>For precise counts, use OpenAI's official tokenizer: <a href="https://platform.openai.com/tokenizer" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">https://platform.openai.com/tokenizer</a></p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              {scenarioType === 'property' 
                ? 'Tokens per Property:' 
                : 'Tokens per Query:'}
            </label>
            <input
              type="number"
              min="1"
              value={tokenCount}
              onChange={(e) => setTokenCount(parseInt(e.target.value) || 1)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Use the Tokenizer tab to get an exact count</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              {scenarioType === 'property' 
                ? 'Number of Properties:' 
                : 'Number of Queries:'}
            </label>
            <input
              type="number"
              min="1"
              value={queryCount}
              onChange={(e) => setQueryCount(parseInt(e.target.value) || 1)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              {modelType === 'embedding' ? 'Embedding Model:' : 'Chat Model:'}
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {modelType === 'embedding' ? (
                <>
                  <option value="text-embedding-3-small">text-embedding-3-small ($0.02 per 1M tokens)</option>
                  <option value="text-embedding-3-large">text-embedding-3-large ($0.13 per 1M tokens)</option>
                  <option value="text-embedding-ada-002">text-embedding-ada-002 ($0.10 per 1M tokens)</option>
                </>
              ) : (
                <>
                  <option value="gpt-4-1106">GPT-4-1106 ($10.00 input, $30.00 output per 1M tokens)</option>
                  <option value="gpt-4o">GPT-4o ($5.00 input, $15.00 output per 1M tokens)</option>
                  <option value="gpt-4o-mini">GPT-4o-mini ($0.15 input, $0.60 output per 1M tokens)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5-turbo ($0.50 input, $1.50 output per 1M tokens)</option>
                  <option value="o1-mini">o1-mini ($1.10 input, $4.40 output per 1M tokens)</option>
                  <option value="o1">o1 ($15.00 input, $60.00 output per 1M tokens)</option>
                  <option value="claude-3.5-sonnet">Claude 3.5 Sonnet ($3.00 input, $15.00 output per 1M tokens)</option>
                </>
              )}
            </select>
          </div>
          
          {modelType === 'chat' && (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Input/Output Ratio: {inputRatio}% input / {100-inputRatio}% output
              </label>
              <input
                type="range"
                min="5"
                max="95"
                value={inputRatio}
                onChange={(e) => setInputRatio(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5% input / 95% output</span>
                <span>50/50</span>
                <span>95% input / 5% output</span>
              </div>
            </div>
          )}
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="mb-2">
              <span className="font-semibold">
                {scenarioType === 'property' 
                  ? 'Tokens per Property:' 
                  : 'Tokens per Query:'}
              </span> {tokenCount}
            </div>
            <div className="mb-2">
              <span className="font-semibold">
                {scenarioType === 'property' 
                  ? 'Number of Properties:' 
                  : 'Number of Queries:'}
              </span> {queryCount.toLocaleString()}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Total Tokens:</span> {totalTokens.toLocaleString()}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Million Tokens:</span> {(totalTokens / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})}
            </div>
            
            {modelType === 'chat' && (
              <>
                <div className="mb-2">
                  <span className="font-semibold">Estimated Input Tokens ({inputRatio}%):</span> {(totalTokens * inputRatio / 100).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Estimated Output Tokens ({100-inputRatio}%):</span> {(totalTokens * (100-inputRatio) / 100).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Input Cost:</span> ${((totalTokens * inputRatio / 100 / 1000000) * chatModelPricing[selectedModel][0]).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Output Cost:</span> ${((totalTokens * (100-inputRatio) / 100 / 1000000) * chatModelPricing[selectedModel][1]).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </>
            )}
            
            <div className="font-bold text-lg">
              <span className="font-semibold">Estimated Total Cost:</span> ${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </div>
        </>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Notes:</p>
        <ul className="list-disc ml-5 mt-2">
          {modelType === 'embedding' ? (
            <>
              {scenarioType === 'property' ? (
                <>
                  <li>This calculation estimates the cost of embedding your entire property database</li>
                  <li>Property embeddings are created once and stored in a vector database</li>
                  <li>Once embedded, you can perform semantic searches on your properties</li>
                </>
              ) : (
                <>
                  <li>This calculation estimates the cost of embedding user search queries</li>
                  <li>Each user query needs to be embedded to search against your property embeddings</li>
                  <li>Query embeddings are typically much smaller than property embeddings</li>
                </>
              )}
              <li>Use the tokenizer to get a more accurate token count for your data</li>
              <li>Consider embedding only essential fields to reduce costs</li>
              <li>For large datasets, consider batching or chunking your embedding requests</li>
            </>
          ) : (
            <>
              {scenarioType === 'property' ? (
                <>
                  <li>This calculation estimates the cost of processing property data through a chat model</li>
                  <li>Chat models can be used to enhance property descriptions or extract structured data</li>
                </>
              ) : (
                <>
                  <li>This calculation estimates the cost of processing user search queries through a chat model</li>
                  <li>Chat models can interpret complex natural language queries and convert them to structured searches</li>
                </>
              )}
              <li>Adjust the input/output ratio slider to match your expected usage pattern</li>
              <li>Chat models typically use more tokens for output than input, but this varies by use case</li>
              <li>GPT-4o-mini and GPT-3.5-turbo offer the best price/performance ratio for most applications</li>
              <li>Models like o1 and GPT-4 are more expensive but excel at complex reasoning tasks</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default EmbeddingCostCalculator;