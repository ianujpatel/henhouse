import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link, useLocation } from "@tanstack/react-router";
import { TrendingUp, Sparkles, Clock, ArrowRight, Coins } from "lucide-react";
import { getGlobalSettings } from "@/lib/global-settings.functions";
import { formatPrice } from "@/lib/format";

export function GlobalAnnouncement() {
  const getSettingsFn = useServerFn(getGlobalSettings);
  const location = useLocation();

  const { data: settings } = useQuery({
    queryKey: ["global-settings"],
    queryFn: () => getSettingsFn(),
    refetchInterval: 30_000, // Refetch every 30 seconds to keep prices real-time
  });

  if (!settings) return null;

  const path = location.pathname;
  const isHome = path === "/";
  const isBuyer =
    path.startsWith("/marketplace") ||
    path.startsWith("/orders") ||
    path.startsWith("/cart") ||
    path.startsWith("/checkout");
  const isFarmer = path.startsWith("/farmer");

  const shouldShow = (visibility: string | undefined, legacyShow: boolean) => {
    const finalVisibility = visibility || (legacyShow ? "all" : "hidden");
    if (finalVisibility === "all") return true;
    if (finalVisibility === "hidden") return false;
    if (finalVisibility === "home") return isHome;
    if (finalVisibility === "buyer") return isBuyer;
    if (finalVisibility === "farmer") return isFarmer;
    return false;
  };

  const showBanner =
    shouldShow(settings.banner_visibility, settings.banner_show) &&
    (settings.banner_text || settings.banner_image_url);
  const showPrices = shouldShow(settings.prices_visibility, settings.prices_show);

  if (!showBanner && !showPrices) return null;


  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="w-full bg-background border-b border-border/40 select-none">
      <div className="container mx-auto px-4 py-3 space-y-3">
        {/* Announcement Banner */}
        {showBanner && (
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-background p-4 shadow-sm transition hover:shadow">
            {settings.banner_image_url ? (
              // Image Banner
              settings.banner_redirect_url ? (
                <a
                  href={settings.banner_redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <img
                    src={settings.banner_image_url}
                    alt={settings.banner_text || "Announcement"}
                    className="w-full h-auto max-h-32 object-cover rounded-xl transition group-hover:scale-[1.01]"
                  />
                  {settings.banner_text && (
                    <div className="mt-2 flex items-center justify-between text-sm font-medium text-foreground">
                      <span>{settings.banner_text}</span>
                      <ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-1" />
                    </div>
                  )}
                </a>
              ) : (
                <div>
                  <img
                    src={settings.banner_image_url}
                    alt={settings.banner_text || "Announcement"}
                    className="w-full h-auto max-h-32 object-cover rounded-xl"
                  />
                  {settings.banner_text && (
                    <p className="mt-2 text-sm font-medium text-foreground">{settings.banner_text}</p>
                  )}
                </div>
              )
            ) : (
              // Text Announcement Banner
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold text-foreground md:text-base leading-snug">
                    {settings.banner_text}
                  </p>
                </div>
                {settings.banner_redirect_url && (
                  <a
                    href={settings.banner_redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow transition hover:bg-primary/90 hover:scale-102 active:scale-98"
                  >
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Today's Price Section */}
        {showPrices && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-secondary/15 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
                <TrendingUp className="h-5 w-5 text-accent" />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">Today's Market Rates</h3>
                <div className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <Clock className="h-3 w-3" />
                  <span>Last Updated: {formatDateTime(settings.prices_updated_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Chicks Price */}
              <div className="flex items-baseline gap-2.5 rounded-xl bg-card border border-border/50 px-4 py-2 shadow-soft">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Chicks</span>
                <span className="font-display text-lg font-black text-primary">
                  {formatPrice(settings.chicks_price)}
                </span>
                <span className="text-[10px] text-muted-foreground">/ bird</span>
              </div>

              {/* Birds Price */}
              <div className="flex items-baseline gap-2.5 rounded-xl bg-card border border-border/50 px-4 py-2 shadow-soft">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Birds</span>
                <span className="font-display text-lg font-black text-primary">
                  {formatPrice(settings.birds_price)}
                </span>
                <span className="text-[10px] text-muted-foreground">/ kg</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
