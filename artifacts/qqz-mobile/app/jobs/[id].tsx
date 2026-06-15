import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  getJob,
  getGetJobQueryKey,
  useCreateQuote,
  useSelectQuote,
  useCreateReview,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "#DCFCE7", text: "#15803D" },
  in_progress: { bg: "#FEF3C7", text: "#D97706" },
  completed: { bg: "#DBEAFE", text: "#1D4ED8" },
  cancelled: { bg: "#FEE2E2", text: "#DC2626" },
};

const QUOTE_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#D97706" },
  selected: { bg: "#DCFCE7", text: "#15803D" },
  rejected: { bg: "#FEE2E2", text: "#DC2626" },
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const jobId = parseInt(id ?? "0");

  const [tab, setTab] = useState<"details" | "quotes">("details");
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteTimeline, setQuoteTimeline] = useState("Flexible");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: getGetJobQueryKey(jobId),
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });

  const { mutate: submitQuote, isPending: submittingQuote } = useCreateQuote({
    mutation: { onSuccess: () => { setQuotePrice(""); setQuoteMessage(""); invalidate(); } },
  });

  const { mutate: selectQuote, isPending: selectingQuote } = useSelectQuote({
    mutation: { onSuccess: invalidate },
  });

  const { mutate: createReview, isPending: reviewPending } = useCreateReview({
    mutation: { onSuccess: () => { setShowReviewForm(false); invalidate(); } },
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Feather name="alert-circle" size={32} color={Colors.textTertiary} />
        <Text style={styles.errorText}>Job not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const j = job as any;
  const isCustomer = user?.role === "customer";
  const isProfessional = user?.role === "professional";
  const statusStyle = STATUS_COLORS[j.status] ?? {};
  const quotes = j.quotes ?? [];
  const myQuote = isProfessional ? quotes.find((q: any) => q.professionalId === user?.id) : null;
  const hasSelectedQuote = quotes.some((q: any) => q.status === "selected");
  const selectedQuote = quotes.find((q: any) => q.status === "selected");
  const hasReview = !!j.review;

  function handleSubmitQuote() {
    if (!quotePrice || isNaN(parseFloat(quotePrice))) {
      Alert.alert("Invalid price", "Please enter a valid price");
      return;
    }
    submitQuote({
      data: {
        jobId,
        price: parseFloat(quotePrice),
        timeline: quoteTimeline || "Flexible",
        message: quoteMessage || null,
      },
    });
  }

  function handleSelectQuote(quoteId: number) {
    Alert.alert("Select Quote", "Accept this quote and award the job to this professional?", [
      { text: "Cancel", style: "cancel" },
      { text: "Select", onPress: () => selectQuote({ id: jobId, data: { quoteId } }) },
    ]);
  }

  function handleReview() {
    if (!selectedQuote) return;
    createReview({
      data: {
        jobId,
        professionalId: selectedQuote.professionalId,
        rating,
        comment: reviewComment || null,
      },
    });
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.jobHeader}>
          <View style={styles.headerTop}>
            <Text style={styles.jobTitle}>{j.service || j.category}</Text>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                {j.status?.replace("_", " ")}
              </Text>
            </View>
          </View>
          <Text style={styles.category}>{j.category}</Text>
          {!!j.description && <Text style={styles.description}>{j.description}</Text>}
          <View style={styles.metaGrid}>
            {j.location && <MetaItem icon="map-pin" value={j.location} />}
            {j.timeline && <MetaItem icon="clock" value={j.timeline} />}
            {j.budget && <MetaItem icon="dollar-sign" value={`Budget: $${j.budget}`} />}
            {j.customer?.name && <MetaItem icon="user" value={j.customer.name} />}
          </View>
        </View>

        <View style={styles.tabRow}>
          {(["details", "quotes"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "details" ? "Details" : `Quotes (${quotes.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "details" && (
          <View style={styles.section}>
            {j.description ? (
              <>
                <Text style={styles.sectionLabel}>Job Description</Text>
                <Text style={styles.descFull}>{j.description}</Text>
              </>
            ) : null}

            {j.status === "completed" && isCustomer && selectedQuote && !hasReview && (
              <View style={styles.reviewCard}>
                <Text style={styles.sectionLabel}>Leave a Review</Text>
                {showReviewForm ? (
                  <View style={{ gap: 10 }}>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)}>
                          <Feather name="star" size={28} color={s <= rating ? Colors.accent : Colors.border} />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={[styles.input, { minHeight: 80 }]}
                      placeholder="Share your experience..."
                      placeholderTextColor={Colors.textTertiary}
                      value={reviewComment}
                      onChangeText={setReviewComment}
                      multiline
                      textAlignVertical="top"
                    />
                    <TouchableOpacity
                      style={[styles.btn, reviewPending && { opacity: 0.6 }]}
                      onPress={handleReview}
                      disabled={reviewPending}
                    >
                      {reviewPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Submit Review</Text>}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.btn} onPress={() => setShowReviewForm(true)}>
                    <Feather name="star" size={15} color={Colors.white} />
                    <Text style={styles.btnText}>Write a Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {hasReview && (
              <View style={styles.reviewCard}>
                <Text style={styles.sectionLabel}>Customer Review</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Feather key={s} name="star" size={20} color={s <= (j.review?.rating ?? 0) ? Colors.accent : Colors.border} />
                  ))}
                </View>
                {j.review?.comment && <Text style={styles.reviewComment}>{j.review.comment}</Text>}
              </View>
            )}
          </View>
        )}

        {tab === "quotes" && (
          <View style={styles.section}>
            {isProfessional && j.status === "open" && !myQuote && (
              <View style={styles.quoteForm}>
                <Text style={styles.sectionLabel}>Submit Your Quote</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your price (USD)"
                  placeholderTextColor={Colors.textTertiary}
                  value={quotePrice}
                  onChangeText={(t) => setQuotePrice(t.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Timeline (e.g. 2 days, 1 week)"
                  placeholderTextColor={Colors.textTertiary}
                  value={quoteTimeline}
                  onChangeText={setQuoteTimeline}
                />
                <TextInput
                  style={[styles.input, { minHeight: 80 }]}
                  placeholder="Message (optional) — describe your approach"
                  placeholderTextColor={Colors.textTertiary}
                  value={quoteMessage}
                  onChangeText={setQuoteMessage}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.btn, submittingQuote && { opacity: 0.6 }]}
                  onPress={handleSubmitQuote}
                  disabled={submittingQuote}
                >
                  {submittingQuote ? <ActivityIndicator color={Colors.white} /> : (
                    <><Feather name="send" size={15} color={Colors.white} /><Text style={styles.btnText}>Submit Quote</Text></>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {myQuote && (
              <View style={[styles.quoteCard, { borderColor: Colors.primary, borderWidth: 1.5 }]}>
                <View style={styles.quoteTop}>
                  <Text style={styles.quoteLabel}>Your Quote</Text>
                  <View style={[styles.quoteBadge, { backgroundColor: QUOTE_COLORS[myQuote.status]?.bg }]}>
                    <Text style={[styles.quoteBadgeText, { color: QUOTE_COLORS[myQuote.status]?.text }]}>{myQuote.status}</Text>
                  </View>
                </View>
                <Text style={styles.quoteAmount}>${myQuote.price}</Text>
                <Text style={styles.quoteNote}>Timeline: {myQuote.timeline}</Text>
                {myQuote.message && <Text style={styles.quoteNote}>{myQuote.message}</Text>}
              </View>
            )}

            {quotes.length === 0 && (
              <View style={styles.emptyBox}>
                <Feather name="file-text" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No quotes yet</Text>
              </View>
            )}

            {quotes.map((q: any) => (
              <View key={q.id} style={styles.quoteCard}>
                <View style={styles.quoteTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quoteLabel}>{q.professionalName ?? `Professional #${q.professionalId}`}</Text>
                    {q.professionalRating && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Feather name="star" size={12} color={Colors.accent} />
                        <Text style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                          {Number(q.professionalRating).toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.quoteBadge, { backgroundColor: QUOTE_COLORS[q.status]?.bg ?? "#F1F5F9" }]}>
                    <Text style={[styles.quoteBadgeText, { color: QUOTE_COLORS[q.status]?.text ?? Colors.textSecondary }]}>{q.status}</Text>
                  </View>
                </View>
                <Text style={styles.quoteAmount}>${q.price}</Text>
                <Text style={styles.quoteNote}>Timeline: {q.timeline}</Text>
                {q.message && <Text style={styles.quoteNote}>{q.message}</Text>}
                {isCustomer && j.status === "open" && q.status === "pending" && !hasSelectedQuote && (
                  <TouchableOpacity
                    style={[styles.selectBtn, selectingQuote && { opacity: 0.6 }]}
                    onPress={() => handleSelectQuote(q.id)}
                    disabled={selectingQuote}
                  >
                    <Text style={styles.selectBtnText}>Select This Quote</Text>
                  </TouchableOpacity>
                )}
                {q.status === "selected" && (
                  <View style={styles.selectedBanner}>
                    <Feather name="check-circle" size={14} color={Colors.success} />
                    <Text style={{ color: Colors.success, fontFamily: "Inter_500Medium", fontSize: 13 }}>Selected</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MetaItem({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Feather name={icon as any} size={13} color={Colors.textSecondary} />
      <Text style={{ fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 16, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  backLink: { color: Colors.primary, fontSize: 14, fontFamily: "Inter_500Medium" },
  jobHeader: { backgroundColor: Colors.card, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  headerTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 },
  jobTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
  category: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 8 },
  description: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 12 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tabRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.white, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  tabTextActive: { color: Colors.white, fontFamily: "Inter_600SemiBold" },
  section: { paddingHorizontal: 16, gap: 12 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  descFull: { fontSize: 15, color: Colors.text, fontFamily: "Inter_400Regular", lineHeight: 22 },
  quoteForm: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 10 },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text },
  btn: { backgroundColor: Colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: Colors.white, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  quoteCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, gap: 6 },
  quoteTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quoteLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  quoteBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  quoteBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  quoteAmount: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.primary },
  quoteNote: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 18 },
  selectBtn: { backgroundColor: Colors.accent, paddingVertical: 10, borderRadius: 10, alignItems: "center", marginTop: 4 },
  selectBtnText: { color: Colors.white, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  selectedBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.successLight, padding: 8, borderRadius: 8 },
  reviewCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 10 },
  starRow: { flexDirection: "row", gap: 8 },
  reviewComment: { fontSize: 14, color: Colors.text, fontFamily: "Inter_400Regular", lineHeight: 20, fontStyle: "italic" },
  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
});
