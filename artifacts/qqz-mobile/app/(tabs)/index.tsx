import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  getJobs,
  getGetJobsQueryKey,
  getMyQuotes,
  getGetMyQuotesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

const CATEGORIES = [
  { name: "Construction", icon: "home" as const },
  { name: "Borehole", icon: "droplet" as const },
  { name: "Transport", icon: "truck" as const },
  { name: "Cleaning", icon: "wind" as const },
  { name: "Agriculture", icon: "sun" as const },
  { name: "Property", icon: "map-pin" as const },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "#DCFCE7", text: "#15803D" },
  in_progress: { bg: "#FEF3C7", text: "#D97706" },
  completed: { bg: "#DBEAFE", text: "#1D4ED8" },
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isCustomer = user?.role === "customer";

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: getGetJobsQueryKey(),
    queryFn: () => getJobs(),
    enabled: !!user,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: getGetMyQuotesQueryKey(),
    queryFn: () => getMyQuotes(),
    enabled: !!user && !isCustomer,
  });

  const openCount = (jobs as any[]).filter((j) => j.status === "open").length;
  const activeCount = (jobs as any[]).filter((j) => j.status === "in_progress").length;
  const completedCount = (jobs as any[]).filter((j) => j.status === "completed").length;

  const stats = isCustomer
    ? [
        { label: "Posted", value: (jobs as any[]).length, color: Colors.primary },
        { label: "Active", value: activeCount, color: Colors.accent },
        { label: "Done", value: completedCount, color: Colors.success },
      ]
    : [
        { label: "Available", value: openCount, color: Colors.primary },
        { label: "Quoted", value: (quotes as any[]).length, color: Colors.accent },
        { label: "Won", value: (quotes as any[]).filter((q) => q.status === "selected").length, color: Colors.success },
      ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <FlatList
      data={(jobs as any[]).slice(0, 8)}
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListHeaderComponent={
        <>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.name}>{firstName} 👋</Text>
            </View>
            <TouchableOpacity style={styles.avatar} onPress={() => router.push("/(tabs)/profile")}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "U"}</Text>
            </TouchableOpacity>
          </View>

          {!user?.phoneVerified && (
            <TouchableOpacity style={styles.verifyBanner} onPress={() => router.push("/verify")}>
              <Feather name="shield" size={15} color={Colors.accent} />
              <Text style={styles.verifyText}>Complete identity verification →</Text>
            </TouchableOpacity>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
            {stats.map((s, i) => (
              <View key={i} style={[styles.statCard, { borderLeftColor: s.color }]}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </ScrollView>

          {isCustomer && (
            <TouchableOpacity style={styles.postBtn} onPress={() => router.push("/create-job")}>
              <Feather name="plus" size={18} color={Colors.white} />
              <Text style={styles.postBtnText}>Post a Job</Text>
            </TouchableOpacity>
          )}

          {isCustomer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Categories</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c.name} style={styles.catCard} onPress={() => router.push("/create-job")}>
                    <View style={styles.catIcon}>
                      <Feather name={c.icon} size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.catName}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.sectionHeader}>{isCustomer ? "Recent Jobs" : "Available Jobs"}</Text>
        </>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.jobCard} onPress={() => router.push(`/jobs/${item.id}`)}>
          <View style={styles.jobTop}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.service || item.category}</Text>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status]?.bg ?? "#F1F5F9" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status]?.text ?? Colors.textSecondary }]}>
                {item.status?.replace("_", " ")}
              </Text>
            </View>
          </View>
          {!!item.description && <Text style={styles.jobDesc} numberOfLines={2}>{item.description}</Text>}
          <View style={styles.jobMeta}>
            <Feather name="map-pin" size={12} color={Colors.textTertiary} />
            <Text style={styles.jobMetaText}>{item.location || "—"}</Text>
            <Text style={styles.jobMetaDot}>·</Text>
            <Feather name="message-square" size={12} color={Colors.textTertiary} />
            <Text style={styles.jobMetaText}>{item.quotesCount ?? 0} quotes</Text>
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No jobs yet</Text>
            {isCustomer && (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/create-job")}>
                <Text style={styles.emptyBtnText}>Post your first job</Text>
              </TouchableOpacity>
            )}
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  greeting: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: Colors.white, fontSize: 17, fontFamily: "Inter_700Bold" },
  verifyBanner: { marginHorizontal: 16, marginBottom: 12, backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA", borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  verifyText: { fontSize: 13, color: Colors.accent, fontFamily: "Inter_500Medium", flex: 1 },
  statsScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 16 },
  statCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, minWidth: 100, borderLeftWidth: 3, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2 },
  postBtn: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.accent, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  postBtnText: { color: Colors.white, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 12 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catCard: { width: "30%", backgroundColor: Colors.card, borderRadius: 14, padding: 12, alignItems: "center", gap: 6, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  catIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EEF4FB", alignItems: "center", justifyContent: "center" },
  catName: { fontSize: 11, color: Colors.text, fontFamily: "Inter_500Medium", textAlign: "center" },
  sectionHeader: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, paddingHorizontal: 16, marginBottom: 10 },
  jobCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.card, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  jobTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  jobTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
  jobDesc: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 8, lineHeight: 18 },
  jobMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  jobMetaText: { fontSize: 12, color: Colors.textTertiary, fontFamily: "Inter_400Regular" },
  jobMetaDot: { color: Colors.textTertiary, fontSize: 12 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { color: Colors.white, fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
