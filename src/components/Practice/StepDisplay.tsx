import type { RotationStep } from '../../types';
import { actions } from '../../data/actions';
import { useKeybindStore } from '../../store/keybindStore';
import { formatKeybind } from '../../utils/keybindFormat';
import type { PracticeFeedback } from '../../hooks/usePracticeInput';

interface StepDisplayProps {
  step: RotationStep;
  completedActions: string[];
  feedback: PracticeFeedback | null;
  stepIndex: number;
  totalSteps: number;
}

function getActionDef(actionId: string) {
  return actions.find((a) => a.id === actionId);
}

export default function StepDisplay({
  step,
  completedActions,
  feedback,
  stepIndex,
  totalSteps,
}: StepDisplayProps) {
  const bindings = useKeybindStore((s) => s.bindings);

  return (
    <div className="step-display">
      <div className="step-header">
        <span className="step-counter">
          Step {stepIndex + 1} of {totalSteps}
        </span>
        <span className="step-hint">Press the key for each action</span>
      </div>

      <div className="step-actions">
        {step.actions.map((actionId) => {
          const def = getActionDef(actionId);
          const name = def?.name ?? actionId;
          const iconUrl = def?.iconUrl;
          const isCompleted = completedActions.includes(actionId);
          const isJustHit =
            feedback?.type === 'hit' && feedback.actionId === actionId;
          const isMissed = feedback?.type === 'miss' && !isCompleted;

          let className = 'action-badge';
          if (isCompleted) className += ' completed';
          if (isJustHit) className += ' hit-flash';
          if (isMissed && !isCompleted) className += ' miss-flash';

          const binding = bindings[actionId];

          return (
            <div key={actionId} className={className}>
              {iconUrl && <img className="badge-icon" src={iconUrl} alt="" />}
              <span className="badge-name">{name}</span>
              <span className="badge-key">
                {binding ? formatKeybind(binding) : '—'}
              </span>
              {isCompleted && <span className="badge-check">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
