import { useState } from 'react';
import {
  CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy, AlertCircle,
} from 'lucide-react';
import type { CourseModule } from '../../data/courseContent';
import { syncProgress } from '../../lib/courseProgress';

interface Props {
  courseId: string;
  modules: CourseModule[];
  userId?: string;
}

function getQuizKey(courseId: string) {
  return `gas_quiz_scores_${courseId}`;
}

function loadScores(courseId: string): Record<string, { score: number; total: number }> {
  try {
    const raw = localStorage.getItem(getQuizKey(courseId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveScores(courseId: string, scores: Record<string, { score: number; total: number }>) {
  localStorage.setItem(getQuizKey(courseId), JSON.stringify(scores));
}

export default function ModuleQuiz({ courseId, modules, userId }: Props) {
  const [scores, setScores] = useState(() => loadScores(courseId));
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const activeModule = modules.find((m) => m.id === activeModuleId);

  if (activeModule) {
    return (
      <QuizSession
        courseId={courseId}
        module={activeModule}
        previousBest={scores[activeModule.id]}
        onFinish={(score, total) => {
          const next = { ...scores };
          const prev = next[activeModule.id];
          if (!prev || score > prev.score) {
            next[activeModule.id] = { score, total };
          }
          setScores(next);
          saveScores(courseId, next);
          if (userId) syncProgress(courseId, userId);
          setActiveModuleId(null);
        }}
        onBack={() => setActiveModuleId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Module Quizzes</h2>
        <p className="text-sm text-slate-500 mb-4">Test your understanding after completing each module.</p>

        <div className="space-y-3">
          {modules.map((mod, idx) => {
            const result = scores[mod.id];
            const passed = result && result.score >= Math.ceil(result.total * 0.7);
            return (
              <div
                key={mod.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    passed ? 'bg-green-50 text-green-600' : result ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {passed ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{mod.title}</p>
                    <p className="text-xs text-slate-500">{mod.quiz.length} questions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {result && (
                    <span className={`text-sm font-medium ${passed ? 'text-green-600' : 'text-amber-600'}`}>
                      {result.score}/{result.total}
                    </span>
                  )}
                  <button
                    onClick={() => setActiveModuleId(mod.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    {result ? 'Retake' : 'Start'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Quiz Session ──────────────────────────────────────────────────────

interface QuizSessionProps {
  courseId: string;
  module: CourseModule;
  previousBest?: { score: number; total: number };
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}

function QuizSession({ module, previousBest, onFinish, onBack }: QuizSessionProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(module.quiz.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const question = module.quiz[currentQ];
  const total = module.quiz.length;

  const handleSelect = (optionIdx: number) => {
    if (submitted) return;
    const next = [...answers];
    next[currentQ] = optionIdx;
    setAnswers(next);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const score = module.quiz.reduce((sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const allAnswered = answers.every((a) => a !== null);
  const passed = score >= Math.ceil(total * 0.7);

  if (submitted) {
    return (
      <div className="space-y-4">
        {/* Score card */}
        <div className={`rounded-xl border p-6 text-center ${passed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${passed ? 'bg-green-100' : 'bg-amber-100'}`}>
            {passed ? <Trophy className="w-8 h-8 text-green-600" /> : <AlertCircle className="w-8 h-8 text-amber-600" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{score}/{total}</h2>
          <p className={`text-sm font-medium ${passed ? 'text-green-700' : 'text-amber-700'}`}>
            {passed ? 'Great job! You passed this quiz.' : 'Keep studying — you need 70% to pass.'}
          </p>
          {previousBest && (
            <p className="text-xs text-slate-500 mt-1">Previous best: {previousBest.score}/{previousBest.total}</p>
          )}
        </div>

        {/* Review answers */}
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {module.quiz.map((q, qi) => {
            const userAnswer = answers[qi];
            const isCorrect = userAnswer === q.correctIndex;
            return (
              <div key={q.id} className="p-4">
                <div className="flex items-start gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm font-medium text-slate-900">{qi + 1}. {q.question}</p>
                </div>
                <div className="ml-6 space-y-1 mb-2">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`text-sm px-3 py-1.5 rounded ${
                        oi === q.correctIndex
                          ? 'bg-green-50 text-green-800 font-medium'
                          : oi === userAnswer && !isCorrect
                            ? 'bg-red-50 text-red-700 line-through'
                            : 'text-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                    </div>
                  ))}
                </div>
                <p className="ml-6 text-xs text-slate-500 bg-slate-50 rounded p-2">{q.explanation}</p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Back to Quizzes
          </button>
          <button
            onClick={() => { onFinish(score, total); }}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          &larr; Back to quizzes
        </button>
        <span className="text-sm text-slate-500">Question {currentQ + 1} of {total}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {module.quiz.map((_, qi) => (
          <button
            key={qi}
            onClick={() => setCurrentQ(qi)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              qi === currentQ ? 'bg-primary-600' : answers[qi] !== null ? 'bg-primary-300' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-base font-medium text-slate-900 mb-5">{question.question}</p>
        <div className="space-y-2">
          {question.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                answers[currentQ] === oi
                  ? 'border-primary-500 bg-primary-50 text-primary-800 font-medium'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
        >
          Previous
        </button>

        {currentQ < total - 1 ? (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
