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

function publicCaller(){
    const {ctx} = createTestContext();
    return serverRouter.createCaller(ctx);
}

function authedCaller(accessToken: string){
    const {ctx} = createTestContext({authToken: accessToken});
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

describe("public.getFormBySlug", () => {
    it("returns a published form with its fields", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedForm(user.accessToken, "My Form");

        await caller.field.createField({formId: form.id!, label: "Name", type: "short_text"});
        await caller.field.createField({formId: form.id!, label: "Email", type: "email"});

        const pub = publicCaller();
        const result = await pub.public.getFormBySlug({slug: form.slug!});

        expect(result.title).toBe("My Form");
        expect(result.slug).toBe(form.slug);
        expect(result.fields.length).toBe(2);
        expect(result.fields[0]!.label).toBe("Name");
        expect(result.fields[1]!.label).toBe("Email");
    })

    it("does not leak internal data", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createPublishedForm(user.accessToken, "My Form");

        const pub = publicCaller();
        const result = await pub.public.getFormBySlug({slug: form.slug!}) as Record<string, unknown>;

        expect(result.userId).toBeUndefined();
        expect(result.deletedAt).toBeUndefined();
        expect(result.status).toBeUndefined();
        expect(result.responseLimit).toBeUndefined();
        expect(result.expiresAt).toBeUndefined();
    })

    it("rejects draft form with generic error", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await caller.form.createForm({title: "Draft Form"});

        const pub = publicCaller();
        await expect(
            pub.public.getFormBySlug({slug: form.slug!})
        ).rejects.toThrow("form is not available");
    })

    it("rejects closed form with generic error", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedForm(user.accessToken, "Closed Form");
        await caller.form.closeForm({id: form.id!});

        const pub = publicCaller();
        await expect(
            pub.public.getFormBySlug({slug: form.slug!})
        ).rejects.toThrow("form is not available");
    })

    it("rejects non-existent slug with generic error", async () => {
        const pub = publicCaller();
        await expect(
            pub.public.getFormBySlug({slug: "does-not-exist"})
        ).rejects.toThrow("form is not available");
    })
})

describe("public.submitResponse", () => {
    it("submits a valid response", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedForm(user.accessToken, "Survey");

        const nameField = await caller.field.createField({formId: form.id!, label: "Name", type: "short_text", required: true});
        const ratingField = await caller.field.createField({formId: form.id!, label: "Rating", type: "rating"});

        const pub = publicCaller();
        const result = await pub.public.submitResponse({
            slug: form.slug!,
            data: {
                [nameField.id!]: "Alice",
                [ratingField.id!]: 4
            },
            sessionId: "sess_123"
        });

        expect(result.success).toBe(true);
    })

    it("rejects submission with missing required field", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedForm(user.accessToken, "Survey");

        await caller.field.createField({formId: form.id!, label: "Name", type: "short_text", required: true});

        const pub = publicCaller();
        await expect(
            pub.public.submitResponse({
                slug: form.slug!,
                data: {},
                sessionId: "sess_123"
            })
        ).rejects.toThrow();
    })

    it("rejects submission with invalid email format", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedForm(user.accessToken, "Survey");

        const emailField = await caller.field.createField({formId: form.id!, label: "Email", type: "email", required: true});

        const pub = publicCaller();
        await expect(
            pub.public.submitResponse({
                slug: form.slug!,
                data: {[emailField.id!]: "not-an-email"},
                sessionId: "sess_123"
            })
        ).rejects.toThrow();
    })

    it("rejects submission with invalid select option", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedForm(user.accessToken, "Survey");

        const selectField = await caller.field.createField({formId: form.id!, label: "Color", type: "single_select", required: true, options: ["Red", "Blue"]});

        const pub = publicCaller();
        await expect(
            pub.public.submitResponse({
                slug: form.slug!,
                data: {[selectField.id!]: "Green"},
                sessionId: "sess_123"
            })
        ).rejects.toThrow();
    })

    it("accepts submission when conditional field is hidden and missing", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedForm(user.accessToken, "Survey");

        const statusField = await caller.field.createField({formId: form.id!, label: "Status", type: "single_select", required: true, options: ["Employed", "Unemployed"]});
        const companyField = await caller.field.createField({formId: form.id!, label: "Company", type: "short_text", required: true});

        await caller.field.updateField({
            id: companyField.id!,
            conditionFieldId: statusField.id!,
            conditionOperator: "equals",
            conditionValue: "Employed"
        });

        const pub = publicCaller();
        const result = await pub.public.submitResponse({
            slug: form.slug!,
            data: {[statusField.id!]: "Unemployed"},
            sessionId: "sess_123"
        });

        expect(result.success).toBe(true);
    })

    it("auto-closes form when response limit is reached", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedForm(user.accessToken, "Limited Form");

        await caller.form.updateForm({id: form.id!, responseLimit: 1});

        const nameField = await caller.field.createField({formId: form.id!, label: "Name", type: "short_text"});

        const pub = publicCaller();
        await pub.public.submitResponse({
            slug: form.slug!,
            data: {[nameField.id!]: "Alice"},
            sessionId: "sess_1"
        });

        await expect(
            pub.public.submitResponse({
                slug: form.slug!,
                data: {[nameField.id!]: "Bob"},
                sessionId: "sess_2"
            })
        ).rejects.toThrow("form is not available");
    })

    it("rejects submission to a closed form", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const caller = authedCaller(user.accessToken);
        const form = await createPublishedForm(user.accessToken, "Closed Form");
        await caller.form.closeForm({id: form.id!});

        const pub = publicCaller();
        await expect(
            pub.public.submitResponse({
                slug: form.slug!,
                data: {},
                sessionId: "sess_123"
            })
        ).rejects.toThrow("form is not available");
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
