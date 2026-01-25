/**
 * Staging State Management
 * 
 * Authoritative storage for pre-session authoring state.
 * Manages staging state CRUD operations, snapshot creation, and locking.
 * 
 * Session-first approach: Session must exist before staging state can be created.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure staging directory exists
const STAGING_DIR = path.join(__dirname, 'staging');
if (!fs.existsSync(STAGING_DIR)) {
  fs.mkdirSync(STAGING_DIR, { recursive: true });
}

// In-memory locks for concurrent write protection
const locks = new Map(); // stagingId → lock timestamp

// In-memory cache for staging state lookups
const stagingBySessionId = new Map(); // sessionId → stagingId

/**
 * Generate staging ID
 * @returns {string} Unique staging identifier
 */
function generateStagingId() {
  return `stg_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

/**
 * Get staging directory path for a staging ID
 * @param {string} stagingId - Staging identifier
 * @returns {string} Directory path
 */
function getStagingDir(stagingId) {
  return path.join(STAGING_DIR, stagingId);
}

/**
 * Get staging state file path
 * @param {string} stagingId - Staging identifier
 * @returns {string} File path
 */
function getStateFilePath(stagingId) {
  return path.join(getStagingDir(stagingId), 'state.json');
}

/**
 * Get snapshot file path
 * @param {string} stagingId - Staging identifier
 * @param {string} snapshotId - Snapshot identifier
 * @returns {string} File path
 */
function getSnapshotFilePath(stagingId, snapshotId) {
  return path.join(getStagingDir(stagingId), `snapshot_${snapshotId}.json`);
}

/**
 * Acquire lock for staging state
 * @param {string} stagingId - Staging identifier
 * @throws {Error} If staging state is already locked
 */
function acquireLock(stagingId) {
  if (locks.has(stagingId)) {
    throw new Error(`Staging state ${stagingId} is locked`);
  }
  locks.set(stagingId, Date.now());
}

/**
 * Release lock for staging state
 * @param {string} stagingId - Staging identifier
 */
function releaseLock(stagingId) {
  locks.delete(stagingId);
}

/**
 * Build default Focus Cue (system-generated)
 * @param {string} sessionId - Session identifier
 * @returns {Object} Default Focus Cue
 */
function buildDefaultFocusCue(sessionId) {
  return {
    id: `focus_system_${Date.now()}`,
    text: 'Open Conversation',
    order: 0,
    createdAt: new Date().toISOString(),
    isSystemDefault: true,
  };
}

/**
 * Migrate staging state from separate arrays to unified stack
 * Lazy migration: converts old format to new format on read
 * 
 * @param {Object} stagingState - Staging state (may be old or new format)
 * @returns {Object} Staging state with unified stack
 */
function migrateToUnifiedStack(stagingState) {
  if (!stagingState) {
    return null;
  }

  // Already migrated if cues array exists
  if (stagingState.cues && Array.isArray(stagingState.cues)) {
    return stagingState;
  }

  // Convert separate arrays to unified stack
  const cues = [];
  let position = 0;

  // Convert focus cues
  if (stagingState.focusCues && Array.isArray(stagingState.focusCues)) {
    stagingState.focusCues.forEach(cue => {
      cues.push({
        id: cue.id,
        type: 'focus',
        position: position++,
        data: {
          text: cue.text,
          isDefault: cue.isDefault || cue.id === stagingState.entryState?.defaultFocusCueId,
        },
        createdAt: cue.createdAt || new Date().toISOString(),
        updatedAt: cue.updatedAt || cue.createdAt || new Date().toISOString(),
      });
    });
  }

  // Convert media cues
  if (stagingState.mediaCues && Array.isArray(stagingState.mediaCues)) {
    stagingState.mediaCues.forEach(cue => {
      cues.push({
        id: cue.id,
        type: 'media',
        position: position++,
        data: {
          label: cue.label,
          source: cue.source || {},
          playback: cue.playback || {},
          binding: cue.binding,
          validation: cue.validation || { status: 'unvalidated' },
        },
        createdAt: cue.createdAt || new Date().toISOString(),
        updatedAt: cue.updatedAt || cue.createdAt || new Date().toISOString(),
      });
    });
  }

  // Create migrated state
  const migrated = {
    ...stagingState,
    cues,
    currentPosition: stagingState.currentPosition !== undefined ? stagingState.currentPosition : -1,
    // Keep old arrays for backward compat during transition
    focusCues: stagingState.focusCues,
    mediaCues: stagingState.mediaCues,
    updatedAt: new Date().toISOString(),
  };

  // Save migrated state back to disk
  if (stagingState.stagingId) {
    try {
      const filePath = getStateFilePath(stagingState.stagingId);
      fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2));
      console.log(`[staging.state] Migrated staging state to unified stack: ${stagingState.stagingId}`);
    } catch (err) {
      console.error(`[staging.state] Error saving migrated state: ${err.message}`);
    }
  }

  return migrated;
}

/**
 * Create default staging state structure
 * @param {string} sessionId - Session identifier
 * @returns {Object} Default staging state
 */
function createDefaultStagingState(sessionId) {
  const defaultFocusCue = buildDefaultFocusCue(sessionId);
  
  // Create unified stack with default focus cue
  const defaultCue = {
    id: defaultFocusCue.id,
    type: 'focus',
    position: 0,
    data: {
      text: defaultFocusCue.text,
      isDefault: true,
    },
    createdAt: defaultFocusCue.createdAt,
    updatedAt: defaultFocusCue.createdAt,
  };
  
  return {
    sessionId,
    stagingId: generateStagingId(),
    state: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isReadOnly: false,
    // Unified stack (primary)
    cues: [defaultCue],
    currentPosition: -1, // Not started
    // Legacy arrays (for backward compatibility during transition)
    focusCues: [defaultFocusCue],
    mediaCues: [],
    entryState: {
      defaultFocusCueId: defaultFocusCue.id,
      focusVisibleOnJoin: true,
      chatOpenOnJoin: true,
      // Anonymity is always ON and is not configurable (see visual-meaning-and-anonymity-contract.md)
      anonymityDefault: 'on',
      welcomeMessage: undefined,
    },
    requirements: {
      stageExecutorRequired: true, // Stage Engine is always required for baseline
      slideControlRequired: false,
    },
    validation: {
      executor: {
        status: 'unvalidated',
        reasons: [],
        lastChecked: undefined,
      },
      slideControl: {
        status: 'unvalidated',
        reasons: [],
        lastChecked: undefined,
      },
      media: {},
    },
  };
}

/**
 * Get or create staging state for a session
 * Session must exist first (Option B approach)
 * 
 * @param {string} sessionId - Session identifier
 * @returns {Object} Staging state
 */
export function getOrCreateStagingState(sessionId) {
  if (!sessionId) {
    throw new Error('[staging.state] sessionId required');
  }

  // Check if staging state already exists for this session
  if (stagingBySessionId.has(sessionId)) {
    const stagingId = stagingBySessionId.get(sessionId);
    return getStagingState(stagingId);
  }

  // Create new staging state
  const stagingState = createDefaultStagingState(sessionId);
  const stagingId = stagingState.stagingId;
  
  // Create directory
  const dir = getStagingDir(stagingId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save to disk
  const filePath = getStateFilePath(stagingId);
  fs.writeFileSync(filePath, JSON.stringify(stagingState, null, 2));

  // Cache mapping
  stagingBySessionId.set(sessionId, stagingId);

  console.log(`[staging.state] Created staging state: ${stagingId} for session: ${sessionId}`);
  
  return stagingState;
}

/**
 * Get staging state by session ID
 * Migrates to unified stack format if needed
 * 
 * @param {string} sessionId - Session identifier
 * @returns {Object|null} Staging state or null if not found
 */
export function getStagingStateBySessionId(sessionId) {
  if (!sessionId) {
    return null;
  }

  if (stagingBySessionId.has(sessionId)) {
    const stagingId = stagingBySessionId.get(sessionId);
    return getStagingState(stagingId);
  }

  // Try to find existing staging state on disk
  const stagingDir = STAGING_DIR;
  if (!fs.existsSync(stagingDir)) {
    return null;
  }

  const dirs = fs.readdirSync(stagingDir);
  for (const dir of dirs) {
    const statePath = path.join(stagingDir, dir, 'state.json');
    if (fs.existsSync(statePath)) {
      try {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        if (state.sessionId === sessionId) {
          stagingBySessionId.set(sessionId, state.stagingId);
          // Migrate to unified stack if needed
          return migrateToUnifiedStack(state);
        }
      } catch (err) {
        console.error(`[staging.state] Error reading staging state: ${err.message}`);
      }
    }
  }

  return null;
}

/**
 * Get staging state by staging ID
 * Migrates to unified stack format if needed
 * 
 * @param {string} stagingId - Staging identifier
 * @returns {Object|null} Staging state or null if not found
 */
export function getStagingState(stagingId) {
  if (!stagingId) {
    return null;
  }

  const filePath = getStateFilePath(stagingId);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const state = JSON.parse(data);
    
    // Cache mapping if not already cached
    if (state.sessionId && !stagingBySessionId.has(state.sessionId)) {
      stagingBySessionId.set(state.sessionId, stagingId);
    }
    
    // Migrate to unified stack if needed
    return migrateToUnifiedStack(state);
  } catch (err) {
    console.error(`[staging.state] Error reading staging state: ${err.message}`);
    return null;
  }
}

/**
 * Update staging state
 * Ensures unified stack format before update
 * 
 * @param {string} stagingId - Staging identifier
 * @param {Object} updates - Partial state updates
 * @param {Object} options - Options
 * @param {boolean} options.checkReadOnly - Check if read-only (default: true)
 * @returns {Object} Updated staging state
 * @throws {Error} If staging state is read-only or locked
 */
export function updateStagingState(stagingId, updates = {}, options = {}) {
  const { checkReadOnly = true } = options;

  const currentState = getStagingState(stagingId);
  if (!currentState) {
    throw new Error(`[staging.state] Staging state not found: ${stagingId}`);
  }

  // Ensure unified format (migration happens in getStagingState)
  if (!currentState.cues || !Array.isArray(currentState.cues)) {
    throw new Error(`[staging.state] Staging state must have unified stack format: ${stagingId}`);
  }

  // Check read-only
  if (checkReadOnly && currentState.isReadOnly) {
    throw new Error(`[staging.state] Staging state is read-only: ${stagingId}`);
  }

  // Check lock
  if (locks.has(stagingId)) {
    throw new Error(`[staging.state] Staging state is locked: ${stagingId}`);
  }

  // Merge updates
  const updatedState = {
    ...currentState,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Save to disk
  const filePath = getStateFilePath(stagingId);
  fs.writeFileSync(filePath, JSON.stringify(updatedState, null, 2));

  return updatedState;
}

/**
 * Create baseline snapshot from staging state
 * Atomic operation - locks staging state during snapshot creation
 * Creates immutable baseline snapshot per hybrid snapshot model
 * 
 * @param {string} stagingId - Staging identifier
 * @returns {Object} Baseline snapshot object with snapshotId
 * @throws {Error} If staging state is locked or read-only
 */
export function createSnapshot(stagingId) {
  // Acquire lock
  acquireLock(stagingId);

  try {
    const stagingState = getStagingState(stagingId);
    if (!stagingState) {
      throw new Error(`[staging.state] Staging state not found: ${stagingId}`);
    }

    if (stagingState.isReadOnly) {
      throw new Error(`[staging.state] Cannot snapshot read-only staging state: ${stagingId}`);
    }

    // Generate snapshot ID
    const snapshotId = `snapshot_baseline_${Date.now()}_${randomUUID().slice(0, 8)}`;

    // Create baseline snapshot (immutable copy of unified stack)
    const baselineSnapshot = {
      snapshotId,
      sessionId: stagingState.sessionId,
      createdAt: new Date().toISOString(),
      isBaseline: true,
      // Deep copy unified stack
      cues: JSON.parse(JSON.stringify(stagingState.cues || [])),
      currentPosition: -1, // Always -1 for baseline
      entryState: JSON.parse(JSON.stringify(stagingState.entryState)),
      requirements: JSON.parse(JSON.stringify(stagingState.requirements)),
      validation: JSON.parse(JSON.stringify(stagingState.validation)),
      // Keep legacy arrays for backward compatibility
      focusCues: JSON.parse(JSON.stringify(stagingState.focusCues || [])),
      mediaCues: JSON.parse(JSON.stringify(stagingState.mediaCues || [])),
    };

    // Save baseline snapshot to disk
    const snapshotPath = getSnapshotFilePath(stagingId, snapshotId);
    fs.writeFileSync(snapshotPath, JSON.stringify(baselineSnapshot, null, 2));

    // Mark staging state as read-only
    updateStagingState(stagingId, { isReadOnly: true }, { checkReadOnly: false });

    console.log(`[staging.state] Created baseline snapshot: ${snapshotId} for staging: ${stagingId}`);

    return baselineSnapshot;
  } finally {
    // Always release lock
    releaseLock(stagingId);
  }
}

/**
 * Get snapshot by snapshot ID
 * 
 * @param {string} stagingId - Staging identifier
 * @param {string} snapshotId - Snapshot identifier
 * @returns {Object|null} Snapshot or null if not found
 */
export function getSnapshot(stagingId, snapshotId) {
  if (!stagingId || !snapshotId) {
    return null;
  }

  const snapshotPath = getSnapshotFilePath(stagingId, snapshotId);
  if (!fs.existsSync(snapshotPath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(snapshotPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`[staging.state] Error reading snapshot: ${err.message}`);
    return null;
  }
}

/**
 * Calculate readiness state (DRAFT or STAGED)
 * Works with both unified stack and legacy format
 * 
 * @param {Object} stagingState - Staging state
 * @returns {string} 'DRAFT' or 'STAGED'
 */
export function calculateReadiness(stagingState) {
  // #region agent log
  try {
    fs.appendFileSync('/Users/jeffwinkler/Documents/GitHub/amplifyed-pulse-ui/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'3',location:'staging.state.js:calculateReadiness',message:'Calculating readiness',data:{requirements: stagingState?.requirements, validation: stagingState?.validation},timestamp:Date.now()}) + '\n');
  } catch(e) {}
  // #endregion
  if (!stagingState) {
    return 'DRAFT';
  }

  // Required checks
  if (!stagingState.entryState?.defaultFocusCueId) {
    return 'DRAFT';
  }

  // Check for focus cues (unified stack or legacy format)
  let hasFocusCues = false;
  let defaultExists = false;

  if (stagingState.cues && Array.isArray(stagingState.cues)) {
    // Unified stack format
    const focusCues = stagingState.cues.filter(cue => cue.type === 'focus');
    hasFocusCues = focusCues.length > 0;
    defaultExists = focusCues.some(
      (cue) => cue.id === stagingState.entryState.defaultFocusCueId
    );
  } else if (stagingState.focusCues && Array.isArray(stagingState.focusCues)) {
    // Legacy format
    hasFocusCues = stagingState.focusCues.length > 0;
    defaultExists = stagingState.focusCues.some(
      (cue) => cue.id === stagingState.entryState.defaultFocusCueId
    );
  }

  if (!hasFocusCues) {
    return 'DRAFT';
  }

  if (!defaultExists) {
    return 'DRAFT';
  }

  // Required subsystem checks
  if (stagingState.requirements?.stageExecutorRequired) {
    const executorStatus = stagingState.validation?.executor?.status;
    if (executorStatus !== 'ready') {
      return 'DRAFT';
    }
  }

  if (stagingState.requirements?.slideControlRequired) {
    const slideStatus = stagingState.validation?.slideControl?.status;
    if (slideStatus !== 'ready') {
      return 'DRAFT';
    }
  }

  return 'STAGED';
}
