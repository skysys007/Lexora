import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askQuestion } from '../services/aiService';
import { announceToScreenReader } from '../utils/a11yHelpers';

const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('javascript:') || clean.startsWith('data:') || clean.startsWith('vbscript:')) {
    return '#';
  }
  return url;
};

export default function DocumentQA({ documentText, apiConfig, apiKey, a11yConfig = {} }) {
  const [conversation, setConversation] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentLang = a11yConfig.language || 'en';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const sendQuestion = async (question) => {
    if (!question || isLoading) return;

    const userMessage = { role: 'user', content: question };
    setConversation(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    announceToScreenReader("Sending question to AI...", "polite");

    try {
      const conversationHistory = conversation.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const activeConfig = apiConfig || apiKey;
      const answer = await askQuestion(documentText, conversationHistory, question, activeConfig, a11yConfig);
      const aiMessage = { role: 'assistant', content: answer };
      setConversation(prev => [...prev, aiMessage]);
      announceToScreenReader("AI answer received.", "assertive");
    } catch (error) {
      const errorMessage = { role: 'assistant', content: `Error: ${error.message}` };
      setConversation(prev => [...prev, errorMessage]);
      announceToScreenReader(`Error getting answer: ${error.message}`, "assertive");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = inputValue.trim();
    if (!question || isLoading) return;
    sendQuestion(question);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="qa-container" role="region" aria-label="Document Question and Answer Session">
      <div className="qa-header">
        <h2>Document Q&A</h2>
        <p>Ask questions about the uploaded legal document</p>
      </div>

      <div className="qa-messages" role="log" aria-live="polite" aria-label="Chat messages">
        {conversation.length === 0 && (
          <div className="qa-empty">
            <p>Start by asking a question about your document.</p>
            <div className="qa-suggestions" role="group" aria-label="Sample questions">
              <button type="button" onClick={() => setInputValue('What are the main obligations in this document?')}>
                What are the main obligations?
              </button>
              <button type="button" onClick={() => setInputValue('What is the termination clause?')}>
                What is the termination clause?
              </button>
              <button type="button" onClick={() => setInputValue('Are there any penalties mentioned?')}>
                Are there any penalties?
              </button>
            </div>
          </div>
        )}

        {conversation.map((msg, index) => (
          <div key={index} className={`qa-message ${msg.role}`}>
            <div className="qa-message-content">
              {msg.role === 'assistant' ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={sanitizeUrl}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="qa-message assistant loading" role="status" aria-label="AI is generating answer">
            <div className="qa-message-content">
              <div className="qa-typing" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="sr-only">AI is generating answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="qa-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the document..."
          disabled={isLoading}
          aria-label="Question text input"
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()} aria-label="Submit question">
          {isLoading ? 'Asking...' : 'Ask'}
        </button>
      </form>
    </div>
  );
}
