import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth, API_BASE_URL } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

const TOTAL = 4;

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [phone, setPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [devCode, setDevCode] = useState("");

  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [role, setRole] = useState<"customer" | "professional" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const apiUrl = (s: string) =>
    API_BASE_URL ? `${API_BASE_URL}${s}` : s;

  async function sendOtp() {
    if (!phone.trim()) { setError("Enter your phone number"); return; }
    setError("");
    setSendingOtp(true);
    try {
      const res = await fetch(apiUrl("/api/verification/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send code"); return; }
      setDevCode(data.code || "");
      setStep(3);
    } catch { setError("Network error"); }
    finally { setSendingOtp(false); }
  }

  async function verifyOtp() {
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setError("");
    setVerifyingOtp(true);
    try {
      const res = await fetch(apiUrl("/api/verification/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid code"); return; }
      setStep(4);
    } catch { setError("Network error"); }
    finally { setVerifyingOtp(false); }
  }

  async function submit() {
    if (!role) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email.trim(), phone: phone.trim() || undefined, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      await login(data.token, data.user);
      router.replace("/verify");
    } catch { setError("Network error"); }
    finally { setSubmitting(false); }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(s => s - 1) : router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={styles.stepRow}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <View key={i} style={[styles.stepDot, step >= i + 1 && styles.stepDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step {step} of {TOTAL}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.body}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {!!error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Your details</Text>
              <Field label="Full Name">
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor={Colors.textTertiary} autoCapitalize="words" />
              </Field>
              <Field label="Email Address">
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={Colors.textTertiary} keyboardType="email-address" autoCapitalize="none" />
              </Field>
              <Field label="Password">
                <View>
                  <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 6 characters" placeholderTextColor={Colors.textTertiary} secureTextEntry={!showPwd} />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                    <Feather name={showPwd ? "eye-off" : "eye"} size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </Field>
              <TouchableOpacity style={styles.btn} onPress={() => { if (!name || !email || !password || password.length < 6) { setError("Fill all fields (min 6 chars password)"); return; } setError(""); setStep(2); }}>
                <Text style={styles.btnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Verify your phone</Text>
              <Text style={styles.stepSub}>We'll send a 6-digit verification code</Text>
              <Field label="Phone Number">
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+263 77 123 4567" placeholderTextColor={Colors.textTertiary} keyboardType="phone-pad" />
              </Field>
              <TouchableOpacity style={[styles.btn, sendingOtp && styles.btnDim]} onPress={sendOtp} disabled={sendingOtp}>
                {sendingOtp ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Send Verification Code</Text>}
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Enter code</Text>
              <Text style={styles.stepSub}>Sent to {phone}</Text>
              {!!devCode && (
                <View style={styles.devBox}>
                  <Text style={styles.devLabel}>Dev Mode — Code: </Text>
                  <Text style={styles.devCode}>{devCode}</Text>
                </View>
              )}
              <Field label="6-digit code">
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </Field>
              <TouchableOpacity style={[styles.btn, verifyingOtp && styles.btnDim]} onPress={verifyOtp} disabled={verifyingOtp}>
                {verifyingOtp ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Verify Code</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.resendBtn} onPress={sendOtp} disabled={sendingOtp}>
                <Text style={styles.resendText}>{sendingOtp ? "Resending…" : "Resend code"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 4 && (
            <View style={styles.card}>
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={18} color={Colors.success} />
                <Text style={styles.verifiedText}>Phone verified!</Text>
              </View>
              <Text style={styles.stepTitle}>How will you use QQZ?</Text>
              <View style={styles.roleRow}>
                {(["customer", "professional"] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleCard, role === r && styles.roleCardActive]}
                    onPress={() => setRole(r)}
                  >
                    <View style={[styles.roleIcon, role === r && styles.roleIconActive]}>
                      <Feather name={r === "customer" ? "user" : "briefcase"} size={24} color={role === r ? Colors.white : Colors.textSecondary} />
                    </View>
                    <Text style={[styles.roleLabel, role === r && styles.roleLabelActive]}>
                      {r === "customer" ? "Customer" : "Professional"}
                    </Text>
                    <Text style={styles.roleSub}>
                      {r === "customer" ? "Post jobs & hire" : "Offer services & earn"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.btn, (!role || submitting) && styles.btnDim]} onPress={submit} disabled={!role || submitting}>
                {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Create Account</Text>}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.signInLink} onPress={() => router.push("/login")}>
            <Text style={styles.signInText}>Already have an account? <Text style={styles.signInBold}>Sign in</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  headerTitle: { color: Colors.white, fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 12 },
  stepRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  stepDot: { height: 4, width: 28, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" },
  stepDotActive: { backgroundColor: Colors.white },
  stepLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  body: { flex: 1, backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  scroll: { padding: 20, gap: 16, flexGrow: 1 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.dangerLight, padding: 12, borderRadius: 10 },
  errorText: { color: Colors.danger, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  card: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, gap: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  stepTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
  stepSub: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: -8 },
  devBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", padding: 12, borderRadius: 10 },
  devLabel: { fontSize: 13, color: "#3B82F6", fontFamily: "Inter_400Regular" },
  devCode: { fontSize: 16, color: "#1D4ED8", fontFamily: "Inter_700Bold", letterSpacing: 4 },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  otpInput: { textAlign: "center", fontSize: 24, letterSpacing: 8, fontFamily: "Inter_700Bold" },
  eyeBtn: { position: "absolute", right: 14, top: 13 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  btnDim: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  resendBtn: { alignItems: "center" },
  resendText: { color: Colors.primary, fontSize: 14, fontFamily: "Inter_500Medium" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 8 },
  verifiedText: { color: Colors.success, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  roleRow: { flexDirection: "row", gap: 12 },
  roleCard: { flex: 1, borderWidth: 2, borderColor: Colors.border, borderRadius: 16, padding: 16, alignItems: "center", gap: 8 },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: "#EEF4FB" },
  roleIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.borderLight, alignItems: "center", justifyContent: "center" },
  roleIconActive: { backgroundColor: Colors.primary },
  roleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  roleLabelActive: { color: Colors.primary },
  roleSub: { fontSize: 11, color: Colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" },
  signInLink: { alignItems: "center", paddingVertical: 8 },
  signInText: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  signInBold: { color: Colors.primary, fontFamily: "Inter_600SemiBold" },
});
