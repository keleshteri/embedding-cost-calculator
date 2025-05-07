import React, { useState } from 'react';
import EmbeddingCostCalculator from './components/EmbeddingCostCalculator';
import ChatSimulation from './components/ChatSimulation';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tokenizer' | 'embedding' | 'chat'>('tokenizer');

  return (
    <div className="App py-8">
      <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">AI Model Cost Calculator</h1>
        <h2 className="text-sm text-gray-600 text-center mb-6">Created by Mike Keleshter to help analyze tokens and calculate costs for OpenAI and Anthropic models</h2>
        <p className="text-sm text-gray-600 text-center mb-6">Supports both embedding models and chat/LLM models with up-to-date pricing (May 2025)</p>
        
        <div className="flex mb-6 border-b">
          <button 
            className={`px-4 py-2 ${activeTab === 'tokenizer' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-2`}
            onClick={() => setActiveTab('tokenizer')}
          >
            Tokenizer
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'embedding' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-2`}
            onClick={() => setActiveTab('embedding')}
          >
            Embedding Cost Calculator
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'chat' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg`}
            onClick={() => setActiveTab('chat')}
          >
            Chat Cost Calculator
          </button>
        </div>
        
        {activeTab === 'tokenizer' ? (
          <TokenizerComponent />
        ) : activeTab === 'embedding' ? (
          <EmbeddingCostCalculator />
        ) : (
          <ChatSimulation />
        )}
      </div>
    </div>
  );
}

