export {
  getFirebaseApp,
  getFirebaseAuth,
  getDb,
  requireAuth,
  requireDb,
  isFirebaseConfigured,
  missingFirebaseKeys,
} from '../../../lib/firebase';

import { getFirebaseAuth, getDb } from '../../../lib/firebase';

export const auth = getFirebaseAuth();
export const db = getDb();
