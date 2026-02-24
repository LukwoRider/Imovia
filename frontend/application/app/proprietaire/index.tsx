import { Button } from "@/components/ui/button";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

const box = { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" } as const;
const first = (s?: string | null) => (s?.trim().split(" ")[0] || "David");
const eur = (n: number) => `${Math.round(n || 0)}€`;
const d = (v?: string | null) => (v ? new Date(v).toLocaleDateString("fr-FR") : "Date inconnue");
const incMeta = (s?: string | null) => s === "resolved" ? { l: "Resolu", c: "#08CB56" } : s === "in_progress" ? { l: "Traite", c: "#3153A1" } : { l: "En cours", c: "#E17100" };

function Stat({ icon, label, value, trend, up }: any) {
  return <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e5e7eb" }}>
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" }}><Ionicons name={icon} size={17} color="#3153A1" /></View>
      <Text style={{ marginLeft: 8, flex: 1, fontSize: 11, color: "#6b7280", fontFamily: "Montserrat_400Regular" }} numberOfLines={2}>{label}</Text>
    </View>
    <Text style={{ fontSize: 20, color: "#1e293b", fontFamily: "Montserrat_700Bold" }}>{value}</Text>
    <Text style={{ fontSize: 11, marginTop: 3, color: up ? "#08CB56" : "#FF0000", fontFamily: "Montserrat_400Regular" }}>{up ? "↑" : "↓"} {trend}</Text>
  </View>;
}

function Head({ icon, title, sub }: any) {
  return <View style={{ flexDirection: "row", alignItems: "center" }}>
    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center", marginRight: 10 }}><Ionicons name={icon} size={18} color="#3153A1" /></View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 15, color: "#1e293b", fontFamily: "Montserrat_700Bold" }}>{title}</Text>
      <Text style={{ fontSize: 11, color: "#9ca3af", fontFamily: "Montserrat_400Regular" }}>{sub}</Text>
    </View>
  </View>;
}

export default function DashboardProprietaire() {
  const router = useRouter();
  const ref = useRef<ScrollView>(null);
  useScrollToTopOnFocus(ref);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("David");
  const [stats, setStats] = useState<any[]>([]);
  const [dates, setDates] = useState<any[]>([]);
  const [port, setPort] = useState<any>({ title: "Aucun bien", addr: "Ajoutez vos biens pour commencer", badges: [], total: 0 });
  const [pay, setPay] = useState({ paid: 0, pending: 0, late: 0, rate: 0 });
  const [incs, setIncs] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(first(p?.full_name));
      const { data: propertiesRaw } = await supabase.from("properties").select("id,title,address,city,status,monthly_rent,created_at").eq("owner_id", user.id).order("created_at", { ascending: false });
      const properties = propertiesRaw || [];
      const propertyIds = properties.map((x: any) => x.id);
      const byId = Object.fromEntries(properties.map((x: any) => [x.id, x]));
      let leases: any[] = [];
      if (propertyIds.length) {
        const { data } = await supabase.from("leases").select("id,property_id,rent_amount,start_date,end_date,created_at").in("property_id", propertyIds).order("created_at", { ascending: false });
        leases = data || [];
      }
      const leaseIds = leases.map((x) => x.id);
      let payments: any[] = [];
      if (leaseIds.length) {
        const { data } = await supabase.from("rent_payments").select("id,lease_id,due_date,status").in("lease_id", leaseIds).order("due_date", { ascending: false });
        payments = (data || []).map((x) => ({ ...x, property_id: leases.find((l) => l.id === x.lease_id)?.property_id }));
      }
      const { data: uploadDocs } = await supabase.from("documents").select("id,title,document_type,document_date,created_at,lease_id").eq("uploader_id", user.id).order("created_at", { ascending: false });
      let allDocs = uploadDocs || [];
      if (leaseIds.length) {
        const { data: leaseDocs } = await supabase.from("documents").select("id,title,document_type,document_date,created_at,lease_id").in("lease_id", leaseIds).order("created_at", { ascending: false });
        const m = new Map<string, any>(); [...allDocs, ...(leaseDocs || [])].forEach((x: any) => m.set(String(x.id), x)); allDocs = Array.from(m.values());
      }
      let allInc: any[] = [];
      try {
        const { data } = await supabase.from("incidents").select(`id,title,description,status,created_at,properties!inner(owner_id)`).eq("properties.owner_id", user.id).order("created_at", { ascending: false });
        allInc = data || [];
      } catch {}
      const paid = payments.filter((x) => x.status === "paid").length;
      const late = payments.filter((x) => x.status === "late").length;
      const pending = payments.filter((x) => ["due", "pending", "unpaid"].includes(String(x.status))).length;
      const rate = payments.length ? Math.round((paid / payments.length) * 100) : 0;
      const totalRent = leases.reduce((s, x) => s + Number(x.rent_amount || 0), 0) || properties.reduce((s: number, x: any) => s + Number(x.monthly_rent || 0), 0);
      const c: any = { available: 0, rented: 0, work: 0, sale: 0, other: 0 };
      properties.forEach((x: any) => { const st = String(x.status || "").toLowerCase(); if (["available", "disponible"].includes(st)) c.available++; else if (["rented", "leased", "loue", "loué"].includes(st)) c.rented++; else if (["travaux", "work", "renovation", "in_work"].includes(st)) c.work++; else if (["for_sale", "sale", "a_vendre", "a vendre"].includes(st)) c.sale++; else c.other++; });
      const badges = [
        ["Disponible", c.available, "#6B91E8"], ["Loue", c.rented, "#3153A1"], ["Travaux", c.work, "#E17100"], ["A vendre", c.sale, "#111827"], ["Autres", c.other, "#6b7280"]
      ].filter((x: any) => x[1] > 0).map((x: any) => ({ label: x[0], count: x[1], color: x[2] }));
      const events = [
        ...leases.flatMap((l: any) => ([l.start_date ? { date: l.start_date, title: `Debut location - ${byId[l.property_id]?.title || byId[l.property_id]?.city || "Bien"}`, subtitle: `Debut le ${d(l.start_date)}` } : null, l.end_date ? { date: l.end_date, title: `Fin location - ${byId[l.property_id]?.title || byId[l.property_id]?.city || "Bien"}`, subtitle: `Echeance le ${d(l.end_date)}` } : null].filter(Boolean) as any[])),
        ...payments.filter((x) => x.status === "due" || x.status === "late").map((x) => ({ date: x.due_date, title: x.status === "late" ? "Paiement en retard" : "Paiement a venir", subtitle: `${byId[x.property_id]?.title || "Loyer"} - ${d(x.due_date)}` }))
      ].filter((x: any) => x.date).sort((a: any, b: any) => +new Date(a.date) - +new Date(b.date)).slice(0, 3);
      setDates(events);
      setStats([
        { icon: "home-outline", label: "Mes logements", value: String(properties.length), trend: properties.length ? "Parc actif" : "Aucun", up: !!properties.length },
        { icon: "cash-outline", label: "Loyer mensuel", value: eur(totalRent), trend: late ? `${late} en retard` : "Stable", up: !late },
        { icon: "document-text-outline", label: "Documents", value: String(allDocs.length), trend: allDocs.length ? "Disponibles" : "Aucun", up: true },
        { icon: "alert-circle-outline", label: "Incidents", value: String(allInc.length), trend: allInc.some((x) => x.status !== "resolved") ? "A suivre" : "Sous controle", up: !allInc.some((x) => x.status !== "resolved") },
      ]);
      setPort({ title: properties[0]?.title || (properties.length ? `${properties.length} biens` : "Aucun bien"), addr: properties[0] ? `${properties[0].address || "Adresse"}, ${properties[0].city || "Ville"}` : "Ajoutez vos biens pour suivre vos locations", badges, total: totalRent });
      setPay({ paid, pending, late, rate });
      setIncs(allInc.slice(0, 3).map((x: any) => ({ id: String(x.id), title: x.title || "Incident", description: x.description || "Sans description", ...incMeta(x.status) })));
      setDocs(allDocs.sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 3).map((x: any) => ({ id: String(x.id), title: x.title || "Document", date: d(x.document_date || x.created_at), type: String(x.document_type || "document") })));
    } catch (e) {
      console.error("[OwnerDashboard]", e);
    } finally {
      setLoading(false);
    }
  }

  return <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
    <ScrollView ref={ref} contentContainerStyle={{ paddingBottom: 32 }}>
      <LinearGradient colors={["#18A6E3", "#0D51C5", "#0A2B97"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 56, paddingBottom: 32, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Image source={require("@/assets/images/logo-white.svg")} style={{ width: 90, height: 24, marginBottom: 4 }} contentFit="contain" />
            <Text style={{ color: "#fff", fontSize: 20, fontFamily: "Montserrat_700Bold" }}>Bonjour, {name} !</Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4, fontFamily: "Montserrat_400Regular" }}>Bienvenue sur votre espace proprietaire imovia</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><NotificationBellButton /><ProfileHeaderButton /></View>
        </View>
      </LinearGradient>

      {loading ? <View style={{ padding: 40, alignItems: "center" }}><ActivityIndicator size="large" color="#3153A1" /></View> : <>
        <View style={{ paddingHorizontal: 16, marginTop: -14 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>{stats[0] && <><Stat {...stats[0]} /><Stat {...stats[1]} /></>}</View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>{stats[2] && <><Stat {...stats[2]} /><Stat {...stats[3]} /></>}</View>
        </View>

        <View style={{ ...box, marginHorizontal: 16, marginTop: 18 }}>
          <Head icon="calendar-outline" title="Dates importantes" sub="Prochains projets et paiements" />
          {dates.length ? dates.map((x: any, i: number) => <View key={i} style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, marginTop: 10 }}>
            <Text style={{ fontSize: 13, color: "#1f2937", fontFamily: "Montserrat_600SemiBold" }}>{x.title}</Text>
            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontFamily: "Montserrat_400Regular" }}>{x.subtitle}</Text>
          </View>) : <Text style={{ marginTop: 14, color: "#6b7280", fontStyle: "italic" }}>Aucune date importante a afficher.</Text>}
        </View>

        <View style={{ ...box, marginHorizontal: 16, marginTop: 18 }}>
          <Head icon="home-outline" title="Mes locations" sub="Vue rapide de votre parc immobilier" />
          <Text style={{ fontSize: 15, color: "#1f2937", fontFamily: "Montserrat_700Bold", marginTop: 14 }}>{port.title}</Text>
          <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontFamily: "Montserrat_400Regular" }}>{port.addr}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {port.badges?.length ? port.badges.map((b: any) => <View key={b.label} style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.color, marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: "#374151", fontFamily: "Montserrat_500Medium" }}>{b.label}: {b.count}</Text>
            </View>) : <Text style={{ color: "#6b7280", fontStyle: "italic", marginTop: 6 }}>Aucun statut a afficher.</Text>}
          </View>
          <View style={{ marginTop: 14, marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>Revenu mensuel estime</Text>
            <Text style={{ fontSize: 18, color: "#1e293b", fontFamily: "Montserrat_700Bold", marginTop: 2 }}>{eur(port.total)}</Text>
          </View>
          <Button onPress={() => router.push("/proprietaire/logement" as any)}><Ionicons name="document-text-outline" size={16} color="#fff" style={{ marginRight: 6 }} /><Text>Voir les details</Text></Button>
        </View>
        <View style={{ ...box, marginHorizontal: 16, marginTop: 18 }}>
          <Head icon="card-outline" title="Etat des paiements" sub="Suivi de vos paiements de loyer" />
          {[["Payes", pay.paid, "checkmark-circle-outline", "#08CB56"], ["En attente", pay.pending, "time-outline", "#E17100"], ["En retard", pay.late, "alert-circle-outline", "#EF4444"]].map((r: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 11, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, marginTop: 10 }}>
              <Ionicons name={r[2]} size={16} color={r[3]} style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, fontSize: 14, color: "#1e293b", fontFamily: "Montserrat_500Medium" }}>{r[0]}</Text>
              <View style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, minWidth: 36, alignItems: "center" }}><Text style={{ fontSize: 13, color: "#1e293b", fontFamily: "Montserrat_600SemiBold" }}>{r[1]}</Text></View>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}><Text style={{ fontSize: 12, color: "#6b7280" }}>Taux de recouvrement</Text><Text style={{ fontSize: 12, color: "#6b7280" }}>{pay.rate}%</Text></View>
          <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 4, marginTop: 8 }}><View style={{ height: 6, width: `${pay.rate}%`, backgroundColor: "#3153A1", borderRadius: 4 }} /></View>
        </View>

        <View style={{ ...box, marginHorizontal: 16, marginTop: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Head icon="warning-outline" title="Mes incidents" sub="Suivi des declarations" />
            <Pressable onPress={() => router.push("/proprietaire/incidents" as any)} style={{ backgroundColor: "#3153A1", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 }}><Text style={{ color: "#fff", fontSize: 11, fontFamily: "Montserrat_600SemiBold" }}>Voir tout</Text></Pressable>
          </View>
          {incs.length ? incs.map((x: any, i: number) => <View key={x.id || i} style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 12, marginTop: i ? 10 : 0 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Ionicons name="ellipse" size={8} color={x.c} style={{ marginTop: 5, marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: "#1e293b", fontFamily: "Montserrat_600SemiBold" }}>{x.title}</Text>
                <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontFamily: "Montserrat_400Regular" }} numberOfLines={2}>{x.description}</Text>
              </View>
              <View style={{ borderRadius: 12, borderWidth: 1, borderColor: x.c, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontSize: 11, color: x.c, fontFamily: "Montserrat_600SemiBold" }}>{x.l}</Text></View>
            </View>
          </View>) : <Text style={{ color: "#6b7280", fontStyle: "italic" }}>Aucun incident trouve.</Text>}
        </View>

        <View style={{ ...box, marginHorizontal: 16, marginTop: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Head icon="folder-outline" title="Mes documents" sub="Acces rapide a vos documents" />
            <Pressable onPress={() => router.push("/proprietaire/documents" as any)} style={{ backgroundColor: "#3153A1", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 }}><Text style={{ color: "#fff", fontSize: 11, fontFamily: "Montserrat_600SemiBold" }}>Voir tout</Text></Pressable>
          </View>
          {docs.length ? docs.map((x: any, i: number) => <View key={x.id || i} style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 12, marginTop: i ? 10 : 0 }}>
            <Ionicons name="document-text-outline" size={16} color="#3153A1" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: "#1e293b", fontFamily: "Montserrat_600SemiBold" }} numberOfLines={1}>{x.title}</Text>
              <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 3, fontFamily: "Montserrat_400Regular" }}>{x.date}</Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "Montserrat_500Medium" }} numberOfLines={1}>{x.type}</Text></View>
          </View>) : <Text style={{ color: "#6b7280", fontStyle: "italic" }}>Aucun document disponible.</Text>}
        </View>
      </>}
    </ScrollView>
  </View>;
}
