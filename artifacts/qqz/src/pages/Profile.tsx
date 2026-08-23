import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetProfile, useUpdateProfile, useCreateProfessionalProfile, useUpdateProfessionalProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetProfileQueryKey } from "@workspace/api-client-react";
import { User, Star, CheckCircle, Edit2, Shield, Phone, CreditCard } from "lucide-react";
import { Link } from "wouter";

const SERVICES = [
  "Building", "Plumbing", "Electrical", "Painting", "Tiling",
  "Drilling", "Deepening", "Pump Installation",
  "Moving", "Truck Hire", "Delivery",
  "Home Cleaning", "Office Cleaning", "Post-Construction Cleaning",
  "Irrigation", "Farm Labor",
  "Property Inspection", "Supervision", "Diaspora Management",
];

export default function Profile() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetProfile();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });

  const updateProfile = useUpdateProfile({
    mutation: {
      onSuccess: (data) => {
        setUser({ ...user!, name: data.name, phone: data.phone ?? null });
        setEditingProfile(false);
        invalidate();
      },
    },
  });

  const createProfProfile = useCreateProfessionalProfile({
    mutation: { onSuccess: () => { setEditingProfessional(false); invalidate(); } },
  });

  const updateProfProfile = useUpdateProfessionalProfile({
    mutation: { onSuccess: () => { setEditingProfessional(false); invalidate(); } },
  });

  function startEditProfile() {
    setName(profile?.name || user?.name || "");
    setPhone(profile?.phone || user?.phone || "");
    setEditingProfile(true);
  }

  function startEditProfessional() {
    if (profile?.professional) {
      setSelectedServices(profile.professional.services || []);
      setBio(profile.professional.bio || "");
      setLocation(profile.professional.location || "");
      setExperience((profile.professional as any).experience || "");
    }
    setEditingProfessional(true);
  }

  function toggleService(s: string) {
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-foreground">Profile</h1>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={28} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">{profile?.name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
              <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{profile?.role}</span>
            </div>
          </div>
          <button
            onClick={startEditProfile}
            className="text-muted-foreground hover:text-primary p-1"
          >
            <Edit2 size={18} />
          </button>
        </div>

        {editingProfile && (
          <form onSubmit={e => { e.preventDefault(); updateProfile.mutate({ data: { name, phone: phone || undefined } }); }} className="space-y-3 border-t border-border pt-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingProfile(false)} className="flex-1 border border-border py-2 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={updateProfile.isPending} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold">
                {updateProfile.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>

      {user?.role === "professional" && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">Provider Profile</h2>
            {profile?.professional && (
              <button onClick={startEditProfessional} className="text-muted-foreground hover:text-primary p-1">
                <Edit2 size={18} />
              </button>
            )}
          </div>

          {profile?.professional ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {(profile.professional as any).photoUrl ? (
                  <img
                    src={(profile.professional as any).photoUrl}
                    alt={profile.name}
                    className="w-14 h-14 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <User size={24} className="text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{profile.name}</p>
                  {(profile.professional as any).experience && (
                    <p className="text-xs text-muted-foreground">{(profile.professional as any).experience} experience</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {profile.professional.verified ? (
                  <span className="flex items-center gap-1 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                    <CheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Pending Verification</span>
                )}
                {profile.professional.rating && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star size={14} className="text-accent fill-accent" />
                    {Number(profile.professional.rating).toFixed(1)}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">{profile.professional.completedJobs} requests completed</span>
              </div>
              {profile.professional.bio && <p className="text-sm text-muted-foreground">{profile.professional.bio}</p>}
              {profile.professional.location && <p className="text-sm text-muted-foreground">📍 {profile.professional.location}</p>}
              <div className="flex flex-wrap gap-1.5">
                {profile.professional.services.map(s => (
                  <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Set up your professional profile to start receiving job quotes.</p>
              {!editingProfessional && (
                <button onClick={startEditProfessional} className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold">
                  Create Professional Profile
                </button>
              )}
            </div>
          )}

          {editingProfessional && (
            <form
              onSubmit={e => {
                e.preventDefault();
                const data = { services: selectedServices, bio: bio || undefined, location: location || undefined, experience: experience || undefined };
                if (profile?.professional) {
                  updateProfProfile.mutate({ data });
                } else {
                  createProfProfile.mutate({ data });
                }
              }}
              className="space-y-3 border-t border-border pt-4 mt-4"
            >
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Services Offered</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selectedServices.includes(s) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Years of Experience</label>
                <input value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 5 years" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell customers about your experience..." rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bulawayo" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingProfessional(false)} className="flex-1 border border-border py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={selectedServices.length === 0 || createProfProfile.isPending || updateProfProfile.isPending} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {createProfProfile.isPending || updateProfProfile.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <Shield size={18} className="text-primary" /> Identity Verification
        </h2>
        <div className="space-y-2.5">
          {[
            { label: "Phone Verified", icon: <Phone size={15} />, verified: user?.phoneVerified },
            { label: "ID Document", icon: <CreditCard size={15} />, verified: user?.idVerified },
            { label: "Face Verification", icon: <User size={15} />, verified: user?.faceVerified },
          ].map(({ label, icon, verified }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${verified ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
                {icon}
              </div>
              <span className="text-sm text-foreground flex-1">{label}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${verified ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                {verified ? "Verified" : "Pending"}
              </span>
            </div>
          ))}
        </div>
        <Link href="/verify">
          <button className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <Shield size={15} /> Manage Verification Documents
          </button>
        </Link>
      </div>
    </div>
  );
}
