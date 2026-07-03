import { useState, useRef, useEffect, useCallback } from 'react';
import { useRotationBuilderStore } from '../../store/rotationBuilderStore';
import { rotations as builtInRotations } from '../../data/rotations';
import { getUserRotations } from '../../utils/storage';
import type { Rotation } from '../../types';

export default function BuilderToolbar() {
  const name = useRotationBuilderStore((s) => s.name);
  const abilities = useRotationBuilderStore((s) => s.abilities);
  const isDirty = useRotationBuilderStore((s) => s.isDirty);
  const loadedRotationId = useRotationBuilderStore((s) => s.loadedRotationId);
  const setName = useRotationBuilderStore((s) => s.setName);
  const clearBuilder = useRotationBuilderStore((s) => s.clearBuilder);
  const saveRotation = useRotationBuilderStore((s) => s.saveRotation);
  const loadRotation = useRotationBuilderStore((s) => s.loadRotation);
  const deleteSaved = useRotationBuilderStore((s) => s.deleteSaved);
  const buildRotation = useRotationBuilderStore((s) => s.buildRotation);

  const [loadOpen, setLoadOpen] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userRotations, setUserRotations] = useState<Rotation[]>([]);

  useEffect(() => {
    if (!loadOpen) return;
    setUserRotations(getUserRotations());
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLoadOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [loadOpen]);

  useEffect(() => {
    if (!savedToast) return;
    const t = setTimeout(() => setSavedToast(false), 2000);
    return () => clearTimeout(t);
  }, [savedToast]);

  const handleSave = useCallback(() => {
    saveRotation();
    setSavedToast(true);
  }, [saveRotation]);

  const handleClear = useCallback(() => {
    if (isDirty && abilities.length > 0) {
      setClearConfirm(true);
    } else {
      clearBuilder();
    }
  }, [isDirty, abilities.length, clearBuilder]);

  const handleDelete = useCallback(() => {
    if (!loadedRotationId) return;
    setDeleteConfirm(true);
  }, [loadedRotationId]);

  const confirmDelete = useCallback(() => {
    if (!loadedRotationId) return;
    deleteSaved(loadedRotationId);
    setDeleteConfirm(false);
  }, [loadedRotationId, deleteSaved]);

  const handleDuplicate = useCallback(() => {
    const rot = buildRotation();
    loadRotation({
      ...rot,
      id: `user-${Date.now()}`,
      name: `${rot.name} (Copy)`,
    });
  }, [buildRotation, loadRotation]);

  const handleLoad = useCallback(
    (rotation: Rotation) => {
      if (isDirty && !window.confirm('You have unsaved changes. Discard?')) return;
      loadRotation(rotation);
      setLoadOpen(false);
    },
    [isDirty, loadRotation],
  );

  const canSave = name.trim().length > 0 && abilities.length > 0;
  const isUserRotation = loadedRotationId?.startsWith('user-') ?? false;
  const isBuiltIn = !!loadedRotationId && !isUserRotation;

  return (
    <div className="builder-toolbar">
      <div className="toolbar-row">
        <input
          className="toolbar-name-input"
          type="text"
          placeholder="Untitled Rotation"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="toolbar-actions">
          <button
            className="toolbar-btn toolbar-btn-save"
            disabled={!canSave}
            onClick={handleSave}
          >
            Save
          </button>

          <div className="toolbar-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="toolbar-btn"
              onClick={() => setLoadOpen(!loadOpen)}
            >
              Load &#9662;
            </button>
            {loadOpen && (
              <div className="toolbar-dropdown">
                <div className="toolbar-dropdown-header">Built-in Rotations</div>
                {builtInRotations.map((r) => (
                  <button
                    key={r.id}
                    className="toolbar-dropdown-item"
                    onClick={() => handleLoad(r)}
                    type="button"
                  >
                    <span className="dropdown-item-name">{r.name}</span>
                    <span className="dropdown-item-count">{r.abilities.length} actions</span>
                  </button>
                ))}

                {userRotations.length > 0 && (
                  <>
                    <div className="toolbar-dropdown-divider" />
                    <div className="toolbar-dropdown-header">My Rotations</div>
                    {userRotations.map((r) => (
                      <button
                        key={r.id}
                        className="toolbar-dropdown-item"
                        onClick={() => handleLoad(r)}
                        type="button"
                      >
                        <span className="dropdown-item-name">{r.name}</span>
                        <span className="dropdown-item-count">{r.abilities.length} actions</span>
                      </button>
                    ))}
                  </>
                )}

                {userRotations.length === 0 && (
                  <div className="toolbar-dropdown-empty">No saved rotations yet</div>
                )}
              </div>
            )}
          </div>

          <button className="toolbar-btn" onClick={handleDuplicate}>
            Duplicate
          </button>

          <div className="toolbar-dropdown-wrapper">
            <button className="toolbar-btn toolbar-btn-clear" onClick={handleClear}>
              Clear
            </button>
            {clearConfirm && (
              <div className="toolbar-confirm-popup">
                <span className="toolbar-confirm-text">Clear all actions?</span>
                <div className="toolbar-confirm-actions">
                  <button
                    className="toolbar-confirm-cancel"
                    onClick={() => setClearConfirm(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="toolbar-confirm-do"
                    onClick={() => { clearBuilder(); setClearConfirm(false); }}
                    type="button"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {(isUserRotation || isBuiltIn) && (
            <div className="toolbar-dropdown-wrapper">
              <button
                className="toolbar-btn toolbar-btn-delete"
                onClick={handleDelete}
                disabled={isBuiltIn}
                title={isBuiltIn ? 'Built-in rotations cannot be deleted' : undefined}
              >
                Delete
              </button>
              {deleteConfirm && (
                <div className="toolbar-confirm-popup">
                  <span className="toolbar-confirm-text">Delete this rotation?</span>
                  <div className="toolbar-confirm-actions">
                    <button
                      className="toolbar-confirm-cancel"
                      onClick={() => setDeleteConfirm(false)}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button className="toolbar-confirm-do" onClick={confirmDelete} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {savedToast && (
        <div className="toolbar-toast">
          Saved!
        </div>
      )}

      {isDirty && (
        <div className="toolbar-dirty-indicator">
          Unsaved changes
        </div>
      )}
    </div>
  );
}
