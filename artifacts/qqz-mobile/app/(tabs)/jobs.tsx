import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { getJobs, getGetJobsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "#DCFCE7", text: "#15803D" },
  in_progress: { bg: "#FEF3C7", text: "#D97706" },
  completed: { bg: "#DBEAFE", text: "#1D4ED8" },
  cancelled: { bg: "#FEE2E2", text: "#DC2626" },
};

const FILTERS = ["All", "Open", "In Progress", "Completed"];

export default function JobsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isCustomer = user?.role === "customer";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const { data: jobs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: getGetJobsQueryKey(),
    queryFn: () => getJobs(),
    enabled: !!user,
  });

  const filtered = (jobs as any[]).filter((j) => {
    const matchSearch =
      !search ||
      j.service?.toLowerCase().includes(search.toLowerCase()) ||
      j.category?.toLowerCase().includes(search.toLowerCase()) ||
      j.description?.toLowerCase().includes(search.toLowerCase()) ||
      j.location?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ||
      (filter === "Open" && j.status === "open") ||
      (filter === "In Progress" && j.status === "in_progress") ||
      (filter === "Completed" && j.status === "completed");
    return matchSearch && matchFilter;
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>{isCustomer ? "My Jobs" : "Browse Jobs"}</Text>
        {isCustomer && (
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/create-job")}>
            <Feather name="plus" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchBox}>
        <Feather name="search" size={16} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/jobs/${item.id}`)}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.service || item.category}
                </Text>
                <Text style={styles.cardCategory}>{item.category}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status]?.bg ?? "#F1F5F9" }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status]?.text ?? Colors.textSecondary }]}>
                  {item.status?.replace("_", " ")}
                </Text>
              </View>
            </View>
            {!!item.description && (
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            )}
            <View style={styles.metaRow}>
              {!!item.location && (
                <>
                  <Feather name="map-pin" size={12} color={Colors.textTertiary} />
                  <Text style={styles.metaText}>{item.location}</Text>
                  <Text style={styles.dot}>·</Text>
                </>
              )}
              <Feather name="message-square" size={12} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{item.quotesCount ?? 0} quotes</Text>
              {!!item.budget && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Feather name="dollar-sign" size={12} color={Colors.textTertiary} />
                  <Text style={styles.metaText}>Budget: ${item.budget}</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Feather name="briefcase" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptyText}>
                {search ? "Try a different search term" : isCustomer ? "Post your first job to get started" : "Check back soon for new opportunities"}
              </Text>
              {isCustomer && !search && (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/create-job")}>
                  <Text style={styles.emptyBtnText}>Post a Job</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text },
  filtersRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  filterTextActive: { color: Colors.white },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  cardCategory: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
  badgeText: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
  desc: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 8, lineHeight: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.textTertiary, fontFamily: "Inter_400Regular" },
  dot: { color: Colors.textTertiary, fontSize: 12 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: Colors.white, fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
