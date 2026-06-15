import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useAuth, API_BASE_URL } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

interface VerifDoc {
  id: number;
  type: string;
  fileName: string;
  mimeType: string;
  status: string;
}

const PERSONAL_DOCS = [
  { type: "id_card", label: "National ID / Passport", description: "Front of your National ID card or passport data page", mode: "image" as const },
  { type: "face_photo", label: "Live Face Photo", description: "A clear selfie looking directly at the camera", mode: "camera" as const },
];

const PRO_DOCS = [
  { type: "secondary_cert", label: "Secondary Certificate", description: "O-Level or equivalent certificate", mode: "document" as const },
  { type: "tertiary_cert", label: "Tertiary Certificate (Optional)", description: "Diploma, degree or trade certificate", mode: "document" as const, optional: true },
  { type: "police_clearance", label: "Police Clearance", description: "Certificate of conduct from ZRP", mode: "document" as const },
  { type: "fingerprint_form", label: "Fingerprint Form (PDF)", description: "Completed fingerprint form from the police", mode: "document" as const },
];

export default function VerifyScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [documents, setDocuments] = useState<VerifDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/verification/documents"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDocuments(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  function getDoc(type: string) { return documents.find((d) => d.type === type); }

  async function upload(type: string, fileName: string, fileData: string, mimeType: string) {
    setUploading(type);
    try {
      const res = await fetch(apiUrl("/api/verification/upload-document"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, fileName, fileData, mimeType }),
      });
      if (res.ok) {
        await fetchDocs();
        Alert.alert("Uploaded", "Document uploaded successfully and is under review.");
      } else {
        const d = await res.json();
        Alert.alert("Upload failed", d.error || "Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setUploading(null);
    }
  }

  async function handlePickImage(type: string) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Allow photo library access to upload documents."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", base64: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const { base64, mimeType } = result.assets[0];
      const mime = mimeType || "image/jpeg";
      await upload(type, `${type}.jpg`, `data:${mime};base64,${base64}`, mime);
    }
  }

  async function handleCamera(type: string) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Allow camera access to take your photo."); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      base64: true,
      quality: 0.85,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled && result.assets[0]) {
      const { base64, mimeType } = result.assets[0];
      const mime = mimeType || "image/jpeg";
      await upload(type, "face_photo.jpg", `data:${mime};base64,${base64}`, mime);
    }
  }

  async function handlePickDocument(type: string) {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const { uri, name, mimeType } = result.assets[0];
      const mime = mimeType || "application/pdf";
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      await upload(type, name, `data:${mime};base64,${base64}`, mime);
    }
  }

  function handleUpload(type: string, mode: "image" | "camera" | "document") {
    if (mode === "camera") return handleCamera(type);
    if (mode === "image") return handlePickImage(type);
    return handlePickDocument(type);
  }

  const isProfessional = user?.role === "professional";

  if (loading) {
    return <View style={[styles.centered, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
    >
      <View style={styles.infoBox}>
        <Feather name="shield" size={16} color={Colors.primary} />
        <Text style={styles.infoText}>
          All documents are encrypted and reviewed only by our verification team. Verified accounts receive a trust badge.
        </Text>
      </View>

      <Text style={styles.sectionHead}>Personal Verification</Text>
      {PERSONAL_DOCS.map((docDef) => {
        const doc = getDoc(docDef.type);
        const isUp = uploading === docDef.type;
        return (
          <DocCard
            key={docDef.type}
            label={docDef.label}
            description={docDef.description}
            doc={doc}
            uploading={isUp}
            onUpload={() => handleUpload(docDef.type, docDef.mode)}
            modeLabel={docDef.mode === "camera" ? "Take Selfie" : "Upload File"}
          />
        );
      })}

      {isProfessional && (
        <>
          <Text style={[styles.sectionHead, { marginTop: 8 }]}>Professional Credentials</Text>
          <Text style={styles.sectionSub}>Upload your qualifications and clearance documents</Text>
          {PRO_DOCS.map((docDef) => {
            const doc = getDoc(docDef.type);
            const isUp = uploading === docDef.type;
            return (
              <DocCard
                key={docDef.type}
                label={docDef.label}
                description={docDef.description}
                doc={doc}
                uploading={isUp}
                onUpload={() => handleUpload(docDef.type, "document")}
                modeLabel="Upload File"
                optional={(docDef as any).optional}
              />
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

interface DocCardProps {
  label: string;
  description: string;
  doc?: VerifDoc;
  uploading: boolean;
  onUpload: () => void;
  modeLabel: string;
  optional?: boolean;
}

function DocCard({ label, description, doc, uploading, onUpload, modeLabel, optional }: DocCardProps) {
  return (
    <View style={dStyles.card}>
      <View style={dStyles.row}>
        <View style={[dStyles.iconBox, doc?.status === "approved" ? dStyles.iconBoxApproved : doc ? dStyles.iconBoxPending : {}]}>
          <Feather
            name={doc?.status === "approved" ? "check-circle" : doc ? "clock" : "file"}
            size={16}
            color={doc?.status === "approved" ? Colors.success : doc ? Colors.warning : Colors.textTertiary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={dStyles.labelRow}>
            <Text style={dStyles.label}>{label}</Text>
            {optional && <Text style={dStyles.optional}>Optional</Text>}
            {doc && (
              <View style={[dStyles.badge, doc.status === "approved" ? dStyles.badgeApproved : dStyles.badgePending]}>
                <Text style={[dStyles.badgeText, doc.status === "approved" ? dStyles.badgeTextApproved : dStyles.badgeTextPending]}>
                  {doc.status === "approved" ? "Approved" : "Under Review"}
                </Text>
              </View>
            )}
          </View>
          <Text style={dStyles.desc}>{description}</Text>
          {doc && <Text style={dStyles.fileName} numberOfLines={1}>{doc.fileName}</Text>}
        </View>
      </View>
      {doc?.status !== "approved" && (
        <TouchableOpacity
          style={[dStyles.uploadBtn, uploading && dStyles.uploadBtnDim]}
          onPress={onUpload}
          disabled={uploading}
        >
          {uploading ? (
            <><ActivityIndicator size="small" color={Colors.primary} /><Text style={dStyles.uploadText}>Uploading…</Text></>
          ) : (
            <><Feather name={modeLabel === "Take Selfie" ? "camera" : "upload"} size={14} color={Colors.primary} /><Text style={dStyles.uploadText}>{doc ? "Replace" : modeLabel}</Text></>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EEF4FB", padding: 14, borderRadius: 14, marginBottom: 4 },
  infoText: { flex: 1, fontSize: 13, color: Colors.primary, fontFamily: "Inter_400Regular", lineHeight: 18 },
  sectionHead: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: -6 },
});

const dStyles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  row: { flexDirection: "row", gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconBoxApproved: { backgroundColor: Colors.successLight },
  iconBoxPending: { backgroundColor: Colors.warningLight },
  labelRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 2 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  optional: { fontSize: 11, color: Colors.textTertiary, fontFamily: "Inter_400Regular" },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  badgeApproved: { backgroundColor: Colors.successLight },
  badgePending: { backgroundColor: Colors.warningLight },
  badgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  badgeTextApproved: { color: Colors.success },
  badgeTextPending: { color: Colors.warning },
  desc: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 16 },
  fileName: { fontSize: 11, color: Colors.textTertiary, fontFamily: "Inter_400Regular", marginTop: 4 },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 10, paddingVertical: 8 },
  uploadBtnDim: { opacity: 0.5 },
  uploadText: { fontSize: 13, color: Colors.primary, fontFamily: "Inter_500Medium" },
});
