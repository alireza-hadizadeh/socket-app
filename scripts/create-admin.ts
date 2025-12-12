// scripts/create-admin.ts
import * as bcrypt from "bcryptjs";
import db from "../lib/db/connection";
import { initializeDatabase } from "../lib/db/database";

async function createAdminUser() {
  try {
    // Initialize database first
    console.log("Initializing database...");
    initializeDatabase();

    // Check if admin already exists
    const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@example.com");

    if (existingAdmin) {
      console.log("Admin user already exists. Updating password...");

      // Hash the password
      const passwordHash = await bcrypt.hash("admin123", 10);

      // Update the admin user
      db.prepare(
        `
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE email = ?
      `
      ).run(passwordHash, "admin@example.com");

      console.log("✅ Admin password updated successfully!");
    } else {
      console.log("Creating new admin user...");

      // Hash the password
      const passwordHash = await bcrypt.hash("admin123", 10);

      // Create admin user
      db.prepare(
        `
        INSERT INTO users (username, email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?)
      `
      ).run("admin", "admin@example.com", passwordHash, "admin", 1);

      console.log("✅ Admin user created successfully!");
    }

    console.log("\nAdmin credentials:");
    console.log("Email: admin@example.com");
    console.log("Password: admin123");
    console.log("\n⚠️  Please change this password after first login!");

    // Verify the user was created
    const admin = db.prepare("SELECT id, username, email, role, is_active FROM users WHERE email = ?").get("admin@example.com");
    console.log("\nVerified admin user:", admin);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();
