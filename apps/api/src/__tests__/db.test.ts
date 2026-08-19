import db from '@repo/database'
import {userTable} from '@repo/database/schema'

describe('database connection', () => {
    it('should query users table and return an empty array', async () => {
        const result = await db.select().from(userTable);
        expect(result).toEqual([]);
    });
});