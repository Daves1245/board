"use client";

import React from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Suggestion {
  id: number;
  upvotes: number;
  downvotes: number;
  content: string;
  title: string;
}

const UpArrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 3L12 7H4L8 3Z" fill="currentColor"/>
  </svg>
);

const DownArrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 13L4 9H12L8 13Z" fill="currentColor"/>
  </svg>
);

export default function Board() {
  const { suggestions, isConnected, vote } = useWebSocket('ws://localhost:8080');


  return (
    <div>
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} style={{
          display: 'flex',
          border: '1px solid #ccc',
          margin: '8px 0',
          padding: '16px',
          borderRadius: '4px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginRight: '16px',
            minWidth: '60px'
          }}>
            <button 
              onClick={() => vote(suggestion.id, 'up')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#666'
              }}
            >
              <UpArrow />
            </button>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              margin: '4px 0' 
            }}>
              {suggestion.upvotes - suggestion.downvotes}
            </div>
            <button 
              onClick={() => vote(suggestion.id, 'down')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#666'
              }}
            >
              <DownArrow />
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
              {suggestion.title}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>
              {suggestion.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
