export function JazzCashLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 select-none">
      <svg
        viewBox="0 0 36 36"
        className="h-7 w-7 shrink-0"
        aria-hidden="true"
        fill="none"
      >
        <rect width="36" height="36" rx="6" fill="#8C1D24" />
        <rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="5"
          stroke="#D4AF37"
          strokeOpacity="0.65"
          strokeWidth="1.2"
        />
        <path
          d="M11 23.5C11 23.5 14.2 26 17.5 23.8C20.2 22 20.5 18.2 20.5 10.5H16.8V19.6C16.8 21.1 15.9 21.8 14.8 21.8C13.7 21.8 12.9 21.1 12.9 21.1L11 23.5Z"
          fill="#D4AF37"
        />
        <circle cx="24.5" cy="14" r="3.2" fill="#F5F2EB" />
        <path
          d="M21.5 23.2C22.4 24.4 23.9 25 25.4 25C26.5 25 27.6 24.6 28.4 23.9L26.9 21.8C26.4 22.2 25.9 22.4 25.3 22.4C24.2 22.4 23.4 21.6 23.4 20.4C23.4 19.2 24.2 18.4 25.3 18.4C25.9 18.4 26.4 18.6 26.9 19L28.4 16.9C27.6 16.2 26.5 15.8 25.3 15.8C22.5 15.8 20.6 17.7 20.6 20.4C20.6 21.5 20.9 22.4 21.5 23.2Z"
          fill="#F5F2EB"
        />
      </svg>
      {!compact && (
        <span className="font-sans text-xs font-bold tracking-tight text-[#F5F2EB]">
          Jazz<span className="text-[#D4AF37]">Cash</span>
        </span>
      )}
    </div>
  );
}
