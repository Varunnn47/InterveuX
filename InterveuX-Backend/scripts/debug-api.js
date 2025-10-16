import axios from 'axios';

const API_BASE = 'http://localhost:5000';

async function testEndpoints() {
  console.log('🔍 Testing API endpoints...\n');

  const endpoints = [
    { method: 'GET', url: '/api/health', description: 'Health check' },
    { method: 'GET', url: '/api/debug/google', description: 'Google OAuth debug' },
    { method: 'POST', url: '/api/auth/login', description: 'Login endpoint', data: { email: 'test@test.com', password: 'test123' } },
    { method: 'POST', url: '/api/auth/register', description: 'Register endpoint', data: { name: 'Test User', email: 'test@test.com', password: 'test123' } }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.url} - ${endpoint.description}`);
      
      const config = {
        method: endpoint.method.toLowerCase(),
        url: `${API_BASE}${endpoint.url}`,
        timeout: 5000
      };

      if (endpoint.data) {
        config.data = endpoint.data;
      }

      const response = await axios(config);
      console.log(`✅ Status: ${response.status}`);
      console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || 'Network Error'}`);
      console.log(`📄 Error Response:`, error.response?.data || error.message);
    }
    console.log('---\n');
  }
}

testEndpoints().catch(console.error);