# Testing Focus Integration in HISTE

## Implementation Complete ✅

All code changes have been implemented and committed to the `feature/histe-focus-integration` branch.

**Commits:**
1. `852bb19` - docs: Extend HISTE contracts for focus events and future extensibility
2. `ad849e0` - feat: Add SimulatedTrainer for HISTE trainer interactions
3. `a3e96ef` - feat: Integrate focus event scheduling in HISTE runner
4. `aaa6ca6` - feat: Add focus observation to HISTE Admin UI
5. `417443c` - feat: Add focus-shift-room sample scenario

---

## Manual Testing Instructions

### Step 1: Start the Application

```bash
# In terminal 1: Start the server
cd /Users/jeffwinkler/Documents/GitHub/amplifyed-pulse-ui
npm run server

# In terminal 2: Start the frontend
npm run dev
```

### Step 2: Navigate to HISTE Admin

Open your browser to: `http://localhost:5173/histe` (or whatever port Vite assigns)

### Step 3: Select Focus Shift Room Scenario

1. In the **Scenario Library** (left column), find "Focus Shift Room"
2. Click to select it
3. Review the scenario details:
   - Participants: 3
   - Tempo: Workshop
   - Flow: Steady with focus shifts
   - Surfacing: Medium

4. Click **"View JSON"** to inspect the focusEvents:
   ```json
   "focusEvents": [
     { "delayMs": 0, "action": "set", "text": "Opening: Introductions and context" },
     { "delayMs": 3000, "action": "set", "text": "Discussion: Core concepts" },
     { "delayMs": 7000, "action": "set", "text": "Deep dive: Implementation strategies" },
     { "delayMs": 11000, "action": "clear" }
   ]
   ```

### Step 4: Run the Scenario

1. Click **"Arm"** button (should turn blue)
2. Click **"Start"** button
3. Watch the **Observation Surfaces** (right column)

### Step 5: Observe Focus Changes

Watch the **"Current Focus"** observation card:

| Time | Expected Focus |
|------|----------------|
| 0s | "Opening: Introductions and context" |
| 3s | "Discussion: Core concepts" |
| 7s | "Deep dive: Implementation strategies" |
| 11s | "— No Focus Set —" (cleared) |

### Step 6: Verify Other Observations

Simultaneously observe:
- **Message Flow Density** - should increase as messages arrive
- **Overlap Events** - should remain low (workshop pace)
- **Silence Duration** - should reset with each message
- **Drift Indicators** - should remain neutral

### Step 7: Open TrainerView (Optional)

In a new browser tab: `http://localhost:5173/`

- Join the session with the displayed access code
- Verify you can see the focus changes in the TrainerView UI
- Confirm focus updates happen at the correct times

### Step 8: Test Stop/Resume

1. Click **"Pause"** - simulation should pause
2. Click **"Resume"** - should continue from where it paused
3. Click **"Stop"** - should halt completely
4. Click **"Clear Session"** - should reset all state

---

## Expected Console Output

In your server terminal, you should see:

```
[SimulatedTrainer] Connected as trainer to session:default
[HISTE] Trainer connected successfully
[HISTE] Setting focus: "Opening: Introductions and context"
[HISTE] Emitting message from participant-a: "Hi everyone, glad to be here."
[HISTE] Setting focus: "Discussion: Core concepts"
[HISTE] Emitting message from participant-b: "Can we clarify the core concept?"
[HISTE] Setting focus: "Deep dive: Implementation strategies"
[HISTE] Clearing focus
[HISTE] Emitting message from participant-c: "Great session, thanks all."
```

---

## Validation Checklist

### Focus Events
- [ ] Focus appears in UI at correct times
- [ ] Focus text matches scenario definition
- [ ] Focus clears correctly (shows "— No Focus Set —")
- [ ] No errors in console

### Trainer Socket
- [ ] SimulatedTrainer connects successfully
- [ ] Trainer joins with proper role
- [ ] Focus events emit through trainer socket
- [ ] Trainer disconnects cleanly on stop

### UI Observation
- [ ] Focus observation card displays correctly
- [ ] Focus text is styled (italic)
- [ ] Updates in real-time
- [ ] Resets on "Clear Session"

### Scenario Integrity
- [ ] Messages still flow correctly
- [ ] Timing is preserved
- [ ] No interference with other pipelines
- [ ] Pause/Resume works

### Contract Compliance
- [ ] No direct pipeline injection
- [ ] Uses standard socket events (focus:set, focus:clear)
- [ ] Trainer joins like a real trainer would
- [ ] Observation is read-only

---

## Troubleshooting

### Focus doesn't appear
- Check server console for SimulatedTrainer connection
- Verify focus pipeline is registered in eventRouter
- Check browser console for socket errors

### Timing is off
- Verify delayMs values in scenario JSON
- Check if simulation was paused/resumed

### Trainer connection fails
- Verify server is running on port 3000
- Check session:join handler is working
- Look for connection errors in console

### Messages but no focus
- Check if focusEvents array exists in scenario
- Verify trainer socket was created
- Look for HISTE warnings in console

---

## Testing Other Scenarios

The focus integration should **not affect** existing scenarios:

### Test: Normal Room (no focus events)
1. Select "Normal Room" scenario
2. Arm and Start
3. Verify: "Current Focus" shows "— No Focus Set —" throughout
4. Verify: Messages flow normally

### Test: Fast Room (no focus events)
1. Select "Fast Room" scenario
2. Arm and Start
3. Verify: No focus changes
4. Verify: High message density is displayed correctly

### Expected: All existing scenarios work unchanged

---

## Next Steps

### If Testing Passes:
1. Push branch to remote:
   ```bash
   git push origin feature/histe-focus-integration
   ```

2. Create Pull Request with description:
   - Links to relevant contracts
   - Summary of changes
   - Testing results

### If Issues Found:
1. Document the issue (what, when, expected vs actual)
2. Check relevant contract for guidance
3. Fix on this branch
4. Re-test
5. Commit fix with clear message

---

## Contract References

- **Phase 8 Focus Governance:** `server/pipelines/focus/Phase_8_Focus_Governance.md`
- **HISTE Contract:** `server/contracts/Human Interaction Stress Testing Environment (HISTE).md`
- **Scenario Contract:** `testing/environments/histe/contracts/HISTE_SCENARIO_CONTRACT.md`
- **Extensions Contract:** `testing/environments/histe/contracts/HISTE_EXTENSIONS_CONTRACT.md`

---

## Success Criteria

✅ Focus events execute at correct times  
✅ Focus displays in HISTE Admin observation surface  
✅ Trainer socket connects with proper permissions  
✅ Existing scenarios unaffected  
✅ No contract violations  
✅ Clean console output  
✅ Proper cleanup on stop  
✅ Pause/Resume works correctly  

---

**Testing Date:** _____________  
**Tester:** _____________  
**Result:** ☐ Pass  ☐ Fail  ☐ Needs Revision  
**Notes:**
