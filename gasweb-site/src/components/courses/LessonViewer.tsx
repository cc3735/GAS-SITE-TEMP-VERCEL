import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronRight, ChevronDown, CheckCircle, Circle, BookOpen,
  ArrowLeft, ArrowRight, Clock, Target, Lightbulb,
  Volume2, Pause, Square, Sparkles, Loader2, ShoppingCart,
} from 'lucide-react';
import type { FullCourse } from '../../data/courseContent';
import { syncProgress } from '../../lib/courseProgress';
import { supabase } from '../../lib/supabase';
import {
  getCreditsBalance, estimateCharacters, purchaseCredits, playHDAudio,
  CREDIT_PACKAGES, type CreditBalance,
} from '../../lib/ttsCredits';

interface Props {
  course: FullCourse;
  initialLessonId?: string;
  userId?: string;
}

function getProgressKey(courseId: string) {
  return `gas_course_progress_${courseId}`;
}

function loadProgress(courseId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getProgressKey(courseId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveProgressLocal(courseId: string, completed: Set<string>, totalLessons: number) {
  localStorage.setItem(getProgressKey(courseId), JSON.stringify([...completed]));
  localStorage.setItem(`gas_course_summary_${courseId}`, JSON.stringify({
    completed: completed.size,
    total: totalLessons,
  }));
}

export default function LessonViewer({ course, initialLessonId, userId }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(() => loadProgress(course.id));
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Flat lesson list for prev/next navigation
  const allLessons = useMemo(
    () => course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title }))),
    [course]
  );

  const [currentIdx, setCurrentIdx] = useState(() => {
    if (initialLessonId) {
      const idx = allLessons.findIndex((l) => l.id === initialLessonId);
      if (idx >= 0) return idx;
    }
    // Find first incomplete lesson
    const firstIncomplete = allLessons.findIndex((l) => !completed.has(l.id));
    return firstIncomplete >= 0 ? firstIncomplete : 0;
  });

  const lesson = allLessons[currentIdx];

  // ── Speech / Audio ──────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(() => {
    try { return parseFloat(localStorage.getItem('gas_tts_speed') || '1'); }
    catch { return 1; }
  });

  function extractPlainText() {
    if (!lesson) return '';
    const parts: string[] = [];
    parts.push(lesson.title + '.');
    if (lesson.objectives.length) {
      parts.push('Learning Objectives: ' + lesson.objectives.join('. ') + '.');
    }
    // Strip markdown from content
    const clean = lesson.content
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/^#{1,3}\s+/gm, '')    // remove heading markers
      .replace(/^>\s+/gm, '')         // remove blockquote markers
      .replace(/^[-*]\s+/gm, '')      // remove list markers
      .replace(/^\d+\.\s+/gm, '')     // remove ordered list markers
      .replace(/\*\*(.+?)\*\*/g, '$1') // bold → text
      .replace(/\*(.+?)\*/g, '$1')     // italic → text
      .replace(/`([^`]+)`/g, '$1')     // inline code → text
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
    parts.push(clean);
    if (lesson.keyTakeaways.length) {
      parts.push('Key Takeaways: ' + lesson.keyTakeaways.join('. ') + '.');
    }
    return parts.join(' ');
  }

  function startSpeech() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(extractPlainText());
    utterance.rate = speechRate;
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }

  function togglePause() {
    if (!window.speechSynthesis) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }

  function stopSpeech() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }

  function changeSpeed(rate: number) {
    setSpeechRate(rate);
    localStorage.setItem('gas_tts_speed', String(rate));
    if (isPlaying) {
      // Restart with new speed
      stopSpeech();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(extractPlainText());
        utterance.rate = rate;
        utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
        utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }, 100);
    }
  }

  // ── HD Audio (ElevenLabs) ──────────────────────────────────────────
  const [audioMode, setAudioMode] = useState<'standard' | 'hd'>('standard');
  const [hdLoading, setHdLoading] = useState(false);
  const [hdPlaying, setHdPlaying] = useState(false);
  const [hdPaused, setHdPaused] = useState(false);
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load credit balance on mount
  useEffect(() => {
    if (userId) {
      getCreditsBalance(userId).then(setCredits);
    }
  }, [userId]);

  async function handlePlayHD() {
    if (!userId) return;
    const text = extractPlainText();
    const chars = estimateCharacters(text);

    if (!credits || credits.credits_remaining < chars) {
      setShowPurchase(true);
      return;
    }

    stopSpeech(); // stop browser TTS if playing
    setHdLoading(true);

    const result = await playHDAudio(text, course.id, lesson.id);

    if ('error' in result) {
      if (result.error === 'insufficient_credits') {
        setShowPurchase(true);
      }
      setHdLoading(false);
      return;
    }

    const url = URL.createObjectURL(result.blob);
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = url;
    audioRef.current.onended = () => { setHdPlaying(false); setHdPaused(false); };
    audioRef.current.play();
    setHdPlaying(true);
    setHdPaused(false);
    setHdLoading(false);

    // Refresh balance after play
    getCreditsBalance(userId).then(setCredits);
  }

  function toggleHdPause() {
    if (!audioRef.current) return;
    if (hdPaused) {
      audioRef.current.play();
      setHdPaused(false);
    } else {
      audioRef.current.pause();
      setHdPaused(true);
    }
  }

  function stopHdAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setHdPlaying(false);
    setHdPaused(false);
  }

  async function handlePurchase(packageId: string) {
    if (!userId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;
    const url = await purchaseCredits(packageId, userId, user.email);
    if (url) window.location.href = url;
  }

  // Stop speech on lesson change or unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [currentIdx]);

  // Auto-expand the module of the current lesson
  useEffect(() => {
    if (lesson) {
      setExpandedModules((prev) => new Set([...prev, lesson.moduleId]));
    }
  }, [lesson?.moduleId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const markComplete = () => {
    const next = new Set(completed);
    next.add(lesson.id);
    setCompleted(next);
    saveProgressLocal(course.id, next, allLessons.length);
    if (userId) syncProgress(course.id, userId);
    // Auto-advance to next lesson
    if (currentIdx < allLessons.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const markIncomplete = () => {
    const next = new Set(completed);
    next.delete(lesson.id);
    setCompleted(next);
    saveProgressLocal(course.id, next, allLessons.length);
    if (userId) syncProgress(course.id, userId);
  };

  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l) => completed.has(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (!lesson) return null;

  return (
    <div className="flex gap-0 -mx-6 md:-mx-8 -mb-6 md:-mb-8" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-72 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          {/* Progress header */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-slate-700">Progress</span>
              <span className="text-slate-500">{completedCount}/{totalLessons}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Module tree */}
          <nav className="p-2">
            {course.modules.map((mod, mi) => {
              const modLessons = mod.lessons;
              const modCompleted = modLessons.filter((l) => completed.has(l.id)).length;
              const isExpanded = expandedModules.has(mod.id);

              return (
                <div key={mod.id} className="mb-1">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span className="flex-1 text-left truncate">Module {mi + 1}: {mod.title}</span>
                    <span className="text-xs text-slate-400">{modCompleted}/{modLessons.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="ml-4 pl-3 border-l border-slate-200">
                      {modLessons.map((l) => {
                        const globalIdx = allLessons.findIndex((al) => al.id === l.id);
                        const isCurrent = globalIdx === currentIdx;
                        const isDone = completed.has(l.id);
                        return (
                          <button
                            key={l.id}
                            onClick={() => setCurrentIdx(globalIdx)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                              isCurrent
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                            )}
                            <span className="truncate text-left">{l.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <div className="text-sm text-slate-500 truncate">
            {lesson.moduleTitle} &gt; {lesson.title}
          </div>
          {/* Audio controls */}
          <div className="ml-auto flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex rounded-md border border-slate-200 overflow-hidden">
              <button
                onClick={() => { setAudioMode('standard'); stopHdAudio(); }}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  audioMode === 'standard' ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => { setAudioMode('hd'); stopSpeech(); }}
                className={`px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                  audioMode === 'hd' ? 'bg-amber-50 text-amber-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                HD
              </button>
            </div>

            {/* Playback controls */}
            {audioMode === 'standard' ? (
              <>
                {isPlaying ? (
                  <>
                    <button
                      onClick={togglePause}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                      title={isPaused ? 'Resume' : 'Pause'}
                    >
                      {isPaused ? <Volume2 className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      onClick={stopSpeech}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Stop"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startSpeech}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Listen (browser voice)"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Listen
                  </button>
                )}
                <select
                  value={speechRate}
                  onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                  className="text-xs bg-transparent border border-slate-200 rounded-md px-1 py-0.5 text-slate-500 cursor-pointer"
                >
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </>
            ) : (
              <>
                {hdLoading ? (
                  <span className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </span>
                ) : hdPlaying ? (
                  <>
                    <button
                      onClick={toggleHdPause}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      title={hdPaused ? 'Resume' : 'Pause'}
                    >
                      {hdPaused ? <Volume2 className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      {hdPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      onClick={stopHdAudio}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Stop"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => userId ? handlePlayHD() : null}
                    disabled={!userId}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                    title={userId ? `Play HD (~${estimateCharacters(extractPlainText()).toLocaleString()} chars)` : 'Sign in to use HD Audio'}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Play HD
                  </button>
                )}
                {credits && (
                  <span className="text-xs text-slate-400">
                    {credits.credits_remaining.toLocaleString()} credits
                  </span>
                )}
              </>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-1">
              <Clock className="w-3.5 h-3.5" />
              {lesson.estimatedMinutes} min
            </div>
          </div>
        </div>

        {/* Credit purchase prompt */}
        {showPurchase && (
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4" />
                  HD Audio Credits Required
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  This lesson needs ~{estimateCharacters(extractPlainText()).toLocaleString()} characters.
                  {credits ? ` You have ${credits.credits_remaining.toLocaleString()} remaining.` : ' You have no credits yet.'}
                </p>
              </div>
              <button
                onClick={() => setShowPurchase(false)}
                className="text-amber-400 hover:text-amber-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg.id)}
                  className="flex-1 min-w-[140px] px-3 py-2 bg-white border border-amber-200 rounded-lg hover:border-amber-400 transition-colors text-left"
                >
                  <div className="text-sm font-semibold text-slate-900">{pkg.priceLabel}</div>
                  <div className="text-xs text-slate-500">{pkg.characters.toLocaleString()} characters</div>
                  <div className="text-xs text-amber-600 font-medium">{pkg.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lesson content */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 mb-4">{lesson.title}</h1>

            {/* Objectives */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-800">Learning Objectives</h3>
              </div>
              <ul className="space-y-1">
                {lesson.objectives.map((obj, i) => (
                  <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">-</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            {/* Main content — render markdown-like text */}
            <div className="prose prose-slate max-w-none mb-8">
              <MarkdownContent text={lesson.content} />
            </div>

            {/* Key Takeaways */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">Key Takeaways</h3>
              </div>
              <ul className="space-y-1">
                {lesson.keyTakeaways.map((t, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {completed.has(lesson.id) ? (
              <button
                onClick={markIncomplete}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Completed
              </button>
            ) : (
              <button
                onClick={markComplete}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Mark as Complete
              </button>
            )}
          </div>

          <button
            onClick={() => setCurrentIdx(Math.min(allLessons.length - 1, currentIdx + 1))}
            disabled={currentIdx === allLessons.length - 1}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Simple Markdown Renderer ──────────────────────────────────────────

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={elements.length} className="bg-slate-800 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm my-4">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Heading
    if (line.startsWith('### ')) {
      elements.push(<h3 key={elements.length} className="text-lg font-semibold text-slate-900 mt-6 mb-3">{renderInline(line.slice(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={elements.length} className="text-xl font-bold text-slate-900 mt-8 mb-4">{renderInline(line.slice(3))}</h2>);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={elements.length} className="border-l-4 border-primary-300 bg-primary-50 pl-4 pr-3 py-3 my-4 text-sm text-primary-800 rounded-r-lg">
          {quoteLines.map((ql, qi) => <p key={qi}>{renderInline(ql)}</p>)}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trimStart().startsWith('- ') || lines[i].trimStart().startsWith('* '))) {
        items.push(lines[i].trimStart().slice(2));
        i++;
      }
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-1.5 my-3 text-slate-700">
          {items.map((item, ii) => <li key={ii}>{renderInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trimStart())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
        items.push(lines[i].trimStart().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={elements.length} className="list-decimal list-inside space-y-1.5 my-3 text-slate-700">
          {items.map((item, ii) => <li key={ii}>{renderInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    elements.push(<p key={elements.length} className="text-slate-700 leading-relaxed my-3">{renderInline(line)}</p>);
    i++;
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Split on inline patterns: **bold**, *italic*, `code`, [link](url)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Italic
    const italicMatch = remaining.match(/\*([^*]+)\*/);

    // Find earliest match
    const matches = [
      boldMatch ? { type: 'bold', match: boldMatch, idx: boldMatch.index! } : null,
      codeMatch ? { type: 'code', match: codeMatch, idx: codeMatch.index! } : null,
      italicMatch && (!boldMatch || italicMatch.index! < boldMatch.index!) ? { type: 'italic', match: italicMatch, idx: italicMatch.index! } : null,
    ].filter(Boolean).sort((a, b) => a!.idx - b!.idx);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;
    if (first.idx > 0) {
      parts.push(remaining.slice(0, first.idx));
    }

    if (first.type === 'bold') {
      parts.push(<strong key={key++} className="font-semibold text-slate-900">{first.match![1]}</strong>);
      remaining = remaining.slice(first.idx + first.match![0].length);
    } else if (first.type === 'code') {
      parts.push(<code key={key++} className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono">{first.match![1]}</code>);
      remaining = remaining.slice(first.idx + first.match![0].length);
    } else {
      parts.push(<em key={key++} className="italic">{first.match![1]}</em>);
      remaining = remaining.slice(first.idx + first.match![0].length);
    }
  }

  return <>{parts}</>;
}
