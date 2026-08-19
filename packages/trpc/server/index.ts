import { router } from "./trpc.js";
import { publicProcedure } from "./trpc.js";
export const serverRouter = router({
    health: publicProcedure.query(async () => {
        return {status: 'ok'}
    })
})

export type ServerRouter = typeof serverRouter;
export {createContext} from './context.js'