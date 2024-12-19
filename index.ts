/*
 * Root
 */

import { createClient as _createClient } from './src/models/client';


export function createClient(options) {
  return _createClient(options).init();
}
