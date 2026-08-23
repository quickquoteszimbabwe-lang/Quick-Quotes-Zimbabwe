import { Link } from "wouter";
import { Wrench, Truck, Droplets, Home, Leaf, Building, Camera } from "lucide-react";

const categories = [
  { icon: Building, label: "Construction" },
  { icon: Droplets, label: "Borehole Services" },
  { icon: Truck, label: "Transport" },
  { icon: Home, label: "Cleaning" },
  { icon: Leaf, label: "Agriculture" },
  { icon: Camera, label: "Photography & Media" },
];

export default function Splash() {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-white px-6 py-12 text-center">
        <img
          src="/logo.png"
          alt="Quick Quotes Zimbabwe"
          className="w-56 h-auto mb-6 drop-shadow-lg"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <p className="text-lg text-white/80 mb-2">Zimbabwe's marketplace for trusted services</p>
        <p className="text-sm text-white/60 mb-10 max-w-sm">
          Find services, rentals, consultations and bookings from verified local providers
        </p>

        <div className="grid grid-cols-3 gap-4 mb-12 w-full max-w-sm">
          {categories.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 bg-white/10 rounded-xl p-3">
              <Icon size={24} className="text-accent" />
              <span className="text-xs text-white/80 text-center">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/register"
            className="bg-accent text-white font-bold py-3 px-8 rounded-xl text-center hover:opacity-90 transition-opacity shadow-lg"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-white/10 text-white font-semibold py-3 px-8 rounded-xl text-center hover:bg-white/20 transition-colors border border-white/20"
          >
            I already have an account
          </Link>
        </div>
      </div>

      <div className="text-center text-white/40 text-xs py-4">
        Serving Zimbabwe's communities with quality
      </div>
    </div>
  );
}
