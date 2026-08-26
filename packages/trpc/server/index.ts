import { authRouter } from "./routes/auth/route.js";
import { formsRouter } from "./routes/form/route.js";
import { router } from "./trpc.js";
import { publicProcedure } from "./trpc.js";
export const serverRouter = router({
    health: publicProcedure.query(async () => {
        return {status: 'ok'}
    }),
    auth: authRouter,
    form: formsRouter
});

export type ServerRouter = typeof serverRouter;
export {createContext} from './context.js'