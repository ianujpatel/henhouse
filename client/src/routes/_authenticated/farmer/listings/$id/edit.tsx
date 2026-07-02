import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { getListingForEdit, updateListing, archiveListing } from "@/lib/listings.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { ListingForm } from "@/components/listing-form";
import { ListingImage } from "@/types";

export const Route = createFileRoute("/_authenticated/farmer/listings/$id/edit")({
  component: EditListing,
});

function EditListing() {
  useRequireRole(["farmer", "admin"]);
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getEditFn = useServerFn(getListingForEdit);
  const updateFn = useServerFn(updateListing);
  const archiveFn = useServerFn(archiveListing);
  
  const meQ = useQuery({ queryKey: ["me"] });
  const isAdmin = (meQ.data as any)?.roles?.includes("admin") ?? false;
  const getDashboardLink = (cat?: string) => {
    if (!isAdmin) return "/farmer";
    return "/admin/manage-listings";
  };

  const q = useQuery({ queryKey: ["listing-edit", id], queryFn: () => getEditFn({ data: { id } }) });
  const listing = q.data;

  if (q.isLoading) return <div><AppHeader /><div className="container mx-auto p-12 text-muted-foreground">Loading…</div></div>;
  if (!listing) return <div><AppHeader /><div className="container mx-auto p-12">Listing not found.</div></div>;

  const handleCancel = () => {
    navigate({ to: getDashboardLink(listing.category) });
  };

  const handleSubmit = async (submitData: any, images: ListingImage[]) => {
    try {
      await updateFn({
        data: {
          id,
          ...submitData,
          images,
        },
      });
      toast.success("Listing updated");
      navigate({ to: getDashboardLink(submitData.category) });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    }
  };

  const handleArchive = async () => {
    if (!confirm("Archive this listing? It will no longer be visible to buyers.")) return;
    try {
      await archiveFn({ data: { id } });
      toast.success("Archived");
      navigate({ to: getDashboardLink(listing.category) });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not archive");
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <Link to={getDashboardLink(listing.category)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-primary">Edit listing</h1>

        <ListingForm 
          initialData={listing}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onArchive={handleArchive}
          isAdmin={isAdmin}
          isEdit={true}
          submitButtonText="Save changes"
        />
      </main>
    </div>
  );
}
