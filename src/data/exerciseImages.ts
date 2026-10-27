// Exercise thumbnails, keyed by exercise name in plan.ts. Metro needs static requires,
// so add entries like:
//   'Arm Circle': require('../../assets/exercises/arm-circle.jpg'),
// The thumbnails used during development came from a licensed coaching app and are not
// redistributed here; exercises without an entry render the built-in placeholder.
import type { ImageSourcePropType } from 'react-native';

export const EXERCISE_IMAGES: Record<string, ImageSourcePropType> = {};
