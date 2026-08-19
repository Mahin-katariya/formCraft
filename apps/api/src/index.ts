import http from 'node:http'
import {app as ExpressApplication} from './server'

import { env } from './env'

async function init(){
    try {
        const server = http.createServer(ExpressApplication);
        const PORT: number = env.PORT ? +env.PORT : 8000;

        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error(`Error creating http server`, {error});
        process.exit(1);
    }
}

init();