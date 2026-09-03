import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  formatPrice,
  menuQueryOptions,
  nextStatus,
  ordersQueryOptions,
  placeOrder,
  updateOrderStatus,
  type CartLine,
  type MenuItem,
  type OrderStatus,
} from "@/lib/chowly";
import heroRamen from "@/assets/hero-ramen.jpg";
import poke from "@/assets/poke.jpg";
import pancakes from "@/assets/pancakes.jpg";
import tempura from "@/assets/tempura.jpg";
import pannaCotta from "@/assets/panna-cotta.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Chowly — Order happy" },
      {
        name: "description",
        content:
          "Chowly restaurant ordering app. Browse the live menu, send orders to the kitchen, and track tickets in staff view.",
      },
      { property: "og:title", content: "Chowly — Order happy" },
      {
        property: "og:description",
        content:
          "Chowly restaurant ordering app. Browse the live menu, send orders to the kitchen, and track tickets in staff view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type ViewMode = "customer" | "staff";

const imageMap: Record<string, string> = {
  "hero-ramen": heroRamen,
  poke,
  pancakes,
  tempura,
  "panna-cotta": pannaCotta,
};

const cardBgs = ["bg-bubble/40", "bg-butter/40", "bg-sky/40", "bg-mint/40"];

function Index() {
  const [view, setView] = useState<ViewMode>("customer");

  return (
    <div className="min-h-screen bg-cream font-body text-ink antialiased">
      <Header view={view} onChange={setView} />
      <main className="mx-auto max-w-6xl px-5 py-8">
        {view === "customer" ? <CustomerView /> : <StaffView />}
      </main>
    </div>
  );
}

function Header({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <header className="sticky top-0 z-10 border-b-2 border-ink/10 bg-cream/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center select-none rounded-2xl bg-coral text-2xl shadow-[0_4px_0_0_rgba(74,59,51,0.12)]">
            🍜
          </div>
          <div className="leading-none">
            <div className="font-display text-2xl font-bold tracking-tight text-ink">
              Chowly
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
              eat happy
            </div>
          </div>
        </div>

        <nav
          className="flex items-center rounded-full border-2 border-ink/10 bg-white p-1.5 shadow-[0_6px_0_0_rgba(74,59,51,0.08)]"
          role="tablist"
          aria-label="View mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "customer"}
            onClick={() => onChange("customer")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition-all",
              view === "customer"
                ? "bg-coral text-cream shadow-[0_3px_0_0_rgba(74,59,51,0.25)]"
                : "text-ink/50 hover:text-ink"
            )}
          >
            <span>👤</span>
            <span className="hidden sm:inline">Customer</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "staff"}
            onClick={() => onChange("staff")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition-all",
              view === "staff"
                ? "bg-coral text-cream shadow-[0_3px_0_0_rgba(74,59,51,0.25)]"
                : "text-ink/50 hover:text-ink"
            )}
          >
            <span>👔</span>
            <span className="hidden sm:inline">Waiter / Staff</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

