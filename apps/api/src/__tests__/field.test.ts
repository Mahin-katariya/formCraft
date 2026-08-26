import {serverRouter} from '@repo/trpc/server'
import db,{userTable, authProviderTable, formsTable, fieldsTable} from '@repo/database'
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

async function createFormAsUser(accessToken: string, title: string){
    const {ctx} = createTestContext({authToken: accessToken});
    const caller = serverRouter.createCaller(ctx);
    return caller.form.createForm({title});
}

beforeEach(async () => {
    vi.clearAllMocks();
    await db.delete(fieldsTable);
    await db.delete(formsTable);
    await db.delete(authProviderTable);
    await db.delete(userTable);
});

describe("field.createField", () => {
    it("creates a field with auto-generated position", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const field = await caller.field.createField({
            formId: form.id!,
            label: "Your Name",
            type: "short_text"
        });

        expect(field.id).toBeDefined();
        expect(field.label).toBe("Your Name");
        expect(field.type).toBe("short_text");
        expect(field.position).toBeDefined();
    })

    it("creates multiple fields with positions in correct order", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const field1 = await caller.field.createField({formId: form.id!, label: "Field 1", type: "short_text"});
        const field2 = await caller.field.createField({formId: form.id!, label: "Field 2", type: "email"});
        const field3 = await caller.field.createField({formId: form.id!, label: "Field 3", type: "number"});

        expect(field1.position! < field2.position!).toBe(true);
        expect(field2.position! < field3.position!).toBe(true);
    })
})

describe("field.listByForm", () => {
    it("returns fields ordered by position", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        await caller.field.createField({formId: form.id!, label: "First", type: "short_text"});
        await caller.field.createField({formId: form.id!, label: "Second", type: "email"});

        const fields = await caller.field.listByForm({formId: form.id!});

        expect(fields.length).toBe(2);
        expect(fields[0].label).toBe("First");
        expect(fields[1].label).toBe("Second");
    })

    it("returns empty array for form with no fields", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const fields = await caller.field.listByForm({formId: form.id!});
        expect(fields.length).toBe(0);
    })
})

describe("field.updateField", () => {
    it("updates field label", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const field = await caller.field.createField({formId: form.id!, label: "Old Label", type: "short_text"});
        const updated = await caller.field.updateField({id: field.id!, label: "New Label"});

        expect(updated.label).toBe("New Label");
        expect(updated.type).toBe("short_text");
    })
})

describe("field.deleteField", () => {
    it("deletes field and it disappears from list", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const field = await caller.field.createField({formId: form.id!, label: "To Delete", type: "short_text"});
        await caller.field.createField({formId: form.id!, label: "To Keep", type: "email"});

        const result = await caller.field.deleteField({id: field.id!});
        expect(result.success).toBe(true);

        const fields = await caller.field.listByForm({formId: form.id!});
        expect(fields.length).toBe(1);
        expect(fields[0].label).toBe("To Keep");
    })
})

describe("field.reorderField", () => {
    it("moves field to beginning — order is correct", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        await caller.field.createField({formId: form.id!, label: "A", type: "short_text"});
        await caller.field.createField({formId: form.id!, label: "B", type: "email"});
        const fieldC = await caller.field.createField({formId: form.id!, label: "C", type: "number"});

        const reordered = await caller.field.reorderField({formId: form.id!, fieldId: fieldC.id!, newIndex: 0});

        expect(reordered[0].label).toBe("C");
        expect(reordered[1].label).toBe("A");
        expect(reordered[2].label).toBe("B");
    })

    it("moves field to middle — position is between neighbors", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        await caller.field.createField({formId: form.id!, label: "A", type: "short_text"});
        await caller.field.createField({formId: form.id!, label: "B", type: "email"});
        const fieldC = await caller.field.createField({formId: form.id!, label: "C", type: "number"});

        const reordered = await caller.field.reorderField({formId: form.id!, fieldId: fieldC.id!, newIndex: 1});

        expect(reordered[0].label).toBe("A");
        expect(reordered[1].label).toBe("C");
        expect(reordered[2].label).toBe("B");
    })
})

describe("field ownership", () => {
    it("rejects field operations on another user's form", async () => {
        const userA = await registerAndGetToken("a@test.com", "password123");
        const userB = await registerAndGetToken("b@test.com", "password123");
        const form = await createFormAsUser(userA.accessToken, "A's Form");

        const {ctx: ctxB} = createTestContext({authToken: userB.accessToken});
        const callerB = serverRouter.createCaller(ctxB);

        await expect(
            callerB.field.createField({formId: form.id!, label: "Sneaky", type: "short_text"})
        ).rejects.toThrow("not your form");
    })
})

afterAll(async () => {
    await db.delete(fieldsTable);
    await db.delete(formsTable);
    await db.delete(authProviderTable);
    await db.delete(userTable);
})
