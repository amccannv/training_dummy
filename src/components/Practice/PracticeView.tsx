import { useEffect, useMemo } from 'react';
import { usePracticeStore } from '../../store/practiceStore';
import { useKeybindStore } from '../../store/keybindStore';
import { rotations } from '../../data/rotations';
import { usePracticeInput } from '../../hooks/usePracticeInput';
import { playCompleteSound } from '../../utils/audio';
import StepDisplay from './StepDisplay';
import ProgressBar from './ProgressBar';
import ResultsScreen from './ResultsScreen';
import './PracticeView.css';

export default function PracticeView() {
  const rotation = usePracticeStore((s) => s.rotation);
  const sessionActive = usePracticeStore((s) => s.sessionActive);
  const currentStepIndex = usePracticeStore((s) => s.currentStepIndex);
  const completedActions = usePracticeStore((s) => s.completedActions);
  const allResults = usePracticeStore((s) => s.allResults);
  const startPractice = usePracticeStore((s) => s.startPractice);
  const advanceStep = usePracticeStore((s) => s.advanceStep);
  const reset = usePracticeStore((s) => s.reset);

  const bindings = useKeybindStore((s) => s.bindings);
  const getBinding = useKeybindStore((s) => s.getBinding);

  const feedback = usePracticeInput();

  const defaultRotation = rotations[0];

  const hasAnyBindings = useMemo(
    () =>
      defaultRotation.steps.some((step) =>
        step.actions.some((aId) => bindings[aId] !== null),
      ),
    [bindings],
  );

  const unboundInRotation = useMemo(() => {
    const ids = new Set<string>();
    for (const step of defaultRotation.steps) {
      for (const aId of step.actions) {
        if (bindings[aId] === null) ids.add(aId);
      }
    }
    return ids.size;
  }, [bindings]);

  // Auto-advance when all actions in current step are hit
  useEffect(() => {
    if (!rotation || !sessionActive) return;
    const step = rotation.steps[currentStepIndex];
    if (!step) return;

    const boundInStep = step.actions.filter(
      (aId) => getBinding(aId) !== null,
    );

    if (
      boundInStep.length > 0 &&
      completedActions.length === boundInStep.length
    ) {
      advanceStep();
    }
  }, [completedActions, currentStepIndex, rotation, sessionActive, advanceStep, getBinding]);

  // Play sound on session completion
  useEffect(() => {
    if (!sessionActive && rotation && allResults.length > 0) {
      playCompleteSound();
    }
  }, [sessionActive, rotation, allResults.length]);

  // Idle: show start screen
  if (!rotation && !sessionActive) {
    return (
      <div className="practice-start">
        <h2 className="practice-title">{defaultRotation.name}</h2>
        <p className="practice-desc">
          {defaultRotation.steps.length} steps &middot;{' '}
          {defaultRotation.steps.reduce((s, st) => s + st.actions.length, 0)} actions
        </p>

        {!hasAnyBindings ? (
          <div className="no-bindings-notice">
            <p>No keybinds configured.</p>
            <p className="no-bindings-hint">
              Set some keybinds in the{' '}
              <span className="link-like">Edit Keybinds</span> tab first.
            </p>
          </div>
        ) : (
          <>
            {unboundInRotation > 0 && (
              <p className="unbound-warning">
                {unboundInRotation} action{unboundInRotation > 1 ? 's' : ''} without a keybind
                will be skipped.
              </p>
            )}
            <button
              className="btn-primary btn-start"
              onClick={() => startPractice(defaultRotation)}
            >
              Start Practice
            </button>
          </>
        )}
      </div>
    );
  }

  // Completed: show results
  if (!sessionActive && rotation) {
    return (
      <ResultsScreen
        rotation={rotation}
        allResults={allResults}
        onPracticeAgain={() => startPractice(defaultRotation)}
        onReset={reset}
      />
    );
  }

  // Practicing
  const currentStep = rotation!.steps[currentStepIndex];

  return (
    <div className="practice-active">
      <div className="practice-top-bar">
        <span className="practice-rotation-name">{rotation!.name}</span>
        <button className="btn-cancel" onClick={reset}>
          Cancel
        </button>
      </div>

      <ProgressBar current={currentStepIndex} total={rotation!.steps.length} />

      <StepDisplay
        step={currentStep}
        completedActions={completedActions}
        feedback={feedback}
        stepIndex={currentStepIndex}
        totalSteps={rotation!.steps.length}
      />
    </div>
  );
}
