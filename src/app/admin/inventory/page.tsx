import Link from "next/link";
import {
  Badge,
  Card,
  Empty,
  PageHeader,
  Progress,
  Stat,
  StatGrid,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { inr, inrExact } from "@/lib/fmt";
import { collections } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects & units — The Urban Firm" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const sp = await searchParams;
  const projectsCol = await collections.projects();
  const unitsCol = await collections.units();

  const projects = await projectsCol.find({}).sort({ name: 1 }).toArray();

  const counts = await unitsCol
    .aggregate<{ _id: { projectId: unknown; status: string }; n: number; value: number }>([
      {
        $group: {
          _id: { projectId: "$projectId", status: "$status" },
          n: { $sum: 1 },
          value: { $sum: "$price" },
        },
      },
    ])
    .toArray();

  const stats = new Map<string, { available: number; sold: number; held: number; soldValue: number }>();
  for (const row of counts) {
    const key = String(row._id.projectId);
    const entry = stats.get(key) ?? { available: 0, sold: 0, held: 0, soldValue: 0 };
    if (row._id.status === "AVAILABLE") entry.available = row.n;
    if (row._id.status === "SOLD") {
      entry.sold = row.n;
      entry.soldValue = row.value;
    }
    if (row._id.status === "HELD") entry.held = row.n;
    stats.set(key, entry);
  }

  const selected = sp.project && projects.find((p) => String(p._id) === sp.project);
  const unitRows = selected
    ? await unitsCol.find({ projectId: selected._id }).sort({ tower: 1, unitNo: 1 }).toArray()
    : [];

  const totalUnits = [...stats.values()].reduce((s, v) => s + v.available + v.sold + v.held, 0);
  const totalSold = [...stats.values()].reduce((s, v) => s + v.sold, 0);
  const totalSoldValue = [...stats.values()].reduce((s, v) => s + v.soldValue, 0);

  return (
    <div>
      <PageHeader
        title="Projects & units"
        subtitle="The live inventory the public listing pages read from."
      />

      <StatGrid cols={4}>
        <Stat label="Projects" value={projects.length} />
        <Stat label="Units in inventory" value={totalUnits.toLocaleString("en-IN")} />
        <Stat
          label="Units sold"
          value={totalSold}
          tone="good"
          hint={`${totalUnits ? ((totalSold / totalUnits) * 100).toFixed(1) : 0}% of inventory`}
        />
        <Stat label="Sold value" value={inr(totalSoldValue)} tone="brand" />
      </StatGrid>

      <Card className="mt-5" title="Projects" subtitle="Click through to see the unit-level inventory.">
        <Table>
          <thead>
            <tr>
              <Th>Project</Th>
              <Th>Location</Th>
              <Th>Configs</Th>
              <Th align="right">Price band</Th>
              <Th>Possession</Th>
              <Th align="right">Available</Th>
              <Th align="right">Sold</Th>
              <Th>Sold through</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const s = stats.get(String(p._id)) ?? { available: 0, sold: 0, held: 0, soldValue: 0 };
              const total = s.available + s.sold + s.held;
              const soldPct = total ? Math.round((s.sold / total) * 100) : 0;
              return (
                <tr key={String(p._id)}>
                  <Td>
                    <p className="font-medium">{p.name}</p>
                    <p className="dim text-xs">{p.builder} · RERA {p.rera}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-sm">
                    {p.locality}
                    <span className="dim">, {p.city}</span>
                  </Td>
                  <Td className="dim whitespace-nowrap text-xs">{p.configs.join(", ")}</Td>
                  <Td align="right" className="whitespace-nowrap tabular-nums">
                    {inr(p.priceFrom)} – {inr(p.priceTo)}
                  </Td>
                  <Td className="whitespace-nowrap text-xs">{p.possession}</Td>
                  <Td align="right" className="tabular-nums">{s.available}</Td>
                  <Td align="right" className="tabular-nums font-semibold">{s.sold}</Td>
                  <Td className="min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Progress value={soldPct} />
                      <span className="dim w-9 text-right text-xs tabular-nums">{soldPct}%</span>
                    </div>
                  </Td>
                  <Td align="right">
                    <div className="flex gap-2 whitespace-nowrap">
                      <Link
                        href={`/admin/inventory?project=${String(p._id)}`}
                        className="text-brand-600 dark:text-brand-300 text-sm hover:underline"
                      >
                        Units
                      </Link>
                      <Link
                        href={`/properties/${p.slug}`}
                        className="dim text-sm hover:underline"
                        target="_blank"
                      >
                        Public page
                      </Link>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {selected && (
        <Card
          className="mt-5"
          title={`${selected.name} — ${unitRows.length} units`}
          subtitle={selected.address}
          action={
            <Link href="/admin/inventory" className="dim text-sm hover:underline">
              Close
            </Link>
          }
        >
          {unitRows.length === 0 ? (
            <Empty>No units loaded for this project.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Unit</Th>
                  <Th>Tower</Th>
                  <Th align="right">Floor</Th>
                  <Th align="right">Config</Th>
                  <Th align="right">Area</Th>
                  <Th>Facing</Th>
                  <Th align="right">Price</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {unitRows.map((u) => (
                  <tr key={String(u._id)}>
                    <Td className="font-mono text-xs">{u.unitNo}</Td>
                    <Td>{u.tower}</Td>
                    <Td align="right" className="tabular-nums">{u.floor || "—"}</Td>
                    <Td align="right" className="whitespace-nowrap">{u.bhk} BHK</Td>
                    <Td align="right" className="tabular-nums">{u.sqft} sqft</Td>
                    <Td className="whitespace-nowrap text-sm">{u.facing}</Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums">{inrExact(u.price)}</Td>
                    <Td>
                      <Badge
                        tone={u.status === "SOLD" ? "good" : u.status === "HELD" ? "warn" : "info"}
                      >
                        {u.status === "SOLD" ? "Sold" : u.status === "HELD" ? "Held" : "Available"}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
