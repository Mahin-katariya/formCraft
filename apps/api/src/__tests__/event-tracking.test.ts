import {serverRouter} from '@repo/trpc/server'
import db,{userTable, authProviderTable, formsTable, fieldsTable, responsesTable, formEventsTable} from '@repo/database'
import { createTestContext } from './helpers/create-test-context.js'

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
    const {ctx} = createTestContext();
    const caller = serverRouter.createCaller(ctx);
    const result = await caller.auth.createUserWithEmailAndPassword({email, password});
    return {accessToken: result.accessToken, userId: result.id};
}

function authedCaller(accessToken: string){
    const {ctx} = createTestContext({authToken: accessToken});
    return serverRouter.createCaller(ctx);
}

function publicCaller(){
    const {ctx} = createTestContext();
    return serverRouter.createCaller(ctx);
}

async function createPublishedForm(accessToken: string, title: string){
    const caller = authedCaller(accessToken);
    const form = await caller.form.createForm({title});
    await caller.form.publishForm({id: form.id!});
    return form;
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

describe("public.trackEvent", () => {
    it("tracks a view event", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createPublishedForm(user.accessToken, "Survey");

        const pub = publicCaller();
        const result = await pub.public.trackEvent({
            formId: form.id!,
            sessionId: "sess_123",
            eventType: "view",
            duration: 0
        });

        expect(result.success).toBe(true);
    });

    it("tracks a start event with duration", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createPublishedForm(user.accessToken, "Survey");

        const pub = publicCaller();
        const result = await pub.public.trackEvent({
            formId: form.id!,
            sessionId: "sess_123",
            eventType: "start",
            duration: 5000
        });

        expect(result.success).toBe(true);
    });

    it("tracks a complete event with duration", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createPublishedForm(user.accessToken, "Survey");

        const pub = publicCaller();
        const result = await pub.public.trackEvent({
            formId: form.id!,
            sessionId: "sess_123",
            eventType: "complete",
            duration: 30000
        });

        expect(result.success).toBe(true);
    });

    it("rejects tracking for non-existent form", async () => {
        const pub = publicCaller();
        await expect(
            pub.public.trackEvent({
                formId: "00000000-0000-0000-0000-000000000000",
                sessionId: "sess_123",
                eventType: "view",
                duration: 0
            })
        ).rejects.toThrow("form not found");
    });

    it("stores multiple events with same session_id", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createPublishedForm(user.accessToken, "Survey");

        const pub = publicCaller();
        await pub.public.trackEvent({formId: form.id!, sessionId: "sess_123", eventType: "view", duration: 0});
        await pub.public.trackEvent({formId: form.id!, sessionId: "sess_123", eventType: "start", duration: 3000});
        await pub.public.trackEvent({formId: form.id!, sessionId: "sess_123", eventType: "complete", duration: 25000});

        const events = await db.select().from(formEventsTable);
        expect(events.length).toBe(3);
        expect(events.map(e => e.eventType).sort()).toEqual(["complete", "start", "view"]);
    });
});

afterAll(async () => {
    await db.delete(formEventsTable);
    await db.delete(responsesTable);
    await db.delete(fieldsTable);
    await db.delete(formsTable);
    await db.delete(authProviderTable);
    await db.delete(userTable);
});
