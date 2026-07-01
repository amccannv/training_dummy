import type { ActionDefinition } from '../../types';
import { useKeybindStore } from '../../store/keybindStore';
import KeyDisplay from '../shared/KeyDisplay';
import type { ConflictInfo } from '../../hooks/useKeybindCapture';

interface ActionRowProps {
  action: ActionDefinition;
  isCapturing: boolean;
  conflict: ConflictInfo | null;
  onStartCapture: (actionId: string) => void;
}

export default function ActionRow({
  action,
  isCapturing,
  conflict,
  onStartCapture,
}: ActionRowProps) {
  const binding = useKeybindStore((s) => s.bindings[action.id]);
  const clearBinding = useKeybindStore((s) => s.clearBinding);

  const isConflicted = conflict?.actionId === action.id;

  let className = 'action-row';
  if (isCapturing) className += ' capturing';
  if (isConflicted) className += ' conflict';

  return (
    <div className={className}>
      <span className="action-name">
        {action.iconUrl && (
          <img className="action-icon" src={action.iconUrl} alt="" />
        )}
        {action.name}
      </span>

      <div className="action-controls">
        {isConflicted && (
          <span className="conflict-warn">Already bound</span>
        )}

        {binding && !isCapturing && (
          <button
            className="action-clear"
            onClick={(e) => {
              e.stopPropagation();
              clearBinding(action.id);
            }}
            title="Clear binding"
          >
            &times;
          </button>
        )}

        <button
          className="action-keybind"
          onClick={() => onStartCapture(action.id)}
          disabled={isCapturing}
        >
          <KeyDisplay keybind={binding} capturing={isCapturing} />
        </button>
      </div>
    </div>
  );
}
