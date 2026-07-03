import type { ActionDefinition } from '../../types';
import { useKeybindStore } from '../../store/keybindStore';
import type { ConflictInfo } from '../../hooks/useKeybindCapture';
import KeyDisplay from '../shared/KeyDisplay';

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

  let className = 'action-row';
  if (isCapturing) className += ' capturing';

  return (
    <div className={className}>
      <span className="action-name">
        {action.iconUrl && (
          <img className="action-icon" src={action.iconUrl} alt="" />
        )}
        {action.name}
      </span>

      {isCapturing && conflict && (
        <div className="conflict-popup">
          <span className="conflict-popup-text">
            {conflict.keybind} is already bound by{' '}
            {conflict.conflictIconUrl && (
              <img className="conflict-popup-icon" src={conflict.conflictIconUrl} alt="" />
            )}
            {conflict.conflictName}
          </span>
        </div>
      )}

      <div className="action-controls">
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
