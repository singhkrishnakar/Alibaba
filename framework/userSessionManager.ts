import { userConfig } from '../config/users.config';

export class UserSessionManager {

  static getUserForWorker(workerIndex: number) {

    if (userConfig.mode === 'single') {
      return userConfig.users[0];
    }

    return userConfig.users[workerIndex % userConfig.users.length];
  }

  static getStorageStatePath(workerIndex: number) {

    if (userConfig.mode === 'single') {
      return 'playwright/.auth/user.json';
    }

    return `playwright/.auth/user${workerIndex}.json`;
  }

}