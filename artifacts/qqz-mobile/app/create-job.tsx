import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useCreateJob } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetJobsQueryKey } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

const CATEGORIES = [
  "Agriculture & Farming",
  "Borehole Drilling",
  "Building & Construction",
  "Cleaning & Sanitation",
  "Electrical",
  "Landscaping",
  "Logistics & Transport",
  "Painting & Decorating",
  "Plumbing",
  "Property & Real Estate",
  "Security",
  "Other",
];

const TIMELINES = ["ASAP", "Within a week", "Within a month", "Flexible"];

export default function CreateJobScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState("");
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [timeline, setTimeline] = useState("");
  const [error, setError] = useState("");

  const { mutate: createJob, isPending } = useCreateJob({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobsQueryKey() });
        router.back();
      },
      onError: (err: any) => {
        setError(err?.response?.data?.error || "Failed to create job. Please try again.");
      },
    },
  });

  function handleSubmit() {
    if (!category) { setError("Please select a category"); return; }
    if (!service.trim()) { setError("Please describe the service you need"); return; }
    if (!description.trim()) { setError("Please provide a job description"); return; }
    if (!location.trim()) { setError("Please enter a location"); return; }
    setError("");
    createJob({
      data: {
        category,
        service: service.trim(),
        description: description.trim(),
        location: location.trim(),
        timeline: timeline || null,
      },
    });
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!!error && (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.sectionHead}>Service Category *</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.catChip, category === c && styles.catChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionHead}>What service do you need? *</Text>
        <TextInput
          style={styles.input}
          value={service}
          onChangeText={setService}
          placeholder="e.g. Fix leaking pipe in kitchen"
          placeholderTextColor={Colors.textTertiary}
          maxLength={100}
        />

        <Text style={styles.sectionHead}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Provide additional details about the job..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={1000}
        />

        <Text style={styles.sectionHead}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Bulawayo, Harare CBD"
          placeholderTextColor={Colors.textTertiary}
        />

        <Text style={styles.sectionHead}>Timeline</Text>
        <View style={styles.timelineRow}>
          {TIMELINES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.timelineChip, timeline === t && styles.timelineChipActive]}
              onPress={() => setTimeline(t)}
            >
              <Text style={[styles.timelineText, timeline === t && styles.timelineTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, isPending && styles.submitBtnDim]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Feather name="send" size={16} color={Colors.white} />
              <Text style={styles.submitBtnText}>Post Job</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.dangerLight, padding: 12, borderRadius: 10 },
  errorText: { color: Colors.danger, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  sectionHead: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginTop: 8 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  catTextActive: { color: Colors.white },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text },
  textarea: { minHeight: 100 },
  timelineRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timelineChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  timelineChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineText: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  timelineTextActive: { color: Colors.white },
  submitBtn: { backgroundColor: Colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 12 },
  submitBtnDim: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
