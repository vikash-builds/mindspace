const axios = require('axios');
const config = require('../config');

class RagBridge {
  constructor() {
    this.client = axios.create({
      baseURL: config.PYTHON_RAG_URL,
      timeout: 60000 // Ingest can take a while
    });
  }

  async ingest(userId, filePath, docId, fileType, params = {}) {
    try {
      const response = await this.client.post('/ingest', {
        userId,
        filePath,
        docId,
        fileType,
        ...params
      });
      return response.data;
    } catch (error) {
      console.error('RAG Ingest error:', error.response?.data || error.message);
      throw error;
    }
  }

  async query(userId, question, chatHistory = [], params = {}) {
    try {
      const response = await this.client.post('/query', {
        userId,
        question,
        chatHistory,
        ...params
      });
      return response.data;
    } catch (error) {
      console.error('RAG Query error:', error.response?.data || error.message);
      throw error;
    }
  }

  async deleteDocument(userId, docId) {
    try {
      const response = await this.client.delete(`/documents/${docId}`, {
        data: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('RAG Delete error:', error.response?.data || error.message);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'offline', error: error.message };
    }
  }
}

module.exports = new RagBridge();
