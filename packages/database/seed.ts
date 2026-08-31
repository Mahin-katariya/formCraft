import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env.js";
import { userTable } from "./models/users.js";
import { authProviderTable } from "./models/authProviders.js";
import { formsTable } from "./models/forms.js";
import { fieldsTable } from "./models/fields.js";
import { responsesTable } from "./models/responses.js";
import { formEventsTable } from "./models/formEvents.js";
import bcryptjs from "bcryptjs";
import { nanoid } from "nanoid";

const db = drizzle(env.DATABASE_URL);

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function seed() {
  console.log("Seeding demo data...");

  // Clean existing demo user if present
  const existing = await db.select().from(userTable).where(
    (await import("drizzle-orm")).eq(userTable.email, "demo@pigeonform.com")
  );
  if (existing.length > 0) {
    const uid = existing[0]!.id;
    const { eq, inArray } = await import("drizzle-orm");
    const userForms = await db.select({ id: formsTable.id }).from(formsTable).where(eq(formsTable.userId, uid));
    const formIds = userForms.map((f) => f.id);
    if (formIds.length > 0) {
      await db.delete(formEventsTable).where(inArray(formEventsTable.formId, formIds));
      await db.delete(responsesTable).where(inArray(responsesTable.formId, formIds));
      await db.delete(fieldsTable).where(inArray(fieldsTable.formId, formIds));
      await db.delete(formsTable).where(eq(formsTable.userId, uid));
    }
    await db.delete(authProviderTable).where(eq(authProviderTable.userId, uid));
    await db.delete(userTable).where(eq(userTable.id, uid));
  }

  // Create demo user (password: demo1234)
  const passwordHash = await bcryptjs.hash("demo1234", 12);
  const [user] = await db
    .insert(userTable)
    .values({
      displayName: "Demo User",
      email: "demo@pigeonform.com",
      passwordHash,
      emailVerified: true,
    })
    .returning();
  const userId = user!.id;
  console.log(`  Created user: demo@pigeonform.com / demo1234`);

  // ── Form 1: Customer Feedback Survey ──
  const [form1] = await db
    .insert(formsTable)
    .values({
      userId,
      title: "Customer Feedback Survey",
      description: "Help us improve our product by sharing your experience.",
      slug: nanoid(8),
      status: "published",
      createdAt: daysAgo(12),
    })
    .returning();

  const f1Fields = await db
    .insert(fieldsTable)
    .values([
      { formId: form1!.id, label: "Full Name", type: "short_text", required: true, position: "a" },
      { formId: form1!.id, label: "Email", type: "email", required: true, position: "b" },
      { formId: form1!.id, label: "How did you hear about us?", type: "single_select", required: false, position: "c", options: JSON.stringify(["Google", "Twitter", "Friend", "Blog post", "Other"]) },
      { formId: form1!.id, label: "Overall satisfaction", type: "rating", required: true, position: "d" },
      { formId: form1!.id, label: "What could we improve?", type: "long_text", required: false, position: "e" },
    ])
    .returning();
  console.log(`  Created form: ${form1!.title} (${f1Fields.length} fields)`);

  const names = ["Alice Chen", "Bob Martinez", "Carol Wu", "David Kim", "Eva Singh", "Frank Lee", "Grace Obi", "Hiro Tanaka", "Isla Patel", "Jake Müller", "Kara Johnson", "Liam O'Brien", "Mia Rossi", "Noah Garcia", "Olivia Park"];
  const sources = ["Google", "Twitter", "Friend", "Blog post", "Other"];
  const improvements = [
    "Faster load times", "More field types", "Dark mode", "Better mobile experience",
    "Webhook integrations", "Team collaboration", "Custom branding", "Nothing, it's great!",
    "Email notifications", "API access", "More analytics", "Embed support",
  ];

  for (let i = 0; i < 28; i++) {
    const day = Math.floor(Math.random() * 12);
    const name = pick(names);
    const sessionId = nanoid(10);
    const submittedAt = daysAgo(day);

    await db.insert(responsesTable).values({
      formId: form1!.id,
      sessionId,
      submittedAt,
      data: {
        [f1Fields[0]!.id]: name,
        [f1Fields[1]!.id]: name.toLowerCase().replace(/[^a-z]/g, "") + "@example.com",
        [f1Fields[2]!.id]: pick(sources),
        [f1Fields[3]!.id]: Math.floor(Math.random() * 3) + 3,
        [f1Fields[4]!.id]: pick(improvements),
      },
    });

    const viewTime = new Date(submittedAt.getTime() - 60000);
    const startTime = new Date(submittedAt.getTime() - 45000);
    await db.insert(formEventsTable).values([
      { formId: form1!.id, sessionId, eventType: "view", timestamp: viewTime, duration: 0 },
      { formId: form1!.id, sessionId, eventType: "start", timestamp: startTime, duration: 15000 },
      { formId: form1!.id, sessionId, eventType: "complete", timestamp: submittedAt, duration: 60000 },
    ]);
  }

  // Add some view-only sessions (no submission) for drop-off data
  for (let i = 0; i < 15; i++) {
    const sessionId = nanoid(10);
    const t = daysAgo(Math.floor(Math.random() * 12));
    await db.insert(formEventsTable).values([
      { formId: form1!.id, sessionId, eventType: "view", timestamp: t, duration: 0 },
    ]);
  }
  for (let i = 0; i < 8; i++) {
    const sessionId = nanoid(10);
    const t = daysAgo(Math.floor(Math.random() * 12));
    await db.insert(formEventsTable).values([
      { formId: form1!.id, sessionId, eventType: "view", timestamp: t, duration: 0 },
      { formId: form1!.id, sessionId, eventType: "start", timestamp: new Date(t.getTime() + 10000), duration: 10000 },
    ]);
  }

  // ── Form 2: Event Registration ──
  const [form2] = await db
    .insert(formsTable)
    .values({
      userId,
      title: "Launch Party RSVP",
      description: "Register for our product launch event on September 15th.",
      slug: nanoid(8),
      status: "published",
      createdAt: daysAgo(7),
    })
    .returning();

  const f2Fields = await db
    .insert(fieldsTable)
    .values([
      { formId: form2!.id, label: "Your name", type: "short_text", required: true, position: "a" },
      { formId: form2!.id, label: "Email address", type: "email", required: true, position: "b" },
      { formId: form2!.id, label: "Company", type: "short_text", required: false, position: "c" },
      { formId: form2!.id, label: "Dietary preferences", type: "multi_select", required: false, position: "d", options: JSON.stringify(["Vegetarian", "Vegan", "Gluten-free", "No restrictions"]) },
      { formId: form2!.id, label: "How many guests?", type: "number", required: true, position: "e" },
    ])
    .returning();
  console.log(`  Created form: ${form2!.title} (${f2Fields.length} fields)`);

  const companies = ["Acme Corp", "Globex", "Initech", "Umbrella Co", "Stark Industries", "Wayne Enterprises", "Capsule Corp", ""];
  const diets = ["Vegetarian", "Vegan", "Gluten-free", "No restrictions"];

  for (let i = 0; i < 16; i++) {
    const day = Math.floor(Math.random() * 7);
    const name = pick(names);
    const sessionId = nanoid(10);
    const submittedAt = daysAgo(day);

    await db.insert(responsesTable).values({
      formId: form2!.id,
      sessionId,
      submittedAt,
      data: {
        [f2Fields[0]!.id]: name,
        [f2Fields[1]!.id]: name.toLowerCase().replace(/[^a-z]/g, "") + "@work.com",
        [f2Fields[2]!.id]: pick(companies),
        [f2Fields[3]!.id]: [pick(diets)],
        [f2Fields[4]!.id]: Math.floor(Math.random() * 3) + 1,
      },
    });

    const viewTime = new Date(submittedAt.getTime() - 50000);
    const startTime = new Date(submittedAt.getTime() - 35000);
    await db.insert(formEventsTable).values([
      { formId: form2!.id, sessionId, eventType: "view", timestamp: viewTime, duration: 0 },
      { formId: form2!.id, sessionId, eventType: "start", timestamp: startTime, duration: 15000 },
      { formId: form2!.id, sessionId, eventType: "complete", timestamp: submittedAt, duration: 50000 },
    ]);
  }

  for (let i = 0; i < 10; i++) {
    const sessionId = nanoid(10);
    const t = daysAgo(Math.floor(Math.random() * 7));
    await db.insert(formEventsTable).values([
      { formId: form2!.id, sessionId, eventType: "view", timestamp: t, duration: 0 },
    ]);
  }

  // ── Form 3: Bug Report (draft — shows draft state in dashboard) ──
  const [form3] = await db
    .insert(formsTable)
    .values({
      userId,
      title: "Bug Report Template",
      description: "Report issues with our platform.",
      slug: nanoid(8),
      status: "draft",
      createdAt: daysAgo(2),
    })
    .returning();

  await db.insert(fieldsTable).values([
    { formId: form3!.id, label: "Summary", type: "short_text", required: true, position: "a" },
    { formId: form3!.id, label: "Steps to reproduce", type: "long_text", required: true, position: "b" },
    { formId: form3!.id, label: "Severity", type: "single_select", required: true, position: "c", options: JSON.stringify(["Critical", "Major", "Minor", "Cosmetic"]) },
    { formId: form3!.id, label: "Screenshot URL", type: "url", required: false, position: "d" },
  ]);
  console.log(`  Created form: ${form3!.title} (draft, 4 fields)`);

  console.log("\nSeed complete!");
  console.log("  Login: demo@pigeonform.com / demo1234");
  console.log(`  Forms: ${form1!.title}, ${form2!.title}, ${form3!.title}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
