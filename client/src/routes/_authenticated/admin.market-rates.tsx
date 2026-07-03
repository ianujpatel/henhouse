import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Edit2, ChevronUp, ChevronDown, Check, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequireRole } from "@/hooks/use-require-role";
import { formatDate } from "@/lib/format";
import {
  getMarketRatesData,
  createMarketRate,
  updateMarketRate,
  deleteMarketRate,
  reorderMarketRates,
  saveMarketMetadata,
  saveMarketRateHistorySnapshot,
  deleteMarketRateHistory,
  MarketRate,
} from "@/lib/market-rates.functions";

export const Route = createFileRoute("/_authenticated/admin/market-rates")({
  component: AdminMarketRates,
});

function AdminMarketRates() {
  useRequireRole(["admin"]);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-market-rates-raw"],
    queryFn: getMarketRatesData,
  });

  // Local state for edits
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [metadata, setMetadata] = useState({
    date: new Date().toISOString().split("T")[0],
    name: "Bihar Market Rates",
    vehicles_arrived: 0,
  });

  // Category addition state
  const [newCategory, setNewCategory] = useState({
    weight_category: "",
    today_price: "",
    yesterday_price: "",
  });

  // Editing category name state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // Sync state with fetched query data
  useEffect(() => {
    if (data) {
      setRates(data.rates || []);
      if (data.metadata) {
        setMetadata({
          date: data.metadata.date ? new Date(data.metadata.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          name: data.metadata.name || "Bihar Market Rates",
          vehicles_arrived: data.metadata.vehicles_arrived ?? 0,
        });
      }
    }
  }, [data]);

  // Mutations
  const metadataMutation = useMutation({
    mutationFn: saveMarketMetadata,
    onSuccess: () => {
      toast.success("Market metadata saved successfully");
      qc.invalidateQueries({ queryKey: ["admin-market-rates-raw"] });
      qc.invalidateQueries({ queryKey: ["public-market-rates"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save metadata");
    },
  });

  const snapshotMutation = useMutation({
    mutationFn: saveMarketRateHistorySnapshot,
    onSuccess: () => {
      toast.success("Historical snapshot published successfully!");
      qc.invalidateQueries({ queryKey: ["admin-market-rates-raw"] });
      qc.invalidateQueries({ queryKey: ["public-market-rates"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to publish historical snapshot");
    },
  });

  const addRateMutation = useMutation({
    mutationFn: createMarketRate,
    onSuccess: () => {
      toast.success("Rate category added");
      setNewCategory({ weight_category: "", today_price: "", yesterday_price: "" });
      qc.invalidateQueries({ queryKey: ["admin-market-rates-raw"] });
      qc.invalidateQueries({ queryKey: ["public-market-rates"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to add category");
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: updateMarketRate,
    onSuccess: () => {
      toast.success("Rate updated successfully");
      setEditingCategoryId(null);
      qc.invalidateQueries({ queryKey: ["admin-market-rates-raw"] });
      qc.invalidateQueries({ queryKey: ["public-market-rates"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update rate");
    },
  });

  const deleteRateMutation = useMutation({
    mutationFn: deleteMarketRate,
    onSuccess: () => {
      toast.success("Rate category deleted");
      qc.invalidateQueries({ queryKey: ["admin-market-rates-raw"] });
      qc.invalidateQueries({ queryKey: ["public-market-rates"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete rate");
    },
  });

  const reorderRatesMutation = useMutation({
    mutationFn: reorderMarketRates,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-market-rates-raw"] });
      qc.invalidateQueries({ queryKey: ["public-market-rates"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save new order");
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: deleteMarketRateHistory,
    onSuccess: () => {
      toast.success("Historical record deleted");
      qc.invalidateQueries({ queryKey: ["admin-market-rates-raw"] });
      qc.invalidateQueries({ queryKey: ["public-market-rates"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete history record");
    },
  });

  // Handlers
  const handleSaveMetadata = () => {
    metadataMutation.mutate({ data: metadata });
  };

  const handlePublishSnapshot = () => {
    snapshotMutation.mutate({ data: metadata });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.weight_category.trim()) {
      toast.error("Category name is required");
      return;
    }
    addRateMutation.mutate({
      data: {
        weight_category: newCategory.weight_category.trim(),
        today_price: Number(newCategory.today_price) || 0,
        yesterday_price: Number(newCategory.yesterday_price) || 0,
        sort_order: rates.length,
      },
    });
  };

  const handleUpdatePrice = (id: string, field: "today_price" | "yesterday_price", value: number) => {
    setRates((prev) =>
      prev.map((r) => (r._id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSavePriceRow = (r: MarketRate) => {
    updateRateMutation.mutate({
      data: {
        id: r._id,
        today_price: r.today_price,
        yesterday_price: r.yesterday_price,
      },
    });
  };

  const handleStartEditingName = (r: MarketRate) => {
    setEditingCategoryId(r._id);
    setEditingCategoryName(r.weight_category);
  };

  const handleSaveCategoryName = (id: string) => {
    if (!editingCategoryName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    updateRateMutation.mutate({
      data: {
        id,
        weight_category: editingCategoryName.trim(),
      },
    });
  };

  const handleDeleteRate = (id: string) => {
    if (!confirm("Are you sure you want to delete this weight category?")) return;
    deleteRateMutation.mutate({ data: { id } });
  };

  const moveRow = async (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= rates.length) return;

    const newRates = [...rates];
    const temp = newRates[index];
    newRates[index] = newRates[nextIndex];
    newRates[nextIndex] = temp;

    const updatedRates = newRates.map((r, i) => ({ ...r, sort_order: i }));
    setRates(updatedRates);

    reorderRatesMutation.mutate({
      data: {
        orders: updatedRates.map((r) => ({ id: r._id, sort_order: r.sort_order })),
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Admin Panel
        </Link>
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold text-primary">Market Rates Management</h1>
            <p className="mt-1 text-muted-foreground">Manage Daily Bihar broiler rates, categories, and snapshot logs.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-12 text-center text-muted-foreground">Loading market rates...</div>
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {/* Metadata & Control Panel */}
            <div className="space-y-6 md:col-span-1">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h3 className="font-display text-lg font-bold text-foreground">Market Info</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="market_name">Market Name</Label>
                    <Input
                      id="market_name"
                      value={metadata.name}
                      onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="market_date">Market Date</Label>
                    <Input
                      id="market_date"
                      type="date"
                      value={metadata.date}
                      onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicles_arrived">Vehicles Arrived</Label>
                    <Input
                      id="vehicles_arrived"
                      type="number"
                      value={metadata.vehicles_arrived}
                      onChange={(e) => setMetadata({ ...metadata, vehicles_arrived: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="pt-2 space-y-2">
                  <Button
                    onClick={handleSaveMetadata}
                    disabled={metadataMutation.isPending}
                    className="w-full rounded-xl"
                  >
                    Save Metadata Only
                  </Button>
                  <Button
                    variant="hero"
                    onClick={handlePublishSnapshot}
                    disabled={snapshotMutation.isPending}
                    className="w-full rounded-xl"
                  >
                    Publish Rates for {formatDate(metadata.date)}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Publishing stores current prices into history log for visitors.
                  </p>
                </div>
              </div>

              {/* Add New Category */}
              <form onSubmit={handleAddCategory} className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h3 className="font-display text-lg font-bold text-foreground">Add Category</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="add_category">Category / Weight Range</Label>
                    <Input
                      id="add_category"
                      placeholder="e.g. 2.5–2.8 Kg"
                      required
                      value={newCategory.weight_category}
                      onChange={(e) => setNewCategory({ ...newCategory, weight_category: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="add_today">Today (₹/kg)</Label>
                      <Input
                        id="add_today"
                        type="number"
                        placeholder="110"
                        value={newCategory.today_price}
                        onChange={(e) => setNewCategory({ ...newCategory, today_price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="add_yesterday">Yesterday (₹/kg)</Label>
                      <Input
                        id="add_yesterday"
                        type="number"
                        placeholder="108"
                        value={newCategory.yesterday_price}
                        onChange={(e) => setNewCategory({ ...newCategory, yesterday_price: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" variant="outline" className="w-full rounded-xl border-primary/20 hover:bg-secondary">
                  <Plus className="mr-2 h-4 w-4 text-primary" /> Add Category
                </Button>
              </form>
            </div>

            {/* Rates Table / CRUD */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Current Broiler Rates</h3>
                {rates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No rates categories found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs font-bold text-muted-foreground">
                          <th className="py-3 px-2 w-12 text-center">Order</th>
                          <th className="py-3 px-2">Weight Category</th>
                          <th className="py-3 px-2 text-center w-28">Today (₹)</th>
                          <th className="py-3 px-2 text-center w-28">Yesterday (₹)</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {rates.map((r, i) => (
                          <tr key={r._id} className="hover:bg-secondary/10">
                            {/* Reordering column */}
                            <td className="py-3 px-2">
                              <div className="flex flex-col gap-0.5 items-center">
                                <button
                                  onClick={() => moveRow(i, "up")}
                                  disabled={i === 0}
                                  className="text-muted-foreground hover:text-primary disabled:opacity-30 cursor-pointer"
                                >
                                  <ChevronUp className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  onClick={() => moveRow(i, "down")}
                                  disabled={i === rates.length - 1}
                                  className="text-muted-foreground hover:text-primary disabled:opacity-30 cursor-pointer"
                                >
                                  <ChevronDown className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            </td>
                            {/* Weight category name column */}
                            <td className="py-3 px-2">
                              {editingCategoryId === r._id ? (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    value={editingCategoryName}
                                    onChange={(e) => setEditingCategoryName(e.target.value)}
                                    className="h-8 py-1 px-2 text-xs"
                                  />
                                  <button
                                    onClick={() => handleSaveCategoryName(r._id)}
                                    className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 cursor-pointer"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCategoryId(null)}
                                    className="p-1 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-600 cursor-pointer"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{r.weight_category}</span>
                                  <button
                                    onClick={() => handleStartEditingName(r)}
                                    className="text-muted-foreground hover:text-primary p-0.5 cursor-pointer"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                            {/* Today price column */}
                            <td className="py-3 px-2 text-center">
                              <Input
                                type="number"
                                value={r.today_price}
                                onChange={(e) => handleUpdatePrice(r._id, "today_price", Number(e.target.value))}
                                onBlur={() => handleSavePriceRow(r)}
                                className="h-8 text-center font-bold text-primary max-w-24 mx-auto"
                              />
                            </td>
                            {/* Yesterday price column */}
                            <td className="py-3 px-2 text-center">
                              <Input
                                type="number"
                                value={r.yesterday_price}
                                onChange={(e) => handleUpdatePrice(r._id, "yesterday_price", Number(e.target.value))}
                                onBlur={() => handleSavePriceRow(r)}
                                className="h-8 text-center text-muted-foreground max-w-24 mx-auto"
                              />
                            </td>
                            {/* Delete action column */}
                            <td className="py-3 px-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRate(r._id)}
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground text-right italic">
                  * Price edits are saved automatically on input focus-out (blur).
                </p>
              </div>

              {/* History snapshots log */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Historical Publish Logs</h3>
                {!data?.history || data.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No historical records posted yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {data.history.map((h) => (
                      <div
                        key={h._id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition duration-150"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{formatDate(h.date)}</span>
                            <span className="text-xs text-muted-foreground">({h.market_name})</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                            <span>🚚 Vehicles: <b>{h.vehicles_arrived ?? 0}</b></span>
                            <span>📊 Rates logged: <b>{h.rates?.length ?? 0} categories</b></span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Delete this history record?")) {
                              deleteHistoryMutation.mutate({ data: { id: h._id } });
                            }
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
