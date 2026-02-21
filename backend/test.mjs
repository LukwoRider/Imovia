/**
 * End-to-End Test Script for Imovia Backend Integration
 *
 * This script validates the complete backend flow using Supabase:
 * - User authentication (owner and tenant)
 * - Property management
 * - Rental applications and leases
 * - Payment processing
 * - Incident reporting and maintenance
 * - Document storage
 * - Dashboard data retrieval
 *
 * It ensures the database schema, RLS policies, RPC functions, and storage buckets work correctly.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultEnvFile = path.join(__dirname, ".env.local");
const envFile = process.env.TEST_ENV_FILE
  ? path.resolve(__dirname, process.env.TEST_ENV_FILE)
  : defaultEnvFile;

if (!fs.existsSync(envFile)) {
  throw new Error(
    `Missing env file: ${envFile}. Copy backend/.env.local.example, .env.staging.example, or .env.prod.example and fill values.`
  );
}

dotenv.config({ path: envFile });

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const ownerEmail = "owner@imovia.test";
const ownerPass = process.env.OWNER_PASS;
const tenantEmail = "tenant@imovia.test";
const tenantPass = process.env.TENANT_PASS;

if (!url || !anon) throw new Error(`Missing SUPABASE_URL or SUPABASE_ANON_KEY in ${envFile}`);
if (!ownerPass) throw new Error(`Missing OWNER_PASS in ${envFile}`);
if (!tenantPass) throw new Error(`Missing TENANT_PASS in ${envFile}`);

if (process.env.OWNER_EMAIL && process.env.OWNER_EMAIL.toLowerCase() !== ownerEmail) {
  console.warn(
    `Ignoring OWNER_EMAIL=${process.env.OWNER_EMAIL}; this script enforces ${ownerEmail}.`
  );
}
if (process.env.TENANT_EMAIL && process.env.TENANT_EMAIL.toLowerCase() !== tenantEmail) {
  console.warn(
    `Ignoring TENANT_EMAIL=${process.env.TENANT_EMAIL}; this script enforces ${tenantEmail}.`
  );
}

const testTarget = (process.env.TEST_TARGET || "local").toLowerCase();
if (!["local", "staging", "prod"].includes(testTarget)) {
  throw new Error(`Invalid TEST_TARGET="${testTarget}". Allowed values: local, staging, prod`);
}

let host;
try {
  host = new URL(url).hostname.toLowerCase();
} catch {
  throw new Error(`Invalid SUPABASE_URL in ${envFile}`);
}

const isLocalHost = host === "127.0.0.1" || host === "localhost";
if (testTarget === "local" && !isLocalHost) {
  throw new Error(
    `Refusing to run local test against remote host "${host}". Use local URL (127.0.0.1/localhost).`
  );
}

if (testTarget === "staging") {
  if (isLocalHost) throw new Error("Staging test requires a remote Supabase URL, not localhost.");
  if (process.env.ALLOW_REMOTE_TESTS !== "true") {
    throw new Error("Remote write protection: set ALLOW_REMOTE_TESTS=true to run against staging.");
  }
}

if (testTarget === "prod") {
  if (isLocalHost) throw new Error("Prod test requires a remote Supabase URL, not localhost.");
  if (process.env.ALLOW_REMOTE_TESTS !== "true") {
    throw new Error("Remote write protection: set ALLOW_REMOTE_TESTS=true to run against prod.");
  }
  if (process.env.ALLOW_PROD_TESTS !== "true") {
    throw new Error(
      "Production protection: set ALLOW_PROD_TESTS=true only if you intentionally run this on prod."
    );
  }
  const confirmProdHost = (process.env.CONFIRM_PROD_HOST || "").toLowerCase();
  if (!confirmProdHost || confirmProdHost !== host) {
    throw new Error(`Production confirmation required: set CONFIRM_PROD_HOST=${host} to continue.`);
  }
}

console.log(
  `Running backend seed/test on ${testTarget} (${host}) using ${path.basename(envFile)}`
);

const supabase = createClient(url, anon);

/**
 * Asserts a condition and throws an error if false.
 * Used for validation in tests.
 */
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Logs detailed error information for debugging.
 */
