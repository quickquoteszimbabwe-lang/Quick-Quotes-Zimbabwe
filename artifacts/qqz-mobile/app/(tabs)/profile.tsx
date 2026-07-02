import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { getProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

function VerifRow({ icon, label, done }: { icon: string; label: string; done?: boolean }) {
  return (
    <View style={vStyles.row}>
      <View style={[vStyles.iconBox, done && vStyles.iconBoxDone]}>
        <Feather name={icon as any} size={14} color={done ? Colors.success : Colors.textTertiary} />
      </View>
      <Text style={vStyles.label}>{label}</Text>
      <View style={[vStyles.badge, done && vStyles.badgeDone]}>
        <Text style={[vStyles.badgeText, done && vStyles.badgeTextDone]}>{done ? "Verified" : "Pending"}</Text>
      </View>
    </View>
  );
}

const vStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, alignItems: "center", justifyContent: "center" },
  iconBoxDone: { backgroundColor: Colors.successLight },
  label: { flex: 1, fontSize: 14, color: Colors.text, fontFamily: "Inter_400Regular" },
  badge: { backgroundColor: Colors.borderLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeDone: { backgroundColor: Colors.successLight },
  badgeText: { fontSize: 11, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  badgeTextDone: { color: Colors.success },
});

function MenuItem({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={mStyles.item} onPress={onPress}>
      <View style={[mStyles.iconBox, danger && mStyles.iconBoxDanger]}>
        <Feather name={icon as any} size={16} color={danger ? Colors.danger : Colors.primary} />
      </View>
      <Text style={[mStyles.label, danger && mStyles.labelDanger]}>{label}</Text>
      <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const mStyles = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF4FB", alignItems: "center", justifyContent: "center" },
  iconBoxDanger: { backgroundColor: Colors.dangerLight },
  label: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
  labelDanger: { color: Colors.danger },
});

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: profile } = useQuery({
    queryKey: getGetProfileQueryKey(),
    queryFn: () => getProfile(),
    enabled: !!user,
  });

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {(profile as any)?.professional?.photoUrl ? (
          <Image source={{ uri: (profile as any).professional.photoUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === "professional" ? "Professional" : user?.role === "admin" ? "Admin" : "Customer"}
          </Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Identity Verification</Text>
        <View style={styles.card}>
          <View style={{ gap: 12 }}>
            <VerifRow icon="phone" label="Phone Number" done={user?.phoneVerified} />
            <View style={styles.divider} />
            <VerifRow icon="credit-card" label="ID Document" done={user?.idVerified} />
            <View style={styles.divider} />
            <VerifRow icon="camera" label="Face Verification" done={user?.faceVerified} />
          </View>
          <TouchableOpacity style={styles.verifyBtn} onPress={() => router.push("/verify")}>
            <Feather name="shield" size={14} color={Colors.primary} />
            <Text style={styles.verifyBtnText}>
              {user?.idVerified && user?.faceVerified ? "View Documents" : "Complete Verification"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {user?.role === "professional" && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Professional Profile</Text>
          <View style={styles.card}>
            {(profile as any)?.professional ? (
              <View style={{ gap: 8 }}>
                {(profile as any).professional.experience && (
                  <View>
                    <Text style={styles.profLabel}>Experience</Text>
                    <Text style={styles.profValue}>{(profile as any).professional.experience}</Text>
                  </View>
                )}
                {(profile as any).professional.services?.length > 0 && (
                  <View>
                    <Text style={styles.profLabel}>Services</Text>
                    <View style={styles.tagsRow}>
                      {(profile as any).professional.services.map((s: string) => (
                        <View key={s} style={styles.tag}>
                          <Text style={styles.tagText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {(profile as any).professional.location && (
                  <View>
                    <Text style={styles.profLabel}>Location</Text>
                    <Text style={styles.profValue}>{(profile as any).professional.location}</Text>
                  </View>
                )}
                {(profile as any).professional.rating && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Feather name="star" size={14} color={Colors.accent} />
                    <Text style={{ color: Colors.accent, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                      {Number((profile as any).professional.rating).toFixed(1)}
                    </Text>
                    <Text style={{ color: Colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                      ({(profile as any).professional.reviewCount ?? 0} reviews)
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noProfText}>Set up your professional profile on the web app to start receiving job quotes.</Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={[styles.card, { padding: 0, overflow: "hidden" }]}>
          <MenuItem icon="shield" label="Verify Identity" onPress={() => router.push("/verify")} />
          <View style={styles.divider} />
          <MenuItem icon="bell" label="Notifications" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="log-out" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </View>

      <Text style={styles.version}>Quick Quotes Zimbabwe v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 24 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 2, borderColor: Colors.border },
  avatarText: { color: Colors.white, fontSize: 28, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 6 },
  roleBadge: { backgroundColor: Colors.primary + "15", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 6 },
  roleText: { color: Colors.primary, fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  email: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  phone: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  verifyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 10 },
  verifyBtnText: { color: Colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 14 },
  profLabel: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_500Medium", marginBottom: 6 },
  profValue: { fontSize: 14, color: Colors.text, fontFamily: "Inter_400Regular" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: Colors.primary + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { color: Colors.primary, fontSize: 12, fontFamily: "Inter_500Medium" },
  noProfText: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 18 },
  version: { textAlign: "center", fontSize: 12, color: Colors.textTertiary, fontFamily: "Inter_400Regular", marginTop: 8 },
});
