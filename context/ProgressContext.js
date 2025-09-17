'use client';

import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const initialState = {
  level: null,
  targetScore: 650,
  targetTimeline: '3 tháng',
  placementHistory: [],
  flashcard: {
    streak: 0,
    lastStudyDate: null,
    dailyGoal: 20,
    todayStudied: 0,
    mastered: 0,
    dueToday: 0
  },
  grammar: {
    lessonsCompleted: 0,
    accuracy: 0,
    timeSpent: 0,
    retryCounts: {}
  },
  mockTests: [],
  activity: [],
  achievements: [],
  difficultyTrend: 'Elementary'
};

function progressReducer(state, action) {
  switch (action.type) {
    case 'RESTORE':
      return { ...state, ...action.payload };
    case 'UPDATE_PLACEMENT': {
      const placementHistory = [...state.placementHistory, action.payload.result];
      return {
        ...state,
        level: action.payload.result.level,
        targetScore: action.payload.recommendedScore,
        targetTimeline: action.payload.recommendedTimeline,
        placementHistory,
        activity: [action.payload.activity, ...state.activity]
      };
    }
    case 'UPDATE_FLASHCARD': {
      return {
        ...state,
        flashcard: {
          ...state.flashcard,
          ...action.payload.flashcard
        },
        activity: [action.payload.activity, ...state.activity]
      };
    }
    case 'UPDATE_GRAMMAR': {
      return {
        ...state,
        grammar: {
          ...state.grammar,
          lessonsCompleted: Math.max(state.grammar.lessonsCompleted, action.payload.completedLessons),
          accuracy: action.payload.accuracy,
          timeSpent: state.grammar.timeSpent + action.payload.sessionTime,
          retryCounts: action.payload.retryCounts
        },
        activity: [action.payload.activity, ...state.activity]
      };
    }
    case 'LOG_MOCK_TEST': {
      const mockTests = [action.payload.result, ...state.mockTests];
      return {
        ...state,
        mockTests,
        difficultyTrend: action.payload.result.difficultySuggestion,
        activity: [action.payload.activity, ...state.activity]
      };
    }
    case 'ADD_ACHIEVEMENT': {
      if (state.achievements.find((item) => item.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        achievements: [action.payload, ...state.achievements]
      };
    }
    case 'UPDATE_GOALS': {
      return {
        ...state,
        targetScore: action.payload.targetScore ?? state.targetScore,
        targetTimeline: action.payload.targetTimeline ?? state.targetTimeline,
        flashcard: {
          ...state.flashcard,
          dailyGoal: action.payload.dailyGoal ?? state.flashcard.dailyGoal
        }
      };
    }
    default:
      return state;
  }
}

const ProgressContext = createContext();

export function ProgressProvider({ children }) {
  const [state, dispatch] = useReducer(progressReducer, initialState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('learn-english-progress');
    if (stored) {
      try {
        dispatch({ type: 'RESTORE', payload: JSON.parse(stored) });
      } catch (error) {
        console.error('Failed to parse stored progress', error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('learn-english-progress', JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return context;
}
