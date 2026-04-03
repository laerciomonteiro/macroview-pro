/**
 * Debug endpoint to test Currents API
 */
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const apiKey = process.env.CURRENTS_API_KEY || ''
  
  if (!apiKey) {
    return { error: 'No API key found', apiKey: 'empty' }
  }
  
  try {
    // Test simple API call
    const response = await $fetch('https://api.currentsapi.services/v1/search', {
      method: 'GET',
      headers: {
        'Authorization': apiKey
      },
      query: {
        keywords: 'Brazil stocks',
        language: 'en',
        size: 5
      }
    })
    
    return { 
      success: true, 
      apiKeyPresent: !!apiKey,
      response 
    }
  } catch (error: any) {
    return { 
      error: error.message || error,
      stack: error.stack
    }
  }
})