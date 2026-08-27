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
        expect(fields[0].label!).toBe("First");
        expect(fields[1].label!).toBe("Second");
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
        expect(fields[0]!.label).toBe("To Keep");
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

        expect(reordered[0]!.label).toBe("C");
        expect(reordered[1]!.label).toBe("A");
        expect(reordered[2]!.label).toBe("B");
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

        expect(reordered[0]!.label).toBe("A");
        expect(reordered[1]!.label).toBe("C");
        expect(reordered[2]!.label).toBe("B");
    })
})

describe("field.conditionalLogic", () => {
    it("sets condition on a field pointing to a single_select source", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const source = await caller.field.createField({formId: form.id!, label: "Status", type: "single_select", options: ["Employed", "Unemployed"]});
        const dependent = await caller.field.createField({formId: form.id!, label: "Company", type: "short_text"});

        const updated = await caller.field.updateField({
            id: dependent.id!,
            conditionFieldId: source.id!,
            conditionOperator: "equals",
            conditionValue: "Employed"
        });

        expect(updated.conditionFieldId).toBe(source.id);
        expect(updated.conditionOperator).toBe("equals");
        expect(updated.conditionValue).toBe("Employed");
    })

    it("rejects condition with non-single_select source", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const source = await caller.field.createField({formId: form.id!, label: "Name", type: "short_text"});
        const dependent = await caller.field.createField({formId: form.id!, label: "Extra", type: "short_text"});

        await expect(
            caller.field.updateField({
                id: dependent.id!,
                conditionFieldId: source.id!,
                conditionOperator: "equals",
                conditionValue: "test"
            })
        ).rejects.toThrow("condition source must be a single-select field");
    })

    it("rejects condition with source from a different form", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const formA = await createFormAsUser(user.accessToken, "Form A");
        const formB = await createFormAsUser(user.accessToken, "Form B");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const sourceOnA = await caller.field.createField({formId: formA.id!, label: "Status", type: "single_select", options: ["Yes", "No"]});
        const dependentOnB = await caller.field.createField({formId: formB.id!, label: "Extra", type: "short_text"});

        await expect(
            caller.field.updateField({
                id: dependentOnB.id!,
                conditionFieldId: sourceOnA.id!,
                conditionOperator: "equals",
                conditionValue: "Yes"
            })
        ).rejects.toThrow("condition source must be in the same form");
    })

    it("clears condition when conditionFieldId is set to null", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const source = await caller.field.createField({formId: form.id!, label: "Status", type: "single_select", options: ["A", "B"]});
        const dependent = await caller.field.createField({formId: form.id!, label: "Detail", type: "short_text"});

        await caller.field.updateField({
            id: dependent.id!,
            conditionFieldId: source.id!,
            conditionOperator: "equals",
            conditionValue: "A"
        });

        const cleared = await caller.field.updateField({
            id: dependent.id!,
            conditionFieldId: null
        });

        expect(cleared.conditionFieldId).toBeNull();
        expect(cleared.conditionOperator).toBeNull();
        expect(cleared.conditionValue).toBeNull();
    })

    it("cascade nullifies conditions when source field is deleted", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const source = await caller.field.createField({formId: form.id!, label: "Status", type: "single_select", options: ["X", "Y"]});
        const dep1 = await caller.field.createField({formId: form.id!, label: "Dep 1", type: "short_text"});
        const dep2 = await caller.field.createField({formId: form.id!, label: "Dep 2", type: "short_text"});

        await caller.field.updateField({id: dep1.id!, conditionFieldId: source.id!, conditionOperator: "equals", conditionValue: "X"});
        await caller.field.updateField({id: dep2.id!, conditionFieldId: source.id!, conditionOperator: "not_equals", conditionValue: "Y"});

        await caller.field.deleteField({id: source.id!});

        const fields = await caller.field.listByForm({formId: form.id!});
        expect(fields.length).toBe(2);
        for (const f of fields) {
            expect(f.conditionFieldId).toBeNull();
            expect(f.conditionOperator).toBeNull();
            expect(f.conditionValue).toBeNull();
        }
    })

    it("lists fields with condition data included", async () => {
        const user = await registerAndGetToken("test@test.com", "password123");
        const form = await createFormAsUser(user.accessToken, "My Form");

        const {ctx} = createTestContext({authToken: user.accessToken});
        const caller = serverRouter.createCaller(ctx);

        const source = await caller.field.createField({formId: form.id!, label: "Pick", type: "single_select", options: ["One", "Two"]});
        const dependent = await caller.field.createField({formId: form.id!, label: "Conditional", type: "short_text"});

        await caller.field.updateField({id: dependent.id!, conditionFieldId: source.id!, conditionOperator: "not_equals", conditionValue: "Two"});

        const fields = await caller.field.listByForm({formId: form.id!});
        const conditionalField = fields.find(f => f.id === dependent.id);

        expect(conditionalField!.conditionFieldId).toBe(source.id);
        expect(conditionalField!.conditionOperator).toBe("not_equals");
        expect(conditionalField!.conditionValue).toBe("Two");
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
