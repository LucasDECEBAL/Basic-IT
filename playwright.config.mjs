import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',
  fullyParallel:false,
  workers:1,
  retries:0,
  timeout:30000,
  reporter:[['list'],['html',{outputFolder:'test-results/report',open:'never'}]],
  outputDir:'test-results/browser',
  use:{baseURL:'http://127.0.0.1:4173',headless:true,trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'node tests/serve-e2e.mjs',url:'http://127.0.0.1:4173/api/public',reuseExistingServer:false,timeout:15000}
});
