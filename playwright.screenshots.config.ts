import { defineConfig, devices } from "@playwright/test";

/** README に載せる画面の写真を撮る設定（npm run screenshots） */
export default defineConfig({
  testDir: "./screenshots",
  reporter: "list",
  use: {
    ...devices["Pixel 7"],
    baseURL: "http://localhost:3000",
    colorScheme: "light",
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
  },
});
