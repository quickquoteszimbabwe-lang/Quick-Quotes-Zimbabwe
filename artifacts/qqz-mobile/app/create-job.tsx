import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCreateJob, useGetCategoryTree } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetJobsQueryKey } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

const TIMELINES = ["ASAP", "Within a week", "Within a month", "Flexible"];
const MAX_PHOTOS = 5;

export default function CreateJobScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: categoryTree } = useGetCategoryTree();

  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [timeline, setTimeline] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");

  const selectedCategory = categoryTree?.find((c) => c.name === category);
  const hasSubcategories = (selectedCategory?.subcategories?.length ?? 0) > 0;
  const selectedSubcategory = selectedCategory?.subcategories?.find((s) => s.name === subcategory);
  const availableServices = hasSubcategories
    ? (selectedSubcategory?.services ?? [])
    : (selectedCategory?.services ?? []);

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

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      base64: true,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (result.canceled) return;
    const dataUrls = result.assets
      .filter((a) => a.base64)
      .map((a) => `data:${a.mimeType || "image/jpeg"};base64,${a.base64}`);
    setPhotos((prev) => [...prev, ...dataUrls].slice(0, MAX_PHOTOS));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!category) { setError("Please select a category"); return; }
    if (!service.trim()) { setError("Please select a service"); return; }
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
        photos: photos.length > 0 ? photos : undefined,
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
          {categoryTree?.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, category === c.name && styles.catChipActive]}
              onPress={() => { setCategory(c.name); setSubcategory(""); setService(""); }}
            >
              <Text style={[styles.catText, category === c.name && styles.catTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!category && hasSubcategories && (
          <>
            <Text style={styles.sectionHead}>Subcategory *</Text>
            <View style={styles.catGrid}>
              {selectedCategory?.subcategories?.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.catChip, subcategory === s.name && styles.catChipActive]}
                  onPress={() => { setSubcategory(s.name); setService(""); }}
                >
                  <Text style={[styles.catText, subcategory === s.name && styles.catTextActive]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {!!category && (!hasSubcategories || !!subcategory) && (
          <>
            <Text style={styles.sectionHead}>Service *</Text>
            <View style={styles.catGrid}>
              {availableServices.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.catChip, service === s.name && styles.catChipActive]}
                  onPress={() => setService(s.name)}
                >
                  <Text style={[styles.catText, service === s.name && styles.catTextActive]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

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

        <Text style={styles.sectionHead}>Photos (optional)</Text>
        <View style={styles.photoRow}>
          {photos.map((photo, i) => (
            <View key={i} style={styles.photoThumbWrap}>
              <Image source={{ uri: photo }} style={styles.photoThumb} />
              <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removePhoto(i)}>
                <Feather name="x" size={12} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity style={styles.photoAddBtn} onPress={pickPhotos}>
              <Feather name="image" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

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
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoThumbWrap: { width: 64, height: 64, position: "relative" },
  photoThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: Colors.white },
  photoRemoveBtn: { position: "absolute", top: -6, right: -6, backgroundColor: Colors.danger, borderRadius: 999, padding: 3 },
  photoAddBtn: { width: 64, height: 64, borderRadius: 10, borderWidth: 1, borderStyle: "dashed", borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  timelineRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timelineChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  timelineChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineText: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  timelineTextActive: { color: Colors.white },
  submitBtn: { backgroundColor: Colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 12 },
  submitBtnDim: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
