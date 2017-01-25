import EventEmitter from 'events';
import schedule from 'node-schedule';
import shelljs from 'shelljs';
import Jsftp from 'jsftp';

class BackupFtp extends EventEmitter {
  constructor(config) {
    super();
    this.cron = config.cron;
    this.ftp = config.ftp;
    this.type = config.type;
    this.name = config.name;
    this.path = config.path;
    this.options = config.options;
    this.job = schedule.scheduleJob(this.cron, this.start.bind(this));
  }

  start() {
    // Emit success or error
    this.handleStart((err, data) => {
      if (err) {
        this.emit('error', err);
      } else {
        this.emit('success', data);
      }
    });
  }

  handleStart(cb) {
    const ftp = new Jsftp(this.ftp);
    // Check connection is working
    ftp.ls('.', (err) => {
      if (err) {
        return cb(err);
      }
      const backupName = this.name();
      this.backup(backupName);
      // Put file on ftp
      return ftp.put(`./${backupName}`, backupName, (error) => {
        if (error) {
          cb(error);
        }
        // Remove local backup file
        this.remove(backupName);
        if (!error) {
          cb(null, `${backupName} uploaded`);
        }
      });
    });
  }

  backup(backupName) {
    if (this.type === 'folder') {
      shelljs.exec(`tar -zcvf ${backupName} ${this.path}`);
    } else if (this.type === 'mongodb') {
      let cmd = 'mongodump --quiet';
      if (this.options && this.options.args) {
        cmd += ` ${this.options.args}`;
      }
      shelljs.exec(cmd);
      shelljs.exec(`tar -zcf ${backupName} dump`);
    }
  }

  remove(backupName) {
    if (this.type === 'mongodb') {
      shelljs.exec('rm -rf dump');
    }
    shelljs.exec(`rm ${backupName}`);
  }

  stop() {
    // Stop cron job
    if (this.job) {
      this.job.cancel();
      this.job = null;
    }
  }
}

export default BackupFtp;
