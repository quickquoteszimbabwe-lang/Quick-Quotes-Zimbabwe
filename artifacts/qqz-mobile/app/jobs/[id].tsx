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
  Image,
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
  useCompleteJob,
  useCreatePayment,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

interface QuoteLineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

const emptyItem = (): QuoteLineItem => ({ description: "", quantity: "1", unitPrice: "" });

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
  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([emptyItem()]);
  const [quoteTimeline, setQuoteTimeline] = useState("Flexible");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ecocash" | "bank_transfer" | "paynow">("ecocash");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: getGetJobQueryKey(jobId),
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });

  const { mutate: submitQuote, isPending: submittingQuote } = useCreateQuote({
    mutation: { onSuccess: () => { setQuoteItems([emptyItem()]); setQuoteMessage(""); invalidate(); } },
  });

  const { mutate: selectQuote, isPending: selectingQuote } = useSelectQuote({
    mutation: { onSuccess: invalidate },
  });

  const { mutate: createReview, isPending: reviewPending } = useCreateReview({
    mutation: { onSuccess: () => { setShowReviewForm(false); invalidate(); } },
  });

  const { mutate: completeJob, isPending: completingJob } = useCompleteJob({
    mutation: { onSuccess: invalidate },
  });

  const { mutate: createPayment, isPending: paymentPending } = useCreatePayment({
    mutation: { onSuccess: () => { setShowPaymentForm(false); invalidate(); } },
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

  const quoteTotal = quoteItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  function updateQuoteItem(index: number, field: keyof QuoteLineItem, value: string) {
    setQuoteItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addQuoteItem() {
    setQuoteItems((prev) => [...prev, emptyItem()]);
  }

  function removeQuoteItem(index: number) {
    setQuoteItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleSubmitQuote() {
    const items = quoteItems
      .filter((item) => item.description.trim() !== "")
      .map((item) => ({
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
      }));
    if (items.length === 0) {
      Alert.alert("Missing items", "Add at least one line item to your quote");
      return;
    }
    submitQuote({
      data: {
        jobId,
        price: quoteTotal,
        timeline: quoteTimeline || "Flexible",
        message: quoteMessage || null,
        items,
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
            {j.customerName && <MetaItem icon="user" value={j.customerName} />}
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

            {isCustomer && j.status === "in_progress" && (
              <View style={styles.actionCard}>
                <Text style={styles.sectionLabel}>Job Progress</Text>
                {!j.payment ? (
                  showPaymentForm ? (
                    <View style={{ gap: 10 }}>
                      <Text style={{ fontSize: 14, color: Colors.text, fontFamily: "Inter_500Medium" }}>Payment Method</Text>
                      {(["ecocash", "bank_transfer", "paynow"] as const).map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.methodBtn, paymentMethod === m && styles.methodBtnActive]}
                          onPress={() => setPaymentMethod(m)}
                        >
                          <View style={[styles.methodRadio, paymentMethod === m && styles.methodRadioActive]} />
                          <Text style={[styles.methodLabel, paymentMethod === m && styles.methodLabelActive]}>
                            {m === "ecocash" ? "EcoCash" : m === "bank_transfer" ? "Bank Transfer" : "Paynow"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPaymentForm(false)}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btn, { flex: 1 }, paymentPending && { opacity: 0.6 }]}
                          disabled={paymentPending}
                          onPress={() => {
                            const sel = quotes.find((q: any) => q.status === "selected");
                            createPayment({ data: { jobId, amount: sel?.price ?? 0, method: paymentMethod } });
                          }}
                        >
                          {paymentPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Confirm Payment</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.accent }]} onPress={() => setShowPaymentForm(true)}>
                      <Feather name="credit-card" size={15} color={Colors.white} />
                      <Text style={styles.btnText}>Record Payment</Text>
                    </TouchableOpacity>
                  )
                ) : (
                  <View style={styles.paymentRow}>
                    <Feather name="check-circle" size={16} color={Colors.success} />
                    <Text style={styles.paymentText}>
                      Payment recorded · {j.payment.method?.replace("_", " ")} · ${j.payment.amount}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: Colors.success, marginTop: 8 }, completingJob && { opacity: 0.6 }]}
                  disabled={completingJob}
                  onPress={() =>
                    Alert.alert("Complete Job", "Mark this job as completed?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Complete", onPress: () => completeJob({ id: jobId }) },
                    ])
                  }
                >
                  {completingJob ? <ActivityIndicator color={Colors.white} /> : (
                    <><Feather name="check-circle" size={15} color={Colors.white} /><Text style={styles.btnText}>Approve Completion</Text></>
                  )}
                </TouchableOpacity>
              </View>
            )}

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
                <Text style={styles.sectionLabel}>Quotation Items</Text>
                {quoteItems.map((item, idx) => (
                  <View key={idx} style={styles.lineItemRow}>
                    <TextInput
                      style={[styles.input, styles.lineItemDesc]}
                      placeholder="Description"
                      placeholderTextColor={Colors.textTertiary}
                      value={item.description}
                      onChangeText={(t) => updateQuoteItem(idx, "description", t)}
                    />
                    <TextInput
                      style={[styles.input, styles.lineItemQty]}
                      placeholder="Qty"
                      placeholderTextColor={Colors.textTertiary}
                      value={item.quantity}
                      onChangeText={(t) => updateQuoteItem(idx, "quantity", t.replace(/[^0-9.]/g, ""))}
                      keyboardType="decimal-pad"
                    />
                    <TextInput
                      style={[styles.input, styles.lineItemPrice]}
                      placeholder="Price"
                      placeholderTextColor={Colors.textTertiary}
                      value={item.unitPrice}
                      onChangeText={(t) => updateQuoteItem(idx, "unitPrice", t.replace(/[^0-9.]/g, ""))}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                      onPress={() => removeQuoteItem(idx)}
                      disabled={quoteItems.length === 1}
                      style={{ opacity: quoteItems.length === 1 ? 0.3 : 1, padding: 6 }}
                    >
                      <Feather name="trash-2" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addItemBtn} onPress={addQuoteItem}>
                  <Feather name="plus" size={14} color={Colors.primary} />
                  <Text style={styles.addItemText}>Add line item</Text>
                </TouchableOpacity>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${quoteTotal.toFixed(2)}</Text>
                </View>

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
                {myQuote.items?.length > 0 && (
                  <View style={styles.itemsBox}>
                    {myQuote.items.map((it: any, i: number) => (
                      <View key={i} style={styles.itemRow}>
                        <Text style={styles.itemDesc} numberOfLines={1}>{it.description}</Text>
                        <Text style={styles.itemMeta}>{it.quantity} x ${Number(it.unitPrice).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                )}
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    {q.professionalPhotoUrl ? (
                      <Image source={{ uri: q.professionalPhotoUrl }} style={styles.quoteAvatar} />
                    ) : (
                      <View style={styles.quoteAvatarPlaceholder}>
                        <Feather name="user" size={16} color={Colors.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quoteLabel}>{q.professionalName ?? `Professional #${q.professionalId}`}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                        {q.professionalRating && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Feather name="star" size={12} color={Colors.accent} />
                            <Text style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                              {Number(q.professionalRating).toFixed(1)}
                            </Text>
                          </View>
                        )}
                        {q.professionalExperience && (
                          <Text style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                            {q.professionalExperience} exp.
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={[styles.quoteBadge, { backgroundColor: QUOTE_COLORS[q.status]?.bg ?? "#F1F5F9" }]}>
                    <Text style={[styles.quoteBadgeText, { color: QUOTE_COLORS[q.status]?.text ?? Colors.textSecondary }]}>{q.status}</Text>
                  </View>
                </View>
                <Text style={styles.quoteAmount}>${q.price}</Text>
                <Text style={styles.quoteNote}>Timeline: {q.timeline}</Text>
                {q.items?.length > 0 && (
                  <View style={styles.itemsBox}>
                    {q.items.map((it: any, i: number) => (
                      <View key={i} style={styles.itemRow}>
                        <Text style={styles.itemDesc} numberOfLines={1}>{it.description}</Text>
                        <Text style={styles.itemMeta}>{it.quantity} x ${Number(it.unitPrice).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                )}
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
  actionCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 12 },
  methodBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: "#EEF4FB" },
  methodRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border },
  methodRadioActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  methodLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text },
  methodLabelActive: { fontFamily: "Inter_600SemiBold", color: Colors.primary },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  cancelBtnText: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.successLight, padding: 12, borderRadius: 12 },
  paymentText: { fontSize: 13, color: Colors.success, fontFamily: "Inter_500Medium", flex: 1 },
  lineItemRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  lineItemDesc: { flex: 1, paddingHorizontal: 10, paddingVertical: 10 },
  lineItemQty: { width: 50, paddingHorizontal: 6, paddingVertical: 10, textAlign: "center" },
  lineItemPrice: { width: 70, paddingHorizontal: 6, paddingVertical: 10, textAlign: "center" },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4 },
  addItemText: { color: Colors.primary, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  totalLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  totalValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.primary },
  itemsBox: { backgroundColor: Colors.background, borderRadius: 10, padding: 10, gap: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemDesc: { fontSize: 12, color: Colors.text, fontFamily: "Inter_400Regular", flex: 1 },
  itemMeta: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  quoteAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.border },
  quoteAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + "15", alignItems: "center", justifyContent: "center" },
});
