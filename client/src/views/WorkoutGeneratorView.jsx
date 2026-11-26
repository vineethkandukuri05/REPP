import React, { useState, useEffect, useCallback } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { SkeletonRows, ErrorState } from '../components/ui/States';

export default function WorkoutGeneratorView() {
  const { profile, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [inWorkoutMode, setInWorkoutMode] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [completedSession, setCompletedSession] = useState(null);
  const [swappingExId, setSwappingExId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  const fetchWorkout = useCallback(async () => {
    try {
      setLoadError('');
      setLoading(true);
      const res = await api.get('/workouts/today');
      if (res && res.workoutPlan) {
        setWorkout(res.workoutPlan);
      }
      setCompletedToday(Boolean(res?.completedToday));
      setCompletedSession(res?.completedSession || null);
      if (res?.completedToday) setInWorkoutMode(false);
    } catch (err) {
      console.error('Error fetching workout:', err);
      setLoadError(err?.message || 'Could not load your workout.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkout();
  }, [fetchWorkout]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      showToast('Generating personalized AI workout split...', 'info');
      const res = await api.post('/workouts/generate', {});
      if (res && res.workoutPlan) {
        setWorkout(res.workoutPlan);
        showToast('New workout routine ready!', 'success');
      }
    } catch (err) {
      if (err.status === 409) setCompletedToday(true);
      showToast(err.message || 'Failed to generate workout plan', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSet = async (exId) => {
    if (!workout) return;
    const ex = workout.exercises?.find(e => e.id === exId);
    if (!ex) return;

    const nextSets = ex.completedSets >= ex.sets ? 0 : ex.completedSets + 1;

    // Optimistic
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => e.id === exId ? { ...e, completedSets: nextSets } : e)
    }));

    try {
      await api.post(`/workouts/set/${exId}`, { completedSets: nextSets });
      if (nextSets === ex.sets) {
        showToast(`All sets completed for ${ex.name}.`, 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubstitute = async (exId) => {
    setSwappingExId(exId);
    try {
      showToast('Finding a biomechanically equivalent exercise...', 'info');
      const res = await api.post(`/workouts/substitute/${exId}`, {});
      if (res && res.exercise) {
        setWorkout(prev => ({
          ...prev,
          exercises: prev.exercises.map(e => e.id === exId ? res.exercise : e)
        }));
        showToast(`Substituted with ${res.exercise.name}!`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to substitute exercise', 'error');
    } finally {
      setSwappingExId(null);
    }
  };

  const handleFinishWorkout = async () => {
    try {
      const res = await api.post('/workouts/complete', {
        workoutPlanId: workout?.id,
        durationMinutes: workout?.duration || 45,
      });

      setInWorkoutMode(false);
      setCompletedToday(true);
      const streak = res?.profile?.streakDays;
      showToast(`Workout logged.${streak ? ` Streak: ${streak} day${streak === 1 ? '' : 's'}.` : ''}`, 'success');
      refreshUser();
      fetchWorkout();
    } catch (err) {
      if (err.status === 409) {
        setInWorkoutMode(false);
        setCompletedToday(true);
      }
      showToast(err.message || 'Failed to complete workout', 'error');
    }
  };

  const currentProfile = profile || {};
  const injuriesList = Array.isArray(currentProfile.injuries) ? currentProfile.injuries : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">
            {workout ? workout.dayName : 'Today’s Workout Session'}
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1 flex flex-wrap items-center gap-3">
            <span>Split: <strong className="text-ink">{workout?.split || currentProfile.workoutSplit || 'Upper / Lower'}</strong></span>
            <span>Duration: <strong className="text-ink">{workout?.duration || currentProfile.workoutDuration || 60} Mins</strong></span>
            <span>Level: <strong className="text-brand">{workout?.difficulty || currentProfile.experienceLevel || 'Intermediate'}</strong></span>
          </p>
        </div>

        {completedToday ? (
          <div className="px-5 py-2.5 bg-subtle border border-brand text-brand font-bold text-xs rounded-sm flex items-center gap-2">
             Workout Completed Today
          </div>
        ) : (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-subtle hover:bg-subtle-hover border border-line text-ink font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            
            <span>Regenerate Routine</span>
          </button>

          {!inWorkoutMode ? (
            <button
              onClick={() => setInWorkoutMode(true)}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2"
            >
               Start Gym Session
            </button>
          ) : (
            <button
              onClick={handleFinishWorkout}
              className="px-5 py-2.5 bg-brand hover:bg-brand text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2"
            >
               Finish & Log Workout
            </button>
          )}
        </div>
        )}
      </div>

      {completedToday && (
        <div className="p-4 bg-subtle border border-brand rounded-sm flex items-start gap-3 text-xs text-muted">
          
          <span>
            <strong className="text-ink">Today's session is done{completedSession?.dayName ? `: ${completedSession.dayName}` : ''}.</strong>{' '}
            Rest and recover. Your next workout is available tomorrow.
          </span>
        </div>
      )}

      {/* Injury & Limitation Safety Badge */}
      {injuriesList.length > 0 && (
        <div className="p-3.5 bg-subtle border border-data-carbs rounded-sm flex items-center gap-3 text-xs text-muted">
          
          <span>
            <strong className="text-ink">Injury Protection Filter:</strong> Routines safety-adjusted for <strong className="text-data-carbs">{injuriesList.join(', ')}</strong>.
          </span>
        </div>
      )}

      {/* Exercises List */}
      {loading ? (
        <SkeletonRows rows={5} />
      ) : loadError ? (
        <ErrorState title="Couldn't load your workout" message={loadError} onRetry={fetchWorkout} />
      ) : !workout || !workout.exercises || workout.exercises.length === 0 ? (
        <div className="bg-surface border border-line rounded-sm p-12 text-center space-y-4">
          
          <h3 className="text-lg font-bold text-ink">No workout routine active</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">Generate an AI-tailored workout program adapted to your equipment and goals.</p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-brand text-on-brand font-bold text-xs rounded-sm cursor-pointer"
          >
            Generate Today's Workout
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {workout.exercises.map((ex, idx) => {
            const isCompleted = ex.completedSets >= ex.sets;
            return (
              <div
                key={ex.id || idx}
                className={`bg-surface border rounded-sm p-6 transition ${
                  isCompleted ? 'border-line opacity-75' : 'border-line hover:border-line-strong'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleSet(ex.id)}
                      disabled={completedToday}
                      className={`disabled:cursor-default w-8 h-8 rounded-sm font-bold flex items-center justify-center transition cursor-pointer text-xs ${
                        isCompleted
                          ? 'bg-brand text-on-brand'
                          : 'border border-line text-ink hover:border-brand'
                      }`}
                    >
                      {isCompleted ? null : `${ex.completedSets || 0}/${ex.sets}`}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand uppercase tracking-wider">{ex.target || ex.muscleGroup || 'Compound'}</span>
                        {ex.isPR && (
                          <span className="text-[10px] bg-subtle text-warning border border-warning px-2 py-0.5 rounded-sm font-bold">
                            Personal Record
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base font-bold ${isCompleted ? 'line-through text-muted' : 'text-ink'}`}>
                        {ex.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSubstitute(ex.id)}
                      disabled={swappingExId === ex.id || completedToday}
                      className="px-3 py-1.5 bg-subtle hover:bg-subtle-hover border border-line rounded-sm text-xs font-semibold text-muted hover:text-ink transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      
                      <span>Substitute</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="text-muted max-w-xl leading-relaxed">
                    {ex.instructions || 'Control the eccentric phase and maintain proper bracing.'}
                  </div>

                  <div className="flex items-center gap-4 font-mono font-bold shrink-0">
                    <div className="text-ink">
                      <span className="text-muted font-sans font-normal">Sets:</span> {ex.sets}
                    </div>
                    <div className="text-ink">
                      <span className="text-muted font-sans font-normal">Reps:</span> {ex.reps}
                    </div>
                    <div className="text-brand">
                      <span className="text-muted font-sans font-normal">Target:</span> {ex.targetWeight || 'Bodyweight'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
}
