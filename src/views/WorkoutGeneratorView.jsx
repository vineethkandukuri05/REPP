import React, { useState } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  Dumbbell,
  Play,
  CheckCircle2,
  RefreshCw,
  Award,
  Clock,
  Flame,
  Plus,
  Minus,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  X,
  History
} from 'lucide-react';

export default function WorkoutGeneratorView({ workoutPlan, userProfile, onCompleteWorkout }) {
  const [exercises, setExercises] = useState(workoutPlan.exercises);
  const [inWorkoutMode, setInWorkoutMode] = useState(false);
  const [activeTimer, setActiveTimer] = useState(0);
  const [selectedSubstitution, setSelectedSubstitution] = useState(null); // Modal for exercise substitution
  const [showHistory, setShowHistory] = useState(false);

  const handleToggleSet = (exId) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        const nextSets = ex.completedSets >= ex.sets ? 0 : ex.completedSets + 1;
        return { ...ex, completedSets: nextSets };
      }
      return ex;
    }));
  };

  const handleSubstitute = (exId, newName) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          name: newName,
          instructions: `Substituted exercise for safety. Focus on smooth mechanical tension on targeted muscle group.`
        };
      }
      return ex;
    }));
    setSelectedSubstitution(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Workout Generator
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{workoutPlan.dayName}</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 flex items-center gap-3">
            <span>Split: <strong className="text-white">{workoutPlan.split}</strong></span>
            <span>Duration: <strong className="text-white">{workoutPlan.duration} Mins</strong></span>
            <span>Level: <strong className="text-[#C6FF00]">{workoutPlan.difficulty}</strong></span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2.5 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <History className="w-4 h-4 text-[#94A3B8]" /> Workout History
          </button>

          {!inWorkoutMode ? (
            <button
              onClick={() => setInWorkoutMode(true)}
              className="px-5 py-2.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2 lime-glow"
            >
              <Play className="w-4 h-4 fill-black" /> Start Gym Session
            </button>
          ) : (
            <button
              onClick={() => { setInWorkoutMode(false); if (onCompleteWorkout) onCompleteWorkout(); }}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Finish & Log Workout
            </button>
          )}
        </div>
      </div>

      {/* Injury & Limitation Safety Badge */}
      {userProfile.injuries?.length > 0 && (
        <div className="p-3.5 bg-[#191C28] border border-cyan-500/30 rounded-2xl flex items-center gap-3 text-xs text-[#94A3B8]">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">Injury Filter Active:</strong> Routines auto-adjusted for <strong className="text-cyan-400">{userProfile.injuries.join(', ')}</strong>.
          </span>
        </div>
      )}

      {/* Workout History Drawer */}
      {showHistory && (
        <div className="p-6 bg-[#12141D] border border-[#2D3245] rounded-3xl space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Past Completed Sessions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#191C28] rounded-xl border border-[#2D3245]">
              <div className="font-bold text-white">Sep 17 • Lower Body Hypertrophy</div>
              <div className="text-[11px] text-[#94A3B8] mt-1">45 mins • 4 exercises • Squats PR 110kg</div>
            </div>
            <div className="p-3 bg-[#191C28] rounded-xl border border-[#2D3245]">
              <div className="font-bold text-white">Sep 15 • Upper Body Power</div>
              <div className="text-[11px] text-[#94A3B8] mt-1">50 mins • 5 exercises • Incline Press 24kg</div>
            </div>
            <div className="p-3 bg-[#191C28] rounded-xl border border-[#2D3245]">
              <div className="font-bold text-white">Sep 13 • Core & Conditioning</div>
              <div className="text-[11px] text-[#94A3B8] mt-1">35 mins • 6 exercises • 8,500 steps</div>
            </div>
          </div>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-4">
        {exercises.map((ex, index) => {
          const isFinished = ex.completedSets >= ex.sets;
          return (
            <div
              key={ex.id}
              className={`bg-[#12141D] border rounded-3xl p-6 transition ${
                isFinished ? 'border-emerald-500/40 bg-[#12141D]/80' : 'border-[#2D3245] hover:border-[#C6FF00]/40'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#2D3245]">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#191C28] border border-[#2D3245] text-xs font-extrabold text-[#C6FF00] flex items-center justify-center">
                    0{index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-white">{ex.name}</h3>
                      {ex.isPR && (
                        <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <Award className="w-3 h-3" /> PR Weight
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#94A3B8]">{ex.target} • {ex.equipment}</span>
                  </div>
                </div>

                {/* Reps, Sets & Substitution Action */}
                <div className="flex items-center gap-4">
                  <div className="text-right font-mono text-xs">
                    <div className="font-extrabold text-white">{ex.sets} Sets x {ex.reps} Reps</div>
                    <div className="text-[#C6FF00]">{ex.targetWeight} Target</div>
                  </div>

                  <button
                    onClick={() => setSelectedSubstitution(ex)}
                    className="p-2 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#C6FF00]" /> Substitute
                  </button>
                </div>
              </div>

              {/* Exercise Details & Set Completion Buttons */}
              <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xl">
                  <strong className="text-white">Form Cue:</strong> {ex.instructions}
                </p>

                {/* Set Trackers */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#94A3B8] font-bold mr-2">Completed Sets:</span>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: ex.sets }).map((_, sIdx) => {
                      const setDone = sIdx < ex.completedSets;
                      return (
                        <button
                          key={sIdx}
                          onClick={() => handleToggleSet(ex.id)}
                          className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                            setDone ? 'bg-[#C6FF00] text-black shadow' : 'bg-[#191C28] text-[#94A3B8] border border-[#2D3245]'
                          }`}
                        >
                          {sIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exercise Substitution Modal */}
      {selectedSubstitution && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 max-w-md w-full relative space-y-4">
            <button
              onClick={() => setSelectedSubstitution(null)}
              className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-white">Substitute Exercise</h3>
            <p className="text-xs text-[#94A3B8]">Choose an alternative movement for {selectedSubstitution.name}</p>

            <div className="space-y-2">
              {selectedSubstitution.substitutions?.map((subName, i) => (
                <button
                  key={i}
                  onClick={() => handleSubstitute(selectedSubstitution.id, subName)}
                  className="w-full p-3 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] hover:border-[#C6FF00] rounded-xl text-left text-xs font-bold text-white transition cursor-pointer flex items-center justify-between"
                >
                  <span>{subName}</span>
                  <ChevronRight className="w-4 h-4 text-[#C6FF00]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <MedicalDisclaimer compact={true} />
    </div>
  );
}