// Simple Tokenizer component
const TokenizerComponent: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [tokens, setTokens] = useState<number>(0);
  const [chars, setChars] = useState<number>(0);
  const [exampleType, setExampleType] = useState<'property' | 'query'>('property');

  // Simple tokenizer function
  const estimateTokens = (input: string): number => {
    if (!input) return 0;
    const charCount = input.length;
    return Math.ceil(charCount / 4); // Very approximate estimation
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    setChars(newText.length);
    setTokens(estimateTokens(newText));
  };

  const clearText = () => {
    setText('');
    setChars(0);
    setTokens(0);
  };

  // Property examples
  const propertyExamples = [
    {
      name: "Basic Apartment",
      text: `Basic Property Information:
Property type: "Apartment"
Bedrooms: 2
Bathrooms: 1
Parking: 1 (carports: 1, garages: 0)
Address: "11/39 Wellington St Kilda VIC 3182 AU"
Location coordinates: latitude: -37.856525, longitude: 144.985485
Rental price: $400 per week
For rent: true
Features: built-in robes, underground car space, storage cage, heating panels, evaporative cooling, lift access, enclosed terrace`
    },
    {
      name: "Luxury House",
      text: `Property Information:
Property type: "House"
Bedrooms: 5
Bathrooms: 3.5
Parking: 3 (garages: 2, carports: 1)
Address: "27 Ocean View Drive, Brighton VIC 3186 AU"
Location coordinates: latitude: -37.916739, longitude: 144.997693
Sale price: $2,850,000
For sale: true
Land size: 850 sqm
Building size: 380 sqm
Year built: 2019
Features: ocean views, home theater, heated swimming pool, solar panels, smart home system, chef's kitchen with butler's pantry, wine cellar, landscaped gardens, outdoor entertainment area with BBQ kitchen`
    },
    {
      name: "Commercial Property",
      text: `Commercial Property Details:
Property type: "Office Building"
Total area: 1,200 sqm
Floor levels: 3
Parking spaces: 15 (underground)
Address: "415 Collins Street, Melbourne VIC 3000 AU"
Location: CBD
Rental price: $75,000 per month (plus GST)
For lease: true
Lease terms: 3+3+3 years
Outgoings: Tenant responsible for all outgoings
Features: modern fit-out, meeting rooms, reception area, kitchen facilities, fiber internet, secure access, elevator, end-of-trip facilities, NABERS energy rating 5.5 stars, close to public transport`
    }
  ];

  // Query examples
  const queryExamples = [
    {
      name: "Basic Apartment Search",
      text: `Show me 2-bedroom apartments near the beach with a pool under $500 per week in St Kilda area`
    },
    {
      name: "Family Home Search",
      text: `I need a 4-bedroom house in good school zones with a backyard, minimum 2 bathrooms, and a double garage. Must be within 10km of Melbourne CBD and have good public transport access. Budget up to $1.2M.`
    },
    {
      name: "Investment Property",
      text: `Looking for high-yield investment properties in growth suburbs with good rental demand. Must have positive cash flow potential, low maintenance, and be within 5-7% gross rental yield range. Prefer established units or townhouses under $600k with low body corporate fees.`
    },
    {
      name: "Commercial Office Search",
      text: `Need office space for tech startup, 10-15 employees, preferably in Richmond or South Yarra. Looking for modern open plan layout with meeting rooms, kitchenette, and NBN connection. Flexible lease terms preferred, budget $5,000-$7,000 per month including outgoings.`
    }
  ];

  const showExample = (index: number) => {
    const examples = exampleType === 'property' ? propertyExamples : queryExamples;
    const example = examples[index].text;
    setText(example);
    setChars(example.length);
    setTokens(estimateTokens(example));
  };

  return (
    <div className="mb-6">
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Example Type:
        </label>
        <select
          value={exampleType}
          onChange={(e) => setExampleType(e.target.value as 'property' | 'query')}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="property">Property Data (database content)</option>
          <option value="query">Search Queries (user input)</option>
        </select>
        <p className="text-sm text-gray-500 mt-1">
          {exampleType === 'property' 
            ? 'Analyze property data to count tokens before embedding in vector database' 
            : 'Analyze search queries to count tokens for embedding and matching'}
        </p>
      </div>
      
      <div className="mb-2">
        <label className="block text-gray-700 font-medium mb-2">
          {exampleType === 'property' 
            ? 'Paste your property data to count tokens:' 
            : 'Paste your search query to count tokens:'}
        </label>
        <textarea
          value={text}
          onChange={handleTextChange}
          className="w-full p-3 border rounded h-64 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={exampleType === 'property' 
            ? "Paste your property JSON or text here to count tokens..." 
            : "Paste your search query here to count tokens..."}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Example Templates:
        </label>
        <div className="flex flex-wrap gap-2">
          {exampleType === 'property' ? (
            propertyExamples.map((example, index) => (
              <button 
                key={index}
                onClick={() => showExample(index)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Example {index + 1}
              </button>
            ))
          ) : (
            queryExamples.map((example, index) => (
              <button 
                key={index}
                onClick={() => showExample(index)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Example {index + 1}
              </button>
            ))
          )}
          <button 
            onClick={clearText}
            className="px-3 py-2 bg-red-100 hover:bg-red-200 rounded text-sm"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold">{tokens}</div>
          <div className="text-gray-600">Tokens</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold">{chars}</div>
          <div className="text-gray-600">Characters</div>
        </div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg mb-4">
        <div className="font-medium text-yellow-800">Token Cost Estimate</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div>
            <div className="text-sm font-medium">text-embedding-3-small</div>
            <div className="text-sm">${((tokens / 1000000) * 0.02).toFixed(6)}</div>
          </div>
          <div>
            <div className="text-sm font-medium">text-embedding-3-large</div>
            <div className="text-sm">${((tokens / 1000000) * 0.13).toFixed(6)}</div>
          </div>
          <div>
            <div className="text-sm font-medium">text-embedding-ada-002</div>
            <div className="text-sm">${((tokens / 1000000) * 0.10).toFixed(6)}</div>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mt-4">
        <p><strong>Note:</strong> This is an approximate token count estimation. Actual tokenization varies by model.</p>
        <p>For precise counts, use OpenAI's official tokenizer: <a href="https://platform.openai.com/tokenizer" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">https://platform.openai.com/tokenizer</a></p>
      </div>
    </div>
  );
};

export default App;