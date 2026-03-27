import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import {
  Shield,
  Upload,
  Camera,
  CheckCircle,
  Clock,
  FileText,
  ChevronRight,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";

const DOC_TYPES = {
  id_card: { label: "National ID / Passport", accept: "image/jpeg,image/png,application/pdf", description: "Front of your national ID card or data page of passport" },
  face_photo: { label: "Live Face Photo", accept: "image/*", description: "A clear photo of your face looking directly at the camera" },
  secondary_cert: { label: "Secondary School Certificate", accept: "application/pdf,image/*", description: "O-Level or equivalent certificate (PDF preferred)" },
  tertiary_cert: { label: "Tertiary Certificate (Optional)", accept: "application/pdf,image/*", description: "Diploma, degree or trade certificate" },
  police_clearance: { label: "Police Clearance Certificate", accept: "application/pdf,image/*", description: "Certificate of conduct from Zimbabwe Republic Police" },
  fingerprint_form: { label: "Fingerprint Form", accept: "application/pdf", description: "Completed fingerprint form from the police (PDF)" },
};

interface VerifDoc {
  id: number;
  type: string;
  fileName: string;
  mimeType: string;
  status: string;
  createdAt: string;
}

export default function Verify() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [documents, setDocuments] = useState<VerifDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraStep, setCameraStep] = useState<"idle" | "ready" | "countdown" | "captured">("idle");
  const [countdown, setCountdown] = useState(3);
  const [instruction, setInstruction] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("qqz_token") : null;

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/verification/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDocuments(await res.json());
    } finally {
      setLoadingDocs(false);
    }
  }, [token]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  useEffect(() => {
    return () => { cameraStream?.getTracks().forEach((t) => t.stop()); };
  }, [cameraStream]);

  function getDoc(type: string) { return documents.find((d) => d.type === type); }

  async function handleFileUpload(type: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setError("");
    setUploading(type);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const res = await fetch("/api/verification/upload-document", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type, fileName: file.name, fileData: event.target?.result, mimeType: file.type }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Upload failed"); return; }
        await fetchDocuments();
      } catch { setError("Upload failed. Please try again."); }
      finally { setUploading(null); }
    };
    reader.readAsDataURL(file);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      setCameraStream(stream);
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setCameraStep("ready");
      setInstruction("Look straight at the camera and smile");
    } catch {
      setError("Camera access denied. Please allow camera permission and try again.");
    }
  }

  function stopCamera() {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setCameraStep("idle");
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    setCameraStep("countdown");

    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      setInstruction(i === 3 ? "Hold still..." : i === 2 ? "Almost there..." : "Capturing!");
      await new Promise((r) => setTimeout(r, 1000));
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const photoData = canvas.toDataURL("image/jpeg", 0.85);
    setCameraStep("captured");
    stopCamera();

    setUploading("face_photo");
    try {
      const res = await fetch("/api/verification/upload-document", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "face_photo", fileName: "face_photo.jpg", fileData: photoData, mimeType: "image/jpeg" }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Photo upload failed"); }
      else await fetchDocuments();
    } catch { setError("Photo upload failed."); }
    finally { setUploading(null); }
  }

  const isProfessional = user?.role === "professional";

  const personalDocs = ["id_card", "face_photo"];
  const professionalDocs = ["secondary_cert", "tertiary_cert", "police_clearance", "fingerprint_form"];
  const completedCount = documents.length;
  const totalRequired = isProfessional ? 5 : 2;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Identity Verification</h1>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {totalRequired} required documents submitted
          </p>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="ml-auto text-sm text-primary font-medium hover:underline"
        >
          {completedCount >= totalRequired ? "Done" : "Skip for now"}
        </button>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${Math.min(100, (completedCount / totalRequired) * 100)}%` }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">
          <AlertCircle size={15} /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-foreground">Personal Verification</h2>

        {personalDocs.map((type) => {
          const doc = getDoc(type);
          const info = DOC_TYPES[type as keyof typeof DOC_TYPES];
          const isUp = uploading === type;

          if (type === "face_photo") {
            return (
              <div key={type} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <StatusIcon doc={doc} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{info.label}</span>
                      <DocBadge doc={doc} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
                    {doc && <p className="text-xs text-muted-foreground mt-1 truncate">{doc.fileName}</p>}
                  </div>
                </div>

                {cameraStep === "idle" && !doc && (
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-medium"
                  >
                    <Camera size={16} /> Open Camera
                  </button>
                )}

                {cameraStep === "idle" && doc && (
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center gap-2 border border-primary text-primary py-2 rounded-xl text-sm"
                  >
                    <RefreshCw size={14} /> Retake Photo
                  </button>
                )}

                {(cameraStep === "ready" || cameraStep === "countdown") && (
                  <div className="space-y-3">
                    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="border-2 border-white/70 rounded-full w-36 h-44 mb-2" />
                        {cameraStep === "countdown" && (
                          <div className="bg-black/60 text-white text-5xl font-bold w-16 h-16 rounded-full flex items-center justify-center">
                            {countdown}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">{instruction}</p>
                    <div className="flex gap-2">
                      <button onClick={stopCamera} className="flex-1 border border-border py-2 rounded-xl text-sm">Cancel</button>
                      <button
                        onClick={capturePhoto}
                        disabled={cameraStep === "countdown"}
                        className="flex-2 flex-grow bg-primary text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        {cameraStep === "countdown" ? `${countdown}...` : "Capture Photo"}
                      </button>
                    </div>
                  </div>
                )}

                {cameraStep === "captured" && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle size={15} /> Photo captured and uploaded successfully
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>
            );
          }

          return (
            <div key={type} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <StatusIcon doc={doc} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{info.label}</span>
                    <DocBadge doc={doc} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
                  {doc && <p className="text-xs text-muted-foreground mt-1 truncate">{doc.fileName}</p>}
                </div>
                <label className={`cursor-pointer flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${isUp ? "opacity-50 cursor-not-allowed border-muted text-muted-foreground" : "border-primary text-primary hover:bg-primary/5"}`}>
                  {isUp ? <><RefreshCw size={12} className="animate-spin" /> Uploading…</> : <><Upload size={12} /> {doc ? "Replace" : "Upload"}</>}
                  <input type="file" accept={info.accept} className="hidden" disabled={isUp} onChange={(e) => handleFileUpload(type, e)} />
                </label>
              </div>
            </div>
          );
        })}
      </section>

      {isProfessional && (
        <section className="space-y-3">
          <div>
            <h2 className="font-semibold text-foreground">Professional Credentials</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Upload your qualifications and clearance documents (PDF format preferred)</p>
          </div>

          {professionalDocs.map((type) => {
            const doc = getDoc(type);
            const info = DOC_TYPES[type as keyof typeof DOC_TYPES];
            const isUp = uploading === type;
            const isOptional = type === "tertiary_cert";

            return (
              <div key={type} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <StatusIcon doc={doc} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{info.label}</span>
                      <DocBadge doc={doc} />
                      {isOptional && <span className="text-xs text-muted-foreground">(Optional)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
                    {doc && <p className="text-xs text-muted-foreground mt-1 truncate">{doc.fileName}</p>}
                  </div>
                  <label className={`cursor-pointer flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${isUp ? "opacity-50 cursor-not-allowed border-muted text-muted-foreground" : "border-primary text-primary hover:bg-primary/5"}`}>
                    {isUp ? <><RefreshCw size={12} className="animate-spin" /> Uploading…</> : <><Upload size={12} /> {doc ? "Replace" : "Upload"}</>}
                    <input type="file" accept={info.accept} className="hidden" disabled={isUp} onChange={(e) => handleFileUpload(type, e)} />
                  </label>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-medium flex items-center gap-2"><Shield size={14} /> Your documents are safe</p>
        <p className="text-blue-600 text-xs">All uploaded files are encrypted and reviewed only by our verification team. Approved accounts receive a verified badge visible to clients.</p>
      </div>

      <button
        onClick={() => navigate("/home")}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
      >
        Continue to Dashboard <ChevronRight size={18} />
      </button>
    </div>
  );
}

function StatusIcon({ doc }: { doc?: VerifDoc }) {
  if (!doc) return <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"><FileText size={16} className="text-muted-foreground" /></div>;
  if (doc.status === "approved") return <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0"><CheckCircle size={16} className="text-green-600" /></div>;
  return <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Clock size={16} className="text-amber-600" /></div>;
}

function DocBadge({ doc }: { doc?: VerifDoc }) {
  if (!doc) return null;
  if (doc.status === "approved") return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Approved</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Under Review</span>;
}
