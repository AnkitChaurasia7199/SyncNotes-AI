const axios = require('axios');

// AI service configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'mock';
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';

/**
 * Generate summary and key points from note content
 */
exports.generateSummary = async (content) => {
  try {
    // Trim content to avoid token limits
    const trimmedContent = content.slice(0, 2000);
    
    let result;
    
    switch (AI_PROVIDER) {
      case 'openai':
        result = await callOpenAI(trimmedContent);
        break;
      case 'huggingface':
        result = await callHuggingFace(trimmedContent);
        break;
      case 'mock':
      default:
        result = await mockAI(trimmedContent);
        break;
    }
    
    return result;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    return {
      summary: 'AI generation failed. Please try again later.',
      keyPoints: []
    };
  }
};

/**
 * Mock AI for development/testing
 */
async function mockAI(content) {
  console.log('Using mock AI for content length:', content.length);
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple summary - first 100 chars
  const summary = content.length > 100 
    ? content.substring(0, 100) + '...' 
    : content;
  
  // Generate simple key points
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keyPoints = sentences.slice(0, 3).map(s => s.trim());
  
  return {
    summary: summary,
    keyPoints: keyPoints.length ? keyPoints : ['No key points generated']
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(content) {
  if (!AI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Summarize the given text and provide key points in JSON format.'
          },
          {
            role: 'user',
            content: `Summarize this and provide key points: ${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    const aiResponse = response.data.choices[0].message.content;
    
    // Try to parse as JSON, if not, create simple response
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        summary: parsed.summary || aiResponse.substring(0, 200),
        keyPoints: parsed.keyPoints || []
      };
    } catch {
      return {
        summary: aiResponse.substring(0, 200),
        keyPoints: []
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    throw error;
  }
}

/**
 * Call Hugging Face API
 */
async function callHuggingFace(content) {
  if (!AI_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }
  
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        inputs: content,
        parameters: {
          max_length: 150,
          min_length: 30
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    let summary = '';
    if (Array.isArray(response.data) && response.data[0]?.summary_text) {
      summary = response.data[0].summary_text;
    } else if (response.data[0]?.generated_text) {
      summary = response.data[0].generated_text;
    } else {
      summary = content.substring(0, 150) + '...';
    }
    
    return {
      summary: summary,
      keyPoints: extractKeyPoints(content)
    };
  } catch (error) {
    console.error('HuggingFace API error:', error.message);
    throw error;
  }
}

/**
 * Simple key point extraction
 */
function extractKeyPoints(content, count = 3) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, count).map(s => s.trim());
}