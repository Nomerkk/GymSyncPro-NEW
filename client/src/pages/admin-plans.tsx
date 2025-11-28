
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminMembershipPlanDialog from "@/components/admin-membership-plan-dialog";
import PageHeader from "@/components/layout/page-header";
import { useMembershipPlans, useMembershipPlanActions } from "@/hooks/useMembershipPlans";
import { Plus, Edit, Trash2, Check, DollarSign } from "lucide-react";
import type { MembershipPlan } from "@shared/schema.ts";

export default function AdminPlans() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);



  const { data: membershipPlans, refetch } = useMembershipPlans(isAuthenticated && isAdmin);
  const { remove } = useMembershipPlanActions();

  // Do not block rendering with a loading spinner; rely on cached data.

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }



  const handleAddPlan = () => {
    setSelectedPlan(null);
    setShowPlanDialog(true);
  };

  const handleEditPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setShowPlanDialog(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this membership plan?")) {
      return;
    }

    try {
      await remove.mutateAsync(planId);
      toast({
        title: "Success!",
        description: "Membership plan has been deleted",
      });
      refetch();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error && typeof error === 'object' && 'message' in error) ? String((error as { message?: unknown }).message) : "Failed to delete membership plan",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership Plans"
        subtitle="Manage membership plans and pricing"
        actions={
          <Button
            className="gym-gradient text-white"
            onClick={handleAddPlan}
            data-testid="button-add-plan"
          >
            <Plus className="mr-2" size={16} />
            Add New Plan
          </Button>
        }
      />

      {/* Plans Grid */}
      {!membershipPlans || membershipPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">No membership plans available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {membershipPlans.map((plan: MembershipPlan) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  <Badge variant={plan.active ? "default" : "secondary"}>
                    {plan.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <DollarSign size={24} className="text-primary" />
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.durationMonths}mo</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {plan.description || "No description"}
                </p>

                {Array.isArray(plan.features) && (plan.features as string[]).length > 0 && (
                  <div className="space-y-2 py-2">
                    {(plan.features as string[]).slice(0, 4).map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 4 && (
                      <p className="text-xs text-muted-foreground pl-6">
                        +{plan.features.length - 4} more features
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditPlan(plan)}
                    data-testid={`button - edit - plan - ${plan.id} `}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePlan(plan.id)}
                    data-testid={`button - delete -plan - ${plan.id} `}
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plan Dialog */}
      <AdminMembershipPlanDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
        plan={selectedPlan}
      />
    </div>
  );
}
