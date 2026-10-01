import Link from "next/link";

const COLUMNS: Array<{ heading: string; links: Array<[string, string]> }> = [
  {
    heading: "Buy",
    links: [
      ["All projects", "/properties"],
      ["Ready to move", "/properties?status=READY_TO_MOVE"],
      ["New launches", "/properties?status=NEW_LAUNCH"],
      ["Villas", "/properties?type=VILLA"],
    ],
  },
  {
    heading: "Cities",
    links: [
      ["Hyderabad", "/properties?city=Hyderabad"],
      ["Bengaluru", "/properties?city=Bengaluru"],
      ["Pune", "/properties?city=Pune"],
    ],
  },
  {
    heading: "After you buy",
    links: [
      ["Track your handover", "/login"],
      ["Raise a service request", "/login"],
      ["Maintenance bills", "/login"],
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="surface border-t hairline">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                GF
              </span>
              <span className="font-semibold tracking-tight">GruhaFlow</span>
            </div>
            <p className="dim mt-3 text-sm">
              Search, buy, move in and live there — handled on one platform, from the first phone
              call to the last plumbing complaint.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold">{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="dim text-sm transition hover:text-[color:var(--text)]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="dim mt-9 border-t hairline pt-5 text-xs">
          GruhaFlow is a demonstration build. Projects, prices, leads and residents shown here are
          synthetic sample data, not real listings, and no real buyer information is stored.
        </p>
      </div>
    </footer>
  );
}
