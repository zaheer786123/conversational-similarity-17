
import { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit } from "firebase/firestore";
import { useCollectionData } from "react-firebase-hooks/firestore";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Trash } from "lucide-react";

export const Chat = () => {
  const [user] = useAuthState(auth);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messagesRef = collection(db, "messages");
  const q = query(messagesRef, orderBy("createdAt"), limit(50));
  const [messages] = useCollectionData(q);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    
    try {
      // Add user message to Firestore
      await addDoc(messagesRef, {
        text: input,
        createdAt: new Date(),
        uid: user?.uid,
        isAI: false
      });

      // Make API call to OpenRouter
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen-vl-plus:free",
          messages: [{ role: "user", content: input }]
        })
      });

      const data = await response.json();
      
      // Add AI response to Firestore
      await addDoc(messagesRef, {
        text: data.choices[0].message.content,
        createdAt: new Date(),
        uid: "ai",
        isAI: true
      });

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const clearChat = async () => {
    // Implement clear chat functionality
  };

  return (
    <div className="flex h-screen bg-chatbg">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar p-4">
        <Button
          onClick={clearChat}
          className="w-full mb-4 bg-red-600 hover:bg-red-700"
          variant="destructive"
        >
          <Trash className="w-4 h-4 mr-2" />
          Clear conversations
        </Button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages?.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.isAI ? "bg-chatbg" : "bg-input"} p-4`}
            >
              <div className="flex-1 max-w-4xl mx-auto">
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                  className="text-white prose prose-invert"
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message your AI assistant..."
              className="w-full bg-input text-white pr-24 resize-none"
              rows={1}
            />
            <div className="absolute right-2 bottom-2 flex space-x-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                <Mic className="w-5 h-5" />
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
