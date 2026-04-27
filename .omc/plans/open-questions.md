# Open Questions

## hamsktop-v0.1-consensus - 2026-04-24

### Resolved in this plan (8 spec open questions)

All 8 open questions from the deep-interview spec have been decided in the plan. No spec-level ambiguity remains.

### Deferred to future versions

- [ ] Multi-generation lineage UI (graveyard, family tree, trait inheritance) -- core emotional hook for long-term retention, deferred to v1.0
- [ ] EN locale and locale auto-detection -- v0.2; string externalization in v0.1 prepares for this
- [ ] Color/skin customization beyond name -- v0.3; requires multiple sprite sheet variants and art pipeline expansion
- [ ] Breeds / evolution system -- v1.0+; design depends on observing how users interact with v0.1 lifecycle
- [ ] Mood-to-gameplay mechanical depth (mood affecting growth rate, not just animation) -- evaluate after v0.1 user feedback
- [ ] Idle penalty reconsideration (hunger/health drain on long absence) -- revisit based on v0.1 user sentiment; neutral model may feel too passive
- [ ] Linux support -- Tauri supports it natively; needs testing and packaging but no code changes expected
- [ ] Volume slider (vs simple on/off toggle) -- v0.2 if sound proves popular

### Implementation-time decisions (executor may need to decide)

- [ ] Exact idle threshold: plan assumes 120 seconds (2 min) of no input = idle. May need tuning. -- Affects growth pacing
- [ ] Sprite sheet frame count per animation: plan specifies 4-8 frames. Exact count depends on art. -- Does not affect code architecture
- [ ] Hit-test polling rate: plan specifies adaptive 2fps (far) / 30fps (near). Fast-mode may need 15fps fallback on older hardware. -- Affects CPU budget
- [ ] Auto-save interval: plan specifies 60 seconds. May need adjustment for battery impact. -- Affects data loss window on crash
- [ ] WebView2 bootstrapper behavior on Windows 10: Tauri handles this automatically but should be tested via CI artifact install in Windows VM. -- Affects Windows install experience
- [ ] Windows VM/machine access for manual verification: CI builds the `.msi` but manual E2E testing (tray icon, hit-test, sound) requires a Windows environment. UTM/Parallels with Windows 11 ARM is optional but recommended. -- Affects thoroughness of Windows verification
- [ ] Tauri v2 vs v1 spike outcome: Milestone A spike will determine if v2 APIs work. If spike fails, fallback to Tauri v1. -- Affects config schema and plugin API surface (not architecture)
- [ ] `mouse_position` crate selection: plan specifies `mouse_position` but alternatives exist (`enigo`, `autopilot`, raw platform FFI). Executor should pick based on Tauri v2 compatibility. -- Affects hit-test module only
- [ ] DPI scale factor edge cases: Windows allows per-monitor DPI. If pet is dragged between monitors with different scaling, `window.scale_factor()` may need re-querying. -- Affects hit-test accuracy on multi-DPI setups
