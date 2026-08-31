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

async function createPublishedFormWithField(accessToken: string, title: string, fieldType = "short_text", options?: string[]){
    const caller = authedCaller(accessToken);
    const form = await caller.form.createForm({title});
    const fieldInput: {formId: string; label: string; type: string; options?: string[]} = {formId: form.id!, label: "Field", type: fieldType};
    if(options) fieldInput.options = options;
    await caller.field.createField(fieldInput);
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

describe("analytics.getByForm", () => {
    it("returns correct visit and submission counts", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createPublishedFormWithField(user.accessToken, "Survey");
        const caller = authedCaller(user.accessToken);
        const pub = publicCaller();

        const fields = await caller.field.listByForm({formId: form.id!});
        const fieldId = fields[0]!.id!;

        await pub.public.trackEvent({formId: form.id!, sessionId: "s1", eventType: "view", duration: 0});
        await pub.public.trackEvent({formId: form.id!, sessionId: "s2", eventType: "view", duration: 0});
        await pub.public.submitResponse({slug: form.slug!, data: {[fieldId]: "Alice"}, sessionId: "s1"});

        const result = await caller.analytics.getByForm({formId: form.id!});
        expect(result.answers.visits).toBe(2);
        expect(result.answers.submissions).toBe(1);
        expect(result.answers.uniqueRespondents).toBe(2);
    });

    it("computes completion rate correctly", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createPublishedFormWithField(user.accessToken, "Survey");
        const pub = publicCaller();

        await pub.public.trackEvent({formId: form.id!, sessionId: "s1", eventType: "view", duration: 0});
        await pub.public.trackEvent({formId: form.id!, sessionId: "s1", eventType: "start", duration: 1000});
        await pub.public.trackEvent({formId: form.id!, sessionId: "s1", eventType: "complete", duration: 5000});

        await pub.public.trackEvent({formId: form.id!, sessionId: "s2", eventType: "view", duration: 0});
        await pub.public.trackEvent({formId: form.id!, sessionId: "s2", eventType: "start", duration: 1000});

        const caller = authedCaller(user.accessToken);
        const result = await caller.analytics.getByForm({formId: form.id!});
        expect(result.dropoffs.started).toBe(2);
        expect(result.dropoffs.completions).toBe(1);
        expect(result.dropoffs.completionRate).toBe(0.5);
    });

    it("computes per-field distributions for select fields", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createPublishedFormWithField(user.accessToken, "Survey", "single_select", ["Red", "Blue", "Green"]);
        const caller = authedCaller(user.accessToken);
        const pub = publicCaller();

        const fields = await caller.field.listByForm({formId: form.id!});
        const fieldId = fields[0]!.id!;

        await pub.public.submitResponse({slug: form.slug!, data: {[fieldId]: "Red"}, sessionId: "s1"});
        await pub.public.submitResponse({slug: form.slug!, data: {[fieldId]: "Red"}, sessionId: "s2"});
        await pub.public.submitResponse({slug: form.slug!, data: {[fieldId]: "Blue"}, sessionId: "s3"});

        const result = await caller.analytics.getByForm({formId: form.id!});
        expect(result.distributions.length).toBe(1);

        const dist = result.distributions[0]!;
        expect(dist.fieldType).toBe("single_select");

        const redCount = dist.distribution.find(d => d.value === "Red")?.count;
        const blueCount = dist.distribution.find(d => d.value === "Blue")?.count;
        expect(redCount).toBe(2);
        expect(blueCount).toBe(1);
    });

    it("groups responses over time by day", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createPublishedFormWithField(user.accessToken, "Survey");
        const caller = authedCaller(user.accessToken);
        const pub = publicCaller();

        const fields = await caller.field.listByForm({formId: form.id!});
        const fieldId = fields[0]!.id!;

        await pub.public.submitResponse({slug: form.slug!, data: {[fieldId]: "A"}, sessionId: "s1"});
        await pub.public.submitResponse({slug: form.slug!, data: {[fieldId]: "B"}, sessionId: "s2"});

        const result = await caller.analytics.getByForm({formId: form.id!});
        expect(result.responsesOverTime.length).toBeGreaterThanOrEqual(1);
        const todayEntry = result.responsesOverTime[0]!;
        expect(todayEntry.count).toBe(2);
    });

    it("rejects analytics for another user's form", async () => {
        const userA = await registerAndGetToken("a@test.com", "password123");
        const userB = await registerAndGetToken("b@test.com", "password123");
        const form = await createPublishedFormWithField(userA.accessToken, "Survey");

        const callerB = authedCaller(userB.accessToken);
        await expect(
            callerB.analytics.getByForm({formId: form.id!})
        ).rejects.toThrow("not your form");
    });

    it("returns zeros when no events or responses exist", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createPublishedFormWithField(user.accessToken, "Survey");
        const caller = authedCaller(user.accessToken);

        const result = await caller.analytics.getByForm({formId: form.id!});
        expect(result.answers.visits).toBe(0);
        expect(result.answers.submissions).toBe(0);
        expect(result.dropoffs.started).toBe(0);
        expect(result.dropoffs.completionRate).toBe(0);
        expect(result.distributions).toEqual([]);
        expect(result.responsesOverTime).toEqual([]);
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
