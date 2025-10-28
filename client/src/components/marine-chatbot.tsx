import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Loader2, Mic, MicOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function MarineChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your marine assistant. I can help you with ocean conditions, marine safety, fishing regulations, and more. You can type or use voice input. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        speechRecognitionRef.current = new SpeechRecognition();
        speechRecognitionRef.current.continuous = false;
        speechRecognitionRef.current.interimResults = false;
        speechRecognitionRef.current.lang = "en-US";

        speechRecognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;

          // ✅ Append transcript instead of overwriting
          setInputMessage((prev) => (prev ? prev + " " + transcript : transcript));

          setIsListening(false);
        };

        speechRecognitionRef.current.onend = () => {
          setIsListening(false);
        };

        speechRecognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          toast({
            title: "Voice Recognition Error",
            description: "Could not recognize speech. Please try again or type your message.",
            variant: "destructive",
          });
        };
      }
    }
  }, [toast]);

  const startVoiceRecognition = () => {
    if (speechRecognitionRef.current && !isListening) {
      setIsListening(true);
      speechRecognitionRef.current.start();
    }
  };

  const stopVoiceRecognition = () => {
    if (speechRecognitionRef.current && isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // --- Audio Recording (kept intact) ---
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        await sendAudioMessage(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting audio recording:", error);
      toast({
        title: "Recording Error",
        description: "Could not start audio recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = async (audioBlob: Blob) => {
    // unchanged
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://aditio.app.n8n.cloud/webhook/cafebf6c-cda2-4628-82cb-4e27f8c5903d",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
          body: JSON.stringify({
            text: currentInput,
            message: currentInput,
            query: currentInput,
            input: currentInput,
          }),
        }
      );

      if (response.ok) {
        const responseText = await response.text();
        let parsedResponse;
        let finalResponseText = "";

        try {
          parsedResponse = JSON.parse(responseText);
          if (typeof parsedResponse === "string") {
            finalResponseText = parsedResponse;
          } else if (parsedResponse.response) {
            finalResponseText = parsedResponse.response;
          } else if (parsedResponse.text) {
            finalResponseText = parsedResponse.text;
          } else if (parsedResponse.message) {
            finalResponseText = parsedResponse.message;
          } else {
            finalResponseText = JSON.stringify(parsedResponse);
          }
        } catch {
          finalResponseText = responseText;
        }

        if (finalResponseText.trim()) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: finalResponseText.trim(),
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          setTimeout(() => speakText(finalResponseText.trim()), 500);
        }
      }
    } catch (error) {
      console.error("Webhook error:", error);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg"
          data-testid="button-open-chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 h-96 bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Marine Assistant</h3>
            <p className="text-xs text-muted-foreground">Voice & Text Support</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {isSpeaking && (
            <Button variant="ghost" size="sm" onClick={stopSpeaking} className="p-1">
              <Volume2 className="h-4 w-4 text-primary animate-pulse" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-chatbot"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-2 rounded-lg text-sm ${
                message.isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
              data-testid={`message-${message.id}`}
            >
              {message.text}
              {!message.isUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakText(message.text)}
                  className="ml-2 p-1 h-auto"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground p-2 rounded-lg text-sm flex items-center space-x-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex space-x-2 mb-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about marine conditions..."
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
            disabled={isLoading || isRecording}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Mic
              className={`h-4 w-4 mr-1 ${
                isListening ? "text-red-500 animate-pulse" : ""
              }`}
            />
            {isListening ? "Listening..." : "Voice Input"}
          </Button>

          <Button
            onClick={isRecording ? stopAudioRecording : startAudioRecording}
            disabled={isLoading || isListening}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4 mr-1 text-red-500 animate-pulse" />
                Stop
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-1" />
                Record
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
