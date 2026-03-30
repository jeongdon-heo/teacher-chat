import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const ROLE_LABELS = {
  teacher: '담임',
  substitute: '기간제',
};

const ROLE_COLORS = {
  teacher: '#1a6b5a',
  substitute: '#2d6ea8',
};

export default function Chat({ roomCode, role, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const otherRole = role === 'teacher' ? 'substitute' : 'teacher';

  // ── Scroll to bottom ──
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 100);
  }, []);

  // ── Load messages ──
  useEffect(() => {
    if (!supabase) return;
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_code', roomCode)
        .order('created_at', { ascending: true })
        .limit(200);

      if (!error && data) {
        setMessages(data);
        scrollToBottom('auto');
      }
    };
    loadMessages();
  }, [roomCode, scrollToBottom]);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          scrollToBottom();

          // Auto mark as read if from the other person
          if (payload.new.sender_role !== role) {
            markAsRead(payload.new.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? payload.new : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, role, scrollToBottom]);

  // ── Mark messages as read ──
  const markAsRead = async (msgId) => {
    if (!supabase) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', msgId);
  };

  // ── Mark all unread from other person ──
  useEffect(() => {
    if (!supabase) return;
    const markAllRead = async () => {
      const unread = messages.filter(
        (m) => m.sender_role !== role && !m.is_read
      );
      if (unread.length > 0) {
        const ids = unread.map((m) => m.id);
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', ids);
      }
    };
    markAllRead();
  }, [messages, role]);

  // ── Online status ──
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Send message ──
  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    setInput('');
    if (!supabase) return;
    await supabase.from('messages').insert({
      room_code: roomCode,
      sender_role: role,
      content: text,
      is_read: false,
    });
  };

  // ── File upload ──
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('파일 크기는 10MB 이하만 가능합니다.');
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${roomCode}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(data.path);

      const isImage = file.type.startsWith('image/');

      await supabase.from('messages').insert({
        room_code: roomCode,
        sender_role: role,
        content: isImage ? '📷 사진' : `📎 ${file.name}`,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: file.type,
        is_read: false,
      });
    } catch (err) {
      console.error('Upload error:', err);
      alert('파일 업로드에 실패했습니다.');
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Format time ──
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h < 12 ? '오전' : '오후';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${ampm} ${hour}:${m}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getFullYear()}년 ${months[d.getMonth()]}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
  };

  // ── Group messages by date ──
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.created_at).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  // ── Render file content ──
  const renderFileContent = (msg) => {
    if (!msg.file_url) return null;

    const isImage = msg.file_type?.startsWith('image/');

    if (isImage) {
      return (
        <div
          className="msg-image-wrap"
          onClick={() => setPreviewImage(msg.file_url)}
        >
          <img src={msg.file_url} alt={msg.file_name || '이미지'} className="msg-image" />
        </div>
      );
    }

    return (
      <a
        href={msg.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="msg-file-link"
      >
        <span className="file-icon">📎</span>
        <span className="file-name">{msg.file_name || '파일'}</span>
        <span className="file-download">↓</span>
      </a>
    );
  };

  const unreadCount = messages.filter(
    (m) => m.sender_role !== role && !m.is_read
  ).length;

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          <div className="header-avatar" style={{ background: ROLE_COLORS[otherRole] }}>
            {otherRole === 'teacher' ? '👨‍🏫' : '🙋‍♂️'}
          </div>
          <div className="header-info">
            <h2>{ROLE_LABELS[otherRole]} 선생님</h2>
            <span className="header-room">방 코드: {roomCode}</span>
          </div>
        </div>
        <button className="header-menu-btn" onClick={() => setShowMenu(!showMenu)}>
          ⋮
        </button>
        {showMenu && (
          <div className="dropdown-menu">
            <button onClick={() => {
              navigator.clipboard.writeText(roomCode);
              alert('방 코드가 복사되었습니다!');
              setShowMenu(false);
            }}>
              📋 방 코드 복사
            </button>
            <button onClick={() => {
              if (confirm('정말 로그아웃하시겠습니까?')) onLogout();
              setShowMenu(false);
            }}>
              🚪 나가기
            </button>
          </div>
        )}
      </header>

      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner">
          📡 인터넷 연결이 끊겼습니다
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages" ref={chatContainerRef}>
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="date-divider">
              <span>{formatDate(msgs[0].created_at)}</span>
            </div>
            {msgs.map((msg, idx) => {
              const isMine = msg.sender_role === role;
              const showTime =
                idx === msgs.length - 1 ||
                msgs[idx + 1].sender_role !== msg.sender_role ||
                new Date(msgs[idx + 1].created_at).getMinutes() !==
                  new Date(msg.created_at).getMinutes();

              return (
                <div
                  key={msg.id}
                  className={`msg-row ${isMine ? 'mine' : 'theirs'}`}
                >
                  {!isMine && (
                    <div className="msg-avatar" style={{ background: ROLE_COLORS[msg.sender_role] }}>
                      {msg.sender_role === 'teacher' ? '👨‍🏫' : '🙋‍♂️'}
                    </div>
                  )}
                  <div className="msg-content-wrap">
                    {!isMine && idx === 0 || (!isMine && msgs[idx - 1]?.sender_role !== msg.sender_role) ? (
                      <span className="msg-sender">{ROLE_LABELS[msg.sender_role]} 선생님</span>
                    ) : null}
                    <div className={`msg-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
                      {isMine && showTime && (
                        <div className="msg-meta mine">
                          {msg.is_read && <span className="read-receipt">읽음</span>}
                          <span className="msg-time">{formatTime(msg.created_at)}</span>
                        </div>
                      )}
                      <div className={`msg-bubble ${isMine ? 'mine' : 'theirs'}`}>
                        {renderFileContent(msg)}
                        {(!msg.file_url || !msg.file_type?.startsWith('image/')) && (
                          <p className="msg-text">{msg.content}</p>
                        )}
                      </div>
                      {!isMine && showTime && (
                        <div className="msg-meta theirs">
                          <span className="msg-time">{formatTime(msg.created_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.hwp,.xlsx,.pptx"
          hidden
        />
        <button
          className="btn-attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '⏳' : '📎'}
        </button>
        <form onSubmit={sendMessage} className="input-form">
          <input
            ref={inputRef}
            type="text"
            placeholder="메시지를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="msg-input"
          />
          <button
            type="submit"
            className="btn-send"
            disabled={!input.trim() || uploading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Image preview modal */}
      {previewImage && (
        <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <button className="preview-close" onClick={() => setPreviewImage(null)}>✕</button>
          <img src={previewImage} alt="미리보기" className="preview-image" />
        </div>
      )}
    </div>
  );
}
