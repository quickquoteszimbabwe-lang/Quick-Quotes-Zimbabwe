export default function ProviderHandshake() {
  return (
    <svg
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      role="img"
      aria-label="A provider and a customer shaking hands"
    >
      <circle cx="200" cy="230" r="150" fill="#1ABC9C" opacity="0.08" />
      <rect x="40" y="188" width="320" height="4" rx="2" fill="#0A3D62" opacity="0.08" />

      <g>
        <path d="M110 190 C110 150 118 120 150 120 C182 120 190 150 190 190 Z" fill="#0A3D62" />
        <path d="M140 122 L150 138 L160 122" stroke="#1ABC9C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="150" cy="96" r="26" fill="#0A3D62" />
        <path d="M182 150 C205 150 212 158 220 168" stroke="#0A3D62" strokeWidth="18" strokeLinecap="round" fill="none" />
      </g>

      <g>
        <path d="M210 190 C210 150 218 120 250 120 C282 120 290 150 290 190 Z" fill="#1ABC9C" />
        <path d="M240 122 L250 138 L260 122" stroke="#0A3D62" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="250" cy="96" r="26" fill="#1ABC9C" />
        <path d="M218 150 C195 150 188 158 180 168" stroke="#1ABC9C" strokeWidth="18" strokeLinecap="round" fill="none" />
      </g>

      <ellipse cx="200" cy="168" rx="16" ry="10" fill="#0A3D62" />
      <ellipse cx="200" cy="168" rx="16" ry="10" fill="#1ABC9C" opacity="0.55" />

      <circle cx="200" cy="132" r="16" fill="#F4B400" />
      <path d="M193 132 L198 137 L208 126" stroke="#0A3D62" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
