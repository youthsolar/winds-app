// middleware.ts 用 `import { env } from 'cloudflare:workers'` 拿 ASSETS binding。
// 不用 `wrangler types` 產生的整包型別：它會把 Worker 全域型別套到瀏覽器端的 <script>，型別檢查冒出一堆假錯。
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
