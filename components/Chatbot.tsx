import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponseStream } from '../services/geminiService';
import { ChatMessage } from '../types';
import { ChatBubbleBottomCenterTextIcon, XIcon, SparklesIcon } from './constants';

// A simple markdown renderer to format chatbot responses.
// Supports: #, ## for headings, * or - for lists, and **text** for bold.
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const parseInlineMarkdown = (line: string): string => {
        return line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushList = () => {
        if (currentList.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-1">
                    {currentList.map((item, index) => (
                        <li key={index} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item) }} />
                    ))}
                </ul>
            );
            currentList = [];
        }
    };

    lines.forEach((line, index) => {
        if (line.trim().startsWith('# ')) {
            flushList();
            elements.push(<h3 key={index} className="text-base font-semibold mt-3 mb-1" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line.substring(2)) }} />);
        } else if (line.trim().startsWith('## ')) {
            flushList();
            elements.push(<h4 key={index} className="font-semibold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line.substring(3)) }} />);
        } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            currentList.push(line.trim().substring(2));
        } else if (line.trim() === '') {
            flushList();
        } else {
            flushList();
            elements.push(<p key={index} className="my-0.5" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line) }} />);
        }
    });

    flushList();

    return <>{elements}</>;
};

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: "Hello! I'm your AI Co-Pilot. How can I help you use the AI Teacher Assistant today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen, messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        // Add a placeholder for the model's response
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        try {
            const stream = await getChatbotResponseStream(currentInput.trim());
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage && lastMessage.role === 'model') {
                            lastMessage.text += chunkText;
                        }
                        return newMessages;
                    });
                }
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.text = "Sorry, I'm having trouble connecting. Please try again later.";
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="chatbot-fab material-button material-button-primary !p-4 !rounded-full shadow-lg"
                aria-label="Toggle AI Assistant"
            >
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
            </button>

            <div className={`chatbot-window material-card ${!isOpen ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-outline)] flex-shrink-0">
                    <div className="flex items-center">
                        <SparklesIcon className="w-6 h-6 text-[var(--color-primary)] mr-2" />
                        <h3 className="font-semibold text-lg text-[var(--color-on-surface)]">AI Co-Pilot</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-[var(--color-surface-variant)]">
                        <XIcon className="w-5 h-5 text-[var(--color-on-surface-variant)]" />
                    </button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto custom-scrollbar-container">
                    <div className="flex flex-col gap-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`p-3 max-w-[85%] text-sm rounded-lg ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-model'}`}>
                                {msg.role === 'model' ? <MarkdownRenderer text={msg.text} /> : <p>{msg.text}</p>}
                            </div>
                        ))}
                        {isLoading && messages[messages.length - 1]?.role === 'model' && messages[messages.length - 1]?.text === '' &&(
                             <div className="p-3 max-w-[85%] text-sm rounded-lg chat-message-model">
                                <div className="flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-current rounded-full animate-pulse delay-0"></span>
                                    <span className="w-2 h-2 bg-current rounded-full animate-pulse delay-200"></span>
                                    <span className="w-2 h-2 bg-current rounded-full animate-pulse delay-400"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                
                <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--color-outline)] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about app features..."
                            className="flex-grow !py-2 !px-3 text-sm"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="material-button material-button-primary !py-2 !px-4 !rounded-lg !uppercase-off text-sm">
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Chatbot;