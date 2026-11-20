import handler from "vinext/server/fetch-handler";
import { journal } from "./router";
import type { Bindings } from "./types";

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const path=new URL(request.url).pathname;
    if(path.startsWith("/press/")||path==="/favicon.svg"||path.startsWith("/@")||path.startsWith("/__vite")||path.startsWith("/_next/")||path.startsWith("/assets/"))
      return handler.fetch(request,env,ctx);
    return journal(request,env as Bindings);
  },
};
