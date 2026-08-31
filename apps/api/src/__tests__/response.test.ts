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

async function createPublishedFormWithField(accessToken: string, title: string){
    const caller = authedCaller(accessToken);
    const form = await caller.form.createForm({title});
    await caller.field.createField({formId: form.id!, label: "Name", type: "short_text"});
    await caller.form.publishForm({id: form.id!});
    return form;
}

async function submitResponse(slug: string, data: Record<string, unknown>, sessionId: string){
    const pub = publicCaller();
    return pub.public.submitResponse({slug, data, sessionId});
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

describe("response.listByForm", () => {
    it("returns responses for a form", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedFormWithField(user.accessToken, "Survey");

        const fields = await caller.field.listByForm({formId: form.id!});
        const fieldId = fields[0]!.id!;

        await submitResponse(form.slug!, {[fieldId]: "Alice"}, "sess_1");
        await submitResponse(form.slug!, {[fieldId]: "Bob"}, "sess_2");

        const result = await caller.response.listByForm({formId: form.id!});
        expect(result.responses.length).toBe(2);
        expect(result.total).toBe(2);
    });

    it("paginates correctly", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedFormWithField(user.accessToken, "Survey");

        const fields = await caller.field.listByForm({formId: form.id!});
        const fieldId = fields[0]!.id!;

        await submitResponse(form.slug!, {[fieldId]: "Alice"}, "sess_1");
        await submitResponse(form.slug!, {[fieldId]: "Bob"}, "sess_2");
        await submitResponse(form.slug!, {[fieldId]: "Charlie"}, "sess_3");

        const page1 = await caller.response.listByForm({formId: form.id!, page: 1, pageSize: 2});
        expect(page1.responses.length).toBe(2);
        expect(page1.total).toBe(3);

        const page2 = await caller.response.listByForm({formId: form.id!, page: 2, pageSize: 2});
        expect(page2.responses.length).toBe(1);
    });

    it("returns newest first", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedFormWithField(user.accessToken, "Survey");

        const fields = await caller.field.listByForm({formId: form.id!});
        const fieldId = fields[0]!.id!;

        await submitResponse(form.slug!, {[fieldId]: "First"}, "sess_1");
        await submitResponse(form.slug!, {[fieldId]: "Second"}, "sess_2");

        const result = await caller.response.listByForm({formId: form.id!});
        const data = result.responses.map(r => (r.data as Record<string, string>)[fieldId]);
        expect(data[0]).toBe("Second");
        expect(data[1]).toBe("First");
    });

    it("rejects non-owner", async () => {
        const userA = await registerAndGetToken("a@test.com", "password123");
        const userB = await registerAndGetToken("b@test.com", "password123");
        const form = await createPublishedFormWithField(userA.accessToken, "Survey");

        const callerB = authedCaller(userB.accessToken);
        await expect(
            callerB.response.listByForm({formId: form.id!})
        ).rejects.toThrow("not your form");
    });
});

describe("response.listAll", () => {
    it("returns responses across all forms", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);

        const form1 = await createPublishedFormWithField(user.accessToken, "Form 1");
        const form2 = await createPublishedFormWithField(user.accessToken, "Form 2");

        const fields1 = await caller.field.listByForm({formId: form1.id!});
        const fields2 = await caller.field.listByForm({formId: form2.id!});

        await submitResponse(form1.slug!, {[fields1[0]!.id!]: "Alice"}, "sess_1");
        await submitResponse(form2.slug!, {[fields2[0]!.id!]: "Bob"}, "sess_2");

        const result = await caller.response.listAll({});
        expect(result.total).toBe(2);
        expect(result.responses.length).toBe(2);
    });

    it("only shows own responses", async () => {
        const userA = await registerAndGetToken("a@test.com", "password123");
        const userB = await registerAndGetToken("b@test.com", "password123");

        const formA = await createPublishedFormWithField(userA.accessToken, "A's Form");
        const formB = await createPublishedFormWithField(userB.accessToken, "B's Form");

        const callerA = authedCaller(userA.accessToken);
        const callerB = authedCaller(userB.accessToken);

        const fieldsA = await callerA.field.listByForm({formId: formA.id!});
        const fieldsB = await callerB.field.listByForm({formId: formB.id!});

        await submitResponse(formA.slug!, {[fieldsA[0]!.id!]: "Alice"}, "sess_1");
        await submitResponse(formB.slug!, {[fieldsB[0]!.id!]: "Bob"}, "sess_2");

        const resultA = await callerA.response.listAll({});
        expect(resultA.total).toBe(1);
        expect(resultA.responses[0]!.formId).toBe(formA.id);
    });

    it("returns empty for user with no forms", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);

        const result = await caller.response.listAll({});
        expect(result.responses).toEqual([]);
        expect(result.total).toBe(0);
    });
});

describe("response.getById", () => {
    it("returns a single response", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedFormWithField(user.accessToken, "Survey");

        const fields = await caller.field.listByForm({formId: form.id!});
        const fieldId = fields[0]!.id!;

        await submitResponse(form.slug!, {[fieldId]: "Alice"}, "sess_1");

        const list = await caller.response.listByForm({formId: form.id!});
        const responseId = list.responses[0]!.id;

        const result = await caller.response.getById({id: responseId});
        expect((result.data as Record<string, string>)[fieldId]).toBe("Alice");
    });

    it("rejects non-owner", async () => {
        const userA = await registerAndGetToken("a@test.com", "password123");
        const userB = await registerAndGetToken("b@test.com", "password123");
        const form = await createPublishedFormWithField(userA.accessToken, "Survey");

        const callerA = authedCaller(userA.accessToken);
        const fields = await callerA.field.listByForm({formId: form.id!});

        await submitResponse(form.slug!, {[fields[0]!.id!]: "Alice"}, "sess_1");

        const list = await callerA.response.listByForm({formId: form.id!});
        const responseId = list.responses[0]!.id;

        const callerB = authedCaller(userB.accessToken);
        await expect(
            callerB.response.getById({id: responseId})
        ).rejects.toThrow("not your form");
    });

    it("returns NOT_FOUND for non-existent id", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);

        await expect(
            caller.response.getById({id: "00000000-0000-0000-0000-000000000000"})
        ).rejects.toThrow("response not found");
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
