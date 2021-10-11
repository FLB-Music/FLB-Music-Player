import { UserInfo } from '@/types';
import fs from 'fs';
import os from 'os';
import { paths } from './Paths';
import { createClient } from '@supabase/supabase-js';

export class UsageManager {
  usageData: UserInfo = {
    id: '',
    architecture: os.arch(),
    cpu_no: os.cpus().length,
    free_memory: os.freemem(),
    total_memory: os.totalmem(),
    host_name: os.hostname(),
    os_release: os.release(),
    os_type: os.type(),
    app_launches: []
  };
  constructor() {
    this.usageData.id = this.idGenerator();
    this.usageData.app_launches = this.appLaunches();
    this.addAppLaunch();
  }
  idGenerator() {
    if (fs.existsSync(paths.usageData)) {
      const data = JSON.parse(
        fs.readFileSync(paths.usageData, 'utf-8')
      );
      return data.id;
    } else {
      return Math.round(Math.random() * 50000) + os.userInfo().username;
    }
  }
  appLaunches() {
    if (fs.existsSync(paths.usageData)) {
      const data: UserInfo = JSON.parse(
        fs.readFileSync(paths.usageData, 'utf-8')
      );
      return data.app_launches;
    } else {
      return [];
    }
  }
  addAppLaunch() {
    this.usageData.app_launches.push(Date());
    this.saveUsageData();
  }
  saveUsageData() {
    fs.writeFile(
      paths.usageData,
      JSON.stringify(this.usageData),
      err => {
        if (err) console.log(err);
      }
    );
  }
  async sendUsageData() {
    const key = process.env.SUPABASE_KEY || ""
    const supabase = createClient('https://tqfvneqybooaifvbdqlj.supabase.co', key);
    try {
      const { data } = await supabase
        .from<UserInfo>('Users')
        .insert([
          this.usageData
        ], { upsert: true });
      console.log(data);
    } catch (error) {
      console.log('Unable to send stats');
      console.log(error);
    }
  }
  public get getUsageData(): UserInfo {
    return this.usageData;
  }
}
