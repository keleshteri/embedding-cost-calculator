import React, { useState, useEffect, useCallback } from 'react';

// Simple GPT tokenizer implementation based on character count
// This is a very simplified approach as accurate tokenization requires a full tokenizer model
const estimateTokens = (text) => {
  if (!text) return 0;
  
  // Count characters
  const charCount = text.length;
  
  // Count words (rough estimate)
  const wordCount = text.split(/\\s+/).filter(Boolean).length;
  
  // GPT models average around 4 characters per token (very approximate)
  // But we add a bit of complexity by considering both characters and words
  // This is still just an estimate - a true tokenizer would be more accurate
  const tokenEstimate = Math.ceil(charCount / 4);
  
  return tokenEstimate;
};

const EmbeddingCostCalculator = () => {
  // State variables
  const [tokenCount, setTokenCount] = useState(180);
  const [propertyCount, setPropertyCount] = useState(1600000);
  const [selectedModel, setSelectedModel] = useState('text-embedding-3-small');
  const [sampleText, setSampleText] = useState('');
  const [sampleTokens, setSampleTokens] = useState(0);
  const [sampleChars, setSampleChars] = useState(0);
  const [activeTab, setActiveTab] = useState('calculator');
  
  // Model pricing data
  const modelPricing = {
    'text-embedding-3-small': 0.02,
    'text-embedding-3-large': 0.13,
    'text-embedding-ada-002': 0.10
  };
  
  // Calculated values
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  
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

  // Handle text input change
  const handleTextChange = (e) => {
    const text = e.target.value;
    setSampleText(text);
    countTokens(text);
  };

  // Example property data
  const showExample = () => {
    const example = `Basic Property Information:
Property type: "Apartment"
Bedrooms: 2
Bathrooms: 1
Parking: 1 (carports: 1, garages: 0)
Address: "11/39 Wellington St Kilda VIC 3182 AU"
Location coordinates: latitude: -37.856525, longitude: 144.985485
Rental price: $400 per week
For rent: true
Features: built-in robes, underground car space, storage cage, heating panels, evaporative cooling, lift access, enclosed terrace`;
    
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
    const tokensPerProperty = tokenCount; // Using token count directly
    const totalTokensCalc = propertyCount * tokensPerProperty;
    const millionTokens = totalTokensCalc / 1000000;
    const costPerModel = modelPricing[selectedModel];
    const calculatedCost = millionTokens * costPerModel;
    
    setTotalTokens(totalTokensCalc);
    setTotalCost(calculatedCost);
  }, [tokenCount, propertyCount, selectedModel]);
  
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-2">Embedding Cost Calculator</h1>
      <h2 className="text-sm text-gray-600 text-center mb-6">Created by Mike Keleshter to help analyze tokens and model costs for embedding projects</h2>
      
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
      
      {activeTab === 'tokenizer' ? (
        <div className="mb-6">
          <div className="mb-2">
            <label className="block text-gray-700 font-medium mb-2">
              Paste your property data to count tokens:
            </label>
            <textarea
              value={sampleText}
              onChange={handleTextChange}
              className="w-full p-3 border rounded h-64 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your property JSON or text here to count tokens..."
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
              Tokens per Property:
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
              Number of Properties:
            </label>
            <input
              type="number"
              min="1"
              value={propertyCount}
              onChange={(e) => setPropertyCount(parseInt(e.target.value) || 1)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Embedding Model:
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text-embedding-3-small">text-embedding-3-small ($0.02 per 1M tokens)</option>
              <option value="text-embedding-3-large">text-embedding-3-large ($0.13 per 1M tokens)</option>
              <option value="text-embedding-ada-002">text-embedding-ada-002 ($0.10 per 1M tokens)</option>
            </select>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="mb-2">
              <span className="font-semibold">Tokens per Property:</span> {tokenCount}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Total Tokens:</span> {totalTokens.toLocaleString()}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Million Tokens:</span> {(totalTokens / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})}
            </div>
            <div className="font-bold text-lg">
              <span className="font-semibold">Estimated Cost:</span> ${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </div>
        </>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Notes:</p>
        <ul className="list-disc ml-5 mt-2">
          <li>This calculator helps estimate embedding costs for property data</li>
          <li>Use the tokenizer to get a more accurate token count for your data</li>
          <li>Consider embedding only essential fields to reduce costs</li>
          <li>For large datasets, consider batching or chunking your requests</li>
        </ul>
      </div>
    </div>
  );
};

export default EmbeddingCostCalculator;