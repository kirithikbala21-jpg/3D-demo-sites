# Photo credits: to do

All 15 photos came from Unsplash and are credited as "Photo: Unsplash" in the footer. The photographer names were not supplied, so find each photo on Unsplash (search by its subject), then replace the generic credit with the photographer's name:

```
python3 tools/add-photo.py img/source/<file>.jpg <slot> --alt "<alt text>" --credit "Jane Doe / Unsplash"
python3 tools/build.py
```

| Slot | Source file | Photographer (to add) |
| --- | --- | --- |
| `hero` | `hero.avif` | |
| `studio` | `class-group-silhouettes.avif` | |
| `banner` | `action-dumbbell-torso.avif` | |
| `coaching` | `coaching-two-trainers.avif` | |
| `gallery-1` | `gallery-1-weights-floor-neon.avif` | |
| `gallery-2` | `gallery-2-kettlebells.avif` | |
| `gallery-3` | `gallery-3-cardio-row.avif` | |
| `gallery-4` | `gallery-4-sauna-recovery.avif` | |
| `gallery-5` | `gallery-5-treadmills.avif` | |
| `gallery-6` | `gallery-6-equipment-rack.avif` | |
| `gallery-7` | `gallery-7-sled-track.avif` | |
| `coach-1` | `coach-1-battle-ropes.avif` | |
| `coach-2` | `coach-2-kettlebell-fullbody.avif` | |
| `coach-3` | `coach-3-crossed-arms-beard.avif` | |
| `coach-4` | `coach-4-crossed-arms-blue.avif` | |

`coach-2` and `coach-4` use cropped JPGs (`*-crop.jpg`) made from the files above.
