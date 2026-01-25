/**
 * Hybrid Snapshot Management
 * 
 * Implements baseline + incremental revision model for unified cue stack.
 * Baseline snapshots are immutable. Live insertions create incremental revisions.
 * 
 * Per Unified Cue Stack Contract Section 11.2
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure staging directory exists
const STAGING_DIR = path.join(__dirname, 'staging');

/**
 * Get staging directory path for a staging ID
 * @param {string} stagingId - Staging identifier
 * @returns {string} Directory path
 */
function getStagingDir(stagingId) {
  return path.join(STAGING_DIR, stagingId);
}

/**
 * Get baseline snapshot file path
 * @param {string} stagingId - Staging identifier
 * @param {string} snapshotId - Snapshot identifier
 * @returns {string} File path
 */
function getBaselineSnapshotPath(stagingId, snapshotId) {
  return path.join(getStagingDir(stagingId), `snapshot_baseline_${snapshotId.replace('snapshot_baseline_', '')}.json`);
}

/**
 * Get revision snapshot file path
 * @param {string} stagingId - Staging identifier
 * @param {string} revisionId - Revision identifier
 * @returns {string} File path
 */
function getRevisionSnapshotPath(stagingId, revisionId) {
  return path.join(getStagingDir(stagingId), `snapshot_revision_${revisionId.replace('snapshot_revision_', '')}.json`);
}

/**
 * Create baseline snapshot (immutable)
 * Called at Live transition
 * 
 * @param {string} stagingId - Staging identifier
 * @param {Object} stagingState - Current staging state (must have unified stack)
 * @returns {Object} Baseline snapshot with snapshotId
 */