function CustomerView() {
  const queryClient = useQueryClient();
  const { data: menu = [], isLoading, error } = useQuery(menuQueryOptions);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [tableLabel, setTableLabel] = useState("T04");
  const [category, setCategory] = useState<"all" | "food" | "drink">("all");

  const lines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const item = menu.find((m) => m.id === id);
          return item ? { item, quantity } : null;
        })
        .filter((line): line is CartLine => line !== null),
    [cart, menu]
  );

  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = lines.reduce(
    (sum, line) => sum + Number(line.item.price) * line.quantity,
    0
  );

  const hero = menu.find((m) => m.is_featured) ?? menu[0];
  const listed = menu.filter(
    (m) =>
      m.id !== hero?.id && (category === "all" || m.category === category)
  );

  const add = (item: MenuItem) => {
    setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }));
  };
  const remove = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      const q = (next[id] ?? 0) - 1;
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  };

  const submit = useMutation({
    mutationFn: () => placeOrder({ tableLabel, lines }),
    onSuccess: () => {
      setCart({});
      toast.success(`Order sent to the kitchen for ${tableLabel}!`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <section className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-butter px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-ink shadow-[0_3px_0_0_rgba(74,59,51,0.12)]">
            ✨ Kitchen is buzzing
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
            What are you craving today?
          </h1>
          <p className="mt-2 font-semibold text-ink/60">
            Fresh bowls, big smiles. Tap a dish and it lands right on your tray.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border-2 border-ink/10 bg-white px-4 py-2.5 shadow-[0_4px_0_0_rgba(74,59,51,0.08)] sm:flex">
          <span className="text-lg">🛒</span>
          <span className="text-sm font-extrabold text-ink">{cartCount}</span>
          <span className="text-sm font-semibold text-ink/40">on tray</span>
        </div>
      </section>

      {error ? (
        <p className="rounded-3xl border-2 border-coral/30 bg-white p-5 font-semibold text-coral">
          Couldn't load the menu: {(error as Error).message}
        </p>
      ) : null}

      {hero ? (
        <section className="relative overflow-hidden rounded-[2rem] border-2 border-ink/10 bg-gradient-to-br from-sky via-bubble to-butter p-6 shadow-[0_10px_0_0_rgba(74,59,51,0.08)] sm:p-8">
          <div className="absolute -top-6 -right-6 size-32 rounded-full bg-white/40"></div>
          <div className="absolute bottom-4 right-16 size-14 rounded-full bg-coral/30"></div>
          <div className="relative grid items-center gap-6 sm:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-coral">
                Today's hero
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold text-ink">
                {hero.name}
              </h2>
              <p className="mt-1 max-w-xs font-semibold text-ink/70">
                {hero.description}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => add(hero)}
                  className="rounded-full bg-coral px-5 py-3 text-sm font-extrabold text-cream shadow-[0_4px_0_0_rgba(74,59,51,0.25)] transition-transform hover:-translate-y-0.5"
                >
                  Add to tray · {formatPrice(hero.price)}
                </button>
              </div>
            </div>
            <img
              src={imageMap[hero.image_key ?? ""] ?? heroRamen}
              alt={hero.name}
              className="aspect-[4/3] w-full rounded-3xl bg-white/50 object-cover outline outline-1 -outline-offset-1 outline-ink/10"
            />
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["all", "food", "drink"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-extrabold capitalize",
                category === key
                  ? "bg-ink text-cream"
                  : "border-2 border-ink/10 bg-white text-ink/60"
              )}
            >
              {key === "all" ? "All" : `${key}s`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="font-semibold text-ink/50">Loading the menu…</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {listed.map((item, i) => (
              <MenuCard
                key={item.id}
                item={item}
                bg={cardBgs[i % cardBgs.length]!}
                quantity={cart[item.id] ?? 0}
                onAdd={() => add(item)}
                onRemove={() => remove(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {cartCount > 0 ? (
        <section className="mt-8 rounded-3xl border-2 border-ink/10 bg-white p-5 shadow-[0_6px_0_0_rgba(74,59,51,0.08)]">
          <h2 className="font-display text-2xl font-bold text-ink">Your tray</h2>
          <ul className="mt-3 space-y-1">
            {lines.map((line) => (
              <li
                key={line.item.id}
                className="flex items-center justify-between text-sm font-semibold text-ink/70"
              >
                <span>
                  {line.quantity}× {line.item.name}
                </span>
                <span>
                  {formatPrice(Number(line.item.price) * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/10 pt-4">
            <label className="flex items-center gap-2 text-sm font-extrabold text-ink">
              Table
              <input
                value={tableLabel}
                onChange={(e) => setTableLabel(e.target.value)}
                className="w-24 rounded-full border-2 border-ink/10 px-3 py-1.5 font-bold text-ink outline-none focus:border-coral"
              />
            </label>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-ink">
                {formatPrice(cartTotal)}
              </span>
              <button
                type="button"
                disabled={submit.isPending || !tableLabel.trim()}
                onClick={() => submit.mutate()}
                className="rounded-full bg-coral px-5 py-3 text-sm font-extrabold text-cream shadow-[0_4px_0_0_rgba(74,59,51,0.25)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {submit.isPending ? "Sending…" : "Place order"}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function MenuCard({
  item,
  bg,
  quantity,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  bg: string;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const image = imageMap[item.image_key ?? ""];
  return (
    <article className="rounded-3xl border-2 border-ink/10 bg-white p-4 shadow-[0_6px_0_0_rgba(74,59,51,0.08)]">
      <div
        className={cn(
          "mb-3 grid aspect-[5/4] place-items-center overflow-hidden rounded-2xl outline outline-1 -outline-offset-1 outline-ink/10",
          bg
        )}
      >
        {image ? (
          <img src={image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl">{item.category === "drink" ? "🥤" : "🍽️"}</span>
        )}
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">{item.name}</h3>
      <p className="mt-0.5 text-xs font-semibold text-ink/50">{item.tags}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-extrabold text-ink">{formatPrice(item.price)}</span>
        <div className="flex items-center gap-2">
          {quantity > 0 ? (
            <>
              <button
                type="button"
                aria-label={`Remove one ${item.name}`}
                onClick={onRemove}
                className="grid size-9 place-items-center rounded-full border-2 border-ink/10 text-lg text-ink"
              >
                −
              </button>
              <span className="text-sm font-extrabold text-ink">{quantity}</span>
            </>
          ) : null}
          <button
            type="button"
            aria-label={`Add ${item.name}`}
            onClick={onAdd}
            className="grid size-9 place-items-center rounded-full bg-mint text-lg text-ink shadow-[0_3px_0_0_rgba(74,59,51,0.12)] transition-transform hover:-translate-y-0.5"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

function StaffView() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, error } = useQuery(ordersQueryOptions);

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success("Ticket updated");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const open = orders.filter((o) => o.status === "new" || o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");
  const served = orders.filter((o) => o.status === "served");

  return (
    <>
      <section className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-ink shadow-[0_3px_0_0_rgba(74,59,51,0.12)]">
            👔 Staff mode
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
            Service floor
          </h1>
          <p className="mt-2 font-semibold text-ink/60">
            Manage live tickets, update table status, and keep the kitchen
            flowing.
          </p>
        </div>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open orders" value={String(open.length)} color="bg-coral" />
        <StatCard label="Ready to serve" value={String(ready.length)} color="bg-butter" />
        <StatCard label="Served" value={String(served.length)} color="bg-mint" />
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-ink">
          Live tickets
        </h2>
        {error ? (
          <p className="font-semibold text-coral">
            Couldn't load tickets: {(error as Error).message}
          </p>
        ) : isLoading ? (
          <p className="font-semibold text-ink/50">Loading tickets…</p>
        ) : orders.length === 0 ? (
          <p className="font-semibold text-ink/50">
            No orders yet — place one from customer view.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {orders.map((order) => {
              const next = nextStatus[order.status];
              return (
                <div
                  key={order.id}
                  className="rounded-3xl border-2 border-ink/10 bg-white p-4 shadow-[0_6px_0_0_rgba(74,59,51,0.08)]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-display text-2xl font-bold text-ink">
                      {order.table_label}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <ul className="mb-4 space-y-1">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="text-sm font-semibold text-ink/70">
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t-2 border-ink/10 pt-3">
                    <span className="text-xs font-semibold text-ink/50">
                      {formatPrice(order.total)}
                    </span>
                    {next ? (
                      <button
                        type="button"
                        disabled={advance.isPending}
                        onClick={() => advance.mutate({ id: order.id, status: next })}
                        className="rounded-full bg-ink px-3 py-1.5 text-xs font-extrabold text-cream transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        Mark {statusLabels[next].toLowerCase()}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-ink/10 bg-white p-5 shadow-[0_6px_0_0_rgba(74,59,51,0.08)]">
      <div className={cn("mb-3 size-10 rounded-2xl", color)} />
      <div className="font-display text-3xl font-bold text-ink">{value}</div>
      <div className="text-sm font-semibold text-ink/60">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

const statusStyles: Record<OrderStatus, string> = {
  new: "bg-coral/15 text-coral",
  preparing: "bg-butter text-ink/70",
  ready: "bg-mint text-ink",
  served: "bg-ink/10 text-ink/50",
  cancelled: "bg-ink/10 text-ink/40",
};

const statusLabels: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};
