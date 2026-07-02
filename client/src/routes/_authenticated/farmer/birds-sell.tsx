import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { createListing } from "@/lib/listings.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { ListingForm } from "@/components/listing-form";
import { ListingImage } from "@/types";

export const Route = createFileRoute("/_authenticated/farmer/birds-sell")({
  component: BirdsSellPage,
});

function BirdsSellPage() {
  useRequireRole(["farmer"]);
  const navigate = useNavigate();
  const fn = useServerFn(createListing);
  
  const meQ = useQuery({ queryKey: ["me"] });
  const isAdmin = (meQ.data as any)?.roles?.includes("admin") ?? false;
  const dashboardLink = "/farmer";

  const handleCancel = () => {
    navigate({ to: dashboardLink });
  };

  const handleSubmit = async (submitData: any, images: ListingImage[]) => {
    try {
      await fn({
        data: {
          ...submitData,
          images,
        },
      });
      toast.success(isAdmin ? "Listing published live!" : "Listing submitted — admin will price it shortly");
      navigate({ to: dashboardLink });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create listing");
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <Link to={dashboardLink} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-primary">Birds Sell</h1>
        <p className="mt-1 text-muted-foreground">
          Directly create and publish a new chicken listing on the marketplace.
        </p>

        <ListingForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isAdmin={isAdmin}
          isEdit={false}
          submitButtonText="Submit Listing"
          showProductTypeSelector={false}
        />
      </main>
    </div>
  );
}