export function createBaselineSnapshot(stagingId, stagingState) {
  if (!stagingState.cues || !Array.isArray(stagingState.cues)) {
    throw new Error('[snapshot] Staging state must have unified stack format');
  }

  // Generate snapshot ID
  const snapshotId = `snapshot_baseline_${Date.now()}_${randomUUID().slice(0, 8)}`;

  // Create immutable baseline snapshot
  const baselineSnapshot = {
    snapshotId,
    sessionId: stagingState.sessionId,
    createdAt: new Date().toISOString(),
    isBaseline: true,
    // Deep copy unified stack (immutable)
    cues: JSON.parse(JSON.stringify(stagingState.cues)),
    currentPosition: -1, // Always -1 for baseline
    entryState: JSON.parse(JSON.stringify(stagingState.entryState)),
    requirements: JSON.parse(JSON.stringify(stagingState.requirements)),
    validation: JSON.parse(JSON.stringify(stagingState.validation)),
  };

  // Save baseline snapshot to disk
  const snapshotPath = getBaselineSnapshotPath(stagingId, snapshotId);
  const dir = getStagingDir(stagingId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(snapshotPath, JSON.stringify(baselineSnapshot, null, 2));

  console.log(`[snapshot] Created baseline snapshot: ${snapshotId} for staging: ${stagingId}`);

  return baselineSnapshot;
}

/**
 * Create incremental revision (for live insertions)
 * Called when cues are inserted during live session
 * 
 * @param {string} stagingId - Staging identifier
 * @param {string} baselineSnapshotId - Baseline snapshot ID this revision references
 * @param {string} previousRevisionId - Previous revision ID (for chaining)
 * @param {Array} insertedCues - New cues inserted during live
 * @returns {Object} Incremental revision with revisionId
 */
export function createIncrementalRevision(stagingId, baselineSnapshotId, previousRevisionId, insertedCues) {
  if (!insertedCues || !Array.isArray(insertedCues) || insertedCues.length === 0) {
    throw new Error('[snapshot] Incremental revision requires at least one inserted cue');
  }

  // Generate revision ID
  const revisionId = `snapshot_revision_${Date.now()}_${randomUUID().slice(0, 8)}`;

  // Create incremental revision
  const revision = {
    revisionId,
    baselineSnapshotId,
    previousRevisionId: previousRevisionId || null,
    createdAt: new Date().toISOString(),
    isRevision: true,
    // Only store inserted cues (not full stack)
    insertedCues: JSON.parse(JSON.stringify(insertedCues)),
  };

  // Save revision to disk
  const revisionPath = getRevisionSnapshotPath(stagingId, revisionId);
  const dir = getStagingDir(stagingId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(revisionPath, JSON.stringify(revision, null, 2));

  console.log(`[snapshot] Created incremental revision: ${revisionId} for baseline: ${baselineSnapshotId}`);

  return revision;
}

/**
 * Get baseline snapshot
 * 
 * @param {string} stagingId - Staging identifier
 * @param {string} snapshotId - Snapshot identifier
 * @returns {Object|null} Baseline snapshot or null if not found
 */
export function getBaselineSnapshot(stagingId, snapshotId) {
  if (!stagingId || !snapshotId) {
    return null;
  }

  const snapshotPath = getBaselineSnapshotPath(stagingId, snapshotId);
  if (!fs.existsSync(snapshotPath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(snapshotPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`[snapshot] Error reading baseline snapshot: ${err.message}`);
    return null;
  }
}

/**
 * Get incremental revision
 * 
 * @param {string} stagingId - Staging identifier
 * @param {string} revisionId - Revision identifier
 * @returns {Object|null} Revision or null if not found
 */
export function getIncrementalRevision(stagingId, revisionId) {
  if (!stagingId || !revisionId) {
    return null;
  }

  const revisionPath = getRevisionSnapshotPath(stagingId, revisionId);
  if (!fs.existsSync(revisionPath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(revisionPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`[snapshot] Error reading incremental revision: ${err.message}`);
    return null;
  }
}

/**
 * Get revision chain (all revisions from baseline to target revision)
 * 
 * @param {string} stagingId - Staging identifier
 * @param {string} baselineSnapshotId - Baseline snapshot ID
 * @param {string} targetRevisionId - Target revision ID (null for latest)
 * @returns {Array} Array of revisions in chronological order
 */
export function getRevisionChain(stagingId, baselineSnapshotId, targetRevisionId = null) {
  const revisions = [];
  const dir = getStagingDir(stagingId);
  
  if (!fs.existsSync(dir)) {
    return revisions;
  }

  // Find all revision files for this baseline
  const files = fs.readdirSync(dir);
  const revisionFiles = files.filter(f => f.startsWith('snapshot_revision_'));
  
  // Load all revisions
  const allRevisions = [];
  for (const file of revisionFiles) {
    try {
      const filePath = path.join(dir, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const revision = JSON.parse(data);
      if (revision.baselineSnapshotId === baselineSnapshotId) {
        allRevisions.push(revision);
      }
    } catch (err) {
      console.error(`[snapshot] Error reading revision file ${file}: ${err.message}`);
    }
  }

  // Build chain by following previousRevisionId links
  const revisionMap = new Map();
  allRevisions.forEach(rev => {
    revisionMap.set(rev.revisionId, rev);
  });

  // Find starting point (revision with no previousRevisionId or matching target)
  let currentRevisionId = targetRevisionId;
  if (!currentRevisionId) {
    // Find latest revision (one not referenced by any other)
    const referencedIds = new Set();
    allRevisions.forEach(rev => {
      if (rev.previousRevisionId) {
        referencedIds.add(rev.previousRevisionId);
      }
    });
    const latest = allRevisions.find(rev => !referencedIds.has(rev.revisionId));
    currentRevisionId = latest ? latest.revisionId : null;
  }

  // Build chain backwards
  const chain = [];
  while (currentRevisionId) {
    const revision = revisionMap.get(currentRevisionId);
    if (!revision) break;
    chain.unshift(revision); // Add to front (chronological order)
    currentRevisionId = revision.previousRevisionId;
  }

  return chain;
}

/**
 * Reconstruct full cue stack from baseline + revisions
 * 
 * @param {string} stagingId - Staging identifier
 * @param {string} baselineSnapshotId - Baseline snapshot ID
 * @param {string} revisionId - Optional: specific revision ID (null for latest)
 * @returns {Array} Reconstructed cues array
 */
export function reconstructCueStack(stagingId, baselineSnapshotId, revisionId = null) {
  // Get baseline
  const baseline = getBaselineSnapshot(stagingId, baselineSnapshotId);
  if (!baseline) {
    throw new Error(`[snapshot] Baseline snapshot not found: ${baselineSnapshotId}`);
  }

  // Start with baseline cues
  let cues = JSON.parse(JSON.stringify(baseline.cues || []));

  // Apply revisions if any
  if (revisionId) {
    const revisions = getRevisionChain(stagingId, baselineSnapshotId, revisionId);
    
    revisions.forEach(revision => {
      // Insert new cues at their positions
      revision.insertedCues.forEach(cue => {
        // Find insertion point
        const insertIndex = Math.min(cue.position, cues.length);
        cues.splice(insertIndex, 0, JSON.parse(JSON.stringify(cue)));
      });
      
      // Re-index positions after insertion
      cues.forEach((c, i) => {
        c.position = i;
      });
    });
  }

  return cues;
}

/**
 * Get latest revision ID for a baseline
 * 
 * @param {string} stagingId - Staging identifier
 * @param {string} baselineSnapshotId - Baseline snapshot ID
 * @returns {string|null} Latest revision ID or null if no revisions
 */
export function getLatestRevisionId(stagingId, baselineSnapshotId) {
  const revisions = getRevisionChain(stagingId, baselineSnapshotId);
  if (revisions.length === 0) {
    return null;
  }
  return revisions[revisions.length - 1].revisionId;
}
