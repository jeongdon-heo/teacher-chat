import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onLogin }) {
  const [roomCode, setRoomCode] = useState('');
  const [role, setRole] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    const code = generateCode();
    try {
      if (!supabase) throw new Error('서버 연결 실패');
      const { error: err } = await supabase
        .from('rooms')
        .insert({ code });
      if (err) throw err;
      setRoomCode(code);
      setStep(2);
    } catch (e) {
      setError('방 생성에 실패했습니다. 다시 시도해주세요.');
    }
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('방 코드를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (!supabase) throw new Error('서버 연결 실패');
      const { data, error: err } = await supabase
        .from('rooms')
        .select('code')
        .eq('code', roomCode.toUpperCase().trim())
        .single();
      if (err || !data) {
        setError('존재하지 않는 방 코드입니다.');
        setLoading(false);
        return;
      }
      setRoomCode(data.code);
      setStep(2);
    } catch {
      setError('연결에 실패했습니다.');
    }
    setLoading(false);
  };

  const handleSelectRole = () => {
    if (!role) {
      setError('역할을 선택해주세요.');
      return;
    }
    onLogin({ roomCode, role });
  };

  return (
    <div className="login-container">
      <div className="login-bg-pattern" />
      <div className="login-card">
        <div className="login-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="14" fill="#1a6b5a"/>
            <path d="M12 15h24a2 2 0 012 2v12a2 2 0 01-2 2h-5l-7 5v-5h-12a2 2 0 01-2-2v-12a2 2 0 012-2z" fill="white" fillOpacity="0.95"/>
            <circle cx="18" cy="23" r="2" fill="#1a6b5a"/>
            <circle cx="24" cy="23" r="2" fill="#1a6b5a"/>
            <circle cx="30" cy="23" r="2" fill="#1a6b5a"/>
          </svg>
        </div>
        <h1 className="login-title">담임톡</h1>
        <p className="login-subtitle">담임 · 기간제 교사 소통 메신저</p>

        {step === 1 && (
          <div className="login-step">
            <div className="login-actions">
              <button
                className="btn btn-primary"
                onClick={handleCreateRoom}
                disabled={loading}
              >
                {loading ? '생성 중...' : '✨ 새 대화방 만들기'}
              </button>

              <div className="login-divider">
                <span>또는</span>
              </div>

              <div className="input-group">
                <label>대화방 코드 입력</label>
                <input
                  type="text"
                  placeholder="예: ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="input-code"
                />
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleJoinRoom}
                disabled={loading || !roomCode.trim()}
              >
                {loading ? '확인 중...' : '입장하기'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="login-step">
            <div className="room-code-display">
              <span className="room-code-label">대화방 코드</span>
              <span className="room-code-value">{roomCode}</span>
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  alert('코드가 복사되었습니다!');
                }}
              >
                📋 복사
              </button>
            </div>

            <p className="role-prompt">역할을 선택해주세요</p>

            <div className="role-selector">
              <button
                className={`role-card ${role === 'teacher' ? 'selected' : ''}`}
                onClick={() => { setRole('teacher'); setError(''); }}
              >
                <span className="role-emoji">👨‍🏫</span>
                <span className="role-name">담임교사</span>
                <span className="role-desc">출장/연수 중</span>
              </button>
              <button
                className={`role-card ${role === 'substitute' ? 'selected' : ''}`}
                onClick={() => { setRole('substitute'); setError(''); }}
              >
                <span className="role-emoji">🙋‍♂️</span>
                <span className="role-name">기간제 교사</span>
                <span className="role-desc">임시 담임</span>
              </button>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSelectRole}
              disabled={!role}
            >
              대화 시작하기
            </button>

            <button
              className="btn-back"
              onClick={() => { setStep(1); setRole(''); setRoomCode(''); setError(''); }}
            >
              ← 뒤로
            </button>
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
