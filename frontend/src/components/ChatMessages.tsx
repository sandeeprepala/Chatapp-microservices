import { Message } from "@/app/chat/page";
import { User } from "@/context/AppContext";
import React, { useEffect, useMemo, useRef } from "react";
import moment from "moment";
import { Check, CheckCheck, ImageIcon } from "lucide-react";

interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
}

const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // seen feature
  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set();
    return messages.filter((message) => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, uniqueMessages]);

  const formatMessageTime = (timestamp: string) => {
    const now = moment();
    const messageTime = moment(timestamp);
    
    if (now.diff(messageTime, 'days') < 1) {
      return messageTime.format("hh:mm A");
    } else if (now.diff(messageTime, 'days') < 7) {
      return messageTime.format("ddd hh:mm A");
    } else {
      return messageTime.format("MMM D, hh:mm A");
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-900/50 to-gray-800/30">
      <div className="h-full max-h-[calc(100vh-215px)] overflow-y-auto p-4 space-y-2 custom-scroll">
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gray-800/50 rounded-full p-6 mb-4 border border-gray-700/50">
              <div className="text-4xl mb-2">📩</div>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Start a Conversation
            </h3>
            <p className="text-gray-400 max-w-sm">
              Select a user from the sidebar to begin chatting and sharing moments
            </p>
          </div>
        ) : uniqueMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gray-800/50 rounded-full p-6 mb-4 border border-gray-700/50">
              <div className="text-4xl mb-2">💬</div>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Messages Yet
            </h3>
            <p className="text-gray-400 max-w-sm">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <>
            {uniqueMessages.map((e, i) => {
              const isSentByMe = e.sender === loggedInUser?._id;
              const uniqueKey = `${e._id}-${i}`;
              const showDateHeader = i === 0 || 
                !moment(e.createdAt).isSame(uniqueMessages[i-1].createdAt, 'day');

              return (
                <div key={uniqueKey}>
                  {/* Date Separator */}
                  {showDateHeader && (
                    <div className="flex justify-center my-6">
                      <div className="bg-gray-700/50 px-3 py-1 rounded-full">
                        <span className="text-xs text-gray-400 font-medium">
                          {moment(e.createdAt).isSame(moment(), 'day') 
                            ? 'Today' 
                            : moment(e.createdAt).format('MMMM D, YYYY')
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`flex gap-2 ${
                      isSentByMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${
                        isSentByMe ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Message Content */}
                      <div
                        className={`rounded-2xl px-4 py-3 transition-all duration-200 ${
                          isSentByMe
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-gray-700 text-white rounded-bl-md"
                        } ${
                          e.messageType === "image" && e.text ? "pb-2" : ""
                        }`}
                      >
                        {e.messageType === "image" && e.image && (
                          <div className="mb-2 last:mb-0">
                            <div className="relative rounded-lg overflow-hidden bg-gray-600/30">
                              <img
                                src={e.image.url}
                                alt="shared image"
                                className="max-w-full h-auto rounded-lg"
                              />
                            </div>
                          </div>
                        )}

                        {e.text && (
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {e.text}
                          </p>
                        )}
                      </div>

                      {/* Timestamp and Status */}
                      <div
                        className={`flex items-center gap-2 px-1 ${
                          isSentByMe ? "flex-row-reverse" : ""
                        }`}
                      >
                        <span className="text-xs text-gray-500 font-medium">
                          {formatMessageTime(e.createdAt)}
                        </span>

                        {isSentByMe && (
                          <div className="flex items-center">
                            {e.seen ? (
                              <CheckCheck className="w-3 h-3 text-blue-400" aria-label={`Seen at ${moment(e.seenAt).format("hh:mm A")}`} />
                            ) : (
                              <Check className="w-3 h-3 text-gray-500" aria-label="Sent" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} className="h-4" />
          </>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(75, 85, 99, 0.1);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.3);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.5);
        }
      `}</style>
    </div>
  );
};

export default ChatMessages;