const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const { parse } = require('url');

let suggestions = [];
let implementedFeatures = [];
let nextId = 1;

const VOTE_THRESHOLD = 5;

async function implementFeature(suggestion) {
  console.log(`🤖 Starting implementation of: "${suggestion.title}"`);
  
  // Notify clients that implementation is starting
  broadcast({
    type: 'implementation_started',
    data: {
      id: suggestion.id,
      title: suggestion.title
    }
  });

  try {
    // Call the Next.js API endpoint to trigger agent implementation
    const response = await fetch('http://localhost:3000/api/implement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: suggestion.id,
        title: suggestion.title,
        content: suggestion.content
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ GitHub Action triggered for: "${suggestion.title}"`);
      console.log(`📋 Status: ${result.status}`);
      
      // GitHub Action will handle the implementation and call back via webhook
      // No immediate completion broadcast - will be handled by webhook
      
    } else {
      throw new Error(result.error || 'GitHub Action trigger failed');
    }

  } catch (error) {
    console.error(`💥 Error implementing "${suggestion.title}":`, error);
    broadcast({
      type: 'implementation_completed',
      data: {
        id: suggestion.id,
        title: suggestion.title,
        success: false,
        error: error.message
      }
    });
  }
}

// Create HTTP server for webhooks
const httpServer = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  
  if (req.method === 'POST' && parsedUrl.pathname === '/webhook/implementation-complete') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        handleImplementationComplete(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (error) {
        console.error('Webhook error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocketServer({ server: httpServer });
const clients = new Set();

function handleImplementationComplete(data) {
  console.log(`🔔 Implementation completed for feature ${data.feature_id}: ${data.success ? 'success' : 'failure'}`);
  
  // Find the feature in implemented list and update status
  const featureIndex = implementedFeatures.findIndex(f => f.id == data.feature_id);
  if (featureIndex !== -1) {
    implementedFeatures[featureIndex].status = data.success ? 'completed' : 'failed';
    if (data.pr_url) {
      implementedFeatures[featureIndex].pr_url = data.pr_url;
    }
    
    // Notify all clients
    broadcast({
      type: 'implementation_completed',
      data: {
        id: data.feature_id,
        success: data.success,
        pr_url: data.pr_url
      }
    });
  }
}

httpServer.listen(8080, () => {
  console.log('WebSocket server with webhook support started on port 8080');
});

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);

  // Send current suggestions and implemented features to new client
  ws.send(JSON.stringify({
    type: 'suggestions',
    data: suggestions
  }));
  
  ws.send(JSON.stringify({
    type: 'implemented_features',
    data: implementedFeatures
  }));

  ws.on('message', (message) => {
    console.log('Received message:', message.toString());
    try {
      const data = JSON.parse(message.toString());
      console.log('Parsed data:', data);
      
      switch (data.type) {
        case 'vote':
          const suggestionIndex = suggestions.findIndex(s => s.id === data.id);
          if (suggestionIndex !== -1) {
            if (data.voteType === 'up') {
              suggestions[suggestionIndex].upvotes++;
            } else if (data.voteType === 'down') {
              suggestions[suggestionIndex].downvotes++;
            }
            
            const suggestion = suggestions[suggestionIndex];
            const netVotes = suggestion.upvotes - suggestion.downvotes;
            
            // Check if suggestion reached threshold
            if (netVotes >= VOTE_THRESHOLD) {
              console.log(`Suggestion "${suggestion.title}" reached threshold with ${netVotes} net votes`);
              
              // Remove from suggestions immediately
              const suggestionToImplement = { ...suggestion };
              suggestions.splice(suggestionIndex, 1);
              
              // Move to implemented features
              const implementedFeature = {
                id: suggestion.id,
                title: suggestion.title,
                content: suggestion.content,
                finalVotes: netVotes,
                implementedAt: new Date().toISOString(),
                status: 'implementing'
              };
              
              implementedFeatures.push(implementedFeature);
              
              // Notify all clients
              broadcast({
                type: 'suggestion_implemented',
                data: {
                  removedId: suggestion.id,
                  implementedFeature: implementedFeature
                }
              });
              
              // Trigger actual implementation
              implementFeature(suggestionToImplement);
            } else {
              // Normal vote update
              broadcast({
                type: 'vote_update',
                data: {
                  id: data.id,
                  upvotes: suggestion.upvotes,
                  downvotes: suggestion.downvotes
                }
              });
            }
          }
          break;
          
        case 'new_suggestion':
          console.log('Creating new suggestion with title:', data.title, 'content:', data.content);
          const newSuggestion = {
            id: nextId++,
            upvotes: 0,
            downvotes: 0,
            title: data.title,
            content: data.content
          };
          suggestions.push(newSuggestion);
          console.log('New suggestion added:', newSuggestion);
          console.log('Total suggestions now:', suggestions.length);
          
          broadcast({
            type: 'suggestion_added',
            data: newSuggestion
          });
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

function broadcast(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(messageStr);
      } catch (error) {
        console.error('Error sending message to client:', error);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  });
}