function dumpError(label, err) {
  console.log(`\n[ERROR] ${label}`);
  console.log("message:", err?.message);
  console.log("details:", err?.details);
  console.log("hint:", err?.hint);
  console.log("code:", err?.code);
  console.log("full:", err);
  console.log("");
}

/**
 * Logs in a user with email and password.
 * Signs out any existing session first.
 */
async function login(email, password) {
  await supabase.auth.signOut();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Retrieves the current authenticated user's ID.
 * Throws an error if no user is authenticated.
 */
async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user?.id) throw new Error("Authenticated user not found");
  return user.id;
}

/**
 * Generates an ISO date string (YYYY-MM-DD) with optional day offset.
 */
function isoDate(deltaDays = 0) {
  const date = new Date(Date.now() + deltaDays * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

/**
 * Ensures the sample.txt file exists for testing document uploads.
 */
function requireSampleFile() {
  const samplePath = path.join(__dirname, "sample.txt");
  if (!fs.existsSync(samplePath)) {
    throw new Error("Missing backend/sample.txt");
  }
  return samplePath;
}

/**
 * Uploads text content to a Supabase storage bucket.
 */
async function uploadTextToBucket(bucket, storagePath, textContent) {
  const { error } = await supabase.storage.from(bucket).upload(
    storagePath,
    Buffer.from(textContent, "utf-8"),
    {
      contentType: "text/plain",
      upsert: false,
    }
  );
  if (error) throw error;
}

/**
 * Main test function that runs the complete end-to-end backend integration test.
 * Simulates the full user journey from property creation to dashboard access.
 */
async function run() {
  const runTag = crypto.randomUUID().slice(0, 8);
  const summary = { run_tag: runTag, tenant_email: tenantEmail };

  // 1) Owner creates one complete property and a tenant contact (persistent demo data).
  console.log("[1/12] Owner creates property + tenant contact");
  await login(ownerEmail, ownerPass);
  const ownerId = await getCurrentUserId();
  summary.owner_id = ownerId;

  const { data: property, error: propertyErr } = await supabase
    .from("properties")
    .insert({
      owner_id: ownerId,
      description: `Demo property seeded by backend/test.mjs (${runTag})`,
      address: `10 Demo Street ${runTag}`,
      postal_code: "69001",
      city: "Lyon",
      country: "FR",
      status: "available",
      property_type: "apartment",
      surface_m2: 62,
      monthly_rent: 1200,
      rooms: 3,
      bathrooms: 1,
      floor_number: 3,
      is_furnished: true,
      has_elevator: true,
      energy_class: "B",
      available_from: isoDate(0),
    })
    .select()
    .single();
  if (propertyErr) throw propertyErr;
  summary.property_id = property.id;

  const { data: tenantContact, error: contactErr } = await supabase
    .from("property_tenant_contacts")
    .insert({
      property_id: property.id,
      first_name: "Demo",
      last_name: "Tenant",
      phone: "+33600001111",
      email: tenantEmail,
    })
    .select()
    .single();
  if (contactErr) throw contactErr;
  summary.property_tenant_contact_id = tenantContact.id;

  await supabase.auth.signOut();

  // 2) Tenant sees available property + creates rental application.
  console.log("[2/12] Tenant sees property + applies");
  await login(tenantEmail, tenantPass);
  const tenantId = await getCurrentUserId();
  summary.tenant_id = tenantId;

  const { data: availableRead, error: availableReadErr } = await supabase
    .from("properties")
    .select("id, address, postal_code, city, status")
    .eq("id", property.id)
    .limit(1);
  if (availableReadErr) throw availableReadErr;
  assert(availableRead?.length === 1, "Tenant cannot read available property");

  const { data: application, error: appErr } = await supabase
    .from("rental_applications")
    .insert({
      property_id: property.id,
      tenant_id: tenantId,
      owner_id: ownerId,
      message: `Demo application ${runTag}`,
      status: "pending",
    })
    .select()
    .single();
  if (appErr) throw appErr;
  summary.application_id = application.id;

  await supabase.auth.signOut();

  // 3) Owner accepts application and creates lease/payments.
  console.log("[3/12] Owner accepts application + generates payments");
  await login(ownerEmail, ownerPass);

  const { data: leaseId, error: leaseErr } = await supabase.rpc("accept_application", {
    p_application_id: application.id,
    p_start_date: "2026-03-01",
    p_end_date: "2027-03-01",
    p_rent_amount: 900,
    p_charges_amount: 50,
    p_payment_day: 5,
    p_notice_period_days: 30,
  });
  if (leaseErr) throw leaseErr;
  summary.lease_id = leaseId;

  const { data: generatedCount, error: scheduleErr } = await supabase.rpc("generate_rent_payments", {
    p_lease_id: leaseId,
    p_months: 6,
  });
  if (scheduleErr) throw scheduleErr;
  summary.payments_generated = generatedCount;

  // Link profile to owner-entered tenant contact.
  const { error: linkContactErr } = await supabase
    .from("property_tenant_contacts")
    .update({ tenant_profile_id: tenantId })
    .eq("id", tenantContact.id);
  if (linkContactErr) throw linkContactErr;

  await supabase.auth.signOut();

  // 4) Owner creates payment variety: paid + partial + overdue.
  console.log("[4/12] Owner creates payment statuses");
  await login(ownerEmail, ownerPass);

  const { data: paymentRows, error: paymentsErr } = await supabase
    .from("rent_payments")
    .select("id, amount_due, due_date")
    .eq("lease_id", leaseId)
    .order("due_date", { ascending: true })
    .limit(3);
  if (paymentsErr) throw paymentsErr;
  assert((paymentRows || []).length >= 3, "Expected at least 3 generated payments");

  const [p1, p2, p3] = paymentRows;

  const { error: p1Err } = await supabase.rpc("mark_payment_paid", {
    p_payment_id: p1.id,
    p_amount_paid: p1.amount_due,
  });
  if (p1Err) throw p1Err;

  const { error: p2Err } = await supabase.rpc("mark_payment_paid", {
    p_payment_id: p2.id,
    p_amount_paid: Number(p2.amount_due) / 2,
  });
  if (p2Err) throw p2Err;

  const { error: p3Err } = await supabase
    .from("rent_payments")
    .update({
      due_date: isoDate(-10),
      status: "due",
      amount_paid: 0,
      paid_at: null,
    })
    .eq("id", p3.id);
  if (p3Err) throw p3Err;
  summary.payment_ids = { paid: p1.id, partial: p2.id, overdue_due: p3.id };

  await supabase.auth.signOut();

  // 5) Tenant creates incidents (one will stay open/in_progress, one resolved later).
  // This tests the incident reporting and maintenance workflow.
  console.log("[5/12] Tenant creates incidents");
  await login(tenantEmail, tenantPass);

  const { data: incidentA, error: incidentAErr } = await supabase.rpc("create_incident", {
    p_lease_id: leaseId,
    p_description: `Kitchen leak reported (${runTag})`,
    p_incident_type: "plumbing",
    p_contact_phone: "+33611112222",
    p_preferred_visit_date: isoDate(1),
    p_allow_access_without_presence: true,
  });
  if (incidentAErr) throw incidentAErr;

  const { data: incidentB, error: incidentBErr } = await supabase.rpc("create_incident", {
    p_lease_id: leaseId,
    p_description: `Electrical outage in living room (${runTag})`,
    p_incident_type: "electricity",
    p_contact_phone: "+33611113333",
    p_preferred_visit_date: isoDate(2),
    p_allow_access_without_presence: false,
  });
  if (incidentBErr) throw incidentBErr;
  summary.incident_ids = [incidentA, incidentB];

  await supabase.auth.signOut();

  // 6) Tenant creates maintenance requests linked to incidents.
  console.log("[6/12] Tenant creates maintenance requests");
  await login(tenantEmail, tenantPass);

  const { data: maintenanceA, error: maintAErr } = await supabase
    .from("maintenance_requests")
    .insert({
      property_id: property.id,
      lease_id: leaseId,
      requester_id: tenantId,
      incident_id: incidentA,
      title: `Plumber visit (${runTag})`,
      description: "Please schedule a plumber quickly.",
      status: "requested",
    })
    .select()
    .single();
  if (maintAErr) throw maintAErr;

  const { data: maintenanceB, error: maintBErr } = await supabase
    .from("maintenance_requests")
    .insert({
      property_id: property.id,
      lease_id: leaseId,
      requester_id: tenantId,
      incident_id: incidentB,
      title: `Electrician visit (${runTag})`,
      description: "Please schedule an electrician.",
      status: "requested",
    })
    .select()
    .single();
  if (maintBErr) throw maintBErr;
  summary.maintenance_ids = [maintenanceA.id, maintenanceB.id];

  await supabase.auth.signOut();

  // 7) Tenant uploads first document.
  console.log("[7/12] Tenant uploads document");
  await login(tenantEmail, tenantPass);
  const samplePath = requireSampleFile();
  const sampleText = fs.readFileSync(samplePath, "utf-8");

  const tenantDocStorage = `leases/${leaseId}/${crypto.randomUUID()}-tenant-${runTag}.txt`;
  await uploadTextToBucket("documents", tenantDocStorage, sampleText);

  const { data: tenantDoc, error: tenantDocErr } = await supabase
    .from("documents")
    .insert({
      lease_id: leaseId,
      property_id: property.id,
      uploader_id: tenantId,
      storage_path: tenantDocStorage,
      title: `Tenant contract copy ${runTag}`,
      document_type: "contract",
      doc_type: "contract",
    })
    .select()
    .single();
  if (tenantDocErr) throw tenantDocErr;
  summary.tenant_document_id = tenantDoc.id;

  await supabase.auth.signOut();

  // 8) Owner uploads second document + property image.
  console.log("[8/12] Owner uploads owner document + property image");
  await login(ownerEmail, ownerPass);

  const ownerDocStorage = `leases/${leaseId}/${crypto.randomUUID()}-owner-${runTag}.txt`;
  await uploadTextToBucket("documents", ownerDocStorage, `Owner receipt ${runTag}`);

  const { data: ownerDoc, error: ownerDocErr } = await supabase
    .from("documents")
    .insert({
      lease_id: leaseId,
      property_id: property.id,
      uploader_id: ownerId,
      storage_path: ownerDocStorage,
      title: `Owner receipt ${runTag}`,
      document_date: isoDate(0),
      target_tenant_id: tenantId,
      document_type: "receipt",
      doc_type: "receipt",
    })
    .select()
    .single();
  if (ownerDocErr) throw ownerDocErr;
  summary.owner_document_id = ownerDoc.id;

  const propertyImageStorage = `properties/${property.id}/${crypto.randomUUID()}-${runTag}.txt`;
  await uploadTextToBucket("property-images", propertyImageStorage, `Property image placeholder ${runTag}`);

  const { data: propertyImage, error: propertyImageErr } = await supabase
    .from("property_images")
    .insert({
      property_id: property.id,
      storage_path: propertyImageStorage,
      is_cover: true,
    })
    .select()
    .single();
  if (propertyImageErr) throw propertyImageErr;
  summary.property_image_id = propertyImage.id;

  await supabase.auth.signOut();

  // 9) Owner updates incident/maintenance statuses and reads owner modules.
  console.log("[9/12] Owner updates statuses + reads owner modules");
  await login(ownerEmail, ownerPass);

  const { error: incidentInProgressErr } = await supabase.rpc("owner_update_incident_status", {
    p_incident_id: incidentA,
    p_status: "in_progress",
    p_resolution_notes: null,
  });
  if (incidentInProgressErr) throw incidentInProgressErr;

  const { error: incidentResolvedErr } = await supabase.rpc("owner_update_incident_status", {
    p_incident_id: incidentB,
    p_status: "resolved",
    p_resolution_notes: `Resolved by owner (${runTag})`,
  });
  if (incidentResolvedErr) throw incidentResolvedErr;

  const { error: maintAUpdateErr } = await supabase
    .from("maintenance_requests")
    .update({ status: "in_progress", cost_estimated: 140 })
    .eq("id", maintenanceA.id);
  if (maintAUpdateErr) throw maintAUpdateErr;

  const { error: maintBApprovedErr } = await supabase
    .from("maintenance_requests")
    .update({ status: "approved", cost_estimated: 220 })
    .eq("id", maintenanceB.id);
  if (maintBApprovedErr) throw maintBApprovedErr;

  const { error: maintBDoneErr } = await supabase
    .from("maintenance_requests")
    .update({ status: "done", cost_real: 215 })
    .eq("id", maintenanceB.id);
  if (maintBDoneErr) throw maintBDoneErr;

  const { data: ownerDashboard, error: ownerDashboardErr } = await supabase.rpc("get_owner_dashboard");
  if (ownerDashboardErr) throw ownerDashboardErr;
  summary.owner_dashboard = ownerDashboard;

  const { data: ownerMapping, error: ownerMappingErr } = await supabase.rpc(
    "get_owner_property_tenants",
    { p_property_id: property.id }
  );
  if (ownerMappingErr) throw ownerMappingErr;
  summary.owner_property_tenants = ownerMapping;

  const { data: ownerKpisRows, error: ownerKpisErr } = await supabase
    .from("owner_kpis")
    .select("*")
    .eq("owner_id", ownerId)
    .limit(1);
  if (ownerKpisErr) throw ownerKpisErr;
  summary.owner_kpis_count = ownerKpisRows?.length ?? 0;

  const { data: ownerProperties, error: ownerPropertiesErr } = await supabase
    .from("properties")
    .select("id, status, address, postal_code, city, property_type, floor_number")
    .eq("id", property.id);
  if (ownerPropertiesErr) throw ownerPropertiesErr;
  assert((ownerProperties || []).length >= 1, "Owner cannot read properties");

  const { data: ownerLeases, error: ownerLeasesErr } = await supabase
    .from("leases")
    .select("id, property_id, owner_id, status, start_date, end_date")
    .eq("id", leaseId);
  if (ownerLeasesErr) throw ownerLeasesErr;
  assert((ownerLeases || []).length === 1, "Owner cannot read lease");

  const { data: ownerLeaseMembers, error: ownerLeaseMembersErr } = await supabase
    .from("lease_tenants")
    .select("lease_id, tenant_id, joined_at")
    .eq("lease_id", leaseId);
  if (ownerLeaseMembersErr) throw ownerLeaseMembersErr;
  assert((ownerLeaseMembers || []).length >= 1, "Owner cannot read lease_tenants");

  const { data: ownerApplications, error: ownerApplicationsErr } = await supabase
    .from("rental_applications")
    .select("id, property_id, tenant_id, owner_id, status")
    .eq("id", application.id);
  if (ownerApplicationsErr) throw ownerApplicationsErr;
  assert((ownerApplications || []).length === 1, "Owner cannot read rental applications");

  const { data: ownerPayments, error: ownerPaymentsErr } = await supabase
    .from("rent_payments")
    .select("id, lease_id, status, amount_due, amount_paid, due_date")
    .eq("lease_id", leaseId);
  if (ownerPaymentsErr) throw ownerPaymentsErr;
  assert((ownerPayments || []).length >= 3, "Owner cannot read rent payments");

  const { data: ownerIncidents, error: ownerIncidentsErr } = await supabase
    .from("incidents")
    .select("id, lease_id, status, incident_type, priority, description")
    .in("id", [incidentA, incidentB]);
  if (ownerIncidentsErr) throw ownerIncidentsErr;
  assert((ownerIncidents || []).length === 2, "Owner cannot read incidents");

  const { data: ownerMaintenance, error: ownerMaintenanceErr } = await supabase
    .from("maintenance_requests")
    .select("id, lease_id, status, title, incident_id, cost_estimated, cost_real")
    .in("id", [maintenanceA.id, maintenanceB.id]);
  if (ownerMaintenanceErr) throw ownerMaintenanceErr;
  assert((ownerMaintenance || []).length === 2, "Owner cannot read maintenance requests");

  const { data: ownerDocuments, error: ownerDocumentsErr } = await supabase
    .from("documents")
    .select("id, lease_id, property_id, uploader_id, title, document_type, document_date, target_tenant_id")
    .in("id", [tenantDoc.id, ownerDoc.id]);
  if (ownerDocumentsErr) throw ownerDocumentsErr;
  assert((ownerDocuments || []).length === 2, "Owner cannot read documents");
  assert(
    (ownerDocuments || []).some((d) => d.id === ownerDoc.id && d.target_tenant_id === tenantId),
    "Owner targeted document is missing target_tenant_id"
  );

  const { data: ownerDocLinks, error: ownerDocLinksErr } = await supabase
    .from("document_users")
    .select("document_id, user_id, link_role")
    .in("document_id", [tenantDoc.id, ownerDoc.id]);
  if (ownerDocLinksErr) throw ownerDocLinksErr;
  assert((ownerDocLinks || []).length >= 2, "Owner cannot read document link rows");

  const { data: ownerPropertyImages, error: ownerPropertyImagesErr } = await supabase
    .from("property_images")
    .select("id, property_id, storage_path, is_cover")
    .eq("property_id", property.id);
  if (ownerPropertyImagesErr) throw ownerPropertyImagesErr;
  assert((ownerPropertyImages || []).length >= 1, "Owner cannot read property images");

  const { data: ownerPropertyContacts, error: ownerPropertyContactsErr } = await supabase
    .from("property_tenant_contacts")
    .select("id, property_id, tenant_profile_id, first_name, last_name, email")
    .eq("property_id", property.id);
  if (ownerPropertyContactsErr) throw ownerPropertyContactsErr;
  assert((ownerPropertyContacts || []).length >= 1, "Owner cannot read property tenant contacts");

  summary.owner_visible_counts = {
    properties: ownerProperties.length,
    leases: ownerLeases.length,
    lease_tenants: ownerLeaseMembers.length,
    applications: ownerApplications.length,
    payments: ownerPayments.length,
    incidents: ownerIncidents.length,
    maintenance_requests: ownerMaintenance.length,
    documents: ownerDocuments.length,
    document_users: ownerDocLinks.length,
    property_images: ownerPropertyImages.length,
    property_tenant_contacts: ownerPropertyContacts.length,
  };

  await supabase.auth.signOut();

  // 10) Tenant reads all associated data modules.
  console.log("[10/12] Tenant reads all associated modules");
  await login(tenantEmail, tenantPass);

  const { data: tenantLeases, error: tenantLeasesErr } = await supabase
    .from("leases")
    .select("id, property_id, status, start_date, end_date")
    .eq("id", leaseId);
  if (tenantLeasesErr) throw tenantLeasesErr;
  assert((tenantLeases || []).length === 1, "Tenant cannot read own lease");

  const { data: tenantActiveLeases, error: tenantActiveLeasesErr } = await supabase
    .from("leases")
    .select("id")
    .eq("status", "active");
  if (tenantActiveLeasesErr) throw tenantActiveLeasesErr;
  assert(
    (tenantActiveLeases || []).length <= 1,
    "Rule violation: tenant is affiliated to more than one active housing"
  );

  const { data: tenantLeaseMembership, error: tenantLeaseMembershipErr } = await supabase
    .from("lease_tenants")
    .select("lease_id, tenant_id")
    .eq("lease_id", leaseId)
    .eq("tenant_id", tenantId);
  if (tenantLeaseMembershipErr) throw tenantLeaseMembershipErr;
  assert((tenantLeaseMembership || []).length === 1, "Tenant is not linked to lease_tenants");

  const { data: affiliatedPropertyRows, error: affiliatedPropertyErr } = await supabase
    .from("properties")
    .select("id, address, postal_code, city, status")
    .eq("id", property.id);
  if (affiliatedPropertyErr) throw affiliatedPropertyErr;
  assert((affiliatedPropertyRows || []).length === 1, "Tenant cannot read affiliated property");

  const { data: tenantPayments, error: tenantPaymentsErr } = await supabase
    .from("rent_payments")
    .select("id, status, amount_due, amount_paid, due_date")
    .eq("lease_id", leaseId);
  if (tenantPaymentsErr) throw tenantPaymentsErr;
  assert((tenantPayments || []).length >= 3, "Tenant cannot read rent payments");

  const paymentStatuses = new Set((tenantPayments || []).map((p) => p.status));
  assert(paymentStatuses.has("paid"), "Paid payment not visible");
  assert(paymentStatuses.has("partial"), "Partial payment not visible");
  assert(paymentStatuses.has("due"), "Due payment not visible");

  const { data: tenantIncidents, error: tenantIncidentsErr } = await supabase
    .from("incidents")
    .select("id, status, description, incident_type, resolution_notes")
    .in("id", [incidentA, incidentB]);
  if (tenantIncidentsErr) throw tenantIncidentsErr;
  assert((tenantIncidents || []).length === 2, "Tenant incidents not fully visible");

  const { data: tenantMaintenance, error: tenantMaintenanceErr } = await supabase
    .from("maintenance_requests")
    .select("id, status, title, incident_id, cost_estimated, cost_real")
    .in("id", [maintenanceA.id, maintenanceB.id]);
  if (tenantMaintenanceErr) throw tenantMaintenanceErr;
  assert((tenantMaintenance || []).length === 2, "Tenant maintenance rows not visible");

  const { data: tenantDocuments, error: tenantDocumentsErr } = await supabase
    .from("documents")
    .select("id, storage_path, title, document_type, lease_id, property_id, document_date, target_tenant_id")
    .in("id", [tenantDoc.id, ownerDoc.id]);
  if (tenantDocumentsErr) throw tenantDocumentsErr;
  assert((tenantDocuments || []).length === 2, "Tenant cannot read both linked documents");

  const { data: tenantDocLinkRows, error: tenantDocLinkErr } = await supabase
    .from("document_users")
    .select("document_id, user_id, link_role")
    .in("document_id", [tenantDoc.id, ownerDoc.id]);
  if (tenantDocLinkErr) throw tenantDocLinkErr;
  assert((tenantDocLinkRows || []).length >= 2, "Tenant document link rows missing");

  await supabase.auth.signOut();

  // 11) Signed URL checks for both users.
  console.log("[11/12] Signed URL checks");
  await login(tenantEmail, tenantPass);
  const { data: tenantSignedA, error: tenantSignedAErr } = await supabase.storage
    .from("documents")
    .createSignedUrl(tenantDocStorage, 120);
  if (tenantSignedAErr) throw tenantSignedAErr;
  assert(!!tenantSignedA?.signedUrl, "Tenant signed URL missing for tenant doc");

  const { data: tenantSignedB, error: tenantSignedBErr } = await supabase.storage
    .from("documents")
    .createSignedUrl(ownerDocStorage, 120);
  if (tenantSignedBErr) throw tenantSignedBErr;
  assert(!!tenantSignedB?.signedUrl, "Tenant signed URL missing for owner doc");
  await supabase.auth.signOut();

  await login(ownerEmail, ownerPass);
  const { data: ownerSigned, error: ownerSignedErr } = await supabase.storage
    .from("documents")
    .createSignedUrl(ownerDocStorage, 120);
  if (ownerSignedErr) throw ownerSignedErr;
  assert(!!ownerSigned?.signedUrl, "Owner signed URL missing");
  await supabase.auth.signOut();

  // 12) Final summary for frontend team.
  console.log("[12/12] Seed completed");
  summary.created_at = new Date().toISOString();
  summary.storage_paths = {
    tenant_doc: tenantDocStorage,
    owner_doc: ownerDocStorage,
    property_image: propertyImageStorage,
  };

  console.log("\nSeed and integration checks passed.");
  console.log("Tenant account used:", tenantEmail);
  console.log("Summary:", JSON.stringify(summary, null, 2));
}

run().catch((err) => {
  dumpError("seed/test failed", err);
  process.exitCode = 1;
});
