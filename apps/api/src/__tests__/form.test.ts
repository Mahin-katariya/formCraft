import {serverRouter} from '@repo/trpc/server'
import db,{userTable, authProviderTable, formsTable, fieldsTable, responsesTable, formEventsTable} from '@repo/database'
import { createTestContext } from './helpers/create-test-context.js'
import { formService } from '@repo/services'

vi.mock('@repo/services', async (importOriginal) => {
    const original = await importOriginal() as Record<string, unknown>;
    return {
        ...original,
        emailService: {
            sendVerificationEmail: vi.fn()
        }
    }
});

async function registerAndGetToken(email: string, password: string){
    const {ctx, cookieJar} = createTestContext();
    const registerCaller = serverRouter.createCaller(ctx);

    const result = await registerCaller.auth.createUserWithEmailAndPassword({email, password});
    return {accessToken: result.accessToken, userId: result.id};
}

beforeEach(async () => {
    vi.clearAllMocks();
    await db.delete(formEventsTable);
    await db.delete(responsesTable);
    await db.delete(fieldsTable);
    await db.delete(formsTable);
    await db.delete(authProviderTable);
    await db.delete(userTable);
});

describe("form.createForm", () => {
    it("creates a form and returns it with-auto generated slgu", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx, cookieJar} = createTestContext({authToken: user.accessToken});
        
        const caller = serverRouter.createCaller(ctx);
        
        const result = await caller.form.createForm({title: 'My Form'});
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('slug');
        expect(result.title).toBe('My Form');
        expect(result.status).toBe('draft');

    })

    it("returns only the current user's non-deleted forms",async () => {
        const userA = await registerAndGetToken("test1@test.com","password123");
        const userB = await registerAndGetToken("test2@test.com","password123");

        const {ctx: ctxA, cookieJar: cookieJarA} = createTestContext({authToken: userA.accessToken});
        const {ctx: ctxB, cookieJar: cookieJarB} = createTestContext({authToken: userB.accessToken});
        const callerA = serverRouter.createCaller(ctxA);
        const callerB = serverRouter.createCaller(ctxB);

        await callerA.form.createForm({title: 'My Form 1'});
        await callerA.form.createForm({title: 'My Form 2'});

        await callerB.form.createForm({title: 'My Form 3'});

        const forms  = await callerA.form.listAllFormsCreatedByUser();
        expect(forms.data?.length).toBe(2);

        let belognsToA = true;
        for(const form of forms.data){
            if(form.userId === userB.userId){
                belognsToA = false;
            }
        }
        expect(belognsToA).toBe(true);
    });
})

describe("form.getFormById", () => {
    it("returns the form if owned by current user", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx, cookieJar} = createTestContext({authToken: user.accessToken});

        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});

        const result = await caller.form.getFormById({id: form.id!});

        expect(result.id).toBe(form.id);
        expect(result).toMatchObject({
            title: 'My Form',
            status: 'draft'
        });
        expect(result.slug).toBeDefined();
        expect(result.id).toBeDefined();
    });

    it("throws FORBIDDEN if form belongs to another user", async () => {
        const userA = await registerAndGetToken("test1@test.com","password123");
        const userB = await registerAndGetToken("test2@test.com","password123");

        const {ctx: ctxA} = createTestContext({authToken: userA.accessToken});
        const callerA = serverRouter.createCaller(ctxA);

        const {ctx: ctxB} = createTestContext({authToken: userB.accessToken});
        const callerB = serverRouter.createCaller(ctxB);

        const formA = await callerA.form.createForm({title: 'My Form'});

        await expect(
            callerB.form.getFormById({id: formA.id!})
        ).rejects.toThrow('not your form');
    })
})

describe("form.listAllFormsCreatedByUser", () => {
    it("excludes soft-deleted forms from the list", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form1 = await caller.form.createForm({title: 'Form 1'});
        await caller.form.createForm({title: 'Form 2'});

        await caller.form.deleteForm({id: form1.id!});

        const result = await caller.form.listAllFormsCreatedByUser();
        expect(result.data?.length).toBe(1);
    })
})

describe("form.updateForm", () => {
    it("updates form fields", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});

        await caller.form.updateForm({id: form.id!, title: 'Updated Title', slug: 'my-custom-slug'});

        const updated = await caller.form.getFormById({id: form.id!});
        expect(updated.title).toBe('Updated Title');
        expect(updated.slug).toBe('my-custom-slug');
    })

    it("throws CONFLICT if slug is already taken by another form", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const formA = await caller.form.createForm({title: 'Form A'});
        const formB = await caller.form.createForm({title: 'Form B'});

        await caller.form.updateForm({id: formB.id!, slug: 'taken-slug'});

        await expect(
            caller.form.updateForm({id: formA.id!, slug: 'taken-slug'})
        ).rejects.toThrow('slug already taken');
    })
})

describe("form.deleteForm", () => {
    it("soft-deletes form — sets deletedAt, disappears from list", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});

        const deleteResult = await caller.form.deleteForm({id: form.id!});
        expect(deleteResult.success).toBe(true);

        const list = await caller.form.listAllFormsCreatedByUser();
        expect(list.data?.length).toBe(0);

        await expect(
            caller.form.getFormById({id: form.id!})
        ).rejects.toThrow('form not found');
    })
})

describe("form.publishForm", () => {
    it("publishes a draft form", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});
        const result = await caller.form.publishForm({id: form.id!});

        expect(result.status).toBe('published');
    })

    it("throws error when publishing an already published form", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});
        await caller.form.publishForm({id: form.id!});

        await expect(
            caller.form.publishForm({id: form.id!})
        ).rejects.toThrow('only draft forms can be published');
    })

    it("throws error when publishing a closed form", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});
        await caller.form.publishForm({id: form.id!});
        await caller.form.closeForm({id: form.id!});

        await expect(
            caller.form.publishForm({id: form.id!})
        ).rejects.toThrow('only draft forms can be published');
    })
})

describe("form.unpublishForm", () => {
    it("unpublishes a published form back to draft", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});
        await caller.form.publishForm({id: form.id!});

        const result = await caller.form.unpublishForm({id: form.id!});
        expect(result.status).toBe('draft');
    })

    it("throws error when unpublishing a draft form", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});

        await expect(
            caller.form.unpublishForm({id: form.id!})
        ).rejects.toThrow('only published forms can be unpublished');
    })
})

describe("form.closeForm", () => {
    it("closes a published form", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});
        await caller.form.publishForm({id: form.id!});

        const result = await caller.form.closeForm({id: form.id!});
        expect(result.status).toBe('closed');
    })

    it("throws error when closing a draft form", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});

        await expect(
            caller.form.closeForm({id: form.id!})
        ).rejects.toThrow('only published forms can be closed');
    })

    it("throws error when closing an already closed form", async () => {
        const user = await registerAndGetToken("test@test.com","password123");
        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const form = await caller.form.createForm({title: 'My Form'});
        await caller.form.publishForm({id: form.id!});
        await caller.form.closeForm({id: form.id!});

        await expect(
            caller.form.closeForm({id: form.id!})
        ).rejects.toThrow('only published forms can be closed');
    })
})

afterAll(async () => {
    await db.delete(formEventsTable);
    await db.delete(responsesTable);
    await db.delete(fieldsTable);
    await db.delete(formsTable);
    await db.delete(authProviderTable);
    await db.delete(userTable);
})
