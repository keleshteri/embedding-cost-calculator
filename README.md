# AI Model Cost Calculator

A tool to analyze token counts and estimate costs for OpenAI and Anthropic models

## Overview

This application helps you estimate the costs of using various AI models for large datasets, particularly focused on property data. It includes:

- A tokenizer to estimate token counts from your actual data
- A cost calculator for different embedding and chat models
- Support for planning large-scale AI projects

## Features

- **Token Analyzer**: Paste your data to see approximate token counts
- **Cost Estimator**: Calculate costs across different models and pricing structures
- **Model Comparison**: Compare both embedding models and chat models
- **Input/Output Ratio Adjustment**: Customize the ratio for chat model calculations
- **Interactive Interface**: Easy-to-use tabs and controls
- **Example Data**: Sample property data for testing

## Models Supported

### Embedding Models
- text-embedding-3-small ($0.02 per 1M tokens)
- text-embedding-3-large ($0.13 per 1M tokens)
- text-embedding-ada-002 ($0.10 per 1M tokens)

### Chat Models
- GPT-4-1106 ($10.00 input, $30.00 output per 1M tokens)
- GPT-4o ($5.00 input, $15.00 output per 1M tokens)
- GPT-4o-mini ($0.15 input, $0.60 output per 1M tokens)
- GPT-3.5-turbo ($0.50 input, $1.50 output per 1M tokens)
- o1-mini ($1.10 input, $4.40 output per 1M tokens)
- o1 ($15.00 input, $60.00 output per 1M tokens)
- Claude 3.5 Sonnet ($3.00 input, $15.00 output per 1M tokens)

## Usage

1. Use the Tokenizer tab to analyze your property data's token count
2. Switch to the Calculator tab to estimate costs based on your token count and data volume
3. Choose between embedding models or chat models
4. For chat models, adjust the input/output ratio to match your use case
5. Adjust parameters to optimize your AI model strategy

## Installation

```bash
# Clone the repository
git clone https://github.com/keleshteri/embedding-cost-calculator.git

# Navigate to project directory
cd embedding-cost-calculator

# Install dependencies
npm install

# Start the development server
npm start
```

## Deployment

The application can be deployed to platforms like Netlify, Vercel, or GitHub Pages.

For Netlify, the repository includes a netlify.toml configuration file that handles CI settings and deployment options.

## Created By

Mike Keleshter

## License

MIT