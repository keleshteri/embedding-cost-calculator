import React, { useState, useEffect, useMemo } from 'react';

// Types
type ScenarioType = 'property' | 'query';
type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002';

const EmbeddingCostCalculator: React.FC = () => {
  // State variables
  const [tokenCount, setTokenCount] = useState<number>(180);
  const [queryCount, setQueryCount] = useState<number>(4000);
  const [selectedModel, setSelectedModel] = useState<EmbeddingModel>('text-embedding-3-small');
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [scenarioType, setScenarioType] = useState<ScenarioType>('property'); // 'property' or 'query'
  
  // Embedding model pricing data (per 1M tokens)
  const embeddingModelPricing = useMemo(() => ({
    'text-embedding-3-small': 0.02,
    'text-embedding-3-large': 0.13,
    'text-embedding-ada-002': 0.10
  }), []);
  
  // Handle scenario type change
  const handleScenarioTypeChange = (type: ScenarioType): void => {
    setScenarioType(type);
  };
  
  // Update calculations when inputs change
  useEffect(() => {
    let totalTokensCalc: number;
    
    if (scenarioType === 'property') {
      // For property embedding, multiply token count by number of properties
      totalTokensCalc = tokenCount * queryCount;
    } else {
      // For query scenarios, we're just calculating the cost of queries
      totalTokensCalc = tokenCount * queryCount;
    }
    
    const millionTokens = totalTokensCalc / 1000000;
    
    // Calculate cost for embedding models
    const costPerModel = embeddingModelPricing[selectedModel];
    const calculatedCost = millionTokens * costPerModel;
    
    setTotalTokens(totalTokensCalc);
    setTotalCost(calculatedCost);
  }, [tokenCount, queryCount, selectedModel, scenarioType, embeddingModelPricing]);
  
  return (
    <div>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Data Type for Embedding:
        </label>
        <select
          value={scenarioType}
          onChange={(e) => handleScenarioTypeChange(e.target.value as ScenarioType)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="property">Property Data (embedding database content)</option>
          <option value="query">Search Queries (embedding user queries)</option>
        </select>
        <p className="text-sm text-gray-500 mt-1">
          {scenarioType === 'property' 
            ? 'Calculate costs for embedding your property database' 
            : 'Calculate costs for embedding user search queries'}
        </p>
      </div>
      
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
        <p className="text-sm text-gray-500 mt-1">Use the Tokenizer tab to analyze your text and get a token count</p>
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
          Embedding Model:
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as EmbeddingModel)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="text-embedding-3-small">text-embedding-3-small ($0.02 per 1M tokens)</option>
          <option value="text-embedding-3-large">text-embedding-3-large ($0.13 per 1M tokens)</option>
          <option value="text-embedding-ada-002">text-embedding-ada-002 ($0.10 per 1M tokens)</option>
        </select>
      </div>
      
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
        
        <div className="font-bold text-lg">
          <span className="font-semibold">Estimated Total Cost:</span> ${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Notes:</p>
        <ul className="list-disc ml-5 mt-2">
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
        </ul>
      </div>
    </div>
  );
};

export default EmbeddingCostCalculator;