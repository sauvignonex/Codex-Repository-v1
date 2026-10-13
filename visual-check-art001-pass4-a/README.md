# SS-ART-001 Pass4 A — bounded AE calibration / working

Heartbeat 2026-10-13T12:21:42.042Z. PR#1 reread: latest REVIEW-02 and REPORT-03; no newer task/review. Only A changed, B/C and installed063 protected.

Pass3 inherited tracking−24 from AE user defaults. Width cap forced uniform scale75.314%, visible body726×126. Explicit body tracking−84 now permits uniform86.5889%, body713×145 at110/1440. Reference manually isolated white body ROI715×143 at111/1440; this is approximate threshold segmentation on baked footage, not exact font attribution. No one-axis stretching. Leading Cera remains tracking−24 explicitly pinned; its italic appearance/proportions relative to reference remain open. Trial−90 yielded701×145; revised fresh r2 uses−84.

Body delay0.60 instead0.70. First word measured once with the existing disabled reserve layer, then its source cleared. Boundary slider0.35736778 controls a staged mask: first word, pause, remainder. Native frame25 shows complete ВКУС without the second word. Stable first-word frames25–27, full reading hold36–88. Motion blur transition frame24 excluded from the interior-pause equality assertion; the first checker incorrectly included it. Duration89/30 unchanged, hardcut at clip-out.

New own comp SS ART001 Pass4 A r2 A, own saved AEP, four layers. Two native trials completed; final fresh r2 matrix8cases short/long ×.25/.5/1.2/3,3576property reads without expressionError. 33sample RGBA frames and all89reference-length alpha frames pass actual safe polygon with shadow/blur >2/255. Eight source/VM cases check immediate short clips, boundary pause, full hold, uniform scale and explicit tracking. No unchanged B/C re-export/tests.

AE-A-full.mp4 uses real RGBA frames plus10generated transparent tail frames to represent clip-out. Compare-A-full-alpha.mp4: left moving reference, right true AE alpha over explicitly offline frozen plate, no chromakey. Not Premiere/comparable moving native background. Live document exactly equal before/after. No Premiere mutation, MOGRT export, installation or live migration this stage. New A **not checked in Premiere**; task not accepted. Need native MOGRT/Premiere on separate QA next, plus earliest reference hold anchor and artistic review. Boundary is prepared per input by builder: future runtime text edits must recompute the boundary; not yet a generic editable product control.

Previous Pass3/release archives preserved. Source and own AEP archived locally; do not mistake source/study archive for an installer. Untracked pre-existing auto-save/template log not committed.
