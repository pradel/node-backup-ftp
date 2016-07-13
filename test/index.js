import { assert } from 'chai';
import BackupFtp from '../src/index';

describe('BackupFtp', () => {
  it('should be a class', () => {
    const backup = new BackupFtp({});
    assert.ok(backup instanceof BackupFtp);
  });
});
