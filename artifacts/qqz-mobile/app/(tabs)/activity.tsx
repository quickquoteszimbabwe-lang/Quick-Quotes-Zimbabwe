import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  getMyQuotes,
  getGetMyQuotesQueryKey,
  getPayments,
  getGetPaymentsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

const QUOTE_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  selected: { bg: "#DCFCE7", text: "#15803D", label: "Selected" },
  rejected: { bg: "#FEE2E2", text: "#DC2626", label: "Rejected" },
};

const PAYMENT_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  completed: { bg: "#DCFCE7", text: "#15803D", label: "Completed" },
  failed: { bg: "#FEE2E2", text: "#DC2626", label: "Failed" },
};

export default function ActivityScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"quotes" | "payments">("quotes");

  const { data: quotes = [], isLoading: quotesLoading, refetch: refetchQuotes, isRefetching: quotesRefetching } = useQuery({
    queryKey: getGetMyQuotesQueryKey(),
    queryFn: () => getMyQuotes(),
    enabled: !!user,
  });

  const { data: payments = [], isLoading: paymentsLoading, refetch: refetchPayments, isRefetching: paymentsRefetching } = useQuery({
    queryKey: getGetPaymentsQueryKey(),
    queryFn: () => getPayments(),
    enabled: !!user,
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });

  const formatAmount = (a: number) =>
    new Intl.NumberFormat("en-ZW", { style: "currency", currency: "USD" }).format(a);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.pageTitle}>Activity</Text>

      <View style={styles.tabRow}>
        {(["quotes", "payments"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "quotes" ? "Quotes" : "Payments"}
            </Text>
            {t === "quotes" && (quotes as any[]).length > 0 && (
              <View style={[styles.pill, tab === t && styles.pillActive]}>
                <Text style={[styles.pillText, tab === t && styles.pillTextActive]}>
                  {(quotes as any[]).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {tab === "quotes" && (
        <FlatList
          data={quotes as any[]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={quotesRefetching} onRefresh={refetchQuotes} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => {
            const s = QUOTE_STATUS[item.status] ?? QUOTE_STATUS.pending;
            return (
              <TouchableOpacity style={styles.card} onPress={() => router.push(`/jobs/${item.jobId}`)}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.job?.service || item.job?.category || `Job #${item.jobId}`}
                    </Text>
                    <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
                  </View>
                </View>
                <View style={styles.amountRow}>
                  <Feather name="dollar-sign" size={14} color={Colors.primary} />
                  <Text style={styles.amount}>{formatAmount(item.amount)}</Text>
                  {!!item.note && <Text style={styles.note} numberOfLines={1}>{item.note}</Text>}
                </View>
                {item.status === "selected" && (
                  <View style={styles.selectedBanner}>
                    <Feather name="check-circle" size={13} color={Colors.success} />
                    <Text style={styles.selectedText}>Your quote was selected!</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            quotesLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <EmptyState
                icon="file-text"
                title="No quotes yet"
                text={user?.role === "professional" ? "Browse jobs and submit quotes to get started" : "Quotes from professionals will appear here"}
              />
            )
          }
        />
      )}

      {tab === "payments" && (
        <FlatList
          data={payments as any[]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={paymentsRefetching} onRefresh={refetchPayments} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => {
            const s = PAYMENT_STATUS[item.status] ?? PAYMENT_STATUS.pending;
            return (
              <TouchableOpacity style={styles.card} onPress={() => router.push(`/jobs/${item.jobId}`)}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.job?.service || item.job?.category || `Job #${item.jobId}`}
                    </Text>
                    <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
                  </View>
                </View>
                <View style={styles.amountRow}>
                  <Feather name="dollar-sign" size={14} color={Colors.success} />
                  <Text style={[styles.amount, { color: Colors.success }]}>{formatAmount(item.amount)}</Text>
                  <Text style={styles.methodText}>{item.method}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            paymentsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <EmptyState icon="credit-card" title="No payments yet" text="Payment history will appear here once jobs are completed" />
            )
          }
        />
      )}
    </View>
  );
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 60, gap: 10 }}>
      <Feather name={icon as any} size={40} color={Colors.textTertiary} />
      <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text }}>{title}</Text>
      <Text style={{ fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pageTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text, paddingHorizontal: 16, paddingVertical: 12 },
  tabRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  tabTextActive: { color: Colors.white },
  pill: { backgroundColor: Colors.borderLight, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  pillActive: { backgroundColor: "rgba(255,255,255,0.3)" },
  pillText: { fontSize: 11, color: Colors.textSecondary, fontFamily: "Inter_600SemiBold" },
  pillTextActive: { color: Colors.white },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  cardDate: { fontSize: 12, color: Colors.textTertiary, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
  badgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  amount: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.primary },
  note: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", flex: 1, marginLeft: 8 },
  methodText: { fontSize: 12, color: Colors.textTertiary, fontFamily: "Inter_400Regular", marginLeft: 8 },
  selectedBanner: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: Colors.successLight, padding: 8, borderRadius: 8 },
  selectedText: { fontSize: 12, color: Colors.success, fontFamily: "Inter_500Medium" },
});
