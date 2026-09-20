# Standing and lunge support corrections

## Result

Eight catalog drafts were corrected. Warrior III already passed and remains unchanged. All nine targeted poses and their left/right reflections pass the current declared support, floor-clearance, joint-envelope, wrist and self-contact checks after runtime placement and capture/restore.

| Catalog pose | Previous findings | Current measured result | Reference alignment still to review |
| --- | --- | --- | --- |
| Warrior I | Sole support | Both soles pass | Front knee bends 57°, a shallow adaptation |
| Warrior II | Sole support | Both soles pass | Same shallow bend; chest and arms open |
| Warrior III | None in this scope | Unchanged pass | Balance and exact reference alignment remain unvalidated |
| Triangle | Sole support | Both soles pass | Lower hand reaches toward the shin at modified depth |
| Revolved Triangle | Soles and lower hand | Both soles and lower hand pass | Hand-volume proxy is within 5 mm; this does not prove a load-bearing palm |
| Lunge | Front sole/rear toes; hip and knee envelope | Palms, front sole and opposite rear toes pass; no measured ROM findings | Hands remain farther forward than the front foot |
| Lizard | Front sole/rear toes; hip and ankle envelope | Same supports, front foot outside the hands; no measured ROM findings | Forward hand reach and front-knee alignment remain modified |
| Crescent Lunge | Front sole/rear toes | Front sole and opposite rear toes pass | Shallow front-knee bend |
| Crescent Lunge on the Knee | Opposite sole/knee/foot-top | All three required regions pass | Knee and foot-top contact use the existing geometric proxies |

No catalog draft flag was removed and no support tolerance or joint envelope was widened. Cues describe modified reach/depth. These are support repairs of authored mannequin poses, not an assertion of complete reference fidelity or anatomical certification.

## Why reload could undo a repair

`placePalmsOnFloor` previously reran leg IK even when an authored or captured pose already had both palms exactly grounded. The IK could introduce off-hinge knee rotations or excessive hip flexion while satisfying hand contact. It now preserves an existing exact palm contact when wrist limits and whole-body floor clearance also pass. Otherwise the existing placement path still runs.

The corrected Lunge and Lizard store their solved root heights, foot/arm angles and palm support mode together. Tests replay capture/restore and placement to ensure these contacts do not depend on a one-time application.

The old Lizard regression required a strictly positive rear-knee bend. It now permits a straight knee, while retaining the prohibitions on hyperextension, off-hinge rotation, a reversed ankle and an upward-facing trailing knee.

## Verification and remaining scope

- Full regression: 89 tests passed, including existing Ashtanga playback; production build passed with the existing bundle-size warning.
- Targeted tests cover all nine poses on both sides, capture/restore, repeat placement, distinct front-foot positions, rear heel release and kneeling support.
- Actual app integration: added all nine through the gallery, downloaded the sequence, loaded it again, and verified saved support/ROM/body/wrist measurements before and after. All passed without browser runtime errors.
- Perspective and side views were rendered in a local browser for shape review. This exposed the need to bring Lizard's hands inside the front foot; that placement was corrected and retested.
- Whole catalog: support findings **125 → 117**, joint-envelope findings **65 → 63**, body collisions **0 → 0**, scoped passes **24 → 32** out of 167.
- Existing example hold support checks: **82 / 82** pass. Sun Salutation hold support is not a claim that all its joint ranges pass.
- Repeated bounded-projection audit: 44 candidates, 19 already valid, 1 projected and 24 rejected with full rollback. This audit does not automatically rewrite catalog entries.
- Arbitrary transitions between these catalog poses, force balance, traction and world-space contact locking are not validated by hold tests. The remaining 117 support findings still need posture-family work.

Reference identity and support contracts remain those reviewed in `SUPPORT-CONTRACT-REVIEW.md` and the catalog Pocket Yoga links. Warrior/Triangle adaptations reuse the independently authored shapes already documented in `ASHTANGA-REVIEW.md`; this increment did not re-download or copy reference illustrations.
