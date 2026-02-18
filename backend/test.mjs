import { createClient } from "@supabase/supabase-js";

const url = "https://gjcuktfaipvtfxiwredc.supabase.co";
const anon =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqY3VrdGZhaXB2dGZ4aXdyZWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDczMjUsImV4cCI6MjA4NjgyMzMyNX0.GNwArGfd3U3g2CdCYWYBgolRfr3j7FnaL68tib6tdcI";

const ownerEmail = "owner@imovia.test";
const ownerPass = "test";

const tenantEmail = "tenant@imovia.test";
const tenantPass = "test";

/*
========================================
INITIALISATION
========================================
*/

const supabase = createClient(url, anon);

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

async function run() {
  /*
  ==========================
  1️⃣ OWNER CRÉE UN BIEN
  ==========================
  */

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

  /*
  ==========================
  2️⃣ TENANT VOIT BIENS + FAIT DEMANDE
  ==========================
  */

  console.log("🔐 Login tenant...");
  await login(tenantEmail, tenantPass);

  const tenantId = (await supabase.auth.getUser()).data.user.id;

  const { data: availableProps, error: e2 } = await supabase
    .from("properties")
    .select("id,title,status")
    .eq("status", "available");

  if (e2) throw e2;

  console.log(
    "👀 Tenant sees properties:",
    availableProps.map((p) => p.id),
  );

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

  /*
  ==========================
  3️⃣ OWNER ACCEPTE → CRÉE LEASE
  ==========================
  */

  console.log("🔐 Owner accepts application...");
  await login(ownerEmail, ownerPass);

  const { data: leaseId, error: e4 } = await supabase.rpc(
    "accept_application",
    {
      p_application_id: application.id,
      p_start_date: "2026-03-01",
      p_end_date: "2027-03-01",
      p_rent_amount: 900,
      p_charges_amount: 50,
      p_payment_day: 5,
      p_notice_period_days: 30,
    },
  );

  if (e4) throw e4;

  console.log("📄 Lease created:", leaseId);

  /*
  ==========================
  4️⃣ GÉNÉRER 12 MOIS DE LOYERS
  ==========================
  */

  const { data: count, error: e5 } = await supabase.rpc(
    "generate_rent_payments",
    {
      p_lease_id: leaseId,
      p_months: 12,
    },
  );

  if (e5) throw e5;

  console.log("💰 Payments generated:", count);

  await supabase.auth.signOut();

  /*
  ==========================
  5️⃣ TENANT CRÉE INCIDENT
  ==========================
  */

  console.log("🔐 Login tenant (incident)...");
  await login(tenantEmail, tenantPass);

  // ✅ On utilise DIRECTEMENT le leaseId qu'on a déjà
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

  if (e6) throw e6;

  console.log("🚨 Incident created:", incident.id);

  await supabase.auth.signOut();

  /*
  ==========================
  6️⃣ OWNER MET À JOUR INCIDENT
  ==========================
  */

  console.log("🔐 Owner updates incident...");
  await login(ownerEmail, ownerPass);

  const { error: e7 } = await supabase
    .from("incidents")
    .update({ status: "in_progress" })
    .eq("id", incident.id);

  if (e7) throw e7;

  console.log("🔧 Incident updated to in_progress");

  /*
    ==========================
    7️⃣ TENANT CRÉE DEMANDE DE TRAVAUX
    ==========================
    */

  await supabase.auth.signOut();
  console.log("🔐 Login tenant (maintenance)...");
  await login(tenantEmail, tenantPass);

  // Tenant crée une demande de travaux
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

  /*
    ==========================
    8️⃣ OWNER APPROUVE + MET COÛT ESTIMÉ
    ==========================
    */

  await supabase.auth.signOut();
  console.log("🔐 Login owner (approve maintenance)...");
  await login(ownerEmail, ownerPass);

  const { error: e9 } = await supabase
    .from("maintenance_requests")
    .update({
      status: "approved",
      cost_estimated: 180,
    })
    .eq("id", work.id);

  if (e9) throw e9;

  console.log("✅ Maintenance approved + estimated cost set");

  /*
    ==========================
    9️⃣ OWNER TERMINE + MET COÛT RÉEL
    ==========================
    */

  const { error: e10 } = await supabase
    .from("maintenance_requests")
    .update({
      status: "done",
      cost_real: 165,
    })
    .eq("id", work.id);

  if (e10) throw e10;

  console.log("🏁 Maintenance marked done + real cost set");

  console.log("✅ TEST COMPLET RÉUSSI 🚀");
}

/*
========================================
LANCEMENT
========================================
*/

run().catch((err) => {
  console.error("❌ ERROR:", err.message);
});
