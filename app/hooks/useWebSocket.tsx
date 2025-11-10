import { useState, useEffect, useCallback } from 'react';

interface Suggestion {
  id: number;
  upvotes: number;
  downvotes: number;
  content: string;
  title: string;
}

interface ImplementedFeature {
  id: number;
  title: string;
  content: string;
  finalVotes: number;
  implementedAt: string;
  status?: 'implementing' | 'completed' | 'failed';
}

export function useWebSocket(url: string) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [implementedFeatures, setImplementedFeatures] = useState<ImplementedFeature[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket(url);
      
      websocket.onopen = () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
        setWs(websocket);
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'suggestions':
              setSuggestions(message.data);
              break;
              
            case 'implemented_features':
              setImplementedFeatures(message.data);
              break;
              
            case 'vote_update':
              setSuggestions(prev => 
                prev.map(suggestion => 
                  suggestion.id === message.data.id 
                    ? { 
                        ...suggestion, 
                        upvotes: message.data.upvotes,
                        downvotes: message.data.downvotes
                      }
                    : suggestion
                )
              );
              break;
              
            case 'suggestion_added':
              setSuggestions(prev => [...prev, message.data]);
              break;
              
            case 'suggestion_implemented':
              // Remove from suggestions and add to implemented features
              setSuggestions(prev => prev.filter(s => s.id !== message.data.removedId));
              setImplementedFeatures(prev => [...prev, message.data.implementedFeature]);
              break;
              
            case 'implementation_started':
              // Update status to show implementation is starting
              setImplementedFeatures(prev => 
                prev.map(feature => 
                  feature.id === message.data.id 
                    ? { ...feature, status: 'implementing' }
                    : feature
                )
              );
              break;
              
            case 'implementation_completed':
              // Update status based on success/failure
              setImplementedFeatures(prev => 
                prev.map(feature => 
                  feature.id === message.data.id 
                    ? { 
                        ...feature, 
                        status: message.data.success ? 'completed' : 'failed'
                      }
                    : feature
                )
              );
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
        setWs(null);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [url]);

  const sendMessage = useCallback((message: object) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, [ws, isConnected]);

  const addSuggestion = useCallback((title: string, content: string) => {
    console.log('Adding suggestion:', title, content);
    const success = sendMessage({
      type: 'new_suggestion',
      title: title,
      content: content
    });
    if (!success) {
      console.log('WebSocket not ready');
    }
  }, [sendMessage]);

  const vote = useCallback((id: number, type: 'up' | 'down') => {
    sendMessage({
      type: 'vote',
      id: id,
      voteType: type
    });
  }, [sendMessage]);

  return {
    suggestions,
    implementedFeatures,
    isConnected,
    addSuggestion,
    vote
  };
}