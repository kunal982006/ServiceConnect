import { db } from "./db";
import { serviceCategories, serviceProblems } from "@shared/schema";
import { eq } from "drizzle-orm";

const electricianProblems = [
  {
    device: "Air Conditioner (AC)",
    issues: [
      "Not cooling properly",
      "Water leakage",
      "Unusual noises",
      "Bad odor from vents",
      "Remote not working",
      "Power turning on/off frequently",
      "Frozen coils",
      "High electricity consumption"
    ]
  },
  {
    device: "Refrigerator",
    issues: [
      "Not cooling or overcooling",
      "Water leakage",
      "Fridge making loud or unusual noise",
      "Ice maker not working",
      "Frost build-up in freezer",
      "Fridge light not working",
      "Compressor issues",
      "Door not closing properly"
    ]
  },
  {
    device: "Television (TV)",
    issues: [
      "No display / black screen",
      "No sound",
      "Remote not working",
      "HDMI/AV ports not functioning",
      "TV turning on and off by itself",
      "Distorted image or colors",
      "Lines on the screen",
      "Wall mount installation needed"
    ]
  },
  {
    device: "Water Heater (Geyser)",
    issues: [
      "Not heating water",
      "Water leakage",
      "Unusual noises",
      "Electrical tripping when turned on",
      "Low hot water pressure",
      "Foul smell from hot water",
      "Thermostat not working"
    ]
  },
  {
    device: "Washing Machine",
    issues: [
      "Not spinning",
      "Water not draining",
      "Door not opening",
      "Vibrating excessively",
      "Leaking water"
    ]
  },
  {
    device: "Microwave Oven",
    issues: [
      "Not heating food",
      "Sparking inside",
      "Buttons not responding",
      "Turntable not rotating"
    ]
  }
];

async function seedElectricianProblems() {
  console.log("🔌 Seeding electrician problems...");

  try {
    // Get electrician category
    const electricianCategory = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.slug, "electrician"))
      .limit(1);

    if (electricianCategory.length === 0) {
      console.error("❌ Electrician category not found. Please run the main seed script first.");
      process.exit(1);
    }

    const categoryId = electricianCategory[0].id;

    // Delete existing electrician problems
    await db.delete(serviceProblems).where(eq(serviceProblems.categoryId, categoryId));
    console.log("✅ Cleared existing electrician problems");

    // Insert device categories (parent problems)
    for (const problem of electricianProblems) {
      const [parentProblem] = await db
        .insert(serviceProblems)
        .values({
          categoryId,
          name: problem.device,
          parentId: null
        })
        .returning();

      console.log(`✅ Created device category: ${problem.device}`);

      // Insert issues for each device (child problems)
      for (const issue of problem.issues) {
        await db.insert(serviceProblems).values({
          categoryId,
          name: issue,
          parentId: parentProblem.id
        });
      }

      console.log(`   ✅ Added ${problem.issues.length} issues for ${problem.device}`);
    }

    console.log("✨ Electrician problems seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding electrician problems:", error);
    throw error;
  }
}

seedElectricianProblems()
  .then(() => {
    console.log("✅ Seed script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
