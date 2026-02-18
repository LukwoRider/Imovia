import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;

const ownerEmail = process.env.OWNER_EMAIL;
const ownerPass = process.env.OWNER_PASS;

const tenantEmail = process.env.TENANT_EMAIL;
const tenantPass = process.env.TENANT_PASS;

if (!url || !anon) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
if (!ownerEmail || !ownerPass) throw new Error("Missing OWNER_EMAIL/OWNER_PASS in .env");
if (!tenantEmail || !tenantPass) throw new Error("Missing TENANT_EMAIL/TENANT_PASS in .env");

const supabase = createClient(url, anon);

async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

function dumpError(label, err) {
  console.log(`\n❌ ${label}`);
  console.log("message:", err?.message);
  console.log("details:", err?.details);
  console.log("hint:", err?.hint);
  console.log("code:", err?.code);
  console.log("full:", err);
  console.log("");
}

async function run() {
  // ==========================
  // 1️⃣ OWNER CRÉE UN BIEN
  // ==========================
  console.log("🔐 Login owner...");
  await login(ownerEmail, ownerPass);

  const ownerId = (await supabase.auth.getUser()).data.user.id;

  const { data: property, error: e1 } = await supabase
    .from("properties")
    .insert({
      owner_id: ownerId,
      title: "T2 Centre Ville",
      city: "Lyon",
      country: "FR",
      status: "available",
    })
    .select()
    .single();
  if (e1) throw e1;

  console.log("🏠 Property created:", property.id);
  await supabase.auth.signOut();

  // ==========================
  // 2️⃣ TENANT FAIT DEMANDE
  // ==========================
  console.log("🔐 Login tenant...");
  await login(tenantEmail, tenantPass);

  const tenantId = (await supabase.auth.getUser()).data.user.id;

  const { data: application, error: e3 } = await supabase
    .from("rental_applications")
    .insert({
      property_id: property.id,
      tenant_id: tenantId,
      owner_id: property.owner_id,
      message: "Je souhaite louer ce bien",
    })
    .select()
    .single();
  if (e3) throw e3;

  console.log("📩 Application created:", application.id);
  await supabase.auth.signOut();

  // ==========================
  // 3️⃣ OWNER ACCEPTE → CRÉE LEASE
  // ==========================
  console.log("🔐 Owner accepts application...");
  await login(ownerEmail, ownerPass);

  const { data: leaseId, error: e4 } = await supabase.rpc("accept_application", {
    p_application_id: application.id,
    p_start_date: "2026-03-01",
    p_end_date: "2027-03-01",
    p_rent_amount: 900,
    p_charges_amount: 50,
    p_payment_day: 5,
    p_notice_period_days: 30,
  });
  if (e4) throw e4;

  console.log("📄 Lease created:", leaseId);

  const { data: count, error: e5 } = await supabase.rpc("generate_rent_payments", {
    p_lease_id: leaseId,
    p_months: 12,
  });
  if (e5) throw e5;

  console.log("💰 Payments generated:", count);
  await supabase.auth.signOut();

  // ==========================
  // 4️⃣ INCIDENT (tenant -> owner update)
  // ==========================
  console.log("🔐 Login tenant (incident)...");
  await login(tenantEmail, tenantPass);

  const { data: incident, error: e6 } = await supabase
    .from("incidents")
    .insert({
      property_id: property.id,
      lease_id: leaseId,
      reporter_id: tenantId,
      title: "Fuite d'eau",
      description: "Il y a une fuite sous l'évier",
    })
    .select()
    .single();
  if (e6) throw e6;

  console.log("🚨 Incident created:", incident.id);
  await supabase.auth.signOut();

  console.log("🔐 Owner updates incident...");
  await login(ownerEmail, ownerPass);

  const { error: e7 } = await supabase
    .from("incidents")
    .update({ status: "in_progress" })
    .eq("id", incident.id);
  if (e7) throw e7;

  console.log("🔧 Incident updated to in_progress");
  await supabase.auth.signOut();

  // ==========================
  // 5️⃣ TRAVAUX (tenant -> owner approve -> done)
  // ==========================
  console.log("🔐 Login tenant (maintenance)...");
  await login(tenantEmail, tenantPass);

  const { data: work, error: e8 } = await supabase
    .from("maintenance_requests")
    .insert({
      property_id: property.id,
      lease_id: leaseId,
      requester_id: tenantId,
      title: "Chauffage en panne",
      description: "Le chauffage ne démarre plus depuis hier",
    })
    .select()
    .single();
  if (e8) throw e8;

  console.log("🛠️ Maintenance request created:", work.id);
  await supabase.auth.signOut();

  console.log("🔐 Login owner (approve maintenance)...");
  await login(ownerEmail, ownerPass);

  const { error: e9 } = await supabase
    .from("maintenance_requests")
    .update({ status: "approved", cost_estimated: 180 })
    .eq("id", work.id);
  if (e9) throw e9;

  console.log("✅ Maintenance approved + estimated cost set");

  const { error: e10 } = await supabase
    .from("maintenance_requests")
    .update({ status: "done", cost_real: 165 })
    .eq("id", work.id);
  if (e10) throw e10;

  console.log("🏁 Maintenance marked done + real cost set");
  await supabase.auth.signOut();

  // ==========================
  // 6) DOCUMENTS (pro)
  // ==========================
  console.log("🔐 Login tenant (documents)...");
  await login(tenantEmail, tenantPass);

  // 🔎 Check pro : vérifier que le tenant est bien membre du lease (sinon RLS refusera)
  const { data: ltRows, error: ltErr } = await supabase
    .from("lease_tenants")
    .select("lease_id, tenant_id")
    .eq("lease_id", leaseId)
    .eq("tenant_id", tenantId);

  if (ltErr) {
    dumpError("lease_tenants select failed", ltErr);
    throw ltErr;
  }

  console.log("🔎 lease_tenants membership rows:", ltRows?.length ?? 0);

  // Fichier local
  const localFile = path.join(__dirname, "sample.txt");
  if (!fs.existsSync(localFile)) {
    throw new Error("Fichier local introuvable: crée sample.txt dans le dossier backend");
  }

  const fileBuffer = fs.readFileSync(localFile);
  const fileName = path.basename(localFile);

  const randomId = crypto.randomUUID();
  const storagePath = `leases/${leaseId}/${randomId}-${fileName}`;

  // Upload bucket private "documents"
  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileBuffer, {
      contentType: "text/plain",
      upsert: false,
    });

  if (upErr) {
    dumpError("storage upload failed", upErr);
    throw upErr;
  }

  console.log("✅ Storage upload ok:", storagePath);

  // INSERT row documents (c'est ici que ton RLS bloque actuellement)
  const { data: docRow, error: dbErr } = await supabase
    .from("documents")
    .insert({
      lease_id: leaseId,
      property_id: property.id,
      uploader_id: tenantId,
      storage_path: storagePath,
      doc_type: "contract",
    })
    .select()
    .single();

  if (dbErr) {
    dumpError("documents insert failed", dbErr);
    throw dbErr;
  }

  console.log("✅ DB document row created:", docRow.id);

  // Signed URL (download 60s)
  const { data: signed, error: signErr } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 60);

  if (signErr) {
    dumpError("signed url failed", signErr);
    throw signErr;
  }

  console.log("🔗 Signed URL (60s):", signed.signedUrl);

  console.log("✅ TEST COMPLET RÉUSSI 🚀 (documents inclus)");
}

run().catch((err) => {
  console.error("❌ ERROR:", err.message);
});
