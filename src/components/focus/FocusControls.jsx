import React, { useMemo, useState } from "react";

/**
 * Focus Box (Trainer View)
 *
 * - Add creates an inactive entry
 * - Selecting an entry activates it immediately
 * - Clear is reset to default ("Open Conversation")
 * - Editing requires explicit mode: edit-in-place OR revise-by-new
 *
 * @param {object} props
 * @param {string} props.focusInput - Current focus input value
 * @param {function} props.setFocusInput - Setter for focus input
 * @param {Array} props.entries - Focus entries list (trainer-only)
 * @param {string} props.activeFocusId - Active focus id
 * @param {string} props.activeFocusText - Active focus text
 * @param {string} props.defaultFocusId - Default baseline focus id
 * @param {function} props.handleAddFocus - Handler for adding a focus (inactive)
 * @param {function} props.handleActivateFocus - Handler for activating by id
 * @param {function} props.handleResetToDefault - Handler for reset to default
 * @param {function} props.handleReorder - Handler for reorder (orderedFocusIds[])
 * @param {function} props.handleEditInPlace - Handler for edit-in-place ({focusId,text})
 * @param {function} props.handleReviseByNew - Handler for revise-by-new ({focusId,text})
 */
export function FocusControls({
  focusInput,
  setFocusInput,
  entries,
  activeFocusId,
  activeFocusText,
  defaultFocusId,
  handleAddFocus,
  handleActivateFocus,
  handleResetToDefault,
  handleReorder,
  handleEditInPlace,
  handleReviseByNew,
}) {
  const [editingFocusId, setEditingFocusId] = useState(null);
  const [editDraft, setEditDraft] = useState("");

  const orderedIds = useMemo(
    () => (Array.isArray(entries) ? entries.map((e) => e.focusId) : []),
    [entries]
  );

  const beginEdit = (entry) => {
    setEditingFocusId(entry.focusId);
    setEditDraft(entry.text ?? "");
  };

  const cancelEdit = () => {
    setEditingFocusId(null);
    setEditDraft("");
  };

  const moveEntry = (focusId, direction) => {
    const idx = orderedIds.indexOf(focusId);
    if (idx === -1) return;
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= orderedIds.length) return;
    const next = [...orderedIds];
    const [item] = next.splice(idx, 1);
    next.splice(nextIdx, 0, item);
    handleReorder(next);
  };

  return (
    <section className="trainer-focus-controls">
      <h3 className="trainer-section-heading">Focus</h3>

      <p className="trainer-text-muted trainer-focus-help">
        Active: <strong>{activeFocusText}</strong>
      </p>

      <form onSubmit={handleAddFocus}>
        <input
          type="text"
          placeholder="Enter focus statement…"
          value={focusInput}
          onChange={(event) => setFocusInput(event.target.value)}
          className="trainer-focus-input"
        />

        <div className="trainer-focus-actions">
          <button className="trainer-focus-button" type="submit">
            Add
          </button>
          <button
            className="trainer-focus-button trainer-focus-button--secondary"
            type="button"
            onClick={handleResetToDefault}
            title='Reset active focus to "Open Conversation"'
          >
            Reset
          </button>
        </div>
      </form>

      <ul className="trainer-focus-list">
        {(entries ?? []).map((entry) => {
          const isActive = entry?.focusId === activeFocusId;
          const isDefault = entry?.focusId === defaultFocusId;
          const isEditing = editingFocusId === entry?.focusId;

          return (
            <li key={entry?.focusId} className="trainer-focus-list-item">
              <button
                type="button"
                className="trainer-focus-entry"
                data-active={isActive ? "true" : "false"}
                onClick={() => handleActivateFocus(entry.focusId)}
                title={isActive ? "Active focus" : "Click to activate"}
              >
                {entry?.text ?? ""}
                {isDefault ? " (default)" : ""}
              </button>

              <div className="trainer-focus-entry-actions">
                <button
                  type="button"
                  className="trainer-focus-entry-action"
                  onClick={() => moveEntry(entry.focusId, -1)}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="trainer-focus-entry-action"
                  onClick={() => moveEntry(entry.focusId, +1)}
                  title="Move down"
                >
                  ↓
                </button>

                <button
                  type="button"
                  className="trainer-focus-entry-action"
                  onClick={() => beginEdit(entry)}
                  title="Edit"
                >
                  Edit
                </button>
              </div>

              {isEditing && (
                <div className="trainer-focus-edit-panel">
                  <input
                    className="trainer-focus-input"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                  />
                  <div className="trainer-focus-actions">
                    <button
                      type="button"
                      className="trainer-focus-button"
                      onClick={() => {
                        handleEditInPlace({ focusId: entry.focusId, text: editDraft });
                        cancelEdit();
                      }}
                      title="Edit-in-Place (wording-only)"
                    >
                      Save (in place)
                    </button>
                    <button
                      type="button"
                      className="trainer-focus-button"
                      onClick={() => {
                        handleReviseByNew({ focusId: entry.focusId, text: editDraft });
                        cancelEdit();
                      }}
                      title="Revise-by-New (creates a new entry)"
                    >
                      Save as new
                    </button>
                    <button
                      type="button"
                      className="trainer-focus-button trainer-focus-button--secondary"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
