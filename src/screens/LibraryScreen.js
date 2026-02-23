// LibraryScreen.js - 동작 라이브러리: ExerciseLibrary 래핑

import { initExerciseLibrary } from '../ui/ExerciseLibrary.js';

let initialized = false;

export function initLibraryScreen() {
    if (initialized) return;
    initialized = true;
    initExerciseLibrary();
}
